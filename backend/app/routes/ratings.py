"""
Rating routes for rating and reviewing materials.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.rating import Rating
from app.models.material import Material
from app.schemas.rating import RatingCreate, RatingResponse, RatingWithUser, RatingUpdate
from app.services.notification_service import NotificationService
from sqlalchemy import func

router = APIRouter(prefix="/materials", tags=["ratings"])


@router.post("/{material_id}/rate", response_model=RatingResponse, status_code=status.HTTP_201_CREATED)
async def rate_material(
    material_id: int,
    rating_data: RatingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Rate a material (1-5 stars) with optional comment.

    Business rules:
    - User cannot rate their own material
    - User can only rate each material once
    - Rating must be between 1-5
    """
    # Check if material exists
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material not found"
        )

    # Prevent self-rating
    if material.uploader_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot rate your own material"
        )

    # Check if user already rated this material
    existing_rating = db.query(Rating).filter(
        Rating.user_id == current_user.id,
        Rating.material_id == material_id
    ).first()

    if existing_rating:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already rated this material. Use PUT to update your rating."
        )

    # Create new rating
    new_rating = Rating(
        rating=rating_data.rating,
        comment=rating_data.comment,
        user_id=current_user.id,
        material_id=material_id
    )

    db.add(new_rating)
    db.commit()
    db.refresh(new_rating)

    # Update material's average rating
    _update_material_rating(db, material_id)

    # Trigger notification for material rating
    NotificationService.notify_material_rated(
        db=db,
        material=material,
        rating_value=rating_data.rating,
        actor=current_user
    )

    return new_rating


@router.get("/{material_id}/ratings", response_model=List[RatingWithUser])
async def get_material_ratings(
    material_id: int,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """
    Get all ratings for a specific material.
    Returns ratings with user information.
    """
    # Check if material exists
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material not found"
        )

    # Get ratings with user info
    ratings = db.query(
        Rating.id,
        Rating.rating,
        Rating.comment,
        Rating.user_id,
        Rating.material_id,
        Rating.created_at,
        Rating.updated_at,
        User.username.label('user_username'),
        User.full_name.label('user_full_name')
    ).join(
        User, Rating.user_id == User.id
    ).filter(
        Rating.material_id == material_id
    ).order_by(
        Rating.created_at.desc()
    ).offset(skip).limit(limit).all()

    # Convert to dict format for RatingWithUser schema
    result = []
    for r in ratings:
        result.append({
            'id': r.id,
            'rating': r.rating,
            'comment': r.comment,
            'user_id': r.user_id,
            'material_id': r.material_id,
            'created_at': r.created_at,
            'updated_at': r.updated_at,
            'user_username': r.user_username,
            'user_full_name': r.user_full_name
        })

    return result


@router.put("/{material_id}/rate", response_model=RatingResponse)
async def update_rating(
    material_id: int,
    rating_data: RatingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update an existing rating for a material.
    User can only update their own rating.
    """
    # Find the user's rating for this material
    existing_rating = db.query(Rating).filter(
        Rating.user_id == current_user.id,
        Rating.material_id == material_id
    ).first()

    if not existing_rating:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You haven't rated this material yet. Use POST to create a rating."
        )

    # Update rating fields
    if rating_data.rating is not None:
        existing_rating.rating = rating_data.rating
    if rating_data.comment is not None:
        existing_rating.comment = rating_data.comment

    db.commit()
    db.refresh(existing_rating)

    # Update material's average rating
    _update_material_rating(db, material_id)

    return existing_rating


@router.delete("/{material_id}/rate", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rating(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a rating for a material.
    User can only delete their own rating.
    """
    # Find the user's rating for this material
    existing_rating = db.query(Rating).filter(
        Rating.user_id == current_user.id,
        Rating.material_id == material_id
    ).first()

    if not existing_rating:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rating not found"
        )

    db.delete(existing_rating)
    db.commit()

    # Update material's average rating
    _update_material_rating(db, material_id)

    return None


def _update_material_rating(db: Session, material_id: int):
    """
    Helper function to recalculate and update material's average rating.
    """
    # Calculate average rating and count
    result = db.query(
        func.avg(Rating.rating).label('avg_rating'),
        func.count(Rating.id).label('rating_count')
    ).filter(
        Rating.material_id == material_id
    ).first()

    # Update material
    material = db.query(Material).filter(Material.id == material_id).first()
    if material:
        material.average_rating = float(result.avg_rating or 0)
        material.rating_count = result.rating_count or 0
        db.commit()
