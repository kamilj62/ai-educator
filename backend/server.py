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
from datetime import datetime
import requests
from typing import Tuple, Optional

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
# List of allowed origins - update this in production
ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Local development
    "http://localhost:8000",  # Also allow local backend origin if needed
    "https://ai-powerpoint-f44a1d57b590.herokuapp.com",  # Your production frontend URL if different
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$|^https://ai-powerpoint-.*\.herokuapp\.com$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,  # Cache preflight requests for 10 minutes
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
    topic: SlideTopic = Field(..., description="Topic data for the slide")
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
        json_encoders = {
            'SlideTopic': lambda v: v.dict()
        }

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
        "fields": ["title", "key_points"],
        "content_types": {"title": "text", "key_points": "list"}
    },
    "title-bullets-image": {
        "fields": ["title", "key_points", "image_url", "image_alt"],
        "content_types": {"title": "text", "key_points": "list", "image_url": "image", "image_alt": "text"}
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
            "id": str(uuid.uuid4()),
            "title": f"Introduction to {context}",
            "key_points": [
                f"What is {context}?",
                f"Why is {context} important?",
                f"Key concepts of {context}"
            ],
            "image_prompt": f"An illustration representing {context}",
            "description": f"An introduction to the topic of {context}",
            "subtopics": []
        },
        {
            "id": str(uuid.uuid4()),
            "title": f"History of {context}",
            "key_points": [
                f"Origins of {context}",
                f"Key milestones in {context} development",
                f"Modern applications of {context}"
            ],
            "image_prompt": f"A historical timeline of {context}",
            "description": f"Historical development of {context}",
            "subtopics": []
        }
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
  - 3-5 bullet_points (bullet points), each a non-empty, concise, and unique string,
  - a brief description.
- If you cannot generate 3-5 bullet points for a slide, DO NOT include that slide.
- If you cannot generate any valid slides, return an empty list ONLY (no explanations).
- Be creative: break down the topic into subtopics, use examples, and avoid repetition.
- Do NOT include any text or explanation outside the JSON array.

