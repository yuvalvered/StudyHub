"""
Notification routes: manage user notifications and notification settings.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.notification import (
    NotificationResponse,
    NotificationUpdate,
    NotificationListResponse,
    NotificationSettingsResponse,
    NotificationSettingsUpdate
)
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notifications"])


# ============================================================================
# Notification Endpoints
# ============================================================================

@router.get("", response_model=NotificationListResponse)
async def get_notifications(
    unread_only: bool = False,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get notifications for the current user.

    - **unread_only**: If true, only return unread notifications
    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum number of records to return
    """
    notifications, total, unread_count = NotificationService.get_user_notifications(
        db=db,
        user_id=current_user.id,
        unread_only=unread_only,
        skip=skip,
        limit=limit
    )

    return NotificationListResponse(
        total=total,
        unread_count=unread_count,
        notifications=notifications
    )


@router.get("/unread", response_model=NotificationListResponse)
async def get_unread_notifications(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get only unread notifications for the current user.

    Shortcut for GET /notifications?unread_only=true
    """
    notifications, total, unread_count = NotificationService.get_user_notifications(
        db=db,
        user_id=current_user.id,
        unread_only=True,
        skip=skip,
        limit=limit
    )

    return NotificationListResponse(
        total=total,
        unread_count=unread_count,
        notifications=notifications
    )


@router.put("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark a specific notification as read.

    Only the notification owner can mark it as read.
    """
    notification = NotificationService.mark_as_read(
        db=db,
        notification_id=notification_id,
        user_id=current_user.id
    )

    return notification


@router.post("/mark-all-read")
async def mark_all_notifications_as_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark all notifications as read for the current user.

    Returns the number of notifications marked as read.
    """
    count = NotificationService.mark_all_as_read(
        db=db,
        user_id=current_user.id
    )

    return {
        "message": f"Marked {count} notifications as read",
        "count": count
    }


# ============================================================================
# Notification Settings Endpoints
# ============================================================================

@router.get("/settings", response_model=NotificationSettingsResponse)
async def get_notification_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get notification settings for the current user.

    If settings don't exist, default settings will be created automatically.
    """
    settings = NotificationService.get_or_create_settings(
        db=db,
        user_id=current_user.id
    )

    return settings


@router.put("/settings", response_model=NotificationSettingsResponse)
async def update_notification_settings(
    settings_update: NotificationSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update notification settings for the current user.

    You can update any combination of the following settings:
    - comment_on_material_in_app / comment_on_material_email
    - comment_on_discussion_in_app / comment_on_discussion_email
    - reply_to_comment_in_app / reply_to_comment_email
    - material_rated_in_app / material_rated_email

    Only the fields you provide will be updated.
    """
    settings = NotificationService.update_settings(
        db=db,
        user_id=current_user.id,
        settings_update=settings_update
    )

    return settings
