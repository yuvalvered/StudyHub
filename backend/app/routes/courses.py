"""
Course routes: CRUD operations for courses.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.dependencies import get_db, get_current_user, get_current_admin_user
from app.models.user import User
from app.schemas.course import (
    CourseCreate,
    CourseResponse,
    CourseUpdate,
    CourseWithStats,
    EnrolledUserInfo,
    CourseEnrollmentResponse
)
from app.schemas.material import MaterialResponse
from app.schemas.discussion import DiscussionResponse
from app.services.course_service import CourseService
from app.models.material import Material
from app.models.discussion import Discussion

router = APIRouter(prefix="/courses", tags=["Courses"])


@router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    course: CourseCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Create a new course (admin only).

    - **course_number**: Unique course number (e.g., "CS101")
    - **course_name**: Course name
    - **department**: Department (optional)
    - **description**: Course description (optional)

    **Note:** This endpoint requires admin privileges.
    """
    return CourseService.create_course(db, course)


@router.get("", response_model=List[CourseResponse])
async def get_courses(
    department: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get list of courses with optional filters.

    - **department**: Filter by department
    - **search**: Search in course number or name
    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum number of records to return
    """
    return CourseService.get_courses(db, department, search, skip, limit)


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(
    course_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific course by ID.
    """
    return CourseService.get_course_by_id(db, course_id)


@router.get("/number/{course_number}", response_model=CourseResponse)
async def get_course_by_number(
    course_number: str,
    db: Session = Depends(get_db)
):
    """
    Get a course by course number (e.g., "CS101").
    """
    return CourseService.get_course_by_number(db, course_number)


@router.put("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: int,
    course_update: CourseUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Update a course (admin only).

    **Note:** This endpoint requires admin privileges.
    """
    return CourseService.update_course(db, course_id, course_update)


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Delete a course (admin only).

    **Note:** This will also delete all related materials and discussions.

    **Note:** This endpoint requires admin privileges.
    """
    CourseService.delete_course(db, course_id)


# Enrollment endpoints

@router.post("/{course_id}/enroll", response_model=CourseEnrollmentResponse)
async def enroll_in_course(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Enroll the current user in a course.

    - **course_id**: ID of the course to enroll in
    """
    return CourseService.enroll_user_in_course(db, course_id, current_user.id)


@router.delete("/{course_id}/enroll", response_model=CourseEnrollmentResponse)
async def unenroll_from_course(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Unenroll the current user from a course.

    - **course_id**: ID of the course to unenroll from
    """
    return CourseService.unenroll_user_from_course(db, course_id, current_user.id)


@router.get("/{course_id}/enrolled-users", response_model=List[EnrolledUserInfo])
async def get_enrolled_users(
    course_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get list of users enrolled in a course.

    - **course_id**: Course ID
    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum number of records to return
    """
    return CourseService.get_enrolled_users(db, course_id, skip, limit)


@router.get("/{course_id}/is-enrolled")
async def check_enrollment(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Check if the current user is enrolled in a course.

    - **course_id**: Course ID
    """
    is_enrolled = CourseService.is_user_enrolled(db, course_id, current_user.id)
    return {
        "course_id": course_id,
        "user_id": current_user.id,
        "is_enrolled": is_enrolled
    }


# Statistics endpoints

@router.get("/{course_id}/statistics", response_model=CourseWithStats)
async def get_course_statistics(
    course_id: int,
    db: Session = Depends(get_db)
):
    """
    Get detailed statistics for a course.

    - **course_id**: Course ID

    Returns course information with:
    - Number of materials
    - Number of discussions
    - Number of enrolled users
    """
    return CourseService.get_course_statistics(db, course_id)


# User's courses endpoint

@router.get("/user/my-courses", response_model=List[CourseResponse])
async def get_my_courses(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all courses the current user is enrolled in.

    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum number of records to return
    """
    return CourseService.get_user_courses(db, current_user.id, skip, limit)


# Course content endpoints

@router.get("/{course_id}/materials", response_model=List[MaterialResponse])
async def get_course_materials(
    course_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get all materials for a specific course.

    - **course_id**: Course ID
    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum number of records to return
    """
    # Verify course exists
    CourseService.get_course_by_id(db, course_id)

    # Get materials
    materials = db.query(Material).filter(
        Material.course_id == course_id
    ).order_by(Material.created_at.desc()).offset(skip).limit(limit).all()

    return materials


@router.get("/{course_id}/discussions", response_model=List[DiscussionResponse])
async def get_course_discussions(
    course_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get all discussions for a specific course.

    - **course_id**: Course ID
    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum number of records to return
    """
    # Verify course exists
    CourseService.get_course_by_id(db, course_id)

    # Get discussions
    discussions = db.query(Discussion).filter(
        Discussion.course_id == course_id
    ).order_by(Discussion.created_at.desc()).offset(skip).limit(limit).all()

    return discussions
