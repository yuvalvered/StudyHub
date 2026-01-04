"""
Notification model for user notifications.
Supports in-app and email notifications.
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.db.base import Base


class NotificationType(str, enum.Enum):
    """Types of notifications."""
    COMMENT_ON_MATERIAL = "comment_on_material"  # Someone commented on my material
    COMMENT_ON_DISCUSSION = "comment_on_discussion"  # Someone commented on my discussion
    REPLY_TO_COMMENT = "reply_to_comment"  # Someone replied to my comment
    MATERIAL_RATED = "material_rated"  # Someone rated my material (optional)


class Notification(Base):
    """User notifications."""
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Notification details
    type = Column(Enum(NotificationType, values_callable=lambda x: [e.value for e in x]), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    link = Column(String(500), nullable=True)  # URL to navigate to

    # Status
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    email_sent = Column(Boolean, default=False, nullable=False)  # Track if email was sent

    # References to related entities (optional, for better querying)
    related_comment_id = Column(Integer, ForeignKey("comments.id", ondelete="CASCADE"), nullable=True)
    related_material_id = Column(Integer, ForeignKey("materials.id", ondelete="CASCADE"), nullable=True)
    related_discussion_id = Column(Integer, ForeignKey("discussions.id", ondelete="CASCADE"), nullable=True)

    # Actor (who triggered the notification)
    actor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="notifications")
    actor = relationship("User", foreign_keys=[actor_id])
    related_comment = relationship("Comment", foreign_keys=[related_comment_id])
    related_material = relationship("Material", foreign_keys=[related_material_id])
    related_discussion = relationship("Discussion", foreign_keys=[related_discussion_id])

    def __repr__(self):
        return f"<Notification {self.type} for user {self.user_id}>"
