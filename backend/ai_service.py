import asyncio
import os
import time
from typing import List, Optional, Tuple, Dict, Any
from enum import Enum
import traceback
import logging
import tempfile
import base64
import json
from datetime import datetime
from pathlib import Path
import re
import hashlib
import vertexai
from openai import AsyncOpenAI, APIError, RateLimitError, APIConnectionError, APITimeoutError, AuthenticationError
from google.cloud import aiplatform
from google.oauth2 import service_account
from google.api_core import retry, exceptions
from fastapi import FastAPI, HTTPException
import httpx
from backend.models import (
    InstructionalLevel,
    SlideContent,
    SlideTopic,
    BulletPoint,
    Example,
    Presentation,
    SlideContentNew,
    SlideNew,
)
from backend.rate_limiter import RateLimiter
from backend.exceptions import (
    ImageGenerationError,
    ImageServiceProvider,
    ErrorType,
    ContentSafetyError
)
from dotenv import load_dotenv
from backend.utils.export_utils import create_presentation

# Load environment variables from .env file
load_dotenv()

logger = logging.getLogger(__name__)

# Try to import Imagen, but don't fail if not available
try:
    from vertexai.preview import generative_models
    IMAGEN_AVAILABLE = True
    logger.info("Successfully imported Vertex AI Imagen")
except ImportError:
    IMAGEN_AVAILABLE = False
    logger.warning("Vertex AI Imagen not available, falling back to DALL-E")

# List of sensitive topics requiring special handling
SENSITIVE_TOPICS = [
    "israeli palestinian conflict",
    "israel palestine",
    "gaza",
    "west bank",
    "middle east conflict"
]

def is_sensitive_topic(context: str) -> bool:
    """Check if the given context contains sensitive topics."""
    context_lower = context.lower()
    return any(topic in context_lower for topic in SENSITIVE_TOPICS)

