from fastapi import FastAPI, HTTPException, File, UploadFile, Request, Body, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
import json
from pydantic import BaseModel, Field, validator
from typing import Dict, Any, Optional, List, Union, ForwardRef
import os
import shutil
from pathlib import Path
import logging
import uuid
from openai import OpenAI, OpenAIError
from dotenv import load_dotenv
import traceback
from collections import deque
import openai
import base64

# Load environment variables
load_dotenv()

# DEBUG: Log OpenAI API key presence at startup
print('[server.py] OPENAI_API_KEY present:', bool(os.environ.get('OPENAI_API_KEY')))

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def get_openai_client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable is required")
    return OpenAI(api_key=api_key)

app = FastAPI()

# --- CORS MIDDLEWARE SETUP ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Add middleware to handle OPTIONS requests for all routes
@app.middleware("http")
async def add_cors_middleware(request: Request, call_next):
    if request.method == "OPTIONS":
        response = JSONResponse(content={"status": "ok"})
    else:
        response = await call_next(request)
        
    # Add CORS headers
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Max-Age"] = "600"
    
    return response

# Ensure directories exist
os.makedirs("static", exist_ok=True)
os.makedirs("static/images", exist_ok=True)

# Mount static files directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# --- LOGGING STORAGE ---
openai_log_buffer = deque(maxlen=10)

# Utility to add a log entry
def add_openai_log(entry):
    openai_log_buffer.appendleft(entry)

# Endpoint to fetch recent OpenAI logs
@app.get("/api/logs/openai")
async def get_openai_logs():
    return JSONResponse(content={"logs": list(openai_log_buffer)})

