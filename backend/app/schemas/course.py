"""
Pydantic schemas for Course-related requests and responses.
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional


class CourseBase(BaseModel):
    """Base course schema."""
    course_number: str = Field(..., max_length=20)
    course_name: str = Field(..., max_length=200)
    department: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None


class CourseCreate(CourseBase):
    """Schema for creating a new course."""
    pass


class CourseUpdate(BaseModel):
    """Schema for updating a course."""
    course_name: Optional[str] = Field(None, max_length=200)
    department: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None


class CourseResponse(CourseBase):
    """Schema for course response."""
    id: int

    model_config = ConfigDict(from_attributes=True)
