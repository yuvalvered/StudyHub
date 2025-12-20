"""
Comment routes for discussion comments.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.comment import Comment
from app.models.discussion import Discussion
from app.models.comment_vote import CommentVote as CommentVoteModel
from app.schemas.comment import (
    CommentCreate,
    CommentResponse,
    CommentWithAuthor,
    CommentWithReplies,
    CommentVote
)

router = APIRouter(tags=["Comments"])


@router.post("/discussions/{discussion_id}/comments", response_model=CommentWithAuthor, status_code=status.HTTP_201_CREATED)
async def create_comment(
    discussion_id: int,
    comment_data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new comment on a discussion.
    Supports nested comments (replies) via parent_comment_id.
    """
    # Check if discussion exists
    discussion = db.query(Discussion).filter(Discussion.id == discussion_id).first()
    if not discussion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Discussion not found"
        )

    # If replying to a comment, check parent exists
    if comment_data.parent_comment_id:
        parent = db.query(Comment).filter(Comment.id == comment_data.parent_comment_id).first()
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent comment not found"
            )
        # Ensure parent is on the same discussion
        if parent.discussion_id != discussion_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parent comment is not on this discussion"
            )

    # Create comment
    new_comment = Comment(
        content=comment_data.content,
        author_id=current_user.id,
        discussion_id=discussion_id,
        parent_comment_id=comment_data.parent_comment_id
    )

    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    # Return with author info
    return _comment_with_author(db, new_comment)


@router.get("/discussions/{discussion_id}/comments", response_model=List[CommentWithReplies])
async def get_discussion_comments(
    discussion_id: int,
    db: Session = Depends(get_db)
):
    """
    Get all comments for a discussion.
    Returns top-level comments with nested replies.
    """
    # Check if discussion exists
    discussion = db.query(Discussion).filter(Discussion.id == discussion_id).first()
    if not discussion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Discussion not found"
        )

    # Get all top-level comments (no parent)
    top_level_comments = db.query(Comment).filter(
        Comment.discussion_id == discussion_id,
        Comment.parent_comment_id == None
    ).order_by(Comment.created_at.desc()).all()

    # Build nested structure
    result = []
    for comment in top_level_comments:
        result.append(_build_comment_tree(db, comment))

    return result


@router.post("/comments/{comment_id}/vote", response_model=CommentWithAuthor)
async def vote_comment(
    comment_id: int,
    vote_data: CommentVote,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Vote on a comment (upvote or downvote).
    Each user can vote only once per comment.
    If user changes their vote, it updates the existing vote.
    """
    # Validate vote type
    if vote_data.vote_type not in ["upvote", "downvote"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid vote type. Use 'upvote' or 'downvote'"
        )

    # Find comment
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )

    # Check if user already voted
    existing_vote = db.query(CommentVoteModel).filter(
        CommentVoteModel.user_id == current_user.id,
        CommentVoteModel.comment_id == comment_id
    ).first()

    if existing_vote:
        # User already voted - update their vote if different
        if existing_vote.vote_type != vote_data.vote_type:
            # Remove old vote count
            if existing_vote.vote_type == "upvote":
                comment.upvotes -= 1
            else:
                comment.downvotes -= 1

            # Add new vote count
            if vote_data.vote_type == "upvote":
                comment.upvotes += 1
            else:
                comment.downvotes += 1

            # Update vote type
            existing_vote.vote_type = vote_data.vote_type
        # If same vote type, do nothing (vote already recorded)
    else:
        # Create new vote
        new_vote = CommentVoteModel(
            user_id=current_user.id,
            comment_id=comment_id,
            vote_type=vote_data.vote_type
        )
        db.add(new_vote)

        # Update comment counts
        if vote_data.vote_type == "upvote":
            comment.upvotes += 1
        else:
            comment.downvotes += 1

    db.commit()
    db.refresh(comment)

    return _comment_with_author(db, comment)


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a comment.
    Only the author can delete their own comment.
    """
    # Find comment
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )

    # Check ownership
    if comment.author_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own comments"
        )

    db.delete(comment)
    db.commit()

    return None


# Helper functions

def _comment_with_author(db: Session, comment: Comment) -> dict:
    """Helper to get comment with author info."""
    from app.models.user import User
    author = db.query(User).filter(User.id == comment.author_id).first()

    return {
        'id': comment.id,
        'content': comment.content,
        'author_id': comment.author_id,
        'discussion_id': comment.discussion_id,
        'parent_comment_id': comment.parent_comment_id,
        'upvotes': comment.upvotes,
        'downvotes': comment.downvotes,
        'created_at': comment.created_at,
        'updated_at': comment.updated_at,
        'author_username': author.username if author else None,
        'author_full_name': author.full_name if author else None,
        'author_profile_image': author.profile_image_url if author else None
    }


def _build_comment_tree(db: Session, comment: Comment) -> dict:
    """Recursively build comment tree with replies."""
    # Get comment with author
    comment_dict = _comment_with_author(db, comment)

    # Get all replies to this comment
    replies = db.query(Comment).filter(
        Comment.parent_comment_id == comment.id
    ).order_by(Comment.created_at.asc()).all()

    # Recursively build tree
    comment_dict['replies'] = [_build_comment_tree(db, reply) for reply in replies]

    return comment_dict
