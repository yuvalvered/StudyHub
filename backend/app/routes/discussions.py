"""
API routes for Discussions/Forums.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.discussion import Discussion
from app.models.course import Course
from app.models.comment import Comment
from app.schemas.discussion import (
    DiscussionCreate,
    DiscussionUpdate,
    DiscussionResponse,
    DiscussionWithAuthor
)

router = APIRouter(tags=["Discussions"])


@router.post(
    "/courses/{course_id}/discussions",
    response_model=DiscussionWithAuthor,
    status_code=status.HTTP_201_CREATED
)
async def create_discussion(
    course_id: int,
    discussion_data: DiscussionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new discussion in a course.
    """
    # Verify course exists
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    # Create discussion
    new_discussion = Discussion(
        title=discussion_data.title,
        content=discussion_data.content,
        author_id=current_user.id,
        course_id=course_id
    )

    db.add(new_discussion)
    db.commit()
    db.refresh(new_discussion)

    # Build response with author info
    return {
        "id": new_discussion.id,
        "title": new_discussion.title,
        "content": new_discussion.content,
        "author_id": new_discussion.author_id,
        "course_id": new_discussion.course_id,
        "is_pinned": new_discussion.is_pinned,
        "is_locked": new_discussion.is_locked,
        "view_count": new_discussion.view_count,
        "vote_count": new_discussion.vote_count,
        "created_at": new_discussion.created_at,
        "updated_at": new_discussion.updated_at,
        "author_username": current_user.username,
        "author_full_name": current_user.full_name,
        "comment_count": 0
    }


@router.get(
    "/courses/{course_id}/discussions",
    response_model=List[DiscussionWithAuthor]
)
async def get_course_discussions(
    course_id: int,
    db: Session = Depends(get_db)
):
    """
    Get all discussions for a course.
    Returns discussions with author info and comment count.
    """
    # Verify course exists
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    # Get all discussions for the course with author info
    discussions = db.query(Discussion).filter(
        Discussion.course_id == course_id
    ).order_by(
        Discussion.is_pinned.desc(),  # Pinned discussions first
        Discussion.created_at.desc()   # Then by newest
    ).all()

    # Build response with author info and comment count
    result = []
    for discussion in discussions:
        # Get comment count
        comment_count = db.query(func.count(Comment.id)).filter(
            Comment.discussion_id == discussion.id
        ).scalar() or 0

        result.append({
            "id": discussion.id,
            "title": discussion.title,
            "content": discussion.content,
            "author_id": discussion.author_id,
            "course_id": discussion.course_id,
            "is_pinned": discussion.is_pinned,
            "is_locked": discussion.is_locked,
            "view_count": discussion.view_count,
            "vote_count": discussion.vote_count,
            "created_at": discussion.created_at,
            "updated_at": discussion.updated_at,
            "author_username": discussion.author.username,
            "author_full_name": discussion.author.full_name,
            "comment_count": comment_count
        })

    return result


@router.get(
    "/discussions/{discussion_id}",
    response_model=DiscussionWithAuthor
)
async def get_discussion(
    discussion_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a single discussion by ID.
    Increments view count.
    """
    discussion = db.query(Discussion).filter(Discussion.id == discussion_id).first()
    if not discussion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Discussion not found"
        )

    # Increment view count
    discussion.view_count += 1
    db.commit()
    db.refresh(discussion)

    # Get comment count
    comment_count = db.query(func.count(Comment.id)).filter(
        Comment.discussion_id == discussion.id
    ).scalar() or 0

    return {
        "id": discussion.id,
        "title": discussion.title,
        "content": discussion.content,
        "author_id": discussion.author_id,
        "course_id": discussion.course_id,
        "is_pinned": discussion.is_pinned,
        "is_locked": discussion.is_locked,
        "view_count": discussion.view_count,
        "vote_count": discussion.vote_count,
        "created_at": discussion.created_at,
        "updated_at": discussion.updated_at,
        "author_username": discussion.author.username,
        "author_full_name": discussion.author.full_name,
        "comment_count": comment_count
    }


@router.put(
    "/discussions/{discussion_id}",
    response_model=DiscussionResponse
)
async def update_discussion(
    discussion_id: int,
    discussion_data: DiscussionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a discussion.
    Only the author or admin can update.
    """
    discussion = db.query(Discussion).filter(Discussion.id == discussion_id).first()
    if not discussion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Discussion not found"
        )

    # Check permissions
    if discussion.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this discussion"
        )

    # Update fields
    if discussion_data.title is not None:
        discussion.title = discussion_data.title
    if discussion_data.content is not None:
        discussion.content = discussion_data.content

    db.commit()
    db.refresh(discussion)

    return discussion


@router.delete(
    "/discussions/{discussion_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
async def delete_discussion(
    discussion_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a discussion.
    Only the author or admin can delete.
    """
    discussion = db.query(Discussion).filter(Discussion.id == discussion_id).first()
    if not discussion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Discussion not found"
        )

    # Check permissions
    if discussion.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this discussion"
        )

    db.delete(discussion)
    db.commit()

    return None
