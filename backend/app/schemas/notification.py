"""
Pydantic schemas for Notification-related requests and responses.
"""
from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from app.models.notification import NotificationType


class NotificationResponse(BaseModel):
    """Schema for notification response."""
    id: int
    notification_type: NotificationType
    title: str
    content: str
    link: Optional[str] = None
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class NotificationUpdate(BaseModel):
    """Schema for updating notification status."""
    is_read: bool
