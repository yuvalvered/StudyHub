"""
User notification preferences/settings model.
Allows users to control which notifications they receive and where (in-app, email, both, or neither).
"""
from sqlalchemy import Column, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from app.db.base import Base


class NotificationSettings(Base):
    """User notification preferences."""
    __tablename__ = "notification_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    # Comment on material notifications
    comment_on_material_in_app = Column(Boolean, default=True, nullable=False)
    comment_on_material_email = Column(Boolean, default=True, nullable=False)

    # Comment on discussion notifications
    comment_on_discussion_in_app = Column(Boolean, default=True, nullable=False)
    comment_on_discussion_email = Column(Boolean, default=True, nullable=False)

    # Reply to comment notifications
    reply_to_comment_in_app = Column(Boolean, default=True, nullable=False)
    reply_to_comment_email = Column(Boolean, default=True, nullable=False)

    # Material rated notifications (optional feature)
    material_rated_in_app = Column(Boolean, default=True, nullable=False)
    material_rated_email = Column(Boolean, default=False, nullable=False)  # Off by default to avoid spam

    # Relationship
    user = relationship("User", back_populates="notification_settings")

    def __repr__(self):
        return f"<NotificationSettings for user {self.user_id}>"

    def should_send_in_app(self, notification_type: str) -> bool:
        """Check if in-app notification should be sent for this type."""
        mapping = {
            "comment_on_material": self.comment_on_material_in_app,
            "comment_on_discussion": self.comment_on_discussion_in_app,
            "reply_to_comment": self.reply_to_comment_in_app,
            "material_rated": self.material_rated_in_app,
        }
        return mapping.get(notification_type, False)

    def should_send_email(self, notification_type: str) -> bool:
        """Check if email notification should be sent for this type."""
        mapping = {
            "comment_on_material": self.comment_on_material_email,
            "comment_on_discussion": self.comment_on_discussion_email,
            "reply_to_comment": self.reply_to_comment_email,
            "material_rated": self.material_rated_email,
        }
        return mapping.get(notification_type, False)
