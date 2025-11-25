"""
Pydantic schemas for Message-related requests and responses.
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


class MessageBase(BaseModel):
    """Base message schema."""
    subject: str = Field(..., max_length=200)
    content: str


class MessageCreate(MessageBase):
    """Schema for creating a message."""
    receiver_id: int


class MessageResponse(MessageBase):
    """Schema for message response."""
    id: int
    sender_id: int
    receiver_id: int
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class MessageWithUsers(MessageResponse):
    """Message response with sender and receiver info."""
    sender_username: str
    sender_full_name: str
    receiver_username: str
    receiver_full_name: str

    model_config = ConfigDict(from_attributes=True)
