"""
User routes: profile management, statistics.
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from pathlib import Path
import uuid
import shutil

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.user_course import UserCourse
from app.models.course import Course
from app.schemas.user import UserProfile, UserUpdate, UserResponse, UserStats
from app.schemas.user_course import UserCourseCreate, UserCourseResponse, UserCourseUpdate, UserCourseWithCourseInfo

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """
    Get current user's profile.
    """
    return current_user


@router.get("/me/stats", response_model=UserStats)
async def get_current_user_stats(current_user: User = Depends(get_current_user)):
    """
    Get current user's statistics.

    Returns:
    - **uploads_count**: Number of materials uploaded by the user
    - **downloads_received**: Total downloads of user's materials
    - **average_rating**: Average rating of user's materials
    """
    return {
        "uploads_count": current_user.uploads_count,
        "downloads_received": current_user.downloads_received,
        "average_rating": current_user.average_rating
    }


@router.put("/me", response_model=UserProfile)
async def update_current_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update current user's profile.

    Allowed fields to update:
    - **full_name**: User's full name
    - **year_in_degree**: Year in degree (1-4)
    - **department**: Department name (e.g., "Computer Science")
    - **department_number**: Department number
    - **bio**: User biography
    """
    # Update only fields that were provided (not None)
    update_data = user_update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)

    return current_user


@router.post("/me/profile-image", response_model=UserProfile)
async def upload_profile_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload or update user's profile image.

    Allowed formats: JPG, JPEG, PNG, GIF
    Maximum size: 5MB
    """
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/jpg"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed types: {', '.join(allowed_types)}"
        )

    # Validate file size (5MB max)
    file.file.seek(0, 2)  # Move to end of file
    file_size = file.file.tell()  # Get position (file size)
    file.file.seek(0)  # Reset to beginning

    max_size = 5 * 1024 * 1024  # 5MB in bytes
    if file_size > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size is 5MB. Your file is {file_size / (1024*1024):.2f}MB"
        )

    # Create uploads directory if it doesn't exist
    upload_dir = Path("uploads/profile_images")
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Generate unique filename
    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = upload_dir / unique_filename

    # Save file
    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )

    # Delete old profile image if exists
    if current_user.profile_image_url:
        old_image_path = Path(current_user.profile_image_url)
        if old_image_path.exists():
            try:
                old_image_path.unlink()
            except Exception:
                pass  # Ignore errors when deleting old image

    # Update user's profile_image_url
    current_user.profile_image_url = str(file_path)
    db.commit()
    db.refresh(current_user)

    return current_user


@router.delete("/me/profile-image", response_model=UserProfile)
async def delete_profile_image(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete user's profile image.
    """
    if not current_user.profile_image_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No profile image to delete"
        )

    # Delete file from filesystem
    image_path = Path(current_user.profile_image_url)
    if image_path.exists():
        try:
            image_path.unlink()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete file: {str(e)}"
            )

    # Remove from database
    current_user.profile_image_url = None
    db.commit()
    db.refresh(current_user)

    return current_user


@router.get("/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    Get user profile by ID (public information only).
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


# ============================================================================
# User Courses Endpoints (Stage 1)
# ============================================================================

@router.post("/me/courses", response_model=UserCourseResponse, status_code=status.HTTP_201_CREATED)
async def enroll_in_course(
    enrollment: UserCourseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Enroll current user in a course.

    The user can specify if they are looking for a study partner in this course.
    """
    from app.models.course import Course
    from app.models.user_course import UserCourse

    # Check if course exists
    course = db.query(Course).filter(Course.id == enrollment.course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course with id {enrollment.course_id} not found"
        )

    # Check if user is already enrolled
    existing_enrollment = db.query(UserCourse).filter(
        UserCourse.user_id == current_user.id,
        UserCourse.course_id == enrollment.course_id
    ).first()

    if existing_enrollment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You are already enrolled in course '{course.course_name}'"
        )

    # Create new enrollment
    new_enrollment = UserCourse(
        user_id=current_user.id,
        course_id=enrollment.course_id,
        looking_for_study_partner=enrollment.looking_for_study_partner
    )

    db.add(new_enrollment)
    db.commit()
    db.refresh(new_enrollment)

    return new_enrollment


@router.get("/me/courses", response_model=List[UserCourseWithCourseInfo])
async def get_my_courses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all courses the current user is enrolled in.

    Returns a list of courses with enrollment details including whether
    the user is looking for a study partner in each course.
    """
    from app.models.user_course import UserCourse
    from app.models.course import Course

    # Query enrollments with course details
    enrollments = db.query(
        UserCourse.id,
        UserCourse.course_id,
        Course.course_number,
        Course.course_name,
        UserCourse.looking_for_study_partner,
        UserCourse.enrolled_at
    ).join(
        Course, UserCourse.course_id == Course.id
    ).filter(
        UserCourse.user_id == current_user.id
    ).all()

    # Convert to list of dicts
    result = [
        {
            "id": enrollment.id,
            "course_id": enrollment.course_id,
            "course_number": enrollment.course_number,
            "course_name": enrollment.course_name,
            "looking_for_study_partner": enrollment.looking_for_study_partner,
            "enrolled_at": enrollment.enrolled_at
        }
        for enrollment in enrollments
    ]

    return result


@router.put("/me/courses/{course_id}", response_model=UserCourseResponse)
async def update_course_enrollment(
    course_id: int,
    update: UserCourseUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update enrollment settings for a specific course.

    Currently supports updating:
    - **looking_for_study_partner**: Toggle whether looking for study partner
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Update course enrollment not yet implemented"
    )


@router.delete("/me/courses/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unenroll_from_course(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Unenroll (remove) current user from a course.
    """
    from app.models.user_course import UserCourse

    # Find the enrollment
    enrollment = db.query(UserCourse).filter(
        UserCourse.user_id == current_user.id,
        UserCourse.course_id == course_id
    ).first()

    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"You are not enrolled in course with id {course_id}"
        )

    # Delete the enrollment
    db.delete(enrollment)
    db.commit()

    return None  # 204 No Content
