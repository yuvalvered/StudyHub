"""
Course routes: CRUD operations for courses.
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.course import CourseCreate, CourseResponse, CourseUpdate
from app.schemas.material import MaterialCreate, MaterialResponse
from app.services.course_service import CourseService
from app.services.material_service import MaterialService

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
    from app.models.course import Course
    from app.models.user_course import UserCourse

    # Verify course exists
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course with id {course_id} not found"
        )

    # Get all users looking for study partners in this course
    study_partners = db.query(
        User.id,
        User.username,
        User.full_name,
        User.department,
        User.year_in_degree,
        User.profile_image_url,
        UserCourse.enrolled_at
    ).join(
        UserCourse, User.id == UserCourse.user_id
    ).filter(
        UserCourse.course_id == course_id,
        UserCourse.looking_for_study_partner == True,
        User.id != current_user.id  # Exclude current user
    ).all()

    # Convert to list of dicts
    result = [
        {
            "id": partner.id,
            "username": partner.username,
            "full_name": partner.full_name,
            "department": partner.department,
            "year_in_degree": partner.year_in_degree,
            "profile_image_url": partner.profile_image_url,
            "enrolled_at": partner.enrolled_at
        }
        for partner in study_partners
    ]

    return result


# ============================================================================
# Course Materials Endpoints (Stage 3)
# ============================================================================

@router.post("/{course_id}/materials", response_model=MaterialResponse, status_code=status.HTTP_201_CREATED)
async def upload_material(
    course_id: int,
    title: str = Form(...),
    description: Optional[str] = Form(None),
    material_type: str = Form(...),
    external_link: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a study material (file) to a course.

    Supports: PDF, DOCX, PPTX files and external links
    """
    from app.models.course import Course

    # Check if course exists
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course with id {course_id} not found"
        )

    # Create MaterialCreate object
    material_data = MaterialCreate(
        title=title,
        description=description,
        course_id=course_id,
        material_type=material_type,
        external_link=external_link
    )

    # Handle file upload if provided
    if file:
        file_path, file_name, file_size = await MaterialService.save_file(file)
        new_material = MaterialService.create_material(db, material_data, current_user, file)
        # Update file info after creation
        new_material.file_path = file_path
        new_material.file_size = file_size
        db.commit()
        db.refresh(new_material)
        return new_material
    else:
        return MaterialService.create_material(db, material_data, current_user, None)


@router.get("/{course_id}/materials")
async def get_course_materials(
    course_id: int,
    material_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Get all study materials for a specific course.

    Optionally filter by material_type.
    Returns list of materials with ratings and download counts.
    """
    from app.models.course import Course

    # Check if course exists
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course with id {course_id} not found"
        )

    # Get materials using the service
    materials = MaterialService.get_materials(
        db=db,
        course_id=course_id,
        material_type=material_type,
        skip=skip,
        limit=limit
    )

    return materials


@router.delete("/{course_id}/materials/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_material(
    course_id: int,
    material_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a material from a course.

    Only the uploader or admin can delete the material.
    Also verifies the material belongs to the specified course.
    """
    from app.models.material import Material

    # First, verify the material exists and belongs to this course
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Material with id {material_id} not found"
        )

    # Verify material belongs to this course
    if material.course_id != course_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Material {material_id} does not belong to course {course_id}"
        )

    # Use the service to delete (it checks permissions internally)
    MaterialService.delete_material(db, material_id, current_user)

    return None  # 204 No Content


# ============================================================================
# Course Discussions Endpoints (Stage 4)
# ============================================================================
# Discussions endpoints have been moved to app/routes/discussions.py