@app.exception_handler(404)
async def custom_404_handler(request: Request, exc: HTTPException):
    endpoint = request.url.path
    return JSONResponse(
        status_code=404,
        content={
            "type": "NOT_FOUND",
            "message": f"The requested endpoint '{endpoint}' was not found",
            "context": {
                "endpoint": endpoint,
                "method": request.method
            },
            "recommendations": [
                "Check that the URL is correct",
                "Verify that you're using the correct HTTP method",
                "Make sure the backend server is running"
            ]
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    return JSONResponse(
        status_code=422,
        content={
            "type": "VALIDATION_ERROR",
            "message": "Invalid request parameters",
            "context": {
                "errors": [{"field": e["loc"][-1], "message": e["msg"]} for e in errors]
            },
            "recommendations": [
                "Check the request parameters match the API specification",
                "Ensure all required fields are provided",
                "Verify the data types of all fields"
            ]
        }
    )

# --- ERROR HANDLING FOR OPENAI API KEY ---
@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    if "OPENAI_API_KEY" in str(exc):
        logger.error(f"OpenAI API key error: {str(exc)}")
        return JSONResponse(
            status_code=500,
            content={
                "type": "OPENAI_API_KEY_ERROR",
                "message": str(exc),
                "recommendations": [
                    "Set the OPENAI_API_KEY environment variable in backend/.env",
                    "Check that your OpenAI API key is correct and active",
                    "Restart the backend server after updating the environment variable"
                ]
            }
        )
    # fallback for other value errors
    return JSONResponse(
        status_code=500,
        content={
            "type": "VALUE_ERROR",
            "message": str(exc),
            "recommendations": [
                "Check your request and backend configuration"
            ]
        }
    )

class Layout(BaseModel):
    name: str = Field(..., description="Name of the layout")
    type: str = Field(..., description="Type of the layout")
    content: Dict[str, Any] = Field(..., description="Content of the layout")

class LayoutSwitch(BaseModel):
    from_layout: str = Field(..., description="Name of the layout to switch from")
    to_layout: str = Field(..., description="Name of the layout to switch to")
    content: Dict[str, Any] = Field(..., description="Content to switch")

# Create a forward reference for the recursive type
SlideTopicRef = ForwardRef('SlideTopic')

class SlideTopic(BaseModel):
    """Model for a slide topic."""
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique identifier for the topic")
    title: str = Field(..., description="Title of the topic")
    key_points: List[str] = Field(..., description="List of key points")
    image_prompt: Optional[str] = Field(None, description="Optional prompt for generating an image")
    description: Optional[str] = Field(None, description="Optional detailed description")
    subtopics: List[SlideTopicRef] = Field(default_factory=list, description="Optional list of subtopics")
    
    class Config:
        json_encoders = {
            'SlideTopic': lambda v: v.dict()
        }

# Define SlideGenerationRequest model
class SlideGenerationRequest(BaseModel):
    """Request model for generating a single slide."""
    topic: Dict[str, Any] = Field(..., description="Topic data for the slide")
    instructional_level: str = Field(
        ...,
        pattern='^(elementary|middle_school|high_school|university|professional)$',
        description="Target audience level"
    )
    layout: str = Field(
        ...,
        pattern='^(title-only|title-image|title-body|title-body-image|title-bullets|title-bullets-image|two-column|two-column-image)$',
        description="Layout type for the slide"
    )
    
    class Config:
        extra = 'forbid'  # Don't allow extra fields

class OutlineRequest(BaseModel):
    """Request model for outline generation."""
    context: str = Field(
        ...,
        description="Topic or context for the outline"
    )
    num_slides: int = Field(
        ...,
        ge=1,
        le=20,
        description="Number of slides to generate"
    )
    instructional_level: str = Field(
        ...,
        pattern='^(elementary|middle_school|high_school|university|professional)$',
        description="Target audience level"
    )
    layout: Optional[str] = Field(
        None,
        pattern='^(title-only|title-image|title-body|title-body-image|title-bullets|title-bullets-image|two-column|two-column-image)$',
        description="Optional preferred slide layout"
    )

class OutlineResponse(BaseModel):
    """Response model for outline generation."""
    topics: List[SlideTopic] = Field(..., description="List of generated topics")
    warnings: List[str] = Field(default_factory=list, description="Optional warnings or suggestions")

class SlideRequest(BaseModel):
    """Request model for slide generation."""
    topic: SlideTopic
    instructional_level: str = Field(
        ...,
        pattern='^(elementary|middle_school|high_school|university|professional)$',
        description="Target audience level"
    )
    layout: str = Field(
        ...,
        pattern='^(title-only|title-image|title-body|title-body-image|title-bullets|title-bullets-image|two-column|two-column-image)$',
        description="Preferred slide layout"
    )

SUPPORTED_LAYOUTS = {
    "title-only": {
        "fields": ["title"],
        "content_types": {"title": "text"}
    },
    "title-image": {
        "fields": ["title", "image_url", "image_alt"],
        "content_types": {"title": "text", "image_url": "image", "image_alt": "text"}
    },
    "title-body": {
        "fields": ["title", "body"],
        "content_types": {"title": "text", "body": "text"}
    },
    "title-body-image": {
        "fields": ["title", "body", "image_url", "image_alt"],
        "content_types": {"title": "text", "body": "text", "image_url": "image", "image_alt": "text"}
    },
    "title-bullets": {
        "fields": ["title", "bullet_points"],
        "content_types": {"title": "text", "bullet_points": "list"}
    },
    "title-bullets-image": {
        "fields": ["title", "bullet_points", "image_url", "image_alt"],
        "content_types": {"title": "text", "bullet_points": "list", "image_url": "image", "image_alt": "text"}
    },
    "two-column": {
        "fields": ["title", "column_left", "column_right"],
        "content_types": {"title": "text", "column_left": "text", "column_right": "text"}
    },
    "two-column-image": {
        "fields": ["title", "column_left", "column_right", "image_url", "image_alt"],
        "content_types": {
            "title": "text", 
            "column_left": "text", 
            "column_right": "text",
            "image_url": "image",
            "image_alt": "text"
        }
    }
}

def generate_sample_topics(context: str, num_slides: int, level: str, layout: str) -> List[SlideTopic]:
    """Generate a list of sample topics for testing."""
    logger.debug(f"Generating sample topics for: {context} with layout: {layout}")
    topics = [
        {
            "id": f"slide_{i+1}",
            "title": f"Slide {i+1}: {context} - Part {i+1}",
            "key_points": [
                f"Key point 1 for {context}",
                f"Key point 2 for {context}",
                f"Key point 3 for {context}"
            ],
            "image_prompt": f"An image representing {context} part {i+1}" if "image" in layout else None,
            "description": f"Description of {context} part {i+1}"
        }
        for i in range(num_slides)
    ]
    logger.debug(f"Generated {len(topics)} topics")
    return topics

def determine_slide_layout(content):
    """Determine the best layout for a slide based on its content."""
    has_image = bool(content.get('image_prompt'))
    has_key_points = bool(content.get('key_points'))
    has_description = bool(content.get('description'))

    if has_image:
        if has_key_points:
            return 'title-bullets-image'
        elif has_description:
            return 'title-body-image'
        else:
            return 'title-image'
    else:
        if has_key_points:
            return 'title-bullets'
        elif has_description:
            return 'title-body'
        else:
            return 'title-only'

async def generate_outline_with_openai(context: str, num_slides: int, level: str) -> List[Dict]:
    """Generate an outline using OpenAI's GPT model."""
    try:
        system_prompt = """
You are an expert educational presentation designer.
Your job is to generate a JSON array of slides for a presentation on a given topic, audience, and slide count.
STRICT REQUIREMENTS:
- Each slide MUST have:
  - a unique id (e.g. 'slide_1', 'slide_2', ...),
  - a clear, informative title,
  - a non-empty image_prompt (a description for an image that would enhance the slide),
  - 3-5 key_points (bullet points), each a non-empty, concise, and unique string,
  - a brief description.
- If you cannot generate 3-5 key points for a slide, DO NOT include that slide.
- If you cannot generate any valid slides, return an empty list ONLY (no explanations).
- Be creative: break down the topic into subtopics, use examples, and avoid repetition.
- Do NOT include any text or explanation outside the JSON array.

Example output:
[
  {
    "id": "slide_1",
    "title": "Phases of the Moon",
    "key_points": [
      "The moon has 8 phases in its monthly cycle",
      "Phases are caused by the moon's orbit around Earth",
      "New moon and full moon are opposite phases"
    ],
    "image_prompt": "Diagram showing all 8 phases of the moon with labels",
    "description": "This slide explains the different phases of the moon and why they occur."
  }
]
"""

        # Chain-of-thought + retry logic for more robust OpenAI outline generation
        import json
        from fastapi import HTTPException

        def build_prompts(context, num_slides, level, attempt=1):
            if attempt == 1:
                system = system_prompt
                user = f"""Generate a presentation outline for:\n        Topic: {context}\n        Number of slides: {num_slides}\n        Audience level: {level}\n        \n        Format each slide as:\n        {{\n            \"id\": \"unique_id\",\n            \"title\": \"slide title\",\n            \"key_points\": [\"point 1\", \"point 2\", \"point 3\"],\n            \"image_prompt\": \"description for an image that would enhance this slide\",\n            \"description\": \"brief description of the slide's content\"\n        }}\n        IMPORTANT: Only include slides with 3-5 key_points and a non-empty image_prompt. Do not include slides with fewer than 3 key_points.\n        If you are struggling to come up with 3-5 key points, try breaking the topic into smaller subtopics, using examples, or rephrasing points.\n        Output only valid JSON, no explanations. If you cannot generate valid slides, return an empty list ONLY."""
            else:
                # On retry, be even more forceful and explicit
                system = system_prompt + "\n\nIMPORTANT: DO NOT return any slide unless it meets ALL requirements. If you cannot generate valid slides, return []. Do NOT return explanations. Think step by step: brainstorm subtopics and bullet points, then generate the JSON array."
                user = f"""Generate a presentation outline for:\n        Topic: {context}\n        Number of slides: {num_slides}\n        Audience level: {level}\n        \n        Format each slide as:\n        {{\n            \"id\": \"unique_id\",\n            \"title\": \"slide title\",\n            \"key_points\": [\"point 1\", \"point 2\", \"point 3\"],\n            \"image_prompt\": \"description for an image that would enhance this slide\",\n            \"description\": \"brief description of the slide's content\"\n        }}\n        REMEMBER: If you cannot generate 3-5 key points for a slide, do NOT include it. If you cannot generate any valid slides, return []."""
            return system, user

        max_attempts = 2
        import asyncio
        for attempt in range(1, max_attempts + 1):
            system, user = build_prompts(context, num_slides, level, attempt)
            loop = asyncio.get_event_loop()
            try:
                response = await loop.run_in_executor(
                    None,
                    lambda: get_openai_client().chat.completions.create(
                        model="gpt-3.5-turbo",  # Using a more reliable model
                        messages=[
                            {"role": "system", "content": system},
                            {"role": "user", "content": user}
                        ],
                        temperature=0.2,  # Lower for more deterministic output
                        max_tokens=2000
                    )
                )
            except Exception as e:
                logger.error(f"OpenAI API call failed: {str(e)}")
                if "Incorrect API key provided" in str(e):
                    raise ValueError("Invalid OpenAI API key. Please check your API key configuration.")
                elif "rate limit" in str(e).lower():
                    raise ValueError("OpenAI API rate limit exceeded. Please try again later.")
                else:
                    raise ValueError(f"OpenAI API error: {str(e)}")
            content = response.choices[0].message.content
            log_entry = {
                "attempt": attempt,
                "raw_response": content,
                "system_prompt": system,
                "user_prompt": user
            }
            logger.info(f"[OpenAI Attempt {attempt}] Raw response: {content}")
            add_openai_log(log_entry)
            try:
                topics = json.loads(content)
            except Exception as e:
                logger.error(f"[OpenAI Attempt {attempt}] JSON decode error: {e}")
                topics = []
            # Filtering logic (same as before)
            filtered_topics = []
            for topic in topics:
                key_points = topic.get("key_points", [])
                image_prompt = topic.get("image_prompt", "")
                valid_key_points = [kp for kp in key_points if isinstance(kp, str) and kp.strip()]
                if (
                    isinstance(key_points, list)
                    and 3 <= len(valid_key_points) <= 5
                    and all(isinstance(kp, str) and kp.strip() for kp in key_points)
                    and isinstance(image_prompt, str)
                    and image_prompt.strip() != ""
                ):
                    filtered_topics.append({**topic, "key_points": valid_key_points, "image_prompt": image_prompt.strip()})
            logger.info(f"[OpenAI Attempt {attempt}] Filtered topics: {filtered_topics}")
            if filtered_topics:
                return filtered_topics
        # If we reach here, all attempts failed
        logger.error("OpenAI could not generate valid slides after all attempts.")
        # Try one last time with a simpler prompt
        try:
            system = """You are an expert educational presentation designer. Generate a simple outline with 3-5 key points per slide."""
            user = f"""Generate a simple presentation outline for: {context}
            Number of slides: {num_slides}
            Audience level: {level}
            
            Format as a JSON array where each item has:
            - id: unique_id
            - title: slide title
            - key_points: ["point 1", "point 2", "point 3"]
            - image_prompt: description for an image
            - description: brief description
            
            Return only the JSON array, no other text."""
            
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: get_openai_client().chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": system},
                        {"role": "user", "content": user}
                    ],
                    temperature=0.3
                )
            )
            
            content = response.choices[0].message.content
            topics = json.loads(content)
            if not isinstance(topics, list):
                topics = [topics]
                
            # Basic validation
            valid_topics = []
            for topic in topics:
                if (isinstance(topic, dict) and 
                    'title' in topic and 
                    'key_points' in topic and 
                    len(topic.get('key_points', [])) >= 1):
                    valid_topics.append(topic)
            
            if valid_topics:
                return valid_topics
                
        except Exception as e:
            logger.error(f"Final fallback attempt failed: {str(e)}")
        
        # If we still have no valid topics, raise an error
        raise HTTPException(
            status_code=500,
            detail={
                "type": "GENERATION_ERROR",
                "message": "Could not generate valid slides. The topic might be too specific or complex. Please try a different topic or simplify your request.",
                "context": {"error": "No valid slides after all attempts"}
            }
        )

    except OpenAIError as e:
        logger.error(f"OpenAI API error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "type": "API_ERROR",
                "message": f"OpenAI API error: {str(e)}",
                "context": {
                    "error": str(e)
                }
            }
        )
    except Exception as e:
        logger.error(f"Unexpected error in generate_outline_with_openai: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail={
                "type": "API_ERROR",
                "message": f"Unexpected error: {str(e)}",
                "context": {
                    "error": str(e)
                }
            }
        )

