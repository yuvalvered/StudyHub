"""
Pydantic schemas for Comment-related requests and responses.
"""
from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class CommentBase(BaseModel):
    """Base comment schema."""
    content: str


class CommentCreate(CommentBase):
    """Schema for creating a comment."""
    discussion_id: int
    parent_comment_id: Optional[int] = None


class CommentUpdate(BaseModel):
    """Schema for updating a comment."""
    content: str


class CommentResponse(CommentBase):
    """Schema for comment response."""
    id: int
    author_id: int
    discussion_id: int
    parent_comment_id: Optional[int] = None
    upvotes: int
    downvotes: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class CommentWithAuthor(CommentResponse):
    """Comment response with author info."""
    author_username: str
    author_full_name: str
    author_profile_image: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
