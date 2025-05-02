from enum import Enum
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field, validator, root_validator, ConfigDict

class InstructionalLevel(str, Enum):
    ELEMENTARY = "elementary"
    MIDDLE_SCHOOL = "middle_school"
    HIGH_SCHOOL = "high_school"
    UNIVERSITY = "university"
    PROFESSIONAL = "professional"

class BulletPoint(BaseModel):
    model_config = ConfigDict(extra='forbid')
    text: str

class Example(BaseModel):
    model_config = ConfigDict(extra='forbid')
    text: str

class SlideTopic(BaseModel):
    model_config = ConfigDict(extra='forbid')
    id: Optional[str] = Field(default=None, description="Unique identifier for the topic")
    title: str = Field(..., description="Title of the topic")
    description: Optional[str] = Field(None, description="Optional detailed description")
    key_points: List[str] = Field(..., min_items=3, max_items=5, description="List of 3-5 key points")
    image_prompt: str = Field(..., min_length=1, description="Non-empty prompt for generating an image")
    subtopics: Optional[List['SlideTopic']] = Field(default_factory=list, description="Optional list of subtopics")

    @validator('key_points')
    def check_key_points(cls, v):
        if not all(isinstance(kp, str) and kp.strip() for kp in v):
            raise ValueError('All key_points must be non-empty strings')
        return v

    @validator('image_prompt')
    def check_image_prompt(cls, v):
        if not isinstance(v, str) or not v.strip():
            raise ValueError('image_prompt must be a non-empty string')
        return v

class SlideLayout(str, Enum):
    TITLE_ONLY = "title-only"
    TITLE_IMAGE = "title-image"
    TITLE_BODY = "title-body"
    TITLE_BODY_IMAGE = "title-body-image"
    TITLE_BULLETS = "title-bullets"
    TITLE_BULLETS_IMAGE = "title-bullets-image"
    TWO_COLUMN = "two-column"
    TWO_COLUMN_IMAGE = "two-column-image"

class SlideContent(BaseModel):
    model_config = ConfigDict(extra='forbid')
    title: str
    subtitle: Optional[str] = None
    body: Optional[str] = None
    bullet_points: Optional[List[BulletPoint]] = None
    examples: Optional[List[Example]] = None
    discussion_questions: Optional[List[str]] = None
    image_url: Optional[str] = None
    image_caption: Optional[str] = None

class SlideContentNew(BaseModel):
    """New slide content model that matches our frontend layout system."""
    model_config = ConfigDict(extra='forbid')
    title: str
    subtitle: Optional[str] = None
    body: Optional[str] = None
    bullet_points: Optional[List[Dict[str, str]]] = None  # List of {"text": "point text"}
    image_url: Optional[str] = None
    image_caption: Optional[str] = None
    layout: str = Field(..., description="Layout type in kebab-case format")
    column_left: Optional[str] = None
    column_right: Optional[str] = None

class SlideNew(BaseModel):
    """New slide model that matches our frontend layout system."""
    model_config = ConfigDict(extra='forbid')
    id: str
    layout: str = Field(..., description="Layout type in kebab-case format")
    content: SlideContentNew

class SlideGenerationRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    topic: SlideTopic
    instructional_level: InstructionalLevel
    layout: str = Field(..., description="Layout type in kebab-case format")

class OutlineGenerationRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    context: str
    num_slides: int
    instructional_level: InstructionalLevel

class OutlineResponse(BaseModel):
    model_config = ConfigDict(extra='forbid')
    topics: List[SlideTopic]
    warnings: Optional[List[str]] = None

class Presentation(BaseModel):
    model_config = ConfigDict(extra='forbid')
    title: str
    slides: List[SlideNew]
    instructional_level: InstructionalLevel
    created_at: Optional[str] = None

class ExportRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    presentation: Presentation
    format: str = "pptx"  # Only pptx supported for now

class ImageServiceProvider(Enum):
    OPENAI = "openai"
    GOOGLE = "google"

class ImageGenerationRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    prompt: str
    context: Optional[Dict[str, Any]] = None

class ExportFormat(str, Enum):
    PDF = "pdf"
    PPTX = "pptx"

class PresentationInput(BaseModel):
    model_config = ConfigDict(extra='forbid')
    context: str = Field(..., min_length=1)
    num_slides: int = Field(..., ge=1, le=20)
    instructional_level: InstructionalLevel