@app.post("/api/generate/outline", response_model=OutlineResponse)
async def generate_outline(request: OutlineRequest):
    """Generate a presentation outline based on the given parameters."""
    try:
        topics = await generate_outline_with_openai(
            request.context,
            request.num_slides,
            request.instructional_level
        )
        return {
            "topics": topics,
            "warnings": []
        }
    except Exception as e:
        logger.error(f"Error generating outline: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "type": "API_ERROR",
                "message": f"Failed to generate outline: {str(e)}",
                "context": {
                    "error": str(e)
                }
            }
        )

@app.get("/")
def root():
    return {"status": "ok", "message": "AI PowerPoint backend is running"}

@app.get("/api/")
async def root():
    return {
        "status": "ok",
        "supported_layouts": list(SUPPORTED_LAYOUTS.keys())
    }

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/api/layouts")
async def get_layouts():
    return {"layouts": SUPPORTED_LAYOUTS}

@app.post("/api/layout/validate")
async def validate_layout(layout: Layout):
    if layout.name not in SUPPORTED_LAYOUTS:
        raise HTTPException(status_code=400, detail="Unsupported layout")
    return {
        "valid": True,
        "layout": layout.name,
        "fields": SUPPORTED_LAYOUTS[layout.name]["fields"],
        "content_types": SUPPORTED_LAYOUTS[layout.name]["content_types"]
    }

