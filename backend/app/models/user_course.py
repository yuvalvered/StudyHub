"""
User-Course enrollment association table.
Represents which users are enrolled in which courses.
"""
from sqlalchemy import Column, Integer, ForeignKey, DateTime, Table
from sqlalchemy.sql import func

from app.db.base import Base

# Association table for many-to-many relationship between Users and Courses
user_courses = Table(
    'user_courses',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    Column('course_id', Integer, ForeignKey('courses.id', ondelete='CASCADE'), primary_key=True),
    Column('enrolled_at', DateTime(timezone=True), server_default=func.now(), nullable=False)
)
