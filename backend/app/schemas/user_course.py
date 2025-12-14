"""
Pydantic schemas for UserCourse (user enrollment in courses).
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


class UserCourseBase(BaseModel):
    """Base user course enrollment schema."""
    course_id: int
    looking_for_study_partner: bool = False


class UserCourseCreate(UserCourseBase):
    """Schema for enrolling in a course."""
    pass


class UserCourseUpdate(BaseModel):
    """Schema for updating course enrollment settings."""
    looking_for_study_partner: bool = Field(..., description="Whether looking for study partner in this course")


class UserCourseResponse(UserCourseBase):
    """Schema for user course enrollment response."""
    id: int
    user_id: int
    enrolled_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserCourseWithCourseInfo(BaseModel):
    """Schema for user course enrollment with course details."""
    id: int
    course_id: int
    course_number: str
    course_name: str
    looking_for_study_partner: bool
    enrolled_at: datetime

    model_config = ConfigDict(from_attributes=True)