@app.post("/api/layout/switch")
async def switch_layout(switch: LayoutSwitch):
    if switch.from_layout not in SUPPORTED_LAYOUTS or switch.to_layout not in SUPPORTED_LAYOUTS:
        raise HTTPException(status_code=400, detail="Invalid layout")
    
    # Get layout definitions
    from_layout = SUPPORTED_LAYOUTS[switch.from_layout]
    to_layout = SUPPORTED_LAYOUTS[switch.to_layout]
    
    # Preserve compatible content
    preserved_content = {}
    
    # First, preserve fields with matching content types
    for field, content_type in from_layout["content_types"].items():
        if (field in to_layout["content_types"] and 
            field in switch.content and 
            to_layout["content_types"][field] == content_type):
            preserved_content[field] = switch.content[field]
    
    # Handle special content preservation cases
    if "body" in switch.content and "bullets" in to_layout["fields"]:
        # Convert paragraph to bullets if needed
        preserved_content["bullets"] = [p.strip() for p in switch.content["body"].split("\n") if p.strip()]
    
    if "bullets" in switch.content and "body" in to_layout["fields"]:
        # Convert bullets to paragraph if needed
        preserved_content["body"] = "\n".join(switch.content["bullets"])
    
    # Preserve image content when both layouts support it
    if ("image" in switch.content and 
        "image" in from_layout["fields"] and 
        "image" in to_layout["fields"]):
        preserved_content["image"] = switch.content["image"]
    
    return {
        "success": True,
        "from": switch.from_layout,
        "to": switch.to_layout,
        "preserved_content": preserved_content
    }

