import asyncio
import os
import time
from typing import List, Optional, Tuple, Dict, Any
import logging
import tempfile
import base64
import json
import traceback
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
    SlideLayout
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
        async with self.rate_limiter.limit(operation_type):
            try:
                return await func(*args, **kwargs)
            except RateLimitError as e:
                raise ImageGenerationError(
                    message="Rate limit exceeded",
                    error_type=ErrorType.RATE_LIMIT,
                    service=ImageServiceProvider.DALLE,
                    retry_after=e.retry_after if hasattr(e, 'retry_after') else None
                )
            except APIError as e:
                raise ImageGenerationError(
                    message=str(e),
                    error_type=ErrorType.API_ERROR,
                    service=ImageServiceProvider.DALLE
                )
            except (APIConnectionError, APITimeoutError) as e:
                raise ImageGenerationError(
                    message="Failed to connect to OpenAI API",
                    error_type=ErrorType.NETWORK_ERROR,
                    service=ImageServiceProvider.DALLE
                )

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
            async with httpx.AsyncClient() as session:
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

    async def _generate_image_url(self, topic: str, level: InstructionalLevel) -> Tuple[str, str]:
        """Generate an educational image using DALL-E."""
        try:
            # Create a detailed prompt for DALL-E
            prompt = f"""Create a detailed, educational illustration for {topic}.
            Style: Clean, modern, suitable for {level.value.replace('_', ' ')} level education.
            Type: Diagram or illustration that clearly explains key concepts.
            Must be: Scientifically accurate, visually engaging, and educational."""
            
            response = await self._make_openai_request(
                'image',
                self.client.images.generate,
                model="dall-e-3",
                prompt=prompt,
                size="1024x1024",
                quality="standard",
                n=1
            )
            
            image_url = response.data[0].url
            image_caption = f"AI-generated educational illustration for {topic}"
            
            # Download and save the image locally
            local_path = await self._download_and_save_image(image_url)
            
            return local_path, image_caption
                
        except Exception as e:
            logger.error(f"Error in generate_image_url: {str(e)}")
            raise ValueError(str(e))

    async def generate_outline(self, context: str, num_slides: int, level: InstructionalLevel, sensitive: bool = False) -> dict:
        """Generate a presentation outline based on context and parameters."""
    async def generate_outline(
        self, 
        context: str, 
        num_slides: int, 
        level: InstructionalLevel,
        sensitive: bool = False
    ) -> List[SlideTopic]:
        """Generate presentation outline with safety checks for sensitive topics."""
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
            response_data = await self._validate_json_response(response_text)
            fixed_topics = []
            for topic in response_data["topics"]:
                if not isinstance(topic, dict):
                    if hasattr(topic, 'dict') and callable(getattr(topic, 'dict', None)):
                        topic = topic.dict()
                    else:
                        topic = dict(topic)
                if "key_points" not in topic or not isinstance(topic["key_points"], list):
                    topic["key_points"] = []
                else:
                    topic["key_points"] = [str(kp) for kp in topic["key_points"]]
                fixed_topics.append(topic)
            topics = [SlideTopic.parse_obj(s) if isinstance(s, dict) else s for s in fixed_topics]
            
            logger.info(f"Successfully generated {len(topics)} topics")
            return {
                "topics": [t.model_dump() for t in topics],
                "warnings": []
            }
        except Exception as e:
            logger.error(f"Error in generate_outline: {str(e)}")
            logger.error(traceback.format_exc())
            raise

    async def _validate_outline_response(self, response_text: str) -> dict:
        """Validate and parse the outline response."""
        try:
            # Parse JSON response
            response_data = json.loads(response_text)
            
            # Validate structure
            if not isinstance(response_data, dict) or "topics" not in response_data:
                raise ValueError("Response missing 'topics' array")
            
            if not isinstance(response_data["topics"], list):
                raise ValueError("'topics' must be an array")
            
            # Validate each topic
            for topic in response_data["topics"]:
                if not isinstance(topic, dict):
                    raise ValueError("Each topic must be an object")
                
                required_fields = ["title", "key_points", "image_prompt"]
                for field in required_fields:
                    if field not in topic:
                        raise ValueError(f"Topic missing required field: {field}")
                
                if not isinstance(topic["title"], str):
                    raise ValueError("Topic title must be a string")
                
                if not isinstance(topic["key_points"], list):
                    raise ValueError("key_points must be an array")
                
                if not isinstance(topic["image_prompt"], str):
                    raise ValueError("image_prompt must be a string")
                
                if not topic["key_points"]:
                    raise ValueError("key_points array cannot be empty")
                
                if not all(isinstance(point, str) for point in topic["key_points"]):
                    raise ValueError("All key points must be strings")
            
            return response_data
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse outline JSON: {str(e)}")
            raise ValueError(f"Invalid JSON format: {str(e)}")
        except Exception as e:
            logger.error(f"Failed to validate outline: {str(e)}")
            raise ValueError(f"Invalid outline format: {str(e)}")

    async def generate_slide_content(
        self,
        topic: SlideTopic,
        instructional_level: InstructionalLevel,
        layout: str
    ) -> SlideContentNew:
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
                'two-column-image': "Create a slide with a title, two columns of content, and an image."
            }

            # Validate layout
            if layout not in layout_prompts:
                logger.error(f"Invalid layout requested: {layout}")
                raise ValueError(f"Unsupported layout: {layout}")

            # Build the prompt based on layout
            system_prompt = """You are an expert presentation content creator.
            Return content in JSON format with this structure:
            {
                "title": "Slide Title",
                "subtitle": "Optional subtitle",
                "body": "Main content if layout requires body text",
                "bullet_points": ["Point 1", "Point 2", "Point 3"],
                "column_left": "Left column content if two-column layout",
                "column_right": "Right column content if two-column layout"
            }
            """

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
            response_text = completion.choices[0].message.content
            content_data = await self._validate_json_response(response_text)
            
            # Generate an image for the slide
            image_path, image_caption = await self._generate_image_url(topic.title, level)
            
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
            
        except Exception as e:
            logger.error(f"Unexpected error in generate_slide_content: {str(e)}")
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
