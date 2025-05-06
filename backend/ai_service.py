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
from openai import AsyncOpenAI
from google.cloud import aiplatform
from google.oauth2 import service_account
from google.api_core import retry, exceptions
from fastapi import FastAPI, HTTPException
import httpx
from models import (
    InstructionalLevel,
    SlideContent,
    SlideTopic,
    BulletPoint,
    Example,
    Presentation,
    SlideNew,
    SlideContentNew,
    SlideLayout
)
from rate_limiter import RateLimiter
from exceptions import (
    ImageGenerationError,
    ImageServiceProvider,
    ErrorType,
    ContentSafetyError
)
from dotenv import load_dotenv
from utils.export_utils import create_presentation

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
        self.client = AsyncOpenAI(api_key=openai_key)
        logger.info(f"OpenAI API Key loaded and starts with: {openai_key[:4]}...")
        
        # Imagen initialization (optional)
        credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        if credentials_path and os.path.exists(credentials_path):
            try:
                credentials = service_account.Credentials.from_service_account_file(
                    credentials_path,
                    scopes=["https://www.googleapis.com/auth/cloud-platform"]
                )
                self.imagen_available = True
            except Exception as e:
                logger.error(f"Failed to initialize Google Cloud credentials: {str(e)}")
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
        except Exception as e:
            logger.error(f"OpenAI API test failed: {str(e)}")
            raise

    async def test_openai_connection(self):
        # Dummy test for OpenAI API
        try:
            await self.client.models.list()
        except Exception as e:
            raise APIConnectionError(f"OpenAI API test failed: {str(e)}")

    async def generate_image(self, prompt: str) -> Dict[str, str]:
        """Generate an image using available image service."""
        try:
            if self.imagen_available:
                try:
                    return await self._generate_image_imagen(prompt)
                except Exception as e:
                    logging.error(f"Imagen generation failed: {str(e)}")
                    # Fall back to DALL-E
                    return await self._generate_image_dalle(prompt)
            else:
                return await self._generate_image_dalle(prompt)
        except Exception as e:
            error_type = ErrorType.API_ERROR
            service = ImageServiceProvider.IMAGEN if self.imagen_available else ImageServiceProvider.DALLE
            
            if isinstance(e, RateLimitError):
                error_type = ErrorType.RATE_LIMIT
            elif isinstance(e, APITimeoutError):
                error_type = ErrorType.API_ERROR
            elif isinstance(e, APIConnectionError):
                error_type = ErrorType.NETWORK_ERROR
            elif isinstance(e, AuthenticationError):
                error_type = ErrorType.API_ERROR
            
            raise ImageGenerationError(
                message=str(e),
                error_type=error_type,
                service=service,
                retry_after=getattr(e, 'retry_after', None),
                recommendations=[
                    "Try a simpler image prompt",
                    "Check if the image service is available",
                    "Wait and try again later"
                ]
            )

    async def _generate_image_dalle(self, prompt: str) -> Dict[str, str]:
        """Generate an image using DALL-E."""
        try:
            response = await self.client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                n=1,
                size="1024x1024"
            )
            
            if not response.data:
                raise ImageGenerationError(
                    message="No image data received from DALL-E",
                    error_type=ErrorType.API_ERROR,
                    service=ImageServiceProvider.DALLE,
                    recommendations=[
                        "Try a different image prompt",
                        "Check if DALL-E service is available",
                        "Try again later"
                    ]
                )
            
            return {"url": response.data[0].url}
            
        except Exception as e:
            error_type = ErrorType.API_ERROR
            if isinstance(e, RateLimitError):
                error_type = ErrorType.RATE_LIMIT
            elif isinstance(e, APITimeoutError):
                error_type = ErrorType.API_ERROR
            elif isinstance(e, APIConnectionError):
                error_type = ErrorType.NETWORK_ERROR
            elif isinstance(e, AuthenticationError):
                error_type = ErrorType.API_ERROR
            
            raise ImageGenerationError(
                message=str(e),
                error_type=error_type,
                service=ImageServiceProvider.DALLE,
                retry_after=getattr(e, 'retry_after', None),
                recommendations=[
                    "Try a simpler image prompt",
                    "Check your API key and permissions",
                    "Wait and try again later"
                ]
            )

    async def _generate_image_imagen(self, prompt: str) -> Dict[str, str]:
        """Generate an image using Imagen."""
        try:
            model = aiplatform.GenerativeModel("imagegeneration@002")
            response = await model.generate_images(
                prompt=prompt,
                number_of_images=1,
                image_parameters={"size": "1024x1024"}
            )
            
            if not response.images:
                raise ImageGenerationError(
                    message="No image data received from Imagen",
                    error_type=ErrorType.API_ERROR,
                    service=ImageServiceProvider.IMAGEN,
                    recommendations=[
                        "Try a different image prompt",
                        "Check if Imagen service is available",
                        "Try again later"
                    ]
                )
            
            return {"url": response.images[0].url}
            
        except Exception as e:
            error_type = ErrorType.API_ERROR
            if "quota" in str(e).lower():
                error_type = ErrorType.QUOTA_EXCEEDED
            elif "rate" in str(e).lower():
                error_type = ErrorType.RATE_LIMIT
            elif "safety" in str(e).lower():
                error_type = ErrorType.SAFETY_VIOLATION
            
            raise ImageGenerationError(
                message=str(e),
                error_type=error_type,
                service=ImageServiceProvider.IMAGEN,
                retry_after=None,  # Imagen doesn't provide retry_after
                recommendations=[
                    "Try a simpler image prompt",
                    "Check your project quota and permissions",
                    "Wait and try again later"
                ]
            )

    async def generate_slide_content(self, topic: SlideTopic, instructional_level: InstructionalLevel, layout: str) -> SlideContentNew:
        """Generate content for a slide based on topic, level, and layout."""
        try:
            # Layout-specific prompts based on our layout system
            layout_prompts = {
                'title': "Create a title slide with an engaging title.",
                'title-image': "Create a title slide with a subtitle and an image that captures the main concept.",
                'title-body': "Create a slide with a title and detailed paragraph text.",
                'title-body-image': "Create a slide with a title, detailed paragraph text, and a relevant image.",
                'title-bullets': "Create a slide with a title and key points as bullet points.",
                'title-bullets-image': "Create a slide with a title, bullet points, and a supporting image.",
                'two-column': "Create a slide with a title and content split into two columns.",
                'two-column-image': "Create a slide with a title, two columns of content, and an image.",
                'title-only': "Create a title slide with only a title. Do not include a subtitle, body, or bullet points."
            }

            # Validate layout
            if layout not in layout_prompts:
                logger.error(f"Invalid layout requested: {layout}")
                raise ValueError(f"Unsupported layout: {layout}")

            # Build the prompt based on layout
            system_prompt = """You are an expert presentation content creator.\nReturn content in JSON format with this structure:\n{\n    \"title\": \"Slide Title\",\n    \"subtitle\": \"Optional subtitle\",\n    \"body\": \"Main content if layout requires body text\",\n    \"bullet_points\": [\"Point 1\", \"Point 2\", \"Point 3\"],\n    \"column_left\": \"Left column content if two-column layout\",\n    \"column_right\": \"Right column content if two-column layout\"\n}\n"""

            user_prompt = f"""
            Generate content for a {layout} slide about {topic.title}.
            The content should be suitable for {instructional_level} level.
            {layout_prompts[layout]}
            
            Key points to cover:
            {', '.join(topic.key_points)}
            
            Additional context:
            {topic.description or 'No additional context provided.'}
            """

            logger.info(f"Generating slide content for topic: {topic.title}")

            # Generate slide content using OpenAI
            completion = await self.client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=500,
                response_format={ "type": "json_object" }
            )

            # Parse the response
            try:
                content = json.loads(completion.choices[0].message.content)
                logger.debug(f"Received content: {json.dumps(content, indent=2)}")
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse OpenAI response: {str(e)}")
                logger.error(f"Raw response: {completion.choices[0].message.content}")
                raise ValueError("Failed to parse slide content response")

            # Generate image if layout requires it
            image_url = None
            image_caption = None
            if '-image' in layout:
                try:
                    image_result = await self.generate_image(topic.image_prompt)
                    image_url = image_result.get('url')
                    image_caption = topic.image_prompt
                except ImageGenerationError as e:
                    # Log the error but continue - image is optional
                    logger.error(f"Image generation failed: {str(e)}")

            # Map key_points to bullet_points (for layouts that use bullets)
            bullet_points = None
            if hasattr(topic, 'key_points') and topic.key_points:
                bullet_points = [{"text": point} for point in topic.key_points]

            slide_content = SlideContentNew(
                title=content["title"],
                subtitle=content.get("subtitle"),
                body=content.get("body"),
                bullet_points=bullet_points,
                image_url=image_url,
                image_caption=image_caption,
                layout=layout,
                column_left=content.get('column_left') if 'two-column' in layout else None,
                column_right=content.get('column_right') if 'two-column' in layout else None
            )

            return slide_content

        except Exception as e:
            logger.error(f"Error in generate_slide_content: {str(e)}")
            logger.error(traceback.format_exc())
            raise

    async def generate_outline(self, context: str, num_slides: int, level: InstructionalLevel, sensitive: bool = False) -> dict:
        """Generate a presentation outline based on context and parameters."""
        try:
            # Format the prompt for outline generation
            system_prompt = """You are an expert educational content creator. Generate a presentation outline in JSON format.
            For each slide, provide:
            1. A clear, concise title
            2. 3-5 key points that will be covered
            3. An image prompt that will generate an educational, appropriate image
            
            Format the response as a JSON object with this structure:
            {
                "topics": [
                    {
                        "title": "Slide Title",
                        "key_points": ["Point 1", "Point 2", "Point 3"],
                        "image_prompt": "Educational image description"
                    }
                ]
            }
            """
            
            user_prompt = f"""Create a {level} level presentation about "{context}" with {num_slides} slides.
            Focus on educational value and clear progression of ideas.
            Ensure all content and image prompts are appropriate for {level} level.
            Return only the JSON response, no additional text."""

            logger.info(f"Generating outline for topic: {context}")
            
            # Make the API request with rate limiting
            async with self.rate_limiter.limit('chat'):
                response = await self.client.chat.completions.create(
                    model="gpt-4-turbo-preview",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.7,
                    response_format={ "type": "json_object" }
                )

            # Parse and validate the response
            response_data = await self._validate_json_response(response.choices[0].message.content)
            
            # Add any content advisories or warnings
            warnings = []
            if sensitive:
                warnings.append("This topic may contain sensitive content. The presentation aims to provide balanced, factual information.")
            
            return {
                "topics": [t.model_dump() for t in response_data["topics"]],
                "warnings": warnings
            }
            
        except Exception as e:
            logger.error(f"Error in generate_outline: {str(e)}")
            logger.error(traceback.format_exc())
            raise

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
                    if "title" not in topic or "key_points" not in topic:
                        raise ValueError("Each topic must have a title and key points")
        except Exception as e:
            logger.error(f"Error validating response format: {str(e)}")
            raise ValueError(f"Invalid response format: {str(e)}")

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
                error_type=ErrorType.API_ERROR,
                service=ImageServiceProvider.IMAGEN
            )
