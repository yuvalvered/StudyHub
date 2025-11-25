"""
Pydantic schemas for AI-related requests and responses.
"""
from pydantic import BaseModel, Field
from typing import Optional, List


class AIQuestionRequest(BaseModel):
    """Schema for asking a question to the AI chatbot."""
    question: str = Field(..., max_length=500)
    course_id: Optional[int] = None
    material_id: Optional[int] = None


class AIQuestionResponse(BaseModel):
    """Schema for AI response."""
    answer: str
    sources: Optional[List[str]] = None
    disclaimer: str = "תשובות ה-AI עלולות להכיל טעויות. יש לאמת מול מקורות אקדמיים"


class AISummarizeRequest(BaseModel):
    """Schema for requesting AI to summarize a document."""
    material_id: int


class AISummarizeResponse(BaseModel):
    """Schema for AI summarization response."""
    summary: str
    key_points: Optional[List[str]] = None


class AIGenerateQuestionsRequest(BaseModel):
    """Schema for generating practice questions."""
    material_id: int
    num_questions: int = Field(default=5, ge=1, le=20)


class AIGenerateQuestionsResponse(BaseModel):
    """Schema for generated questions response."""
    questions: List[str]
