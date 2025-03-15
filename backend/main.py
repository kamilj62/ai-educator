from fastapi import FastAPI, HTTPException, Body
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import os
import logging
import traceback
from models import (
    PresentationInput, 
    OutlineResponse, 
    Presentation, 
    ExportRequest,
    SlideTopic,
    InstructionalLevel,
    SlideContent,
    SlideGenerationRequest,
    ImageGenerationRequest
)
from ai_service import AIService
from rate_limiter import RateLimiter
from exceptions import ImageGenerationError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configure CORS with specific origins
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://localhost:3004",
    "http://localhost:3005",
    "http://localhost:3006",
    "http://localhost:3007",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
    "http://127.0.0.1:3003",
    "http://127.0.0.1:3004",
    "http://127.0.0.1:3005",
    "http://127.0.0.1:3006",
    "http://127.0.0.1:3007",
    "http://127.0.0.1:58802",  # Current browser preview proxy
    "http://127.0.0.1:63932",  # Previous browser preview proxy
    "http://127.0.0.1:56737",  # Previous browser preview proxy
    "http://127.0.0.1:53543",  # Previous browser preview proxy
    "http://127.0.0.1:49616"   # Previous browser preview proxy
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,  # Changed to True to allow credentials
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Accept", "Authorization", "X-Requested-With"],
    max_age=86400  # Cache preflight requests for 24 hours
)

# Mount static files directory for images
app.mount("/static", StaticFiles(directory="static"), name="static")

# Initialize rate limiter and AI service
rate_limiter = RateLimiter()
ai_service = AIService(rate_limiter)

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    await ai_service.initialize()
    logger.info("AI service initialized")

@app.get("/")
async def root():
    return {"message": "Welcome to the Marvel AI Presentation Generator API"}

@app.post("/generate/outline")
async def generate_outline(input_data: PresentationInput) -> dict:
    try:
        logger.info(f"Received outline generation request: {input_data}")
        logger.debug(f"Request data: {input_data.dict()}")
        
        # Validate input
        if not input_data.context.strip():
            raise HTTPException(status_code=400, detail="Context cannot be empty")
        if not 1 <= input_data.num_slides <= 20:
            raise HTTPException(status_code=400, detail="Number of slides must be between 1 and 20")
        
        logger.info("Input validation passed")
            
        # Generate outline
        try:
            topics = await ai_service.generate_outline(
                context=input_data.context,
                num_slides=input_data.num_slides,
                level=input_data.instructional_level
            )
            
            logger.info(f"Generated {len(topics)} topics")
            logger.debug(f"Topics: {[topic.dict() for topic in topics]}")
            
            return {"topics": [topic.dict() for topic in topics]}
            
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
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in generate_outline endpoint: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )

@app.post("/generate/slide")
async def generate_slide_content(request: SlideGenerationRequest):
    try:
        logger.info(f"Received slide generation request for topic: {request.topic.title}")
        logger.debug(f"Request data: {request.dict()}")
        
        try:
            slide_content = await ai_service.generate_slide_content(
                request.topic,
                request.instructional_level
            )
            
            logger.info(f"Successfully generated content for topic: {request.topic.title}")
            logger.debug(f"Slide content: {slide_content.dict()}")
            
            # Return slide content in a consistent format
            return {
                "data": {
                    "slide": slide_content.dict(),
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
            logger.error(f"Error generating slide content: {str(e)}")
            logger.error(traceback.format_exc())
            raise HTTPException(
                status_code=500,
                detail=f"Error generating slide content: {str(e)}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in generate_slides endpoint: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )

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

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8005, reload=True)
