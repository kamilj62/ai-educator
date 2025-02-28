from fastapi import FastAPI, HTTPException, Request
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
    SlideContent
)
from ai_service import AIService
from presentation_service import PresentationService
import logging
import traceback
import json
from typing import List, Dict, Any, Union

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="MarvelAI Presentation Generator")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
ai_service = AIService()
presentation_service = PresentationService()

class SlideGenerationRequest(BaseModel):
    topics: List[SlideTopic]
    instructional_level: InstructionalLevel

def create_error_response(status_code: int, detail: Union[str, Dict[str, Any]]) -> JSONResponse:
    """Create a standardized error response"""
    if isinstance(detail, str):
        content = {"detail": detail}
    else:
        content = detail
        
    return JSONResponse(
        status_code=status_code,
        content=content,
        headers={
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "http://localhost:3001",
            "Access-Control-Allow-Credentials": "true"
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Validation error: {str(exc)}")
    return create_error_response(422, {"detail": str(exc)})

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.error(f"HTTP exception: {str(exc)}")
    return create_error_response(exc.status_code, {"detail": exc.detail})

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception handler caught: {str(exc)}")
    logger.error(traceback.format_exc())
    
    # Handle different types of errors
    if isinstance(exc, json.JSONDecodeError):
        return create_error_response(500, "Failed to parse JSON response from AI service. Please try again.")
    elif isinstance(exc, ValidationError):
        return create_error_response(422, f"Invalid data format: {str(exc)}")
    else:
        return create_error_response(500, str(exc))

@app.post("/api/generate-outline")
async def generate_outline(input_data: PresentationInput):
    """Generate presentation outline based on input parameters."""
    try:
        logger.info(f"Generating outline for context: {input_data.context}")
        
        try:
            topics = ai_service.generate_outline(
                input_data.context,
                input_data.num_slides,
                input_data.instructional_level
            )
            logger.info(f"Generated {len(topics)} topics")
            
            response_data = {"topics": [topic.dict() for topic in topics]}
            return JSONResponse(
                content=response_data,
                headers={"Content-Type": "application/json"}
            )
        except ValueError as ve:
            logger.error(f"AI Service error: {str(ve)}")
            return JSONResponse(
                status_code=400,
                content={"error": str(ve)},
                headers={"Content-Type": "application/json"}
            )
            
    except Exception as e:
        logger.error(f"Error generating outline: {str(e)}")
        logger.error(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error occurred while generating outline"},
            headers={"Content-Type": "application/json"}
        )

@app.post("/api/generate-slides")
async def generate_slides(request: SlideGenerationRequest):
    """Generate slide content for approved outline."""
    try:
        logger.info(f"Generating slides for {len(request.topics)} topics at {request.instructional_level} level")
        slides: List[SlideContent] = []
        errors = []
        
        for topic in request.topics:
            try:
                logger.info(f"Generating content for topic: {topic.title}")
                slide_content = ai_service.generate_slide_content(topic, request.instructional_level)
                slides.append(slide_content)
                logger.info(f"Successfully generated content for topic: {topic.title}")
            except Exception as e:
                logger.error(f"Error generating content for topic {topic.title}: {str(e)}")
                logger.error(traceback.format_exc())
                errors.append(f"Failed to generate content for topic '{topic.title}': {str(e)}")
                continue  # Continue with next topic even if this one fails
        
        if len(slides) == 0:
            # If all slides failed, return error
            error_message = "\n".join(errors)
            return create_error_response(500, f"Failed to generate any slides:\n{error_message}")
        
        logger.info(f"Generated {len(slides)} slides successfully")
        
        # Convert slides to dict and log the response
        response_data = {
            "slides": [slide.dict() for slide in slides],
            "warnings": errors if errors else None
        }
        logger.info(f"Response data: {json.dumps(response_data)}")
        
        return JSONResponse(
            content=response_data,
            headers={"Content-Type": "application/json"}
        )
    except Exception as e:
        logger.error(f"Error generating slides: {str(e)}")
        logger.error(traceback.format_exc())
        return create_error_response(500, str(e))

@app.post("/api/export")
async def export_presentation(request: ExportRequest):
    """Export presentation in specified format."""
    try:
        logger.info(f"Exporting presentation in {request.format} format")
        result = presentation_service.export_presentation(
            request.presentation.slides,
            request.format
        )
        logger.info(f"Export successful: {result}")
        return JSONResponse(
            content={"status": "success", "file_path": result},
            headers={"Content-Type": "application/json"}
        )
    except Exception as e:
        logger.error(f"Error exporting presentation: {str(e)}")
        logger.error(traceback.format_exc())
        return create_error_response(500, f"Failed to export presentation: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
