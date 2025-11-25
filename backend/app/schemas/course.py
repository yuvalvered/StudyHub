"""
Pydantic schemas for Course-related requests and responses.
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


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


class CourseWithStats(CourseResponse):
    """Course response with statistics."""
    materials_count: int = 0
    discussions_count: int = 0
    enrolled_users_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class EnrolledUserInfo(BaseModel):
    """Information about a user enrolled in a course."""
    user_id: int
    username: str
    full_name: str
    profile_image_url: Optional[str] = None
    enrolled_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class CourseEnrollmentResponse(BaseModel):
    """Response after enrolling/unenrolling from a course."""
    message: str
    course_id: int
    user_id: int
    enrolled: bool
