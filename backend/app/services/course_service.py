"""
Course service - handles course CRUD operations.
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from typing import List, Optional, Dict, Any

from app.models.course import Course
from app.models.user import User
from app.models.material import Material
from app.models.discussion import Discussion
from app.models.user_course import user_courses
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

    @staticmethod
    def enroll_user_in_course(db: Session, course_id: int, user_id: int) -> Dict[str, Any]:
        """
        Enroll a user in a course.

        Args:
            db: Database session
            course_id: Course ID
            user_id: User ID

        Returns:
            Dictionary with enrollment status

        Raises:
            HTTPException: If course not found or user already enrolled
        """
        course = CourseService.get_course_by_id(db, course_id)
        user = db.query(User).filter(User.id == user_id).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with id {user_id} not found"
            )

        # Check if already enrolled
        existing_enrollment = db.execute(
            user_courses.select().where(
                (user_courses.c.user_id == user_id) &
                (user_courses.c.course_id == course_id)
            )
        ).first()

        if existing_enrollment:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User already enrolled in course {course.course_name}"
            )

        # Add enrollment
        db.execute(
            user_courses.insert().values(user_id=user_id, course_id=course_id)
        )
        db.commit()

        return {
            "message": f"Successfully enrolled in {course.course_name}",
            "course_id": course_id,
            "user_id": user_id,
            "enrolled": True
        }

    @staticmethod
    def unenroll_user_from_course(db: Session, course_id: int, user_id: int) -> Dict[str, Any]:
        """
        Unenroll a user from a course.

        Args:
            db: Database session
            course_id: Course ID
            user_id: User ID

        Returns:
            Dictionary with unenrollment status

        Raises:
            HTTPException: If course not found or user not enrolled
        """
        course = CourseService.get_course_by_id(db, course_id)

        # Check if enrolled
        existing_enrollment = db.execute(
            user_courses.select().where(
                (user_courses.c.user_id == user_id) &
                (user_courses.c.course_id == course_id)
            )
        ).first()

        if not existing_enrollment:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User is not enrolled in course {course.course_name}"
            )

        # Remove enrollment
        db.execute(
            user_courses.delete().where(
                (user_courses.c.user_id == user_id) &
                (user_courses.c.course_id == course_id)
            )
        )
        db.commit()

        return {
            "message": f"Successfully unenrolled from {course.course_name}",
            "course_id": course_id,
            "user_id": user_id,
            "enrolled": False
        }

    @staticmethod
    def get_enrolled_users(db: Session, course_id: int, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get list of users enrolled in a course.

        Args:
            db: Database session
            course_id: Course ID
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of enrolled users with enrollment info

        Raises:
            HTTPException: If course not found
        """
        course = CourseService.get_course_by_id(db, course_id)

        # Query enrolled users with enrollment date
        enrolled = db.query(
            User.id.label('user_id'),
            User.username,
            User.full_name,
            User.profile_image_url,
            user_courses.c.enrolled_at
        ).join(
            user_courses, User.id == user_courses.c.user_id
        ).filter(
            user_courses.c.course_id == course_id
        ).offset(skip).limit(limit).all()

        return [
            {
                "user_id": e.user_id,
                "username": e.username,
                "full_name": e.full_name,
                "profile_image_url": e.profile_image_url,
                "enrolled_at": e.enrolled_at
            }
            for e in enrolled
        ]

    @staticmethod
    def get_course_statistics(db: Session, course_id: int) -> Dict[str, Any]:
        """
        Get statistics for a course.

        Args:
            db: Database session
            course_id: Course ID

        Returns:
            Dictionary with course statistics

        Raises:
            HTTPException: If course not found
        """
        course = CourseService.get_course_by_id(db, course_id)

        # Count materials
        materials_count = db.query(func.count(Material.id)).filter(
            Material.course_id == course_id
        ).scalar()

        # Count discussions
        discussions_count = db.query(func.count(Discussion.id)).filter(
            Discussion.course_id == course_id
        ).scalar()

        # Count enrolled users
        enrolled_count = db.query(func.count(user_courses.c.user_id)).filter(
            user_courses.c.course_id == course_id
        ).scalar()

        return {
            "id": course.id,
            "course_number": course.course_number,
            "course_name": course.course_name,
            "department": course.department,
            "description": course.description,
            "materials_count": materials_count or 0,
            "discussions_count": discussions_count or 0,
            "enrolled_users_count": enrolled_count or 0
        }

    @staticmethod
    def get_user_courses(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Course]:
        """
        Get all courses a user is enrolled in.

        Args:
            db: Database session
            user_id: User ID
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of courses the user is enrolled in
        """
        courses = db.query(Course).join(
            user_courses, Course.id == user_courses.c.course_id
        ).filter(
            user_courses.c.user_id == user_id
        ).order_by(Course.course_name).offset(skip).limit(limit).all()

        return courses

    @staticmethod
    def is_user_enrolled(db: Session, course_id: int, user_id: int) -> bool:
        """
        Check if a user is enrolled in a course.

        Args:
            db: Database session
            course_id: Course ID
            user_id: User ID

        Returns:
            True if user is enrolled, False otherwise
        """
        enrollment = db.execute(
            user_courses.select().where(
                (user_courses.c.user_id == user_id) &
                (user_courses.c.course_id == course_id)
            )
        ).first()

        return enrollment is not None
