"""
Discussion/Forum model for community discussions.
Supports two types of discussions:
1. General course discussions (course_id set, material_id NULL)
2. Material-specific discussions (material_id set, course_id NULL)
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, CheckConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.base import Base


class Discussion(Base):
    __tablename__ = "discussions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    content = Column(Text, nullable=False)

    # Status
    is_pinned = Column(Boolean, default=False, nullable=False)
    is_locked = Column(Boolean, default=False, nullable=False)

    # Metadata
    view_count = Column(Integer, default=0, nullable=False)
    vote_count = Column(Integer, default=0, nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Foreign Keys
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=True)

    # Relationships
    author = relationship("User", back_populates="discussions")
    course = relationship("Course", back_populates="discussions")
    material = relationship("Material", back_populates="discussion")
    comments = relationship("Comment", back_populates="discussion", cascade="all, delete-orphan")

    # Table constraints
    __table_args__ = (
        CheckConstraint(
            '(course_id IS NOT NULL AND material_id IS NULL) OR '
            '(course_id IS NULL AND material_id IS NOT NULL)',
            name='discussion_type_check'
        ),
    )

    def __repr__(self):
        return f"<Discussion {self.title}>"