class GenerateSlidesRequest(BaseModel):
    topics: List[SlideTopic] = Field(
        ...,
        description="List of slide topics to generate slides for"
    )
    instructional_level: str = Field(
        ...,
        pattern='^(elementary|middle_school|high_school|university|professional)$',
        description="Target audience level"
    )
    layout: str = Field(
        default="title-bullets",
        pattern='^(title-only|title-image|title-body|title-body-image|title-bullets|title-bullets-image|two-column|two-column-image)$',
        description="Default layout for the slides"
    )

    class Config:
        extra = 'ignore'  # Ignore extra fields in the request

from pydantic import ValidationError

@app.post("/api/generate/slides")
async def generate_slides(
    request: Request,
    body: Dict[str, Any] = Body(...)  # This will be the parsed body
):
    """Generate presentation slides from an outline."""
    try:
        # Log the incoming request for debugging
        logger.info("=== NEW SLIDE GENERATION REQUEST ===")
        
        # Log the raw request body
        try:
            raw_body = await request.body()
            logger.info("Raw request body: %s", raw_body.decode())
        except Exception as e:
            logger.error("Error getting raw request body: %s", str(e))
        
        # Log the parsed request body
        logger.info("Parsed request body type: %s", type(body))
        logger.info("Parsed request body: %s", json.dumps(body, indent=2))
        
        # Validate the request body against our model
        try:
            request_data = GenerateSlidesRequest(**body)
            logger.info("Successfully validated request data")
        except ValidationError as e:
            logger.error("Validation error: %s", str(e))
            raise HTTPException(
                status_code=422,
                detail={
                    "type": "VALIDATION_ERROR",
                    "message": "Invalid request data",
                    "errors": e.errors()
                }
            )
            
        # Log the validated request data
        logger.info("Validated request data: %s", json.dumps(jsonable_encoder(request_data), indent=2))
        
        # Log the structure of the request data
        logger.info("Request data keys: %s", list(request_data.dict().keys()))
        if hasattr(request_data, 'topics') and request_data.topics:
            logger.info("Number of topics: %d", len(request_data.topics))
            if request_data.topics:
                first_topic = request_data.topics[0]
                logger.info("First topic type: %s", type(first_topic))
                logger.info("First topic data: %s", json.dumps(jsonable_encoder(first_topic), indent=2))
        
        # Process each topic into a slide
        topics = request_data.topics
        if not topics:
            error_msg = "No topics provided in the request"
            logger.error(error_msg)
            raise HTTPException(status_code=400, detail=error_msg)

        logger.info("Processing %d topics", len(topics))
        
        slides = []
        for i, topic in enumerate(topics, 1):
            try:
                logger.info("Processing topic %d/%d: %s", i, len(topics), getattr(topic, 'title', 'Untitled'))
                
                # Ensure we have a valid SlideTopic object
                try:
                    # Convert topic to dict if it's a Pydantic model
                    topic_dict = topic.dict() if hasattr(topic, 'dict') else dict(topic)
                    
                    # Ensure required fields are present
                    if 'title' not in topic_dict or not topic_dict['title']:
                        topic_dict['title'] = f"Topic {i}"
                    if 'key_points' not in topic_dict or not topic_dict['key_points']:
                        topic_dict['key_points'] = ["Key point 1", "Key point 2"]
                    
                    # Create a SlideTopic instance
                    slide_topic = SlideTopic(
                        id=topic_dict.get('id', str(uuid.uuid4())),
                        title=topic_dict['title'],
                        key_points=topic_dict['key_points'],
                        image_prompt=topic_dict.get('image_prompt', ''),
                        description=topic_dict.get('description', ''),
                        subtopics=topic_dict.get('subtopics', [])
                    )
                    
                    # Create a copy of the topic data to avoid modifying the original
                    topic_data = slide_topic.dict()
                    
                    # Ensure required fields are present
                    if 'title' not in topic_data or not topic_data['title']:
                        topic_data['title'] = f"Topic {i}"
                    if 'key_points' not in topic_data or not topic_data['key_points']:
                        topic_data['key_points'] = ["Key point 1", "Key point 2"]
                    if 'description' not in topic_data or not topic_data['description']:
                        topic_data['description'] = f"Description for {topic_data['title']}"
                    
                    # Create a SlideGenerationRequest
                    slide_request = SlideGenerationRequest(
                        topic=topic_data,
                        instructional_level=request_data.instructional_level,
                        layout=request_data.layout
                    )
                    
                    logger.info("Sending slide generation request: %s", json.dumps({
                        "topic": topic_data.get('title', 'Untitled'),
                        "instructional_level": request_data.instructional_level,
                        "layout": request_data.layout
                    }, indent=2))
                    
                    # Generate content for the slide
                    try:
                        slide_content = await generate_slide_content(slide_request)
                        
                        # Log the response for debugging
                        logger.info("Received slide content: %s", 
                                  json.dumps(slide_content, indent=2) if isinstance(slide_content, dict) 
                                  else str(slide_content))
                        
                    except HTTPException as he:
                        logger.error("HTTP error in slide generation: %s", str(he.detail))
                        raise
                    except Exception as e:
                        logger.error("Error in slide generation: %s", str(e))
                        logger.error("Slide topic data: %s", json.dumps(topic_data, indent=2))
                        logger.error(traceback.format_exc())
                        raise
                    
                    # Create slide object from the generated content
                    try:
                        if not isinstance(slide_content, dict):
                            raise ValueError(f"Expected slide_content to be a dict, got {type(slide_content)}")
                        
                        # Ensure we have a valid layout
                        layout = slide_content.get('layout', request_data.layout)
                        if layout not in SUPPORTED_LAYOUTS:
                            layout = request_data.layout  # Fall back to the requested layout
                        
                        # Create the slide with the generated content
                        slide = {
                            "id": str(uuid.uuid4()),
                            "title": slide_content.get('title', f"Slide {len(slides) + 1}"),
                            "content": slide_content.get('content', {}),
                            "layout": layout,
                            "order": len(slides) + 1
                        }
                        
                        # Add the slide to the presentation
                        slides.append(slide)
                        
                        logger.info(f"Created slide {len(slides)} with layout: {layout}")
                        
                    except Exception as e:
                        logger.error(f"Error creating slide: {str(e)}")
                        logger.error(f"Slide content: {json.dumps(slide_content, indent=2) if isinstance(slide_content, dict) else str(slide_content)}")
                        raise
                    
                    # Add image prompt if available
                    if slide_topic.image_prompt:
                        slide['image_prompt'] = slide_topic.image_prompt
                    
                    
                except Exception as e:
                    error_msg = f"Error creating slide topic {i}: {str(e)}"
                    logger.error(error_msg)
                    logger.error(traceback.format_exc())
                    raise
                    
            except Exception as e:
                error_msg = "Error processing topic %d: %s" % (i, str(e))
                logger.error(error_msg)
                logger.error(traceback.format_exc())
                continue  # Skip this topic and continue with the next one
        
        if not slides:
            error_msg = "Failed to generate any slides. Please check the input data and try again."
            logger.error(error_msg)
            raise HTTPException(status_code=500, detail=error_msg)
            
        logger.info("Successfully generated %d slides", len(slides))
        
        # Prepare the response
        response_data = {
            "success": True, 
            "slides": slides,
            "metadata": {
                "generated_at": datetime.utcnow().isoformat(),
                "topics_processed": len(topics),
                "slides_generated": len(slides)
            }
        }
        
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = "Error generating slides: %s" % str(e)
        logger.error(error_msg)
        logger.error(traceback.format_exc())
        error_detail = {
            "type": "SERVER_ERROR",
            "message": "An unexpected error occurred while generating slides",
            "error": str(e)
        }
        if hasattr(e, 'args') and e.args:
            error_detail["details"] = e.args[0]
        raise HTTPException(status_code=500, detail=error_detail)

