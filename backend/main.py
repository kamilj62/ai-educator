<<<<<<< HEAD
from fastapi import FastAPI
=======
from fastapi import FastAPI, HTTPException, Body, Request
from fastapi.responses import JSONResponse, FileResponse
>>>>>>> af182bc4 (Fix layout type errors, update selectors, and resolve build issues)
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://ai-educator-nine.vercel.app",
        "https://ai-educator-one.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

origins = [
    "https://ai-educator-six.vercel.app",
    "https://ai-educator-1vxhsdwjo-kamilj62s-projects.vercel.app",
    "http://localhost:3000",
    "https://ai-powerpoint-f44a1d57b590.herokuapp.com"
]

print("CORS origins:", origins)

from fastapi import HTTPException, Body
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import uvicorn
import os
from dotenv import load_dotenv
from openai import OpenAI
import logging
import traceback
import json
import time
<<<<<<< HEAD
import pathlib
from backend.models import (
=======
from models import (
>>>>>>> af182bc4 (Fix layout type errors, update selectors, and resolve build issues)
    PresentationInput, 
    OutlineResponse, 
    Presentation, 
    ExportRequest,
    SlideTopic,
    InstructionalLevel,
    SlideContent,
    SlideGenerationRequest,
<<<<<<< HEAD
)
from backend.ai_service import AIService
from backend.rate_limiter import RateLimiter
from backend.exceptions import (
=======
    ImageGenerationRequest,
    SlideLayout,
    SlideContentNew,
    SlideNew as Slide
)
from ai_service import AIService
from rate_limiter import RateLimiter
from exceptions import (
>>>>>>> af182bc4 (Fix layout type errors, update selectors, and resolve build issues)
    ImageGenerationError,
    ContentSafetyError,
    ErrorType,
    ImageServiceProvider
)
from datetime import datetime
from pptx import Presentation as pptx_Presentation
from pptx.util import Inches
<<<<<<< HEAD
from contextlib import asynccontextmanager
import asyncio
=======
>>>>>>> af182bc4 (Fix layout type errors, update selectors, and resolve build issues)

# Configure logging with more detail
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

<<<<<<< HEAD
# Load environment variables
load_dotenv()

# Load OpenAI API key from credentials or environment
try:
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        with open('credentials/marvelai-imagen-sa-key.json', 'r') as f:
            credentials = json.load(f)
            api_key = credentials.get('openai_api_key')
    if not api_key:
        raise ValueError("OpenAI API key not found in environment or credentials file")
    client = OpenAI(api_key=api_key)
    logger.info(f"✅ OpenAI API Key Loaded: {api_key[:5]}...{api_key[-5:]}")
except Exception as e:
    logger.error(f"Error loading credentials: {str(e)}")
    raise

# Initialize services
ai_service = None
rate_limiter = RateLimiter()

# Ensure static directories exist
STATIC_DIR = pathlib.Path(__file__).parent / "static"
IMAGES_DIR = STATIC_DIR / "images"
STATIC_DIR.mkdir(exist_ok=True)
IMAGES_DIR.mkdir(exist_ok=True)
logger.info(f"Static directories created: {STATIC_DIR}, {IMAGES_DIR}")

# Replace deprecated startup event with lifespan context
@asynccontextmanager
def lifespan(app):
    global ai_service
    try:
        ai_service = AIService(rate_limiter)
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        loop.run_until_complete(ai_service.initialize())
        loop.run_until_complete(ai_service.test_openai_connection())
        logger.info("AI service initialized (lifespan)")
    except Exception as e:
        logger.error(f"Failed to initialize AI service (lifespan): {e}")
        logger.error(traceback.format_exc())
        raise
    yield
    # (Optional: add shutdown/cleanup code here)

app.lifespan_context = lifespan

import sys
if ("pytest" in sys.modules or "PYTEST_CURRENT_TEST" in os.environ) and ai_service is None:
    try:
        ai_service = AIService(rate_limiter)
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        loop.run_until_complete(ai_service.initialize())
        loop.run_until_complete(ai_service.test_openai_connection())
        logger.info("AI service initialized for testing (pytest hack)")
    except Exception as e:
        logger.error(f"Failed to initialize AI service for testing: {e}")
        logger.error(traceback.format_exc())

=======
# Load OpenAI API key from credentials
try:
    with open('credentials/marvelai-imagen-sa-key.json', 'r') as f:
        credentials = json.load(f)
        api_key = credentials.get('openai_api_key')
        if not api_key:
            raise ValueError("OpenAI API key not found in credentials")
        client = OpenAI(api_key=api_key)
        logger.info(f"✅ OpenAI API Key Loaded: {api_key[:5]}...{api_key[-5:]}")
except Exception as e:
    logger.error(f"Error loading credentials: {str(e)}")
    raise

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

>>>>>>> af182bc4 (Fix layout type errors, update selectors, and resolve build issues)
# Mount static files directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# Basic error handling middleware
@app.middleware("http")
<<<<<<< HEAD
async def log_requests(request, call_next):
=======
async def log_requests(request: Request, call_next):
>>>>>>> af182bc4 (Fix layout type errors, update selectors, and resolve build issues)
    try:
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        logger.info(f"Request to {request.url.path} took {process_time:.2f} seconds")
        return response
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        raise

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/")
async def root():
    return {"message": "Welcome to the Marvel AI Presentation Generator API"}

@app.post("/api/generate/outline")
async def generate_outline(input_data: PresentationInput) -> OutlineResponse:
<<<<<<< HEAD
    """Generate presentation outline with enhanced error handling and explicit logging."""
    try:
        logging.info(f"[DEBUG] Received outline generation request: {input_data}")
=======
    """Generate presentation outline with enhanced error handling."""
    try:
        logger.info(f"Received outline generation request: {input_data}")
        
>>>>>>> af182bc4 (Fix layout type errors, update selectors, and resolve build issues)
        # Validate input
        if not input_data.context.strip():
            logging.warning("[DEBUG] Context is empty!")
            raise HTTPException(status_code=400, detail="Context cannot be empty")
        if not 1 <= input_data.num_slides <= 20:
            logging.warning(f"[DEBUG] Invalid num_slides: {input_data.num_slides}")
            raise HTTPException(status_code=400, detail="Number of slides must be between 1 and 20")
<<<<<<< HEAD
        # Check for sensitive topics
        logging.info("[DEBUG] Calling ai_service.generate_outline...")
        try:
            response = await ai_service.generate_outline(
                input_data.context,
                input_data.num_slides,
                input_data.instructional_level,
                sensitive=False
            )
            logging.info(f"[DEBUG] ai_service.generate_outline response: {response}")
            return response
        except Exception as e:
            logging.error(f"[DEBUG] Error in generate_outline: {str(e)}")
            logging.error(traceback.format_exc())
            raise HTTPException(
                status_code=500,
                detail=f"Error generating outline: {str(e)}"
            )
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"[DEBUG] Unexpected error in generate_outline endpoint: {str(e)}")
        logging.error(traceback.format_exc())
