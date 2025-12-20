"""
Models package.
Import all models here for easier access.
"""
from app.models.user import User
from app.models.course import Course
from app.models.user_course import UserCourse
from app.models.material import Material, MaterialType
from app.models.rating import Rating
from app.models.discussion import Discussion
from app.models.comment import Comment
from app.models.comment_vote import CommentVote
from app.models.message import Message
from app.models.notification import Notification, NotificationType

__all__ = [
    "User",
    "Course",
    "UserCourse",
    "Material",
    "MaterialType",
    "Rating",
    "Discussion",
    "Comment",
    "CommentVote",
    "Message",
    "Notification",
    "NotificationType",
]
