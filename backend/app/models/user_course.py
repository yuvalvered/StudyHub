"""
UserCourse association model - represents a user's enrollment in a course.
This allows tracking which courses a user is taking and if they're looking for study partners.
"""
from sqlalchemy import Column, Integer, ForeignKey, Boolean, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.base import Base


class UserCourse(Base):
    """Association table between users and courses with additional metadata."""
    __tablename__ = "user_courses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)

    # Additional fields for this specific user-course relationship
    looking_for_study_partner = Column(Boolean, default=False, nullable=False)
    enrolled_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="enrolled_courses")
    course = relationship("Course", back_populates="enrolled_users")

    def __repr__(self):
        return f"<UserCourse user_id={self.user_id} course_id={self.course_id}>"
