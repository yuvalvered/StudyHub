"""
Pydantic schemas for Rating-related requests and responses.
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


class RatingBase(BaseModel):
    """Base rating schema."""
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None


class RatingCreate(RatingBase):
    """Schema for creating a rating."""
    material_id: int


class RatingUpdate(BaseModel):
    """Schema for updating a rating."""
    rating: Optional[int] = Field(None, ge=1, le=5)
    comment: Optional[str] = None


class RatingResponse(RatingBase):
    """Schema for rating response."""
    id: int
    user_id: int
    material_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class RatingWithUser(RatingResponse):
    """Rating response with user info."""
    user_username: str
    user_full_name: str

    model_config = ConfigDict(from_attributes=True)
