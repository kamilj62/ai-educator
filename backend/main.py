from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, ValidationError
from models import (
    PresentationInput, 
    OutlineResponse, 
    Presentation, 
    ExportRequest,
    SlideTopic,
    InstructionalLevel,
    SlideContent,
    SlideGenerationRequest
)
from ai_service import AIService
from presentation_service import PresentationService
import logging
import traceback
import json
from typing import List, Dict, Any, Union
import asyncio
from contextlib import asynccontextmanager

# Configure logging with more detail
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="MarvelAI Presentation Generator")

# Configure CORS
origins = [
    "http://localhost:3000",  # Next.js frontend
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
try:
    ai_service = AIService()
    presentation_service = PresentationService()
    logger.info("Services initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize services: {str(e)}")
    logger.error(traceback.format_exc())
    raise

@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "MarvelAI Presentation Generator API"}

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    try:
        # Test OpenAI connection
        await ai_service.client.models.list()
        return {"status": "healthy", "message": "All services operational"}
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"status": "unhealthy", "message": str(e)}
        )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors."""
    logger.error(f"Validation error: {str(exc)}")
    return JSONResponse(
        status_code=422,
        content={"detail": str(exc)},
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle all other exceptions."""
    logger.error(f"Unhandled exception: {str(exc)}")
    logger.error(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
    )

@app.post("/api/generate-outline")
async def generate_outline(input_data: PresentationInput):
    """Generate a presentation outline based on the input context."""
    try:
        logger.info(f"Received outline generation request: {input_data}")
        logger.debug(f"Request data: {json.dumps(input_data.dict(), indent=2)}")
        
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
            logger.debug(f"Topics: {json.dumps([topic.dict() for topic in topics], indent=2)}")
            
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

@app.post("/api/generate-slides")
async def generate_slides(request: SlideGenerationRequest):
    """Generate content for a single slide."""
    try:
        logger.info(f"Received slide generation request for topic: {request.topic.title}")
        logger.debug(f"Request data: {json.dumps(request.dict(), indent=2)}")
        
        try:
            slide_content = await ai_service.generate_slide_content(
                request.topic,
                request.instructional_level
            )
            
            logger.info(f"Successfully generated content for topic: {request.topic.title}")
            logger.debug(f"Slide content: {json.dumps(slide_content.dict(), indent=2)}")
            
            # Return slide content in a consistent format
            return {
                "data": {
                    "slide": slide_content.dict(),
                    "warnings": []  # Add any warnings if needed
                }
            }
            
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

@app.post("/api/export")
async def export_presentation(request: ExportRequest):
    """Export presentation to specified format."""
    try:
        logger.info(f"Received export request for format: {request.format}")
        result = await presentation_service.export_presentation(
            request.presentation,
            request.format
        )
        return result
    except Exception as e:
        logger.error(f"Error exporting presentation: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Error exporting presentation: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    import sys
    
    try:
        logger.info("Starting server...")
        uvicorn.run(
            app,  
            host="127.0.0.1",  
            port=8002,
            reload=False,  
            log_level="debug",
            access_log=True,
            workers=1
        )
    except Exception as e:
        logger.error(f"Failed to start server: {str(e)}")
        logger.error(traceback.format_exc())
        sys.exit(1)
