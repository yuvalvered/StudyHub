"""
Course routes: CRUD operations for courses.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.course import CourseCreate, CourseResponse, CourseUpdate
from app.services.course_service import CourseService

router = APIRouter(prefix="/courses", tags=["Courses"])


@router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    course: CourseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new course (admin only would be ideal, but for now any authenticated user).

    - **course_number**: Unique course number (e.g., "CS101")
    - **course_name**: Course name
    - **department**: Department (optional)
    - **description**: Course description (optional)
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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a course (admin only would be ideal).
    """
    return CourseService.update_course(db, course_id, course_update)


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a course (admin only would be ideal).

    Note: This will also delete all related materials and discussions.
    """
    CourseService.delete_course(db, course_id)


# ============================================================================
# Study Partners Endpoints (Stage 2)
# ============================================================================

@router.get("/{course_id}/study-partners")
async def get_study_partners(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get list of users looking for study partners in this course.

    Returns users who are enrolled in the course and have
    `looking_for_study_partner` set to True.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Study partners search not yet implemented"
    )


# ============================================================================
# Course Materials Endpoints (Stage 3)
# ============================================================================

@router.post("/{course_id}/materials")
async def upload_material(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a study material (file) to a course.

    Supports: PDF, DOCX, PPTX files
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Material upload not yet implemented"
    )


@router.get("/{course_id}/materials")
async def get_course_materials(
    course_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Get all study materials for a specific course.

    Returns list of materials with ratings and download counts.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Get course materials not yet implemented"
    )


# ============================================================================
# Course Discussions Endpoints (Stage 4)
# ============================================================================

@router.post("/{course_id}/discussions")
async def create_discussion(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new discussion/question in the course forum.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Create discussion not yet implemented"
    )


@router.get("/{course_id}/discussions")
async def get_course_discussions(
    course_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Get all discussions/questions for a specific course.

    Returns list of discussions with comment counts.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Get course discussions not yet implemented"
    )
