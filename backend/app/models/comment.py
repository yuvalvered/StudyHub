"""
Comment model for replies to discussions.
"""
from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.base import Base


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)

    # Voting
    upvotes = Column(Integer, default=0, nullable=False)
    downvotes = Column(Integer, default=0, nullable=False)

    # Nested comments support
    parent_comment_id = Column(Integer, ForeignKey("comments.id"), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Foreign Keys
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    discussion_id = Column(Integer, ForeignKey("discussions.id"), nullable=False)

    # Relationships
    author = relationship("User", back_populates="comments")
    discussion = relationship("Discussion", back_populates="comments")
    parent_comment = relationship("Comment", remote_side=[id], backref="replies")

    def __repr__(self):
        return f"<Comment by User {self.author_id}>"
