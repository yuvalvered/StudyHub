"""
Pydantic schemas for Discussion/Forum-related requests and responses.
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


class DiscussionBase(BaseModel):
    """Base discussion schema."""
    title: str = Field(..., max_length=200)
    content: str


class DiscussionCreate(DiscussionBase):
    """Schema for creating a discussion for a course.

    Note: course_id is taken from URL path parameter, not from request body.
    """
    pass  # Only title and content are needed


class DiscussionUpdate(BaseModel):
    """Schema for updating a discussion."""
    title: Optional[str] = Field(None, max_length=200)
    content: Optional[str] = None


class DiscussionResponse(DiscussionBase):
    """Schema for discussion response."""
    id: int
    author_id: int
    course_id: Optional[int] = None
    is_pinned: bool
    is_locked: bool
    view_count: int
    vote_count: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class DiscussionWithAuthor(DiscussionResponse):
    """Discussion response with author info."""
    author_username: str
    author_full_name: str
    comment_count: int = 0

    model_config = ConfigDict(from_attributes=True)