@app.post("/api/upload/image")
async def upload_image(file: UploadFile = File(...)):
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail={
                    "type": "INVALID_REQUEST",
                    "message": "File must be an image",
                    "context": {"field": "file"}
                }
            )
        
        # Create unique filename
        file_ext = Path(file.filename).suffix
        unique_filename = f"{os.urandom(8).hex()}{file_ext}"
        file_path = f"static/images/{unique_filename}"
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        return {
            "success": True,
            "filename": unique_filename,
            "url": f"/static/images/{unique_filename}"
        }
    except Exception as e:
        logger.error("Error uploading image: %s", str(e))
        raise HTTPException(
            status_code=500,
            detail={
                "type": "API_ERROR",
                "message": str(e),
                "context": {"field": "file"}
            }
        )

# --- IMAGE GENERATION ENDPOINT ---
@app.post("/api/generate/image")
async def generate_image(request: dict):
    logger.info('[server.py] /api/generate/image called')
    logger.info('[server.py] Request data: %s', request)
    logger.info('[server.py] OPENAI_API_KEY present: %s', bool(os.environ.get('OPENAI_API_KEY')))
    try:
        logger.info(f"Received image generation request: {request}")
        # Ensure prompt is present and valid
        prompt = request.get('prompt') if isinstance(request, dict) else None
        if not prompt or not isinstance(prompt, str) or not prompt.strip():
            logger.error("Image generation request missing valid 'prompt'")
            return JSONResponse(
                status_code=400,
                content={
                    "status": "error",
                    "message": "Image generation request must include a non-empty 'prompt' field.",
                    "error_type": "INVALID_REQUEST"
                }
            )
        try:
            # Generate image using OpenAI DALL-E (openai>=1.0.0 syntax)
            client = get_openai_client()
            response = openai.images.generate(
                prompt=prompt,
                n=1,
                size="1024x1024",
                response_format="b64_json"
            )
            b64_image = response.data[0].b64_json
            # Save image to static/images
            image_data = base64.b64decode(b64_image)
            filename = f"{uuid.uuid4().hex[:8]}.png"
            filepath = f"static/images/{filename}"
            with open(filepath, "wb") as f:
                f.write(image_data)
            image_url = f"/static/images/{filename}"
            logger.info(f"Generated image URL: {image_url}")
            add_openai_log({
                "prompt": prompt,
                "image_url": image_url
            })
            return {"image_url": image_url}
        except openai.OpenAIError as oe:
            logger.error(f"OpenAI API error: {str(oe)}")
            return JSONResponse(
                status_code=500,
                content={
                    "status": "error",
                    "message": f"OpenAI API error: {str(oe)}",
                    "error_type": "OPENAI_API_ERROR"
                }
            )
        except Exception as e:
            logger.error(f"Unexpected error in OpenAI image generation: {str(e)}")
            logger.error(traceback.format_exc())
            return JSONResponse(
                status_code=500,
                content={
                    "status": "error",
                    "message": f"Unexpected error: {str(e)}",
                    "error_type": "UNEXPECTED_ERROR"
                }
            )
    except Exception as e:
        logger.error(f"Error in generate_image: {str(e)}")
        logger.error(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"Error generating image: {str(e)}"
            }
        )