class AIService:
    def __init__(self, rate_limiter: RateLimiter):
        """Initialize the AIService."""
        self.rate_limiter = rate_limiter
        self.imagen_available = False
        
        # Get OpenAI API key from environment
        openai_key = os.getenv("OPENAI_API_KEY")
        if not openai_key:
            logger.error("OPENAI_API_KEY environment variable is not set")
            raise ValueError("OPENAI_API_KEY environment variable is not set")
        
        # Initialize OpenAI client with API key
        self.client = AsyncOpenAI(
            api_key=openai_key,
            default_headers={"User-Agent": "marvelAI/1.0"},
            http_client=httpx.AsyncClient(
                timeout=60.0,
                limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)
            )
        )
        
        # Log API key validation (safely)
        logger.info(f"OpenAI API Key loaded and starts with: {openai_key[:4]}...")
        
        # Initialize Vertex AI with Google Cloud credentials if Imagen is available
        if IMAGEN_AVAILABLE:
            try:
                project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
                if not project_id:
                    raise ValueError("GOOGLE_CLOUD_PROJECT environment variable not set")
                
                credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
                if not credentials_path:
                    raise ValueError("GOOGLE_APPLICATION_CREDENTIALS environment variable not set")
                
                if not os.path.exists(credentials_path):
                    raise ValueError(f"Credentials file not found at: {credentials_path}")
                
                # Initialize credentials from service account file
                try:
                    credentials = service_account.Credentials.from_service_account_file(
                        credentials_path,
                        scopes=["https://www.googleapis.com/auth/cloud-platform"]
                    )
                    
                    # Verify required roles are present
                    required_roles = [
                        "roles/aiplatform.user",
                        "roles/serviceusage.serviceUsageViewer"
                    ]
                    
                    if hasattr(credentials, 'roles'):
                        missing_roles = [role for role in required_roles if role not in credentials.roles]
                        if missing_roles:
                            logger.warning(f"Missing required roles: {', '.join(missing_roles)}")
                            self.imagen_available = False
                        else:
                            self.imagen_available = True
                except Exception as e:
                    logger.error(f"Failed to initialize Google Cloud credentials: {str(e)}")
                    self.imagen_available = False
                
                # Initialize Vertex AI with the correct project and region
                if self.imagen_available:
                    try:
                        vertexai.init(
                            project=project_id,
                            location="us-central1",  # Imagen is available in us-central1
                            credentials=credentials
                        )
                        logger.info(f"Initialized Vertex AI with project: {project_id}")
                    except Exception as e:
                        logger.error(f"Failed to initialize Vertex AI: {str(e)}")
                        self.imagen_available = False
            except Exception as e:
                logger.error(f"Failed to setup Imagen: {str(e)}")
                self.imagen_available = False
        else:
            self.imagen_available = False
        
        if not self.imagen_available:
            logger.info("Imagen not available, using DALL-E as fallback")
        
        # Create images directory if it doesn't exist
        self.images_dir = Path("static/images")
        self.images_dir.mkdir(parents=True, exist_ok=True)
        logger.debug(f"Images directory created at {self.images_dir}")

    async def initialize(self):
        """Initialize async components."""
        try:
            # Test API connection
            await self.test_openai_connection()
            logger.info("OpenAI API connection test successful")
        except AuthenticationError as e:
            logger.error(f"OpenAI API key is invalid: {str(e)}")
            raise ValueError("Invalid OpenAI API key. Please check your API key and try again.")
        except RateLimitError as e:
            logger.error(f"OpenAI API rate limit exceeded: {str(e)}")
            raise ValueError("Rate limit exceeded. Please try again in a few minutes.")
        except Exception as e:
            logger.error(f"Failed to test OpenAI connection: {str(e)}")
            logger.error(traceback.format_exc())
            raise ValueError(f"Failed to test OpenAI connection: {str(e)}")

    async def test_openai_connection(self):
        """Test the OpenAI API connection."""
        try:
            # Simple API call to test connection
            response = await self.client.models.list()
            logger.info("OpenAI API connection test successful")
        except AuthenticationError:
            logger.error("OpenAI API key is invalid")
            raise
        except APIConnectionError:
            logger.error("Failed to connect to OpenAI API")
            raise
        except Exception as e:
            logger.error(f"OpenAI API test failed: {str(e)}")
            raise

    async def _make_openai_request(self, operation_type: str, func, *args, **kwargs):
        """Make an OpenAI API request with rate limiting."""
        try:
            # Wait if we're at the rate limit
            await self.rate_limiter.wait_if_needed(operation_type)
            
            # Make the API call
            return await func(*args, **kwargs)
            
        except AuthenticationError as e:
            logger.error(f"OpenAI API key is invalid: {str(e)}")
            raise ValueError("Invalid OpenAI API key. Please check your API key and try again.")
        except RateLimitError as e:
            logger.error(f"OpenAI API rate limit exceeded: {str(e)}")
            raise ValueError("Rate limit exceeded. Please try again in a few minutes.")
        except APIError as e:
            if "insufficient_quota" in str(e):
                logger.error(f"OpenAI API quota exceeded: {str(e)}")
                raise ValueError("OpenAI API quota exceeded. Please check your billing status or upgrade your plan.")
            else:
                logger.error(f"OpenAI API error: {str(e)}")
                raise ValueError(f"OpenAI API error: {str(e)}")
        except Exception as e:
            logger.error(f"OpenAI API error: {str(e)}")
            raise ValueError(f"OpenAI API error: {str(e)}")

    async def _validate_json_response(self, response_text: str) -> dict:
        """Validate and parse JSON response from OpenAI."""
        try:
            # First, try to parse the JSON
            try:
                response_data = json.loads(response_text)
            except json.JSONDecodeError as e:
                # If direct parsing fails, try to extract JSON from markdown
                match = re.search(r'```json\n(.*?)\n```', response_text, re.DOTALL)
                if match:
                    try:
                        response_data = json.loads(match.group(1))
                    except json.JSONDecodeError:
                        raise ValueError(f"Invalid JSON in markdown block: {str(e)}")
                else:
                    raise ValueError(f"Failed to parse JSON response: {str(e)}")

            # Validate the response format
            await self._validate_response_format(response_data)
            return response_data

        except Exception as e:
            logger.error(f"Error validating JSON response: {str(e)}")
            logger.error(f"Response text: {response_text}")
            raise ValueError(f"Invalid response format: {str(e)}")

    async def _validate_response_format(self, response_data: dict) -> None:
        """Validate that the response has the correct format."""
        try:
            # For outline generation
            if "topics" in response_data:
                if not isinstance(response_data["topics"], list):
                    raise ValueError("Topics must be a list")
                for topic in response_data["topics"]:
                    if not isinstance(topic, dict):
                        raise ValueError("Each topic must be a dictionary")
                    if "title" not in topic or "description" not in topic:
                        raise ValueError("Each topic must have a title and description")
        except Exception as e:
            logger.error(f"Error validating response format: {str(e)}")
            raise ValueError(f"Invalid response format: {str(e)}")

    async def generate_image(self, prompt: str, context: Optional[Dict[str, Any]] = None, retry_count: int = 0, max_retries: int = 3) -> str:
        """Generate image with Imagen, falling back to DALL-E if needed.
        
        Args:
            prompt: The image generation prompt
            context: Optional dictionary containing request context (e.g., topic, level)
            retry_count: Current retry attempt number
            max_retries: Maximum number of retries allowed
            
        Returns:
            str: Base64 encoded image data
        """
        try:
            # First try Imagen
            try:
                return await self._generate_image_imagen(prompt, context)
            except ImageGenerationError as e:
                logger.warning(f"Imagen generation failed: {e.message}")
                if retry_count < max_retries:
                    # Exponential backoff
                    wait_time = 2 ** retry_count
                    logger.info(f"Retrying Imagen in {wait_time} seconds...")
                    await asyncio.sleep(wait_time)
                    return await self.generate_image(prompt, context, retry_count + 1, max_retries)
                else:
                    logger.warning(f"Imagen failed after {max_retries} attempts, falling back to DALL-E")
                    return await self._generate_image_dalle(prompt, context)
            except Exception as e:
                logger.error(f"Unexpected error in Imagen generation: {str(e)}")
                raise ImageGenerationError(
                    message=str(e),
                    error_type=ImageGenerationErrorType.API_ERROR,
                    service=ImageServiceProvider.IMAGEN
                )

        except Exception as e:
            logger.error(f"Failed to generate image: {str(e)}")
            raise ImageGenerationError(
                message=str(e),
                error_type=ImageGenerationErrorType.API_ERROR,
                service=ImageServiceProvider.IMAGEN
            )

    async def _generate_image_imagen(self, prompt: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Generate image using Google Cloud Imagen.
        
        Args:
            prompt: The image generation prompt
            context: Optional dictionary containing request context (e.g., topic, level)
            
        Returns:
            str: Base64 encoded image data
        """
        try:
            # Wait if we're at the rate limit
            await self.rate_limiter.wait_if_needed('imagen')

            # Initialize Vertex AI
            model = generative_models.GenerativeModel("imagegeneration@002")

            # Generate the image
            response = await model.generate_images(
                prompt=prompt,
                number_of_images=1,
                image_size="1024x1024"
            )

            # Get the base64 encoded image
            if response and response.images:
                return response.images[0].base64
            else:
                raise ImageGenerationError(
                    message="No image generated by Imagen",
                    error_type=ImageGenerationErrorType.API_ERROR,
                    service=ImageServiceProvider.IMAGEN
                )

        except exceptions.PermissionDenied as e:
            raise ImageGenerationError(
                message=str(e),
                error_type=ImageGenerationErrorType.API_ERROR,
                service=ImageServiceProvider.IMAGEN
            )
        except exceptions.ResourceExhausted as e:
            if "quota" in str(e).lower():
                raise ImageGenerationError(
                    message=str(e),
                    error_type=ImageGenerationErrorType.QUOTA_EXCEEDED,
                    service=ImageServiceProvider.IMAGEN,
                    retry_after=3600  # 1 hour
                )
            else:
                raise ImageGenerationError(
                    message=str(e),
                    error_type=ImageGenerationErrorType.RATE_LIMIT,
                    service=ImageServiceProvider.IMAGEN,
                    retry_after=60  # 1 minute
                )
        except exceptions.InvalidArgument as e:
            if "safety" in str(e).lower():
                raise ImageGenerationError(
                    message=str(e),
                    error_type=ImageGenerationErrorType.SAFETY_VIOLATION,
                    service=ImageServiceProvider.IMAGEN
                )
            else:
                raise ImageGenerationError(
                    message=str(e),
                    error_type=ImageGenerationErrorType.INVALID_REQUEST,
                    service=ImageServiceProvider.IMAGEN
                )
        except exceptions.ServiceUnavailable as e:
            raise ImageGenerationError(
                message=str(e),
                error_type=ImageGenerationErrorType.NETWORK_ERROR,
                service=ImageServiceProvider.IMAGEN,
                retry_after=30  # 30 seconds
            )
        except Exception as e:
            raise ImageGenerationError(
                message=str(e),
                error_type=ImageGenerationErrorType.API_ERROR,
                service=ImageServiceProvider.IMAGEN
            )

    async def _generate_image_dalle(self, prompt: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Generate image using DALL-E as fallback.
        
        Args:
            prompt: The image generation prompt
            context: Optional dictionary containing request context (e.g., topic, level)
            
        Returns:
            str: Base64 encoded image data
        """
        try:
            # Wait if we're at the rate limit
            await self.rate_limiter.wait_if_needed('dalle')

            # Generate the image
            response = await self._make_openai_request(
                'dalle',
                self.client.images.generate,
                model="dall-e-3",
                prompt=prompt,
                n=1,
                size="1024x1024",
                response_format="b64_json"
            )

            if response and response.data:
                return response.data[0].b64_json
            else:
                raise ImageGenerationError(
                    message="No image generated by DALL-E",
                    error_type=ImageGenerationErrorType.API_ERROR,
                    service=ImageServiceProvider.DALLE
                )

        except Exception as e:
            # Convert to our custom error format
            raise ImageGenerationError.from_dalle_error(e, context)

    async def _generate_image_url(self, topic: str, level: InstructionalLevel) -> Tuple[str, str]:
        """Generate an educational image using Imagen with DALL-E fallback."""
        MAX_IMAGEN_RETRIES = 3
        RETRY_DELAY = 2  # seconds

        # Sanitize topic for file naming
        safe_topic = topic.lower().replace('/', '_').replace('\\', '_').replace(' ', '_')

        # Generate the base prompt for both services
        prompt = f"""Create a detailed, educational illustration for {topic}.
        Style: Clean, modern, suitable for {level.value.replace('_', ' ')} level education.
        Type: Diagram or illustration that clearly explains key concepts.
        Must be: Scientifically accurate, visually engaging, and educational."""

        context = {"topic": topic, "level": level.value}

        try:
            # Try generating with Imagen first (with retries)
            try:
                image_data = await self.generate_image(prompt, context=context, max_retries=MAX_IMAGEN_RETRIES)
                image_path = self._save_base64_image(image_data, f"slide_{safe_topic}")
                return image_path, "Generated educational illustration with Imagen"
            except ImageGenerationError as e:
                # If Imagen fails, try DALL-E
                logger.warning(f"Imagen generation failed, trying DALL-E: {e.message}")
                try:
                    image_data = await self._generate_image_dalle(prompt, context)
                    image_path = self._save_base64_image(image_data, f"slide_{safe_topic}")
                    return image_path, "Generated educational illustration with DALL-E"
                except ImageGenerationError as dalle_error:
                    # If both fail, raise the DALL-E error
                    logger.error(f"Both Imagen and DALL-E failed: {dalle_error.message}")
                    raise dalle_error
            except Exception as e:
                logger.error(f"Unexpected error in image generation: {str(e)}")
                # Try DALL-E as fallback
                try:
                    image_data = await self._generate_image_dalle(prompt, context)
                    image_path = self._save_base64_image(image_data, f"slide_{safe_topic}")
                    return image_path, "Generated educational illustration with DALL-E"
                except ImageGenerationError as dalle_error:
                    logger.error(f"DALL-E fallback also failed: {dalle_error.message}")
                    raise dalle_error

        except Exception as e:
            if isinstance(e, ImageGenerationError):
                raise e
            logger.error(f"Failed to generate image: {str(e)}")
            raise ImageGenerationError(
                message=str(e),
                error_type=ImageGenerationErrorType.API_ERROR,
                service=ImageServiceProvider.IMAGEN
            )

    def _save_base64_image(self, base64_data: str, name_prefix: str) -> str:
        """Save a base64 encoded image to the static directory."""
        try:
            # Create a hash of the image data for unique naming
            image_hash = hashlib.md5(base64_data.encode()).hexdigest()[:8]
            # Sanitize the name prefix to avoid directory path issues
            safe_prefix = name_prefix.replace('/', '_').replace('\\', '_').lower()
            image_name = f"{safe_prefix}_{image_hash}.png"
            image_path = self.images_dir / image_name

            # Decode and save the image
            image_data = base64.b64decode(base64_data)
            with open(image_path, "wb") as f:
                f.write(image_data)

            # Return the URL path (without domain) that will be served by FastAPI's static files
            return f"static/images/{image_name}"
        except Exception as e:
            logger.error(f"Error saving image: {str(e)}")
            raise ImageGenerationError(
                message=f"Failed to save generated image: {str(e)}",
                error_type=ImageGenerationErrorType.API_ERROR,
                service=ImageServiceProvider.IMAGEN
            )

    async def generate_outline(self, context: str, num_slides: int, level: InstructionalLevel, sensitive: bool = False) -> dict:
        """Generate a presentation outline based on context and parameters."""
        try:
            logger.info(f"Generating outline for context: {context}")
            logger.debug(f"Parameters: num_slides={num_slides}, level={level}")
            
            # Create the prompt
            prompt = {
                "context": context,
                "num_slides": num_slides,
                "level": level.value,
                "instructions": "Create an educational presentation outline with detailed descriptions"
            }
            
            completion = await self._make_openai_request(
                'chat',
                self.client.chat.completions.create,
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": f"""You are a JSON generator for educational presentation outlines. 
                        Analyze the input and return a JSON object with a 'topics' array containing exactly {num_slides} topics.
                        
                        Each topic must have:
                        - 'title': A clear, concise title (3-7 words)
                        - 'description': A detailed 2-3 sentence description explaining the key points and importance of this topic
                        
                        Requirements:
                        - Topics must be unique and non-overlapping
                        - Descriptions must be specific and informative
                        - Content must be appropriate for {level.value} level
                        - No empty or one-word descriptions
                        - Include specific examples or data points in descriptions"""
                    },
                    {"role": "user", "content": json.dumps(prompt, indent=2)}
                ],
                temperature=0.7
            )
            
            # Get the response content
            response_text = completion.choices[0].message.content
            logger.debug(f"Raw response: {response_text}")
            
            # Parse and validate the response
            response_data = await self._validate_json_response(response_text)
            fixed_topics = []
            for topic in response_data["topics"]:
                # Ensure key_points is present and is a list of strings
                if "key_points" not in topic or not isinstance(topic["key_points"], list):
                    topic["key_points"] = []
                else:
                    # Coerce all key_points to strings (in case)
                    topic["key_points"] = [str(kp) for kp in topic["key_points"]]
                fixed_topics.append(topic)
            topics = [SlideTopic(**topic) for topic in fixed_topics]
            
            logger.info(f"Successfully generated {len(topics)} topics")
            return {
                "topics": topics,
                "warnings": []
            }
            
        except Exception as e:
            logger.error(f"Error in generate_outline: {str(e)}")
            logger.error(traceback.format_exc())
            raise

    async def generate_slide_content(self, topic: SlideTopic, level: InstructionalLevel, layout: str) -> SlideContentNew:
        """Generate content for a single slide."""
        try:
            logger.info(f"Generating slide content for topic: {topic.title}")
            
            # First, generate the slide content
            completion = await self._make_openai_request(
                'chat',
                self.client.chat.completions.create,
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": """You are a JSON generator for educational slide content.
                        Create engaging, informative content suitable for the specified educational level.
                        
                        Required JSON structure:
                        {
                            "title": "string (3-7 words)",
                            "bullet_points": ["string", "string", ...],
                            "examples": ["string", "string", ...],
                            "discussion_questions": ["string", "string", ...]
                        }
                        
                        Guidelines:
                        - Title should be clear and concise
                        - Include 3-5 bullet points with key concepts
                        - Provide 2-3 concrete examples
                        - Add 2-3 thought-provoking discussion questions
                        - Content must be accurate and educational
                        - Return ONLY the JSON object, no other text"""
                    },
                    {
                        "role": "user",
                        "content": json.dumps({
                            "topic": topic.dict(),
                            "level": level.value,
                            "instructions": "Generate educational slide content following the exact JSON structure specified."
                        }, indent=2)
                    }
                ],
                temperature=0.7
            )
            
            # Parse the response
            response_text = completion.choices[0].message.content
            content_data = await self._validate_json_response(response_text)
            
            # Generate an image for the slide
            try:
                image_path, image_caption = await self._generate_image_url(topic.title, level)
            except ImageGenerationError as e:
                # Re-raise ImageGenerationError to be handled by the endpoint
                raise
            except Exception as e:
                # Convert other errors to ImageGenerationError
                raise ImageGenerationError(
                    message=f"Failed to generate image: {str(e)}",
                    error_type=ImageGenerationErrorType.API_ERROR,
                    service=ImageServiceProvider.IMAGEN
                )
            
            # Create the slide content
            return SlideContentNew(
                title=content_data["title"],
                bullet_points=[BulletPoint(text=point) for point in content_data["bullet_points"]],
                examples=[Example(text=example) for example in content_data["examples"]],
                discussion_questions=content_data["discussion_questions"],
                image_url=str(image_path),
                image_caption=image_caption,
                layout=layout
            )
            
        except ImageGenerationError:
            # Re-raise ImageGenerationError to be handled by the endpoint
            raise
        except Exception as e:
            logger.error(f"Error generating slide content: {str(e)}")
            logger.error(traceback.format_exc())
            raise ValueError(f"Failed to generate slide content: {str(e)}")

    async def enhance_content(self, slide_content: SlideContent) -> SlideContent:
        """Enhance slide content with Gemini Pro (optional enhancement)."""
        try:
            # Initialize Vertex AI
            vertexai.init(project="marvelai-imagen")
            return slide_content
        except Exception as e:
            logger.error(f"Error in enhance_content: {str(e)}")
            # Don't raise an error here, just return the original content
            return slide_content

    def export_presentation(self, presentation: Presentation, format: str = "pptx") -> str:
        """Export presentation with secure image handling."""
        try:
            # Create exports directory in static for easy access
            export_dir = os.path.join("static", "exports")
            
            # Convert presentation to format needed by export utils
            slides_data = []
            for slide in presentation.slides:
                slide_data = {
                    "title": slide.title,
                    "bullet_points": [{"text": point.text} for point in slide.bullet_points],
                    "examples": [{"text": ex.text} for ex in slide.examples],
                    "discussion_questions": slide.discussion_questions,
                    "image_url": slide.image_url
                }
                slides_data.append(slide_data)
            
            # Export presentation
            output_path = create_presentation(
                title=presentation.topics[0].title,
                slides=slides_data,
                output_dir=export_dir
            )
            
            # Return relative path for frontend
            return os.path.relpath(output_path, "static")
            
        except Exception as e:
            logger.error(f"Error exporting presentation: {str(e)}")
            logger.error(traceback.format_exc())
            raise ValueError(f"Failed to export presentation: {str(e)}")
