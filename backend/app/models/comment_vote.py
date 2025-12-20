"""
CommentVote model for tracking user votes on comments.
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.base import Base


class CommentVote(Base):
    __tablename__ = "comment_votes"

    id = Column(Integer, primary_key=True, index=True)
    vote_type = Column(String(10), nullable=False)  # 'upvote' or 'downvote'

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    comment_id = Column(Integer, ForeignKey("comments.id"), nullable=False)

    # Relationships
    user = relationship("User")
    comment = relationship("Comment")

    # Unique constraint - each user can vote only once per comment
    __table_args__ = (
        UniqueConstraint('user_id', 'comment_id', name='unique_user_comment_vote'),
    )

    def __repr__(self):
        return f"<CommentVote {self.vote_type} by User {self.user_id} on Comment {self.comment_id}>"
