"""
Database initialization utilities.
"""
from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.models.user import User


def init_db(db: Session) -> None:
    """
    Initialize database with default data.
    This can be called from a script or on first startup.
    """
    # Check if we already have users
    user = db.query(User).first()
    if not user:
        # Create a default admin user
        admin_user = User(
            username="admin",
            email="admin@studyhub.com",
            hashed_password=get_password_hash("admin123"),
            full_name="Admin User",
            is_active=True,
            is_admin=True
        )
        db.add(admin_user)
        db.commit()
        print("Created default admin user: admin / admin123")
