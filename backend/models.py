from enum import Enum
from pydantic import BaseModel, Field, validator
from typing import List, Optional

class InstructionalLevel(str, Enum):
    ELEMENTARY = "elementary"
    MIDDLE_SCHOOL = "middle_school"
    HIGH_SCHOOL = "high_school"
    UNIVERSITY = "university"
    PROFESSIONAL = "professional"

class BulletPoint(BaseModel):
    text: str

    @validator('text')
    def text_must_not_be_empty(cls, v):
        if not v:
            raise ValueError('Text must not be empty')
        return v

class Example(BaseModel):
    text: str

    @validator('text')
    def text_must_not_be_empty(cls, v):
        if not v:
            raise ValueError('Text must not be empty')
        return v

class SlideTopic(BaseModel):
    title: str
    description: str

    @validator('title')
    def title_must_not_be_empty(cls, v):
        if not v:
            raise ValueError('Title must not be empty')
        return v

    @validator('description')
    def description_must_not_be_empty(cls, v):
        if not v:
            raise ValueError('Description must not be empty')
        return v

class SlideContent(BaseModel):
    title: str
    bullet_points: List[BulletPoint]
    discussion_questions: List[str]
    examples: List[Example]

    @validator('title')
    def title_must_not_be_empty(cls, v):
        if not v:
            raise ValueError('Title must not be empty')
        return v

    @validator('bullet_points')
    def bullet_points_must_not_be_empty(cls, v):
        if not v:
            raise ValueError('Bullet points must not be empty')
        return v

    @validator('discussion_questions')
    def discussion_questions_must_not_be_empty(cls, v):
        if not v:
            raise ValueError('Discussion questions must not be empty')
        return v

    @validator('examples')
    def examples_must_not_be_empty(cls, v):
        if not v:
            raise ValueError('Examples must not be empty')
        return v

class PresentationInput(BaseModel):
    context: str = Field(..., min_length=1)
    num_slides: int = Field(..., ge=1, le=20)
    instructional_level: InstructionalLevel

    @validator('context')
    def context_must_not_be_empty(cls, v):
        if not v:
            raise ValueError('Context must not be empty')
        return v

class OutlineResponse(BaseModel):
    topics: List[SlideTopic]

    @validator('topics')
    def topics_must_not_be_empty(cls, v):
        if not v:
            raise ValueError('Topics must not be empty')
        return v

class SlideGenerationRequest(BaseModel):
    topic: SlideTopic
    instructional_level: InstructionalLevel

class Presentation(BaseModel):
    topics: List[SlideTopic]
    slides: List[SlideContent]
    instructional_level: InstructionalLevel
    num_slides: int

    @validator('topics')
    def topics_must_not_be_empty(cls, v):
        if not v:
            raise ValueError('Topics must not be empty')
        return v

    @validator('slides')
    def slides_must_not_be_empty(cls, v):
        if not v:
            raise ValueError('Slides must not be empty')
        return v

class ExportFormat(str, Enum):
    PDF = "pdf"
    PPTX = "pptx"

class ExportRequest(BaseModel):
    presentation: Presentation
    format: ExportFormat
