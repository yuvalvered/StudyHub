"""
Material model for study materials (files, summaries, exams).
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.db.base import Base


class MaterialType(str, enum.Enum):
    """Types of materials that can be uploaded."""
    SUMMARY = "summary"
    EXAM = "exam"
    SLIDES = "slides"
    NOTES = "notes"
    LINK = "link"
    OTHER = "other"


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

    # External link (if material_type is LINK)
    external_url = Column(String(500), nullable=True)

    # Metadata
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

    def __repr__(self):
        return f"<Material {self.title}>"
