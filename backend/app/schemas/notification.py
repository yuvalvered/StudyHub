"""
Pydantic schemas for notifications and notification settings.
"""
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional

from app.models.notification import NotificationType


# ============================================================================
# Notification Schemas
# ============================================================================

class NotificationResponse(BaseModel):
    """Response schema for a notification."""
    id: int
    user_id: int
    type: NotificationType
    title: str
    message: str
    link: Optional[str] = None
    is_read: bool
    email_sent: bool
    related_comment_id: Optional[int] = None
    related_material_id: Optional[int] = None
    related_discussion_id: Optional[int] = None
    actor_id: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationUpdate(BaseModel):
    """Schema for updating a notification (marking as read)."""
    is_read: bool = Field(..., description="Mark notification as read or unread")


class NotificationListResponse(BaseModel):
    """Response schema for a list of notifications with pagination info."""
    total: int
    unread_count: int
    notifications: list[NotificationResponse]


# ============================================================================
# Notification Settings Schemas
# ============================================================================

class NotificationSettingsResponse(BaseModel):
    """Response schema for user notification settings."""
    id: int
    user_id: int
    comment_on_material_in_app: bool
    comment_on_material_email: bool
    comment_on_discussion_in_app: bool
    comment_on_discussion_email: bool
    reply_to_comment_in_app: bool
    reply_to_comment_email: bool
    material_rated_in_app: bool
    material_rated_email: bool

    model_config = ConfigDict(from_attributes=True)


class NotificationSettingsUpdate(BaseModel):
    """Schema for updating notification settings."""
    comment_on_material_in_app: Optional[bool] = Field(None, description="Receive in-app notifications for comments on my materials")
    comment_on_material_email: Optional[bool] = Field(None, description="Receive email notifications for comments on my materials")
    comment_on_discussion_in_app: Optional[bool] = Field(None, description="Receive in-app notifications for comments on my discussions")
    comment_on_discussion_email: Optional[bool] = Field(None, description="Receive email notifications for comments on my discussions")
    reply_to_comment_in_app: Optional[bool] = Field(None, description="Receive in-app notifications for replies to my comments")
    reply_to_comment_email: Optional[bool] = Field(None, description="Receive email notifications for replies to my comments")
    material_rated_in_app: Optional[bool] = Field(None, description="Receive in-app notifications when my materials are rated")
    material_rated_email: Optional[bool] = Field(None, description="Receive email notifications when my materials are rated")

    model_config = ConfigDict(from_attributes=True)
