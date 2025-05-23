import asyncio
import os
import time
from typing import List, Optional, Tuple, Dict, Any
from enum import Enum
import traceback
import logging
logger = logging.getLogger(__name__)
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
    ImageGenerationErrorType,
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

    async def generate_slide_content(self, topic: SlideTopic, level: InstructionalLevel, layout: str) -> SlideContentNew:
        """Generate content for a slide based on topic, level, and layout."""
        try:
            # System prompt for the AI
            system_prompt = """You are an expert presentation content creator.\nReturn content in JSON format with this structure:\n{\n    \"title\": \"Slide Title\",\n    \"subtitle\": \"Optional subtitle\",\n    \"body\": \"Main content if layout requires body text\",\n    \"key_points\": [\"Point 1\", \"Point 2\", \"Point 3\"],\n    \"column_left\": \"Left column content if two-column layout\",\n    \"column_right\": \"Right column content if two-column layout\"\n}\n"""

            user_prompt = f"""
            Generate content for a {layout} slide about {topic.title}.
            Target audience: {level.value}
            Key points to cover: {', '.join(topic.key_points) if hasattr(topic, 'key_points') and topic.key_points else 'Not specified'}
            
            Return the content in the specified JSON format.
            """

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]

            # Generate slide content
            response = await self._make_openai_request(
                "chat",
                self.client.chat.completions.create,
                model="gpt-4",
                messages=messages,
                temperature=0.7,
                max_tokens=1000
            )

            # Parse the response
            content = response.choices[0].message.content
            content = content.strip()
            
            # Clean up the response (remove markdown code blocks if present)
            if content.startswith("```json"):
                content = content[7:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()
            
            # Parse the JSON response
            content_data = json.loads(content)
            
            # Generate an image if needed
            image_path = None
            image_caption = None
            
            if layout in ["title-image", "title-body-image", "title-bullets-image"]:
                try:
                    # Use the generate_image method which handles the actual image generation
                    image_data = await self.generate_image(
                        prompt=topic.title,
                        context={"topic": topic.title, "level": level.value}
                    )
                    if image_data and 'data' in image_data and 'image_url' in image_data['data']:
                        image_path = image_data['data']['image_url']
                        image_caption = f"Image of {topic.title}"
                except Exception as e:
                    logger.error(f"Error generating image: {str(e)}")
                    # Continue without an image if generation fails
                    image_path = None
                    image_caption = None
            
            # Prepare key_points for the layout
            key_points = None
            if hasattr(topic, 'key_points') and topic.key_points:
                key_points = [point if isinstance(point, str) else str(point) for point in topic.key_points]

            slide_content = SlideContentNew(
                title=content_data.get("title", ""),
                subtitle=content_data.get("subtitle"),
                body=content_data.get("body"),
                key_points=key_points or content_data.get("key_points", []),
                image_url=image_path,
                image_caption=image_caption,
                layout=layout,
                notes=content_data.get("notes", ""),
                column_left=content_data.get("column_left"),
                column_right=content_data.get("column_right")
            )
            
            return slide_content
            
        except Exception as e:
            logger.error(f"Error generating slide content: {str(e)}")
            logger.error(traceback.format_exc())
            raise ValueError(f"Failed to generate slide content: {str(e)}")

    async def generate_outline(self, context: str, num_slides: int, level: InstructionalLevel, sensitive: bool = False) -> dict:
        """Generate a presentation outline based on context and parameters."""
        import re
        import json
        try:
            logger.info(f"Generating outline for context: {context}")
            logger.debug(f"Parameters: num_slides={num_slides}, level={level}")

            # Strongest possible system prompt
            system_prompt = (
                "You are an expert educational presentation designer.\n"
                "You MUST generate a JSON array of slides for a presentation on a given topic, audience, and slide count.\n"
                "STRICT REQUIREMENTS (READ CAREFULLY):\n"
                "- EACH SLIDE MUST BE A JSON OBJECT WITH ALL OF THE FOLLOWING FIELDS:\n"
                "  - 'id': unique string (e.g. 'slide_1', 'slide_2', ...)\n"
                "  - 'title': non-empty string\n"
                "  - 'key_points': array of 3-5 non-empty strings\n"
                "  - 'image_prompt': non-empty string\n"
                "  - 'description': non-empty string\n"
                "- DO NOT OMIT ANY FIELD, even if you must invent plausible content.\n"
                "- If you cannot fill all fields, SKIP THAT SLIDE.\n"
                "- Output ONLY valid JSON. Do NOT include any explanation, markdown, or notes.\n"
                "- IF YOU OMIT ANY FIELD, THE REQUEST WILL FAIL.\n"
                "- THE JSON OUTPUT MUST MATCH THIS SCHEMA: [ { 'id': str, 'title': str, 'key_points': list[str], 'image_prompt': str, 'description': str }, ... ]\n"
                "\nVALID EXAMPLE 1:\n[\n  {\n    'id': 'slide_1',\n    'title': 'Phases of the Moon',\n    'key_points': [\n      'The moon has 8 phases in its monthly cycle',\n      'Phases are caused by the moon\'s orbit around Earth',\n      'New moon and full moon are opposite phases'\n    ],\n    'image_prompt': 'Diagram showing all 8 phases of the moon with labels',\n    'description': 'This slide explains the different phases of the moon and why they occur.'\n  }\n]\n"
                "\nVALID EXAMPLE 2:\n[\n  {\n    'id': 'slide_2',\n    'title': 'Photosynthesis Overview',\n    'key_points': [\n      'Plants use sunlight to make food',\n      'Photosynthesis occurs in chloroplasts',\n      'Oxygen is a byproduct'\n    ],\n    'image_prompt': 'Diagram showing sunlight, a leaf, and arrows for CO2 and O2',\n    'description': 'This slide introduces the process of photosynthesis in plants.'\n  }\n]\n"
                "\nINVALID EXAMPLE (WILL CAUSE FAILURE):\n[\n  {\n    'title': 'Incomplete Slide',\n    'description': 'This slide is missing key_points and image_prompt.'\n  }\n]\n"
                "\nDO NOT WRAP THE OUTPUT IN MARKDOWN OR ADD ANY EXPLANATION.\n"
            )
            user_prompt = (
                f"Generate a presentation outline for:\n"
                f"Topic: {context}\n"
                f"Number of slides: {num_slides}\n"
                f"Audience level: {level.value}\n"
            )

            def extract_json(text):
                # Remove markdown code block wrappers and extract first JSON array
                text = text.strip()
                text = re.sub(r'^```[a-zA-Z]*', '', text)
                text = re.sub(r'```$', '', text)
                # Try to find the first [ ... ] or { ... }
                match = re.search(r'(\[.*\]|\{.*\})', text, re.DOTALL)
                if match:
                    return match.group(1)
                return text

            max_attempts = 2
            for attempt in range(1, max_attempts + 1):
                completion = await self._make_openai_request(
                    'chat',
                    self.client.chat.completions.create,
                    model="gpt-4-turbo-preview",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.2,
                    max_tokens=2000
                )
                content = completion.choices[0].message.content
                logger.info(f"[OpenAI] Raw outline response (attempt {attempt}): {content}")
                # Try to extract JSON
                response_text = extract_json(content)
                try:
                    parsed = json.loads(response_text.replace("'", '"'))
                    if isinstance(parsed, dict) and "topics" in parsed:
                        topics = parsed["topics"]
                    elif isinstance(parsed, list):
                        topics = parsed
                    else:
                        logger.error(f"[OpenAI] Unexpected JSON structure: {parsed}")
                        topics = []
                except Exception as e:
                    logger.error(f"[OpenAI] JSON decode error: {e}")
                    logger.error(f"[OpenAI] Raw content on decode error: {response_text}")
                    topics = []
                # Log raw OpenAI content and parsed topics immediately after parsing
                logger.error(f"[OpenAI] Raw content: {content}")
                logger.error(f"[OpenAI] Parsed topics: {topics}")
                for handler in logger.handlers:
                    try:
                        handler.flush()
                    except Exception:
                        pass
                # Validate topics and repair if possible
                repaired_topics = []
                for i, topic in enumerate(topics):
                    if not isinstance(topic, dict):
                        continue
                    title = topic.get("title", "").strip()
                    description = topic.get("description", "").strip()
                    key_points = topic.get("key_points") if "key_points" in topic else None
                    image_prompt = topic.get("image_prompt", "").strip() if "image_prompt" in topic else ""
                    slide_id = topic.get("id", f"slide_{i+1}")

                    # Always synthesize missing key_points if title/description exist
                    if (not key_points or not isinstance(key_points, list) or len(key_points) < 3):
                        if description:
                            bullets = [s.strip() for s in re.split(r'[.;\n\-•]', description) if s.strip()]
                            if len(bullets) >= 3:
                                key_points = bullets[:5]
                                logger.info(f"[OpenAI][Repair] Aggressively extracted key_points from description for slide {i+1}: {key_points}")
                            else:
                                key_points = [
                                    f"Key fact about {title}",
                                    f"Another important point about {title}",
                                    f"Summary statement for {title}"
                                ]
                                logger.info(f"[OpenAI][Repair] Synthesized generic key_points for slide {i+1}: {key_points}")
                        else:
                            key_points = [
                                f"Key fact about {title}",
                                f"Another important point about {title}",
                                f"Summary statement for {title}"
                            ]
                            logger.info(f"[OpenAI][Repair] Synthesized generic key_points for slide {i+1} (no description): {key_points}")
                    # Always synthesize missing image_prompt
                    if not image_prompt and title:
                        image_prompt = f"Illustration of {title}"
                        logger.info(f"[OpenAI][Repair] Generated image_prompt for slide {i+1}: {image_prompt}")
                    # Always assign repaired fields
                    slide = dict(topic)
                    slide["key_points"] = key_points
                    slide["image_prompt"] = image_prompt
                    slide["id"] = slide_id
                    repaired_topics.append(slide)

                # Debug: Log all repaired slides before filtering
                for idx, slide in enumerate(repaired_topics):
                    logger.error(f"[DEBUG][Repaired Slide {idx+1}] Fields: title={slide.get('title')!r}, description={slide.get('description')!r}, key_points={slide.get('key_points')!r}, image_prompt={slide.get('image_prompt')!r}, id={slide.get('id')!r}")
                # Now filter: only skip slides missing BOTH title and description
                filtered_topics = []
                for slide in repaired_topics:
                    if not slide.get("title") and not slide.get("description"):
                        logger.warning(f"[OpenAI][Filter] Slide {slide.get('id', '?')} missing both title and description, skipping: {slide}")
                        continue
                    filtered_topics.append(slide)
                logger.error(f"[DEBUG] Filtered topics ({len(filtered_topics)}): {filtered_topics}")
                for handler in logger.handlers:
                    try:
                        handler.flush()
                    except Exception:
                        pass
                if filtered_topics:
                    logger.info(f"[OpenAI] Returning {len(filtered_topics)} topics to client.")
                    return {
                        "topics": filtered_topics,
                        "warnings": []
                    }
                logger.error(f"[OpenAI] After repair, not enough valid slides. Rejecting response.")
                # If first attempt failed, retry with explicit feedback
                user_prompt += ("\nYour last response was missing required fields. Please follow the JSON structure exactly and ensure every slide contains: id, title, key_points (3-5), image_prompt, and description. Output only valid JSON.")
            # DEBUG: Log raw OpenAI output and parsed topics to Heroku logs only
            logger.error(f"[OpenAI][DEBUG] Raw content (pre-error): {content}")
            logger.error(f"[OpenAI][DEBUG] Parsed topics (pre-error): {topics}")
            for handler in logger.handlers:
                try:
                    handler.flush()
                except Exception:
                    pass
            raise ValueError("OpenAI did not return any valid slides with all required fields.")
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

            # Do NOT validate response format here! For outline, repair/validate after parsing.
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
                            "key_points": ["string", "string", ...],
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
                            "topic": topic.model_dump(),
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
            
            # Generate an image for the slide if layout requires it
            image_url = None
            image_caption = None
            
            if layout in ["title-image", "title-body-image", "title-bullets-image"]:
                try:
                    # Use the generate_image method which handles the actual image generation
                    image_data = await self.generate_image(
                        prompt=topic.title,
                        context={"topic": topic.title, "level": level.value}
                    )
                    if image_data and 'data' in image_data and 'image_url' in image_data['data']:
                        image_url = image_data['data']['image_url']
                        image_caption = f"Image of {topic.title}"
                except Exception as e:
                    logger.error(f"Error generating image: {str(e)}")
                    # Continue without an image if generation fails
                    image_url = None
                    image_caption = None
            
            # Format key points as a list of strings if they're not already
            key_points = content_data.get("key_points", content_data.get("bullet_points", []))
            if key_points and isinstance(key_points[0], dict):
                key_points = [point.get("text", str(point)) for point in key_points]
            
            # Create the slide content with only the fields that SlideContentNew expects
            return SlideContentNew(
                title=content_data["title"],
                key_points=key_points,
                image_url=image_url,
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

    async def _make_openai_request(self, api_type: str, api_func, *args, **kwargs):
        """
        Wrapper for making OpenAI API requests with error handling and rate limiting.
        Args:
            api_type: 'chat', 'dalle', etc. Used for rate limiting and logging.
            api_func: The OpenAI API function to call (should be awaitable).
            *args, **kwargs: Arguments to pass to the API function.
        Returns:
            The response from the OpenAI API.
        Raises:
            HTTPException or ValueError on error.
        """
        try:
            # Rate limiting
            await self.rate_limiter.wait_if_needed(api_type)
            response = await api_func(*args, **kwargs)
            return response
        except Exception as e:
            logger.error(f"Error in OpenAI request ({api_type}): {str(e)}")
            logger.error(traceback.format_exc())
            raise ValueError(f"OpenAI API request failed: {str(e)}")

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
                    "key_points": [point.text if hasattr(point, 'text') else str(point) for point in slide.key_points],
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
