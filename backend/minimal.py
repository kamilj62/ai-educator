from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Dict, Any, Optional
import os
import shutil
from pathlib import Path

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

class Layout(BaseModel):
    name: str
    type: str
    content: Dict[str, Any]

class LayoutSwitch(BaseModel):
    from_layout: str
    to_layout: str
    content: Dict[str, Any]

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

@app.get("/")
async def root():
    return {
        "status": "ok",
        "supported_layouts": list(SUPPORTED_LAYOUTS.keys())
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/layouts")
async def get_layouts():
    return {"layouts": SUPPORTED_LAYOUTS}

@app.post("/layout/validate")
async def validate_layout(layout: Layout):
    if layout.name not in SUPPORTED_LAYOUTS:
        raise HTTPException(status_code=400, detail="Unsupported layout")
    return {
        "valid": True,
        "layout": layout.name,
        "fields": SUPPORTED_LAYOUTS[layout.name]["fields"],
        "content_types": SUPPORTED_LAYOUTS[layout.name]["content_types"]
    }

@app.post("/layout/switch")
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

@app.post("/upload/image")
async def upload_image(file: UploadFile = File(...)):
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
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
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    print("Starting minimal server on port 3001...")
    uvicorn.run(app, host="127.0.0.1", port=3001)
