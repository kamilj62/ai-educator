from fastapi import FastAPI, HTTPException, File, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, Field, validator
from typing import Dict, Any, Optional, List
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

class SlideTopic(BaseModel):
    """Model for a slide topic."""
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique identifier for the topic")
    title: str = Field(..., description="Title of the topic")
    key_points: List[str] = Field(..., description="List of key points")
    image_prompt: Optional[str] = Field(None, description="Optional prompt for generating an image")
    description: Optional[str] = Field(None, description="Optional detailed description")
    subtopics: Optional[List['SlideTopic']] = Field(default_factory=list, description="Optional list of subtopics")

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
        pattern='^(elementary_school|middle_school|high_school|university|professional)$',
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
        pattern='^(elementary_school|middle_school|high_school|university|professional)$',
        description="Target audience level"
    )
    layout: str = Field(
        ...,
        pattern='^(title-only|title-image|title-body|title-body-image|title-bullets|title-bullets-image|two-column|two-column-image)$',
        description="Preferred slide layout"
    )

SUPPORTED_LAYOUTS = {
    "TitleImageLayout": {
        "fields": {"title": True, "subtitle": True, "image": True},
        "description": "Title slide with optional subtitle and image",
        "content_types": {
            "title": "text",
            "subtitle": "text",
            "image": "image"
        }
    },
    "TitleBodyLayout": {
        "fields": {"title": True, "body": True, "image": True},
        "description": "Title with paragraph text and optional image",
        "content_types": {
            "title": "text",
            "body": "richtext",
            "image": "image"
        }
    },
    "TitleBulletsLayout": {
        "fields": {"title": True, "bullets": True, "image": True},
        "description": "Title with bullet points and optional image",
        "content_types": {
            "title": "text",
            "bullets": "list",
            "image": "image"
        }
    },
    "TwoColumnLayout": {
        "fields": {"title": True, "column1": True, "column2": True},
        "description": "Title with two columns (text or image)",
        "content_types": {
            "title": "text",
            "column1": "mixed",
            "column2": "mixed"
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
        raise HTTPException(
            status_code=500,
            detail={
                "type": "GENERATION_ERROR",
                "message": "OpenAI could not generate valid slides for this topic. Please try rephrasing or choosing a different topic.",
                "context": {"error": "No valid slides after multiple attempts."}
            }
        )

        system_prompt = """You are an expert presentation outline generator. 
        Create detailed, well-structured presentation outlines based on the given topic, number of slides, and audience level.
        Each slide should have a clear title and 3-4 key points.
        For image-worthy slides, include an image prompt that describes what kind of image would enhance the content."""

        user_prompt = f"""Generate a presentation outline for:
        Topic: {context}
        Number of slides: {num_slides}
        Audience level: {level}
        
        Format each slide as:
        {{
            "id": "unique_id",
            "title": "slide title",
            "key_points": ["point 1", "point 2", "point 3"],
            "image_prompt": "description for an image that would enhance this slide",
            "description": "brief description of the slide's content"
        }}"""

        response = await get_openai_client().chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=2000,
            top_p=1.0,
            frequency_penalty=0.0,
            presence_penalty=0.0,
            response_format={"type": "json_object"}
        )

        # Parse and validate the response
        content = response.choices[0].message.content
        try:
            import json
            topics = json.loads(content)
            if not isinstance(topics, list):
                topics = [topics]
            return topics
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse OpenAI response: {e}")
            raise HTTPException(
                status_code=500,
                detail={
                    "type": "API_ERROR",
                    "message": "Failed to parse AI response",
                    "context": {"error": str(e)}
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

@app.post("/api/generate/slides")
async def generate_slides(request: SlideRequest):
    """Generate presentation slides from an outline."""
    try:
        # Log the incoming request for debugging
        logger.debug("Received slide request: %s", request.dict())

        # Process the topic into a slide
        topic = request.topic
        
        # Determine layout based on content and request
        layout = request.layout or determine_slide_layout({
            "title": topic.title,
            "key_points": topic.key_points,
            "image_prompt": topic.image_prompt,
            "description": topic.description
        })

        # Create response with proper field names
        response = {
            "title": topic.title,
            "subtitle": "",  # Optional subtitle
            "body": topic.description,
            "bullet_points": topic.key_points,
            "image_url": "",  # Will be populated by image generation
            "image_alt": topic.image_prompt,
            "image_caption": "",
            "image_service": "generated"
        }

        return response
    except Exception as e:
        logger.error("Error generating slides: %s", str(e))
        raise HTTPException(
            status_code=500,
            detail={
                "type": "API_ERROR",
                "message": f"Failed to generate slides: {str(e)}",
                "context": {
                    "error": str(e)
                }
            }
        )

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
if __name__ == "__main__":
    import uvicorn
    print("Starting server on port 8000...")
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
