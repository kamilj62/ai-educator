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

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize OpenAI client
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    logger.error("OPENAI_API_KEY not found in environment variables")
    raise ValueError("OPENAI_API_KEY environment variable is required")

client = OpenAI(api_key=api_key)

app = FastAPI()

# Configure CORS - Allow all origins in development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=False,  # Must be False when using allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure directories exist
os.makedirs("static", exist_ok=True)
os.makedirs("static/images", exist_ok=True)

# Mount static files directory
app.mount("/static", StaticFiles(directory="static"), name="static")

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
        system_prompt = """You are an expert presentation outline generator. 
        Create detailed, well-structured presentation outlines based on the given topic, number of slides, and audience level.
        Each slide must have a clear title, a non-empty image_prompt, and 3-5 key_points (bullet points) that are informative and non-redundant.
        IMPORTANT: Only include slides that strictly follow this format. If you cannot generate 3 key points for a slide, do not include it.
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
            "description": "This slide explains the different phases of the moon and why they occur, with a focus on the science behind the cycle."
          }
        ]
        STRICTLY match this JSON structure for every slide."""

        user_prompt = f"""Generate a presentation outline for:\n        Topic: {context}\n        Number of slides: {num_slides}\n        Audience level: {level}\n        \n        Format each slide as:\n        {{\n            \"id\": \"unique_id\",\n            \"title\": \"slide title\",\n            \"key_points\": [\"point 1\", \"point 2\", \"point 3\"],\n            \"image_prompt\": \"description for an image that would enhance this slide\",\n            \"description\": \"brief description of the slide's content\"\n        }}\n        IMPORTANT: Only include slides with 3-5 key_points and a non-empty image_prompt. Do not include slides with fewer than 3 key_points.\n        Output only valid JSON, no explanations."""

        response = await client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3,  # Lowered for more deterministic output
            max_tokens=2000
        )
        
        # Log the raw OpenAI response
        content = response.choices[0].message.content
        logger.info(f"Raw OpenAI response: {content}")
        try:
            import json
            topics = json.loads(content)
            if not isinstance(topics, list):
                topics = [topics]
            # Filter topics to only include those with 3-5 non-empty key_points and a non-empty image_prompt
            filtered_topics = []
            for topic in topics:
                key_points = topic.get("key_points", [])
                image_prompt = topic.get("image_prompt", "")
                # Strict: key_points must be a list with 3-5 non-empty strings, image_prompt must be a non-empty string
                valid_key_points = [kp for kp in key_points if isinstance(kp, str) and kp.strip()]
                if (
                    isinstance(key_points, list)
                    and 3 <= len(valid_key_points) <= 5
                    and all(isinstance(kp, str) and kp.strip() for kp in key_points)
                    and isinstance(image_prompt, str)
                    and image_prompt.strip() != ""
                ):
                    filtered_topics.append({**topic, "key_points": valid_key_points, "image_prompt": image_prompt.strip()})
            logger.info(f"Filtered topics: {filtered_topics}")
            if not filtered_topics:
                logger.error("No valid slides generated: All topics missing required fields. Raising error as intended.")
                raise HTTPException(
                    status_code=500,
                    detail={
                        "type": "GENERATION_ERROR",
                        "message": "No valid slides could be generated. Please try a different topic or wording.",
                        "context": {"error": "All slides missing key_points or image_prompt."}
                    }
                )
            logger.info("Returning only valid filtered topics.")
            return filtered_topics
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
                "message": "OpenAI API error",
                "context": {
                    "error": str(e)
                }
            }
        )
    except Exception as e:
        logger.error(f"Unexpected error in generate_outline_with_openai: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "type": "API_ERROR",
                "message": "Failed to generate outline",
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

if __name__ == "__main__":
    import uvicorn
    print("Starting server on port 8000...")
    uvicorn.run(app, host="127.0.0.1", port=8000)
