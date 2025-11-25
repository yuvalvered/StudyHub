"""
Course model for organizing materials by academic courses.
"""
from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.base import Base


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    course_number = Column(String(20), unique=True, index=True, nullable=False)
    course_name = Column(String(200), nullable=False)
    department = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)

    # Relationships
    materials = relationship("Material", back_populates="course", cascade="all, delete-orphan")
    discussions = relationship("Discussion", back_populates="course", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Course {self.course_number}: {self.course_name}>"