=======
            
        # Check for sensitive topics
        sensitive = is_sensitive_topic(input_data.context)
        if sensitive:
            logger.info(f"Detected sensitive topic in context: {input_data.context}")
            
        try:
            # Generate outline with safety checks if needed
            response = await ai_service.generate_outline(
                context=input_data.context,
                num_slides=input_data.num_slides,
                level=input_data.instructional_level,
                sensitive=sensitive
            )
            
            logger.info(f"Generated outline with {len(response['topics'])} topics")
            logger.debug(f"Response: {response}")
            
            # Convert to OutlineResponse model
            return OutlineResponse(
                topics=[SlideTopic(**topic) for topic in response["topics"]],
                warnings=response.get("warnings", [])
            )
            
        except ContentSafetyError as cse:
            logger.error(f"Content safety error: {str(cse)}")
            return JSONResponse(
                status_code=400,
                content={
                    "type": "SAFETY_VIOLATION",
                    "message": str(cse),
                    "context": {"topic": input_data.context},
                    "recommendations": [
                        "Consider focusing on factual, educational content",
                        "Use balanced and objective language",
                        "Include multiple perspectives when appropriate"
                    ]
                }
            )
            
    except ValueError as ve:
        logger.error(f"Value error in generate_outline: {str(ve)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=400, detail=str(ve))
            
    except Exception as e:
        logger.error(f"Error in generate_outline: {str(e)}")
        logger.error(traceback.format_exc())
>>>>>>> af182bc4 (Fix layout type errors, update selectors, and resolve build issues)
        raise HTTPException(
            status_code=500,
            detail=f"Error generating outline: {str(e)}"
        )

<<<<<<< HEAD
@app.post("/api/generate/slide")
async def generate_slide_content(request: SlideGenerationRequest):
    try:
        logger.info(f"Received slide generation request for topic: {request.topic.title}")
        logger.debug(f"Request data: {request.model_dump()}")
        try:
            slide_content = await ai_service.generate_slide_content(
                request.topic,
                request.instructional_level,
                request.layout
            )
            logger.info(f"Successfully generated content for topic: {request.topic.title}")
            logger.debug(f"Slide content: {slide_content.model_dump()}")
            # Return slide content in a consistent format
            return {
                "data": {
                    "slide": slide_content.model_dump(),
                    "warnings": []  # Add any warnings if needed
                }
            }
        except ImageGenerationError as e:
            logger.error(f"Image generation error: {e.message} ({e.error_type.value})")
            return JSONResponse(
                status_code=500,
                content={
                    "status": "error",
                    "message": e.message,
                    "error_type": e.error_type.value,
                    "service": e.service.value if e.service else None,
                    "retry_after": e.retry_after
                }
            )
        except ValueError as ve:
            logger.error(f"Value error in generate_slide_content: {str(ve)}")
            logger.error(traceback.format_exc())
            raise HTTPException(status_code=400, detail=str(ve))
        except Exception as e:
            logger.error(f"Error in generate_slide_content: {str(e)}")
            logger.error(traceback.format_exc())
            raise HTTPException(
                status_code=500,
                detail=f"Error generating slide content: {str(e)}"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in generate_slide_content endpoint: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
=======
@app.post("/api/generate/slides", response_model=SlideContentNew)
async def generate_slide_content(request: SlideGenerationRequest) -> SlideContentNew:
    try:
        slide_content = await ai_service.generate_slide_content(
            topic=request.topic,
            instructional_level=request.instructional_level,
            layout=request.layout
>>>>>>> af182bc4 (Fix layout type errors, update selectors, and resolve build issues)
        )
        return slide_content
    except ImageGenerationError as e:
        error_response = {
            "type": e.error_type,
            "message": str(e),
            "service": e.service,
            "retry_after": e.retry_after,
            "context": {
                "topic": request.topic.title,
                "level": request.instructional_level,
                "layout": request.layout
            },
            "recommendations": e.recommendations or [
                "Try again with simpler content",
                "Check your connection and try again",
                "Contact support if the issue persists"
            ]
        }
        raise HTTPException(status_code=400, detail=error_response)
    except ContentSafetyError as e:
        error_response = {
            "type": ErrorType.SAFETY_VIOLATION,
            "message": str(e),
            "context": {
                "topic": request.topic.title,
                "level": request.instructional_level,
                "layout": request.layout
            },
            "recommendations": [
                "Review content guidelines",
                "Modify content to comply with safety policies",
                "Contact support for clarification"
            ]
        }
        raise HTTPException(status_code=400, detail=error_response)
    except Exception as e:
        error_info = {
            "type": ErrorType.API_ERROR,
            "message": f"Error generating slide content: {str(e)}",
            "context": {
                "topic": request.topic.title,
                "level": request.instructional_level,
                "layout": request.layout,
                "error_details": traceback.format_exc()
            },
            "recommendations": [
                "Try again with simpler content",
                "Check your connection and try again",
                "Contact support if the issue persists"
            ]
        }
        logging.error(f"Error in generate_slide_content: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=error_info)

@app.post("/api/generate-image")
async def generate_image(request: ImageGenerationRequest):
    try:
        if not request.prompt:
            raise HTTPException(status_code=400, detail="Prompt is required")
            
        logger.info(f"Generating image with prompt: {request.prompt}")
        response = client.images.generate(
            model="dall-e-3",
            prompt=request.prompt,
            n=1,
            size="1024x1024"
        )
        image_url = response.data[0].url
        logger.info(f"Generated image URL: {image_url}")
        return {"imageUrl": image_url}
    except Exception as e:
        logger.error(f"Error generating image: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate/slides")
async def generate_slides(request: SlideGenerationRequest):
    """Generate presentation slides from an outline."""
    try:
        logger.debug(f"Received slide request: {request.model_dump()}")
        topic = request.topic
        layout = request.layout or "title-bullets"
        response = {
            "title": topic.title,
            "subtitle": "",
            "body": topic.description or "",
            "bullet_points": topic.key_points,
            "image": {
                "url": getattr(topic, "image_url", None) or "",
                "alt": topic.image_prompt,
                "caption": getattr(topic, "image_caption", None) or "",
                "service": getattr(topic, "image_service", None) or "generated"
            }
        }
        return response
    except Exception as e:
        logger.error(f"Error generating slides: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "type": "API_ERROR",
                "message": f"Failed to generate slides: {str(e)}",
                "context": {"error": str(e)}
            }
        )

@app.post("/api/generate/image")
async def generate_image(request: dict):
    try:
        logger.info(f"Received image generation request: {request}")
        try:
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
            image_url = await ai_service.generate_image(request)
            logger.info(f"Generated image URL: {image_url}")
            return {"image_url": image_url}
        except ImageGenerationError as e:
            logger.error(f"Image generation error: {e.message} ({e.error_type.value})")
            return JSONResponse(
                status_code=500,
                content={
                    "status": "error",
                    "message": e.message,
                    "error_type": e.error_type.value,
                    "service": e.service.value if e.service else None,
                    "retry_after": e.retry_after
                }
            )
        except Exception as e:
            logger.error(f"Error in generate_image: {str(e)}")
            logger.error(traceback.format_exc())
            raise HTTPException(
                status_code=500,
                detail=f"Error generating image: {str(e)}"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in generate_image endpoint: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )

@app.post("/export")
async def export_presentation(request: ExportRequest):
    """Export presentation to specified format."""
    try:
        logger.info(f"Received export request for format: {request.format}")
        result = ai_service.export_presentation(request)
        return {"file_path": result}
    except Exception as e:
        logger.error(f"Error exporting presentation: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Error exporting presentation: {str(e)}"
        )

@app.post("/export/quick")
async def quick_export(presentation: Presentation):
    """Quick export endpoint for presentations."""
    try:
        # Create exports directory if it doesn't exist
        export_dir = os.path.join("static", "exports")
        os.makedirs(export_dir, exist_ok=True)
<<<<<<< HEAD
=======
        
>>>>>>> af182bc4 (Fix layout type errors, update selectors, and resolve build issues)
        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"renewable_energy_{timestamp}.pptx"
        output_path = os.path.join(export_dir, filename)
<<<<<<< HEAD
        # Create basic presentation
        prs = pptx_Presentation()
=======
        
        # Create basic presentation
        prs = pptx_Presentation()
        
>>>>>>> af182bc4 (Fix layout type errors, update selectors, and resolve build issues)
        # Add title slide
        title_slide = prs.slides.add_slide(prs.slide_layouts[0])
        title_slide.shapes.title.text = "Renewable Energy"
        subtitle = title_slide.placeholders[1]
        subtitle.text = f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M')}"
<<<<<<< HEAD
=======
        
>>>>>>> af182bc4 (Fix layout type errors, update selectors, and resolve build issues)
        # Add content slides
        for slide in presentation.slides:
            content_slide = prs.slides.add_slide(prs.slide_layouts[1])
            content_slide.shapes.title.text = slide.title
<<<<<<< HEAD
            # Add content
            body_shape = content_slide.shapes.placeholders[1]
            tf = body_shape.text_frame
            for point in slide.bullet_points:
                p = tf.add_paragraph()
                p.text = point.text
=======
            
            # Add content
            body_shape = content_slide.shapes.placeholders[1]
            tf = body_shape.text_frame
            
            for point in slide.bullet_points:
                p = tf.add_paragraph()
                p.text = point.text
            
>>>>>>> af182bc4 (Fix layout type errors, update selectors, and resolve build issues)
            # Save image if present
            if slide.image_url:
                img_path = os.path.join("marvelAI", slide.image_url)
                if os.path.exists(img_path):
                    content_slide.shapes.add_picture(
                        img_path,
                        Inches(1),
                        Inches(2),
                        width=Inches(8)
                    )
<<<<<<< HEAD
        # Save presentation
        prs.save(output_path)
        return {"file_path": f"exports/{filename}"}
=======
        
        # Save presentation
        prs.save(output_path)
        
        return {"file_path": f"exports/{filename}"}
        
>>>>>>> af182bc4 (Fix layout type errors, update selectors, and resolve build issues)
    except Exception as e:
        logger.error(f"Export error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

def is_sensitive_topic(context: str) -> bool:
    """Check if the given context contains sensitive topics."""
    context_lower = context.lower()
    SENSITIVE_TOPICS = [
        "israeli palestinian conflict",
        "israel palestine",
        "gaza",
        "west bank",
        "middle east conflict"
    ]
    return any(topic in context_lower for topic in SENSITIVE_TOPICS)

<<<<<<< HEAD
if __name__ == "__main__":
    import os
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=False)
=======
# Initialize services
ai_service = None
rate_limiter = RateLimiter()

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    global ai_service
    try:
        ai_service = AIService(rate_limiter)
        await ai_service.initialize()  # Initialize async components
        # Test OpenAI connection
        await ai_service.test_openai_connection()
        logger.info("AI service initialized")
    except Exception as e:
        logger.error(f"Failed to initialize AI service: {e}")
        logger.error(traceback.format_exc())
        raise

if __name__ == "__main__":
    import uvicorn
    print("Starting server on port 8000...")
    uvicorn.run("main:app", host="127.0.0.1", port=8000)
>>>>>>> af182bc4 (Fix layout type errors, update selectors, and resolve build issues)
