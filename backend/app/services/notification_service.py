"""
Notification service for creating and managing notifications.
Handles both in-app and email notifications based on user preferences.
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import Optional, List
import logging

from app.models.notification import Notification, NotificationType
from app.models.notification_settings import NotificationSettings
from app.models.user import User
from app.models.comment import Comment
from app.models.material import Material
from app.models.discussion import Discussion
from app.schemas.notification import NotificationSettingsUpdate
from app.services.email_service import EmailService
from app.core.config import settings

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for handling all notification operations."""

    @staticmethod
    def get_or_create_settings(db: Session, user_id: int) -> NotificationSettings:
        """
        Get notification settings for a user, or create default settings if they don't exist.

        Args:
            db: Database session
            user_id: User ID

        Returns:
            NotificationSettings object
        """
        settings = db.query(NotificationSettings).filter(
            NotificationSettings.user_id == user_id
        ).first()

        if not settings:
            # Create default settings for new user
            # All in-app notifications ON, all email notifications OFF by default
            settings = NotificationSettings(
                user_id=user_id,
                comment_on_material_in_app=True,
                comment_on_material_email=False,
                comment_on_discussion_in_app=True,
                comment_on_discussion_email=False,
                reply_to_comment_in_app=True,
                reply_to_comment_email=False,
                material_rated_in_app=True,
                material_rated_email=False
            )
            db.add(settings)
            db.commit()
            db.refresh(settings)
            logger.info(f"Created default notification settings for user {user_id}")

        return settings

    @staticmethod
    def update_settings(
        db: Session,
        user_id: int,
        settings_update: NotificationSettingsUpdate
    ) -> NotificationSettings:
        """
        Update user notification settings.

        Args:
            db: Database session
            user_id: User ID
            settings_update: Settings update data

        Returns:
            Updated NotificationSettings object
        """
        settings = NotificationService.get_or_create_settings(db, user_id)

        # Update only the fields that were provided
        update_data = settings_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(settings, field, value)

        db.commit()
        db.refresh(settings)
        logger.info(f"Updated notification settings for user {user_id}")

        return settings

    @staticmethod
    def create_notification(
        db: Session,
        user_id: int,
        notification_type: NotificationType,
        title: str,
        message: str,
        link: Optional[str] = None,
        actor_id: Optional[int] = None,
        related_comment_id: Optional[int] = None,
        related_material_id: Optional[int] = None,
        related_discussion_id: Optional[int] = None
    ) -> Optional[Notification]:
        """
        Create a notification (in-app and/or email) based on user preferences.

        Args:
            db: Database session
            user_id: User to notify
            notification_type: Type of notification
            title: Notification title
            message: Notification message
            link: Optional link to navigate to
            actor_id: User who triggered the notification
            related_comment_id: Related comment ID
            related_material_id: Related material ID
            related_discussion_id: Related discussion ID

        Returns:
            Created Notification object if in-app notification was enabled, None otherwise
        """
        # Don't notify users about their own actions
        if actor_id and actor_id == user_id:
            logger.debug(f"Skipping notification for user {user_id} - self-action")
            return None

        # Get user's notification settings
        user_settings = NotificationService.get_or_create_settings(db, user_id)

        # Convert NotificationType enum to string for settings check
        type_str = notification_type.value if isinstance(notification_type, NotificationType) else notification_type

        # Check if user wants in-app notifications for this type
        should_send_in_app = user_settings.should_send_in_app(type_str)
        should_send_email = user_settings.should_send_email(type_str)

        # If user disabled both, don't create anything
        if not should_send_in_app and not should_send_email:
            logger.debug(f"User {user_id} has disabled all notifications for type {type_str}")
            return None

        notification = None

        # Create in-app notification if enabled
        if should_send_in_app:
            notification = Notification(
                user_id=user_id,
                type=notification_type,
                title=title,
                message=message,
                link=link,
                actor_id=actor_id,
                related_comment_id=related_comment_id,
                related_material_id=related_material_id,
                related_discussion_id=related_discussion_id,
                email_sent=False
            )
            db.add(notification)
            db.commit()
            db.refresh(notification)
            logger.info(f"Created in-app notification {notification.id} for user {user_id}")

        # Send email notification if enabled
        if should_send_email:
            user = db.query(User).filter(User.id == user_id).first()
            if user and user.email:
                email_sent = NotificationService._send_email_notification(
                    user_email=user.email,
                    user_username=user.username,
                    title=title,
                    message=message,
                    link=link
                )

                # Update notification record if it exists
                if notification:
                    notification.email_sent = email_sent
                    db.commit()
                    db.refresh(notification)

        return notification

    @staticmethod
    def _send_email_notification(
        user_email: str,
        user_username: str,
        title: str,
        message: str,
        link: Optional[str] = None
    ) -> bool:
        """
        Send email notification to user.

        Args:
            user_email: User's email address
            user_username: User's username
            title: Notification title
            message: Notification message
            link: Optional link to navigate to

        Returns:
            True if email sent successfully, False otherwise
        """
        subject = f"StudyHub: {title}"

        # Create full URL for link if provided
        full_link = f"{settings.FRONTEND_URL}{link}" if link else settings.FRONTEND_URL

        html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f4f4f4; border-radius: 10px; padding: 30px;">
                <h1 style="color: #3498db; text-align: center;">{title}</h1>

                <p>Hello {user_username},</p>

                <p>{message}</p>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="{full_link}"
                       style="background-color: #3498db; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                        View on StudyHub
                    </a>
                </div>

                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

                <p style="font-size: 12px; color: #7f8c8d; text-align: center;">
                    StudyHub - Platform for sharing study materials<br>
                    You can manage your notification preferences in your account settings.<br>
                    This email was sent automatically, please do not reply.
                </p>
            </div>
        </body>
        </html>
        """

        return EmailService.send_email(user_email, subject, html_content)

    @staticmethod
    def notify_comment_on_material(
        db: Session,
        material: Material,
        comment: Comment,
        actor: User
    ) -> Optional[Notification]:
        """
        Notify material uploader when someone comments on their material.

        Args:
            db: Database session
            material: Material that was commented on
            comment: The comment that was created
            actor: User who created the comment

        Returns:
            Created Notification object if notification was sent
        """
        # Don't notify if commenter is the uploader
        if material.uploader_id == actor.id:
            return None

        title = "New comment on your material"
        message = f"{actor.username} commented on your material '{material.title}'"
        link = f"/materials/{material.id}"

        return NotificationService.create_notification(
            db=db,
            user_id=material.uploader_id,
            notification_type=NotificationType.COMMENT_ON_MATERIAL,
            title=title,
            message=message,
            link=link,
            actor_id=actor.id,
            related_comment_id=comment.id,
            related_material_id=material.id
        )

    @staticmethod
    def notify_comment_on_discussion(
        db: Session,
        discussion: Discussion,
        comment: Comment,
        actor: User
    ) -> Optional[Notification]:
        """
        Notify discussion creator when someone comments on their discussion.

        Args:
            db: Database session
            discussion: Discussion that was commented on
            comment: The comment that was created
            actor: User who created the comment

        Returns:
            Created Notification object if notification was sent
        """
        # Don't notify if commenter is the discussion creator
        if discussion.author_id == actor.id:
            return None

        title = "New comment on your discussion"
        message = f"{actor.username} commented on your discussion '{discussion.title}'"
        link = f"/discussions/{discussion.id}"

        return NotificationService.create_notification(
            db=db,
            user_id=discussion.author_id,
            notification_type=NotificationType.COMMENT_ON_DISCUSSION,
            title=title,
            message=message,
            link=link,
            actor_id=actor.id,
            related_comment_id=comment.id,
            related_discussion_id=discussion.id
        )

    @staticmethod
    def notify_reply_to_comment(
        db: Session,
        parent_comment: Comment,
        reply_comment: Comment,
        actor: User
    ) -> Optional[Notification]:
        """
        Notify comment author when someone replies to their comment.

        Args:
            db: Database session
            parent_comment: Comment that was replied to
            reply_comment: The reply comment
            actor: User who created the reply

        Returns:
            Created Notification object if notification was sent
        """
        # Don't notify if replier is the original commenter
        if parent_comment.author_id == actor.id:
            return None

        # Determine the context (material or discussion)
        if parent_comment.discussion_id:
            discussion = db.query(Discussion).filter(Discussion.id == parent_comment.discussion_id).first()
            context = f"discussion '{discussion.title}'" if discussion else "a discussion"
            link = f"/discussions/{parent_comment.discussion_id}"
        else:
            context = "your comment"
            link = "/"

        title = "New reply to your comment"
        message = f"{actor.username} replied to your comment on {context}"

        return NotificationService.create_notification(
            db=db,
            user_id=parent_comment.author_id,
            notification_type=NotificationType.REPLY_TO_COMMENT,
            title=title,
            message=message,
            link=link,
            actor_id=actor.id,
            related_comment_id=reply_comment.id
        )

    @staticmethod
    def notify_material_rated(
        db: Session,
        material: Material,
        rating_value: int,
        actor: User
    ) -> Optional[Notification]:
        """
        Notify material uploader when someone rates their material.

        Args:
            db: Database session
            material: Material that was rated
            rating_value: Rating value (1-5)
            actor: User who rated the material

        Returns:
            Created Notification object if notification was sent
        """
        # Don't notify if rater is the uploader
        if material.uploader_id == actor.id:
            return None

        title = "New rating on your material"
        message = f"{actor.username} gave your material '{material.title}' {rating_value} stars"
        link = f"/materials/{material.id}"

        return NotificationService.create_notification(
            db=db,
            user_id=material.uploader_id,
            notification_type=NotificationType.MATERIAL_RATED,
            title=title,
            message=message,
            link=link,
            actor_id=actor.id,
            related_material_id=material.id
        )

    @staticmethod
    def get_user_notifications(
        db: Session,
        user_id: int,
        unread_only: bool = False,
        skip: int = 0,
        limit: int = 50
    ) -> tuple[List[Notification], int, int]:
        """
        Get notifications for a user with pagination.

        Args:
            db: Database session
            user_id: User ID
            unread_only: If True, only return unread notifications
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            Tuple of (notifications list, total count, unread count)
        """
        query = db.query(Notification).filter(Notification.user_id == user_id)

        # Get total and unread counts
        total_count = query.count()
        unread_count = query.filter(Notification.is_read == False).count()

        # Apply unread filter if requested
        if unread_only:
            query = query.filter(Notification.is_read == False)

        # Order by created_at descending (newest first)
        query = query.order_by(Notification.created_at.desc())

        # Apply pagination
        notifications = query.offset(skip).limit(limit).all()

        return notifications, total_count, unread_count

    @staticmethod
    def mark_as_read(db: Session, notification_id: int, user_id: int) -> Notification:
        """
        Mark a notification as read.

        Args:
            db: Database session
            notification_id: Notification ID
            user_id: User ID (for permission check)

        Returns:
            Updated Notification object

        Raises:
            HTTPException: If notification not found or user not authorized
        """
        from fastapi import HTTPException, status

        notification = db.query(Notification).filter(
            and_(
                Notification.id == notification_id,
                Notification.user_id == user_id
            )
        ).first()

        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )

        notification.is_read = True
        db.commit()
        db.refresh(notification)

        logger.info(f"Marked notification {notification_id} as read for user {user_id}")
        return notification

    @staticmethod
    def mark_all_as_read(db: Session, user_id: int) -> int:
        """
        Mark all notifications as read for a user.

        Args:
            db: Database session
            user_id: User ID

        Returns:
            Number of notifications marked as read
        """
        count = db.query(Notification).filter(
            and_(
                Notification.user_id == user_id,
                Notification.is_read == False
            )
        ).update({"is_read": True})

        db.commit()

        logger.info(f"Marked {count} notifications as read for user {user_id}")
        return count
