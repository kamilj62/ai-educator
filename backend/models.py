from pydantic import BaseModel
from typing import List, Optional
from enum import Enum

class InstructionalLevel(str, Enum):
    ELEMENTARY = "elementary"
    MIDDLE_SCHOOL = "middle_school"
    HIGH_SCHOOL = "high_school"
    UNIVERSITY = "university"
    PROFESSIONAL = "professional"

class PresentationInput(BaseModel):
    context: str
    num_slides: int
    instructional_level: InstructionalLevel
    
class SlideTopic(BaseModel):
    title: str
    description: str

class OutlineResponse(BaseModel):
    topics: List[SlideTopic]

class BulletPoint(BaseModel):
    text: str
    sub_points: Optional[List[str]] = None
    emphasis: Optional[bool] = None

class Example(BaseModel):
    description: str
    details: Optional[List[str]] = None

class SlideContent(BaseModel):
    title: str
    subtitle: Optional[str] = None
    introduction: Optional[str] = None
    bullet_points: List[BulletPoint]
    examples: Optional[List[Example]] = None
    key_takeaway: Optional[str] = None
    discussion_questions: Optional[List[str]] = None
    
class Presentation(BaseModel):
    slides: List[SlideContent]
    
class ExportFormat(str, Enum):
    PDF = "pdf"
    GOOGLE_SLIDES = "google_slides"
    PPTX = "pptx"
    
class ExportRequest(BaseModel):
    presentation: Presentation
    format: ExportFormat
