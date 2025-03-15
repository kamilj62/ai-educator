from enum import Enum
from typing import List, Optional, Tuple, Dict, Any
import os
import asyncio
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
from vertexai.preview import generative_models
from google.cloud import aiplatform
from google.oauth2 import service_account
from google.api_core import retry, exceptions
from fastapi import HTTPException
from models import InstructionalLevel, SlideContent, SlideTopic, BulletPoint, Example
from rate_limiter import RateLimiter
from exceptions import (
    ImageGenerationError,
    ImageServiceProvider,
    ImageGenerationErrorType
)
import openai
from openai import AsyncOpenAI, APIError, RateLimitError, APIConnectionError, APITimeoutError, AuthenticationError
import time
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

logger = logging.getLogger(__name__)

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
        self.client = AsyncOpenAI(api_key=openai_key)
        
        # Log API key validation (safely)
        logger.info(f"OpenAI API Key loaded and starts with: {openai_key[:4]}...")
            
        # Initialize Vertex AI with Google Cloud credentials
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
            
        except Exception as e:
            logger.error(f"Failed to initialize Google Cloud credentials: {str(e)}")
            raise ValueError(f"Invalid Google Cloud credentials: {str(e)}")
        
        # Initialize Vertex AI with the correct project and region
        try:
            vertexai.init(
                project=project_id,
                location="us-central1",  # Imagen is available in us-central1
                credentials=credentials
            )
            logger.info(f"Initialized AIService with project: {project_id}")
        except Exception as e:
            logger.error(f"Failed to initialize Vertex AI: {str(e)}")
            raise ValueError(f"Failed to initialize Vertex AI: {str(e)}")
        
        # Create images directory if it doesn't exist
        self.images_dir = Path("static/images")
        self.images_dir.mkdir(parents=True, exist_ok=True)
        logger.debug(f"Images directory created at {self.images_dir}")
            
    async def initialize(self):
        """Initialize async components."""
        try:
            # Test API connection
            await self.test_connection()
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

    async def test_connection(self):
        """Test the OpenAI API connection."""
        try:
            await self.client.models.list()
        except AuthenticationError as e:
            logger.error(f"OpenAI API key is invalid: {str(e)}")
            raise
        except RateLimitError as e:
            logger.error(f"OpenAI API rate limit exceeded: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"OpenAI API connection test failed: {str(e)}")
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
                return

            # For slide content generation
            required_fields = ["title", "bullet_points", "examples", "discussion_questions"]
            for field in required_fields:
                if field not in response_data:
                    raise ValueError(f"Missing required field: {field}")
                
                # Title should be a string
                if field == "title":
                    if not isinstance(response_data[field], str):
                        raise ValueError("Title must be a string")
                    if not response_data[field].strip():
                        raise ValueError("Title cannot be empty")
                    continue
                
                # Other fields should be lists
                if not isinstance(response_data[field], list):
                    raise ValueError(f"Field {field} must be a list")
                
                # Validate list items
                for i, item in enumerate(response_data[field]):
                    if not isinstance(item, str):
                        raise ValueError(f"Item {i+1} in {field} must be a string")
                    if not item.strip():
                        raise ValueError(f"Item {i+1} in {field} cannot be empty")

        except Exception as e:
            logger.error(f"Error validating response format: {str(e)}")
            logger.error(f"Response data: {json.dumps(response_data, indent=2)}")
            raise

    async def _download_and_save_image(self, image_url: str) -> str:
        """Download an image from a URL and save it locally."""
        try:
            # Generate a unique filename based on the URL
            filename = hashlib.md5(image_url.encode()).hexdigest() + ".png"
            filepath = self.images_dir / filename
            
            # If file already exists, return its path
            if filepath.exists():
                logger.debug(f"Image already exists at {filepath}")
                return str(filepath)
            
            # Download and save the image
            async with aiohttp.ClientSession() as session:
                async with session.get(image_url) as response:
                    response.raise_for_status()
                    image_data = await response.read()
                    
                    with open(filepath, "wb") as f:
                        f.write(image_data)
                    
                    logger.debug(f"Image saved to {filepath}")
                    return str(filepath)
                    
        except Exception as e:
            logger.error(f"Failed to download and save image: {str(e)}")
            raise ValueError(f"Failed to download and save image: {str(e)}")

    async def _verify_imagen_access(self) -> bool:
        """Verify access to Imagen API."""
        try:
            # 1. Check environment variables (from our memory requirements)
            project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
            if not project_id:
                logger.error("GOOGLE_CLOUD_PROJECT environment variable not set")
                return False

            credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
            if not credentials_path or not os.path.exists(credentials_path):
                logger.error("Invalid GOOGLE_APPLICATION_CREDENTIALS")
                return False

            # 2. Load and verify credentials
            try:
                from google.oauth2 import service_account
                import json
                
                # Read service account info to verify project
                with open(credentials_path) as f:
                    creds_data = json.load(f)
                    
                if creds_data.get('project_id') != project_id:
                    logger.error(f"Project ID mismatch: {project_id} != {creds_data.get('project_id')}")
                    return False
                    
                credentials = service_account.Credentials.from_service_account_file(
                    credentials_path,
                    scopes=['https://www.googleapis.com/auth/cloud-platform']
                )
                logger.info(f"Successfully loaded credentials for {credentials.service_account_email}")
            except Exception as e:
                logger.error(f"Failed to load credentials: {str(e)}")
                return False

            # 3. Initialize Vertex AI with explicit project and region
            try:
                # Initialize Vertex AI with our project settings
                vertexai.init(
                    project=project_id,
                    location="us-central1",
                    credentials=credentials
                )
                logger.info("Successfully initialized Vertex AI")
                
                # Get the Imagen model
                model = generative_models.GenerativeModel("imagegeneration@002")
                logger.info("Successfully loaded Imagen model")
            except Exception as e:
                logger.error(f"Failed to initialize Imagen model: {str(e)}")
                return False
            
            # 4. Try a minimal test request
            try:
                response = model.generate_content(
                    "A simple test image of a blue circle"
                )
                
                if response and response.candidates:
                    logger.info("Successfully generated test image with Imagen")
                    return True
                else:
                    logger.error("Imagen API test request returned no images")
                    return False
                    
            except Exception as e:
                error_msg = str(e)
                if "permission" in error_msg.lower():
                    logger.error(f"Permission error with Imagen API: {error_msg}")
                elif "quota" in error_msg.lower():
                    logger.error(f"Quota error with Imagen API: {error_msg}")
                else:
                    logger.error(f"Unknown error with Imagen API: {error_msg}")
                return False
            
        except Exception as e:
            logger.error(f"Failed to verify Imagen access: {str(e)}")
            return False

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

    async def generate_outline(self, context: str, num_slides: int, level: InstructionalLevel) -> List[SlideTopic]:
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
            topics = [SlideTopic(**topic) for topic in response_data["topics"]]
            
            logger.info(f"Successfully generated {len(topics)} topics")
            return topics
            
        except Exception as e:
            logger.error(f"Error in generate_outline: {str(e)}")
            logger.error(traceback.format_exc())
            raise

    async def generate_slide_content(self, topic: SlideTopic, level: InstructionalLevel) -> SlideContent:
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
            return SlideContent(
                title=content_data["title"],
                bullet_points=[BulletPoint(text=point) for point in content_data["bullet_points"]],
                examples=[Example(text=example) for example in content_data["examples"]],
                discussion_questions=content_data["discussion_questions"],
                image_url=image_path,
                image_caption=image_caption
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

    async def _validate_content_specificity(self, slide_data: dict) -> None:
        """Validate that the content is specific, detailed, and non-repetitive."""
        # Generic terms to avoid
        generic_terms = {'things', 'stuff', 'etc'}
        
        # Track used content to prevent repetition
        used_content = set()
        
        def check_text(text: str, context: str, min_words: int = 4) -> None:
            # Remove punctuation for word counting
            words = text.replace(',', ' ').replace('.', ' ').replace(';', ' ').split()
            unique_words = set(w.lower() for w in words)
            
            # Check for overly generic terms
            if generic_terms & unique_words:
                raise ValueError(f"Found overly generic terms in {context}: {generic_terms & unique_words}")
            
            # Check for repetitive content
            content_key = ' '.join(sorted(unique_words))  # Normalize word order
            if content_key in used_content:
                raise ValueError(f"Found repetitive content in {context}: {text}")
            used_content.add(content_key)
            
            # Allow shorter phrases if they contain specific data or terminology
            contains_data = any(c.isdigit() for c in text)
            contains_proper_noun = any(w[0].isupper() and not w.isupper() for w in words[1:])  # Skip first word
            contains_date = bool(re.search(r'\b\d{4}\b', text))  # Check for year
            
            if len(words) < min_words and not (contains_data or contains_proper_noun or contains_date):
                raise ValueError(f"Content needs more detail in {context}: {text}")

        # Validate title and subtitle
        if not slide_data.get('title'):
            raise ValueError("Missing title")
        if not slide_data.get('subtitle'):
            raise ValueError("Missing subtitle")
        check_text(slide_data['subtitle'], 'subtitle')

        # Validate introduction
        if not slide_data.get('introduction'):
            raise ValueError("Missing introduction")
        check_text(slide_data['introduction'], 'introduction', min_words=8)

        # Track topics to prevent repetition across bullet points
        topic_fingerprints = set()
        
        # Validate bullet points
        if not slide_data.get('bullet_points'):
            raise ValueError("Missing bullet points")
            
        for i, point in enumerate(slide_data['bullet_points']):
            # Extract main topic from bullet point and create fingerprint
            topic_words = ' '.join(sorted(set(point.lower().split())))
            if topic_words in topic_fingerprints:
                raise ValueError(f"Bullet point {i+1} repeats a previously covered topic")
            topic_fingerprints.add(topic_words)
            
            # Main point should be more detailed
            check_text(point, f"bullet point {i+1}", min_words=6)
            
            # Sub-points can be more concise if they contain specific data
            for j, sub_point in enumerate(point.get('sub_points', [])):
                check_text(sub_point, f"sub-point {i+1}.{j+1}", min_words=4)

        # Validate examples
        if not slide_data.get('examples'):
            raise ValueError("Missing examples")
            
        for i, example in enumerate(slide_data['examples']):
            # Check if example repeats a topic from bullet points
            example_words = ' '.join(sorted(set(example.lower().split())))
            if example_words in topic_fingerprints:
                raise ValueError(f"Example {i+1} repeats content from bullet points")
            topic_fingerprints.add(example_words)
            
            # Description should be detailed
            check_text(example, f"example {i+1}", min_words=5)
            
            # Details can be more concise if they contain specific data
            for j, detail in enumerate(example.get('details', [])):
                check_text(detail, f"example detail {i+1}.{j+1}", min_words=4)

        # Validate key takeaway
        if not slide_data.get('key_takeaway'):
            raise ValueError("Missing key takeaway")
        check_text(slide_data['key_takeaway'], 'key takeaway', min_words=6)

        # Validate discussion questions
        if not slide_data.get('discussion_questions'):
            raise ValueError("Missing discussion questions")
            
        for i, question in enumerate(slide_data['discussion_questions']):
            # Ensure questions cover different aspects
            question_words = ' '.join(sorted(set(question.lower().split())))
            if question_words in topic_fingerprints:
                raise ValueError(f"Discussion question {i+1} repeats content from bullet points")
            topic_fingerprints.add(question_words)
            
            # Ensure proper question format
            if not any(w in question.lower() for w in ['how', 'what', 'why', 'when', 'where', 'which']):
                raise ValueError(f"Discussion question {i+1} should start with a question word (how, what, why, etc.)")
            check_text(question, f"discussion question {i+1}", min_words=6)
