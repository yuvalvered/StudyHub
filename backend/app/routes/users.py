"""
User routes: profile management, statistics.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.user import UserProfile, UserUpdate, UserResponse, UserStats

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
    """
    # TODO: Implement profile update logic
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Profile update not yet implemented"
    )


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