Example output:
[
  {
    "id": "slide_1",
    "title": "Phases of the Moon",
    "bullet_points": [
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
                user = f"""Generate a presentation outline for:\n        Topic: {context}\n        Number of slides: {num_slides}\n        Audience level: {level}\n        \n        Format each slide as:\n        {{\n            \"id\": \"unique_id\",\n            \"title\": \"slide title\",\n            \"bullet_points\": [\"point 1\", \"point 2\", \"point 3\"],\n            \"image_prompt\": \"description for an image that would enhance this slide\",\n            \"description\": \"brief description of the slide's content\"\n        }}\n        IMPORTANT: Only include slides with 3-5 bullet_points and a non-empty image_prompt. Do not include slides with fewer than 3 bullet_points.\n        If you are struggling to come up with 3-5 bullet points, try breaking the topic into smaller subtopics, using examples, or rephrasing points.\n        Output only valid JSON, no explanations. If you cannot generate valid slides, return an empty list ONLY."""
            else:
                # On retry, be even more forceful and explicit
                system = system_prompt + "\n\nIMPORTANT: DO NOT return any slide unless it meets ALL requirements. If you cannot generate valid slides, return []. Do NOT return explanations. Think step by step: brainstorm subtopics and bullet points, then generate the JSON array."
                user = f"""Generate a presentation outline for:\n        Topic: {context}\n        Number of slides: {num_slides}\n        Audience level: {level}\n        \n        Format each slide as:\n        {{\n            \"id\": \"unique_id\",\n            \"title\": \"slide title\",\n            \"bullet_points\": [\"point 1\", \"point 2\", \"point 3\"],\n            \"image_prompt\": \"description for an image that would enhance this slide\",\n            \"description\": \"brief description of the slide's content\"\n        }}\n        REMEMBER: If you cannot generate 3-5 bullet points for a slide, do NOT include it. If you cannot generate any valid slides, return []."""
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
                key_points = topic.get("key_points", topic.get("bullet_points", []))  # Fallback to bullet_points for backward compatibility
                image_prompt = topic.get("image_prompt", "")
                
                # Validate key points
                valid_key_points = [kp for kp in key_points if isinstance(kp, str) and kp.strip()]
                
                if (topic.get("title") and 
                    isinstance(key_points, list)
                    and 3 <= len(valid_key_points) <= 5
                    and all(isinstance(kp, str) and kp.strip() for kp in key_points)
                    and image_prompt and isinstance(image_prompt, str) and image_prompt.strip()):
                    
                    filtered_topics.append({**topic, "key_points": valid_key_points, "image_prompt": image_prompt.strip()})
            logger.info(f"[OpenAI Attempt {attempt}] Filtered topics: {filtered_topics}")
            if filtered_topics:
                return filtered_topics
        # If we reach here, all attempts failed
        logger.error("OpenAI could not generate valid slides after all attempts.")
        # Try one last time with a simpler prompt
        try:
            system = """You are an expert educational presentation designer. Generate a simple outline with 3-5 bullet points per slide."""
            user = f"""Generate a simple presentation outline for: {context}
            Number of slides: {num_slides}
            Audience level: {level}
            
            Format as a JSON array where each item has:
            - id: unique_id
            - title: slide title
            - bullet_points: ["point 1", "point 2", "point 3"]
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
                    'bullet_points' in topic and 
                    len(topic.get('bullet_points', [])) >= 1):
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

@app.api_route("/api/generate/slides", methods=["GET", "POST"])
async def generate_slides(
    request: Request,
    body: Dict[str, Any] = Body(default=None)  # Make body optional for GET requests
):
    # Log the incoming request method and URL
    logger.info(f"=== NEW SLIDE GENERATION REQUEST ({request.method}) ===")
    logger.info(f"Request URL: {request.url}")
    
    # Log headers
    logger.info("Headers:")
    for name, value in request.headers.items():
        logger.info(f"  {name}: {value}")
    
    # For GET requests, parse query parameters
    if request.method == "GET":
        logger.info("Processing GET request")
        body = dict(request.query_params)
        logger.info(f"Query params: {body}")
    # For POST requests, use the request body
    elif request.method == "POST":
        logger.info("Processing POST request")
        if body is None:
            try:
                body = await request.json()
                logger.info("Parsed JSON body:")
                logger.info(json.dumps(body, indent=2))
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON: {str(e)}")
                body = {}
    
    logger.info("Final request data:")
    logger.info(json.dumps(body, indent=2))
    
    try:
        # Log the raw request body if available
        try:
            raw_body = await request.body()
            if raw_body:
                logger.info("Raw request body:")
                logger.info(raw_body.decode('utf-8', errors='replace'))
        except Exception as e:
            logger.warning(f"Could not log raw request body: {str(e)}")
        
        # Parse the request body with more flexible validation
        try:
            # Log the received body for debugging
            logger.info("=== REQUEST BODY VALIDATION ===")
            logger.info(f"Body type: {type(body)}")
            
            # Check if we have a 'topics' key or if the body itself is an array of topics
            if 'topics' in body:
                logger.info("Found 'topics' key in request body")
                topics = body['topics']
                instructional_level = body.get('instructional_level', 'middle_school')
                layout = body.get('layout', 'title-bullets')
            elif isinstance(body, list):
                logger.info("Request body is an array, using as topics")
                topics = body
                instructional_level = 'middle_school'  # Default value
                layout = 'title-bullets'  # Default value
            else:
                logger.info("No 'topics' key found, treating entire body as a single topic")
                topics = [body]
                instructional_level = body.get('instructional_level', 'middle_school')
                layout = body.get('layout', 'title-bullets')
            
            logger.info(f"Topics after processing: {json.dumps(topics, indent=2)}")
            logger.info(f"Instructional level: {instructional_level}")
            logger.info(f"Layout: {layout}")
                
            # Ensure topics is a list
            if not isinstance(topics, list):
                topics = [topics]
                
            # Process each topic to ensure it has required fields
            processed_topics = []
            for i, topic in enumerate(topics, 1):
                if not isinstance(topic, dict):
                    logger.warning(f"Topic {i} is not a dictionary: {topic}")
                    continue
                    
                # Ensure required fields exist with defaults
                topic_title = topic.get('title', f'Topic {i}')
                # Handle both key_points and bullet_points for backward compatibility
                key_points = topic.get('key_points', topic.get('bullet_points', [f'Key point {i}']))
                processed_topic = {
                    'id': topic.get('id', f'topic-{i}'),
                    'title': topic_title,
                    'key_points': key_points,
                    'description': topic.get('description', f'Description for {topic_title}'),
                    'image_prompt': topic.get('image_prompt', f'Image for {topic_title}'),
                    'subtopics': topic.get('subtopics', [])
                }
                processed_topics.append(processed_topic)
            
            if not processed_topics:
                raise ValueError("No valid topics found in the request")
                
            # Validate instructional level
            if instructional_level not in ['elementary', 'middle_school', 'high_school', 'university', 'professional']:
                instructional_level = 'middle_school'  # Default to middle_school if invalid
                
            # Validate layout
            if layout not in ['title-only', 'title-image', 'title-body', 'title-body-image', 'title-bullets', 'title-bullets-image', 'two-column', 'two-column-image']:
                layout = 'title-bullets'  # Default to title-bullets if invalid
                
            logger.info(f"Processed {len(processed_topics)} topics with level={instructional_level}, layout={layout}")
            
        except Exception as e:
            logger.error(f"Error processing request: {str(e)}", exc_info=True)
            raise HTTPException(status_code=422, detail={
                "message": f"Invalid request data: {str(e)}",
                "type": "validation_error"
            })
            
        # Create a response object to return
        response_data = {
            "presentation": {
                "id": str(uuid.uuid4()),
                "title": "Generated Presentation",
                "slides": []
            },
            "warnings": []
        }
        
        slides = []
        image_prompts = []
        
        # Process each topic
        for i, topic in enumerate(processed_topics, 1):
            try:
                logger.info("Processing topic %d/%d: %s", i, len(processed_topics), topic.get('title', 'Untitled'))
                
                # Ensure we have a valid SlideTopic object
                try:
                    # Convert topic to dict if it's a Pydantic model
                    topic_dict = topic.dict() if hasattr(topic, 'dict') else dict(topic)
                    
                    # Ensure required fields are present
                    if 'title' not in topic_dict or not topic_dict['title']:
                        topic_dict['title'] = f"Topic {i}"
                    # Handle both key_points and bullet_points for backward compatibility
                    if 'key_points' not in topic_dict or not topic_dict['key_points']:
                        if 'bullet_points' in topic_dict and topic_dict['bullet_points']:
                            topic_dict['key_points'] = topic_dict['bullet_points']
                        else:
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
                    # Handle both key_points and bullet_points for backward compatibility
                    if 'key_points' not in topic_data or not topic_data['key_points']:
                        if 'bullet_points' in topic_data and topic_data['bullet_points']:
                            topic_data['key_points'] = topic_data['bullet_points']
                        else:
                            topic_data['key_points'] = ["Key point 1", "Key point 2"]
                    if 'description' not in topic_data or not topic_data['description']:
                        topic_data['description'] = f"Description for {topic_data['title']}"
                    
                    # Create a slide for the main topic
                    try:
                        # Create a SlideGenerationRequest
                        slide_request = SlideGenerationRequest(
                            topic=topic_data,
                            instructional_level=instructional_level,
                            layout=layout
                        )
                        
                        logger.info("Sending slide generation request: %s", json.dumps({
                            "topic": topic_data.get('title', 'Untitled'),
                            "instructional_level": instructional_level,
                            "layout": layout
                        }, indent=2))
                        
                        # Generate content for the slide
                        try:
                            slide_content = await generate_slide_content(slide_request)
                            
                            # Log the response for debugging
                            logger.info("Received slide content: %s", 
                                      json.dumps(slide_content, indent=2) if isinstance(slide_content, dict) 
                                      else str(slide_content))
                            
                            # Create slide object from the generated content
                            try:
                                if not isinstance(slide_content, dict):
                                    raise ValueError(f"Expected slide_content to be a dict, got {type(slide_content)}")
                                
                                # Ensure we have a valid layout
                                slide_layout = slide_content.get('layout', layout)
                                if slide_layout not in SUPPORTED_LAYOUTS:
                                    slide_layout = layout  # Fall back to the requested layout
                            
                                # Create the slide with the generated content
                                slide = {
                                    "id": str(uuid.uuid4()),
                                    "title": slide_content.get('title', f"Slide {len(slides) + 1}"),
                                    "content": slide_content.get('content', {}),
                                    "layout": slide_layout,
                                    "order": len(slides) + 1,
                                    "image_source": slide_content.get('content', {}).get('image_source', 'none')
                                }
                                
                                # Add the slide to the presentation
                                slides.append(slide)
                                
                                logger.info(f"Created slide {len(slides)} with layout: {slide_layout}")
                                
                            except Exception as e:
                                logger.error(f"Error creating slide: {str(e)}")
                                logger.error(f"Slide content: {json.dumps(slide_content, indent=2) if isinstance(slide_content, dict) else str(slide_content)}")
                                raise
                                
                        except HTTPException as he:
                            logger.error(f"HTTP error in slide generation: {str(he.detail)}")
                            raise
                        except Exception as e:
                            logger.error(f"Error in slide generation: {str(e)}")
                            logger.error(traceback.format_exc())
                            raise
                            
                    except Exception as e:
                        logger.error(f"Error creating slide request: {str(e)}")
                        logger.error(traceback.format_exc())
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

def save_image_from_b64(b64_image: str, prompt: str) -> Tuple[str, str]:
    """Save base64 image data to disk and return the URL and filepath."""
    try:
        image_data = base64.b64decode(b64_image)
        filename = f"{uuid.uuid4().hex[:8]}.png"
        filepath = f"static/images/{filename}"
        os.makedirs("static/images", exist_ok=True)
        with open(filepath, "wb") as f:
            f.write(image_data)
        image_url = f"/static/images/{filename}"
        logger.info(f"Saved image to: {filepath}")
        return image_url, filepath
    except Exception as e:
        logger.error(f"Error saving image: {str(e)}")
        raise

async def generate_with_imagen(prompt: str) -> Optional[dict]:
    """Generate image using Google's Imagen API."""
    try:
        # Replace this with actual Imagen API call when available
        # For now, we'll simulate a failure to trigger the fallback
        logger.info(f"Attempting to generate with Imagen: {prompt}")
        raise Exception("Imagen API not yet implemented")
        
        # Example implementation (commented out since we don't have the actual API yet):
        # response = requests.post(
        #     "https://imagen-api-url/generate",
        #     json={"prompt": prompt},
        #     headers={"Authorization": f"Bearer {os.getenv('IMAGEN_API_KEY')}"}
        # )
        # response.raise_for_status()
        # return {"b64_image": response.json()["image"], "source": "imagen"}
    except Exception as e:
        logger.warning(f"Imagen generation failed: {str(e)}")
        return None

async def generate_with_dalle(prompt: str) -> dict:
    """Generate image using OpenAI's DALL-E."""
    try:
        logger.info(f"Generating with DALL-E: {prompt}")
        client = get_openai_client()
        response = openai.images.generate(
            prompt=prompt,
            n=1,
            size="1024x1024",
            response_format="b64_json"
        )
        return {"b64_image": response.data[0].b64_json, "source": "dalle"}
    except Exception as e:
        logger.error(f"DALL-E generation failed: {str(e)}")
        raise

# --- IMAGE GENERATION ENDPOINT ---
@app.post("/api/generate/image")
async def generate_image(request: dict):
    """Generate an image using Imagen (with fallback to DALL-E)."""
    logger.info('[server.py] /api/generate/image called')
    logger.info('[server.py] Request data: %s', request)
    
    try:
        # Validate request
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
        
        source = None
        try:
            # Try Imagen first
            imagen_result = await generate_with_imagen(prompt)
            if imagen_result:
                image_url, _ = save_image_from_b64(imagen_result["b64_image"], prompt)
                source = "imagen"
            else:
                # Fall back to DALL-E
                dalle_result = await generate_with_dalle(prompt)
                image_url, _ = save_image_from_b64(dalle_result["b64_image"], prompt)
                source = "dalle"
                
            # Log the successful generation
            add_openai_log({
                "prompt": prompt,
                "image_url": image_url,
                "source": source
            })
            
            return {
                "image_url": image_url,
                "source": source
            }
            
        except Exception as e:
            logger.error(f"Error in image generation: {str(e)}")
            logger.error(traceback.format_exc())
            return JSONResponse(
                status_code=500,
                content={
                    "status": "error",
                    "message": f"Failed to generate image: {str(e)}",
                    "error_type": "IMAGE_GENERATION_ERROR"
                }
            )
            
    except Exception as e:
        logger.error(f"Error in generate_image endpoint: {str(e)}")
        logger.error(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": "Internal server error during image generation"
            }
        )

@app.post("/api/generate/slide")
async def generate_slide_content(request: SlideGenerationRequest):
    """Generate content for a single slide."""
    try:
        logger.info(f"Generating slide content for topic: {request.topic.title}")
        
        # Get the topic data
        topic_data = request.topic
        
        # Validate layout - this should be handled by Pydantic, but we'll double-check
        if request.layout not in SUPPORTED_LAYOUTS:
            logger.warning(f"Unsupported layout: {request.layout}")
            raise HTTPException(status_code=400, detail={
                "detail": f"Unsupported layout: {request.layout}",
                "error_type": "validation_error",
                "field": "layout",
                "allowed_values": list(SUPPORTED_LAYOUTS.keys())
            })
        
        # Prepare the slide content based on the layout
        slide_content = {
            "layout": request.layout,
            "title": topic_data.title or 'Untitled',
            "content": {}
        }
        
        # Add content based on layout
        layout_config = SUPPORTED_LAYOUTS[request.layout]
        for field in layout_config['fields']:
            if field == 'title':
                slide_content['content'][field] = topic_data.title or 'Untitled'
            elif field == 'body':
                slide_content['content'][field] = topic_data.description or ''
            elif field == 'key_points':
                # Include both 'bullets' and 'key_points' for compatibility
                slide_content['content']['bullets'] = topic_data.key_points or []
                slide_content['content']['key_points'] = topic_data.key_points or []
            elif field == 'image_url':
                # Generate or fetch the image
                if topic_data.image_prompt:
                    try:
                        # Call our image generation endpoint
                        image_result = await generate_image({"prompt": topic_data.image_prompt})
                        if isinstance(image_result, dict) and 'image_url' in image_result:
                            slide_content['content'][field] = image_result['image_url']
                            slide_content['content']['image_alt'] = topic_data.image_prompt
                            slide_content['content']['image_source'] = image_result.get('source', 'unknown')
                        else:
                            # Fallback to just showing the prompt if generation fails
                            slide_content['content'][field] = f"Generated image for: {topic_data.image_prompt}"
                            slide_content['content']['image_alt'] = topic_data.image_prompt
                    except Exception as e:
                        logger.error(f"Error generating image: {str(e)}")
                        slide_content['content'][field] = f"Error generating image: {topic_data.image_prompt}"
                        slide_content['content']['image_alt'] = topic_data.image_prompt
                else:
                    slide_content['content'][field] = ""
                    slide_content['content']['image_alt'] = ""
            elif field in ['column_left', 'column_right']:
                # For two-column layouts, we'll split the description
                desc = topic_data.description or ''
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