@app.post("/api/generate/slide")
async def generate_slide_content(request: SlideGenerationRequest):
    """Generate content for a single slide."""
    try:
        logger.info(f"Generating slide content for topic: {request.topic.get('title', 'Untitled')}")
        
        # Ensure we have a valid topic dictionary
        if not isinstance(request.topic, dict):
            raise HTTPException(status_code=400, detail=f"Invalid topic format: {type(request.topic)}")
        
        # Get the topic data
        topic_data = request.topic
        
        # Validate layout
        if request.layout not in SUPPORTED_LAYOUTS:
            raise HTTPException(status_code=400, detail=f"Unsupported layout: {request.layout}")
        
        # Prepare the slide content based on the layout
        slide_content = {
            "layout": request.layout,
            "title": topic_data.get('title', 'Untitled'),
            "content": {}
        }
        
        # Add content based on layout
        layout_config = SUPPORTED_LAYOUTS[request.layout]
        for field in layout_config['fields']:
            if field == 'title':
                slide_content['content'][field] = topic_data.get('title', 'Untitled')
            elif field == 'body':
                slide_content['content'][field] = topic_data.get('description', '')
            elif field == 'bullet_points':
                slide_content['content'][field] = topic_data.get('key_points', [])
            elif field == 'image_url':
                # For now, we'll just return the image prompt
                # In a real implementation, you would generate or fetch an image here
                slide_content['content'][field] = f"Generated image for: {topic_data.get('image_prompt', '')}"
                slide_content['content']['image_alt'] = topic_data.get('image_prompt', '')
            elif field in ['column_left', 'column_right']:
                # For two-column layouts, we'll split the description
                desc = topic_data.get('description', '')
                parts = desc.split('. ')
                mid = len(parts) // 2
                if field == 'column_left':
                    slide_content['content'][field] = '. '.join(parts[:mid])
                else:
                    slide_content['content'][field] = '. '.join(parts[mid:])
        
        logger.info(f"Generated slide content: {slide_content}")
        return slide_content
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating slide content: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error generating slide content: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    print("Starting server on port 8000...")
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
