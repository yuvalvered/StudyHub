"""
Course service - handles course CRUD operations.
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional

from app.models.course import Course
from app.schemas.course import CourseCreate, CourseUpdate


class CourseService:
    """Service for handling course operations."""

    @staticmethod
    def create_course(db: Session, course_data: CourseCreate) -> Course:
        """
        Create a new course.

        Args:
            db: Database session
            course_data: Course creation data

        Returns:
            Created course object

        Raises:
            HTTPException: If course_number already exists
        """
        # Check if course_number already exists
        existing_course = db.query(Course).filter(
            Course.course_number == course_data.course_number
        ).first()

        if existing_course:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Course with number {course_data.course_number} already exists"
            )

        # Create new course
        new_course = Course(
            course_number=course_data.course_number,
            course_name=course_data.course_name,
            department=course_data.department,
            description=course_data.description
        )

        db.add(new_course)
        db.commit()
        db.refresh(new_course)

        return new_course

    @staticmethod
    def get_courses(
        db: Session,
        department: Optional[str] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Course]:
        """
        Get list of courses with optional filters.

        Args:
            db: Database session
            department: Filter by department
            search: Search in course_number, course_name
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of courses
        """
        query = db.query(Course)

        if department:
            query = query.filter(Course.department == department)

        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                (Course.course_number.ilike(search_pattern)) |
                (Course.course_name.ilike(search_pattern))
            )

        query = query.order_by(Course.course_number)
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def get_course_by_id(db: Session, course_id: int) -> Course:
        """
        Get a course by ID.

        Args:
            db: Database session
            course_id: Course ID

        Returns:
            Course object

        Raises:
            HTTPException: If course not found
        """
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Course with id {course_id} not found"
            )
        return course

    @staticmethod
    def get_course_by_number(db: Session, course_number: str) -> Course:
        """
        Get a course by course number.

        Args:
            db: Database session
            course_number: Course number

        Returns:
            Course object

        Raises:
            HTTPException: If course not found
        """
        course = db.query(Course).filter(Course.course_number == course_number).first()
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Course with number {course_number} not found"
            )
        return course

    @staticmethod
    def update_course(
        db: Session,
        course_id: int,
        course_update: CourseUpdate
    ) -> Course:
        """
        Update a course.

        Args:
            db: Database session
            course_id: Course ID
            course_update: Update data

        Returns:
            Updated course

        Raises:
            HTTPException: If course not found
        """
        course = CourseService.get_course_by_id(db, course_id)

        # Update fields
        if course_update.course_name is not None:
            course.course_name = course_update.course_name
        if course_update.department is not None:
            course.department = course_update.department
        if course_update.description is not None:
            course.description = course_update.description

        db.commit()
        db.refresh(course)

        return course

    @staticmethod
    def delete_course(db: Session, course_id: int):
        """
        Delete a course.

        Args:
            db: Database session
            course_id: Course ID

        Raises:
            HTTPException: If course not found
        """
        course = CourseService.get_course_by_id(db, course_id)

        db.delete(course)
        db.commit()
