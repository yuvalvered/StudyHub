"""
Material model for study materials (files, summaries, exams).
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, Float, Boolean, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.db.base import Base


class MaterialType(str, enum.Enum):
    """Types of materials that can be uploaded."""
    summaries = "summaries"  # סיכומים
    homework = "homework"  # תרגילי בית
    lectures = "lectures"  # הרצאות
    exercises = "exercises"  # תרגולים
    exam_prep = "exam_prep"  # הכנה למבחן
    quiz_prep = "quiz_prep"  # הכנה לבוחן
    quizme = "quizme"  # quizme


class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    material_type = Column(Enum(MaterialType), nullable=False)

    # File information
    file_path = Column(String(500), nullable=True)  # S3 URL or local path
    file_name = Column(String(255), nullable=True)
    file_size = Column(Integer, nullable=True)  # in bytes
    file_extension = Column(String(10), nullable=True)
    file_content_text = Column(Text, nullable=True)  # Extracted text from PDF for search

    # External link (if material_type is LINK)
    external_url = Column(String(500), nullable=True)

    # AI-extracted metadata
    page_count = Column(Integer, nullable=True)  # Number of pages in the document
    topics = Column(JSON, nullable=True)  # List of topics ["topic1", "topic2", ...]
    ai_processed = Column(Boolean, default=False, nullable=False)  # Whether AI processed this material

    # Metadata
    view_count = Column(Integer, default=0, nullable=False)
    download_count = Column(Integer, default=0, nullable=False)
    average_rating = Column(Float, default=0.0, nullable=False)
    rating_count = Column(Integer, default=0, nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Foreign Keys
    uploader_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)

    # Relationships
    uploader = relationship("User", back_populates="materials")
    course = relationship("Course", back_populates="materials")
    ratings = relationship("Rating", back_populates="material", cascade="all, delete-orphan")
    user_reports = relationship("MaterialReport", back_populates="material", cascade="all, delete-orphan")
    discussion = relationship("Discussion", back_populates="material", uselist=False, cascade="all, delete-orphan")

    @property
    def reports_count(self) -> int:
        """Get the number of reports for this material."""
        return len(self.user_reports)

    def __repr__(self):
        return f"<Material {self.title}>"
