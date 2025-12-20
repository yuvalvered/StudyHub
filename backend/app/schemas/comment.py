"""
Pydantic schemas for Comment-related requests and responses.
"""
from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class CommentBase(BaseModel):
    """Base comment schema."""
    content: str


class CommentCreate(CommentBase):
    """Schema for creating a comment."""
    parent_comment_id: Optional[int] = None  # For replies


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


# Nested comment schema for replies
class CommentWithReplies(CommentWithAuthor):
    """Comment with nested replies."""
    replies: List['CommentWithReplies'] = []

    model_config = ConfigDict(from_attributes=True)


# Voting schema
class CommentVote(BaseModel):
    """Schema for voting on a comment."""
    vote_type: str  # 'upvote' or 'downvote'
