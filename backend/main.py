from fastapi import FastAPI, HTTPException, Body, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import os
from dotenv import load_dotenv
from openai import OpenAI
import logging
import traceback
import json
import time
from models import (
    PresentationInput, 
    OutlineResponse, 
    Presentation, 
    ExportRequest,
    SlideTopic,
    InstructionalLevel,
    SlideContent,
    SlideGenerationRequest,
    ImageGenerationRequest,
    SlideLayout,
    SlideContentNew,
    SlideNew as Slide
)
from ai_service import AIService
from rate_limiter import RateLimiter
from exceptions import (
    ImageGenerationError,
    ContentSafetyError,
    ErrorType,
    ImageServiceProvider
)
from datetime import datetime
from pptx import Presentation as pptx_Presentation
from pptx.util import Inches

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

# Mount static files directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# Basic error handling middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
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
    """Generate presentation outline with enhanced error handling."""
    try:
        logger.info(f"Received outline generation request: {input_data}")
        
        # Validate input
        if not input_data.context.strip():
            raise HTTPException(status_code=400, detail="Context cannot be empty")
        if not 1 <= input_data.num_slides <= 20:
            raise HTTPException(status_code=400, detail="Number of slides must be between 1 and 20")
            
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
        raise HTTPException(
            status_code=500,
            detail=f"Error generating outline: {str(e)}"
        )

@app.post("/api/generate/slides", response_model=SlideContentNew)
async def generate_slide_content(request: SlideGenerationRequest) -> SlideContentNew:
    try:
        slide_content = await ai_service.generate_slide_content(
            topic=request.topic,
            instructional_level=request.instructional_level,
            layout=request.layout
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

@app.post("/api/test-image-generation")
async def test_image_generation(request: ImageGenerationRequest):
    """Test endpoint for image generation with proper error handling."""
    try:
        # Generate image with automatic fallback to DALL-E if Imagen fails
        image_base64 = await ai_service.generate_image(request.prompt)
        return {"status": "success", "image": image_base64}
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
        logger.error(f"Unexpected error in image generation: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": str(e),
                "error_type": "UNEXPECTED_ERROR"
            }
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
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"renewable_energy_{timestamp}.pptx"
        output_path = os.path.join(export_dir, filename)
        
        # Create basic presentation
        prs = pptx_Presentation()
        
        # Add title slide
        title_slide = prs.slides.add_slide(prs.slide_layouts[0])
        title_slide.shapes.title.text = "Renewable Energy"
        subtitle = title_slide.placeholders[1]
        subtitle.text = f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        
        # Add content slides
        for slide in presentation.slides:
            content_slide = prs.slides.add_slide(prs.slide_layouts[1])
            content_slide.shapes.title.text = slide.title
            
            # Add content
            body_shape = content_slide.shapes.placeholders[1]
            tf = body_shape.text_frame
            
            for point in slide.bullet_points:
                p = tf.add_paragraph()
                p.text = point.text
            
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
        
        # Save presentation
        prs.save(output_path)
        
        return {"file_path": f"exports/{filename}"}
        
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
