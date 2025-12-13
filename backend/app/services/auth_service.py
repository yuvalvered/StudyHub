"""
Authentication service - handles user registration, login, and password management.
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import datetime, timezone

from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    create_email_verification_token,
    get_email_verification_token_expiry,
    create_password_reset_token,
    get_password_reset_token_expiry
)
from app.services.email_service import EmailService


class AuthService:
    """Service for handling authentication operations."""

    @staticmethod
    def register_user(db: Session, user_data: UserCreate) -> User:
        """
        Register a new user.

        Args:
            db: Database session
            user_data: User registration data

        Returns:
            Created user object

        Raises:
            HTTPException: If username or email already exists
        """
        # Check if username already exists
        existing_user = db.query(User).filter(User.username == user_data.username).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )

        # Check if email already exists
        existing_email = db.query(User).filter(User.email == user_data.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Create email verification token
        verification_token = create_email_verification_token()
        verification_token_expires = get_email_verification_token_expiry()

        # Create new user (inactive until email verified)
        new_user = User(
            username=user_data.username,
            email=user_data.email,
            hashed_password=get_password_hash(user_data.password),
            full_name=user_data.full_name,
            is_active=False,  # User is inactive until email is verified
            is_admin=False,
            is_email_verified=False,
            email_verification_token=verification_token,
            email_verification_token_expires=verification_token_expires
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # Send verification email
        email_sent = EmailService.send_verification_email(
            to_email=new_user.email,
            username=new_user.username,
            verification_token=verification_token
        )

        if not email_sent:
            # Log the error but don't fail registration
            # User can request a new verification email later
            pass

        return new_user

    @staticmethod
    def authenticate_user(db: Session, username: str, password: str) -> User:
        """
        Authenticate a user with username and password.

        Args:
            db: Database session
            username: Username
            password: Plain text password

        Returns:
            User object if authentication successful

        Raises:
            HTTPException: If credentials are invalid
        """
        # Find user by username
        user = db.query(User).filter(User.username == username).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Verify password
        if not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Check if user is active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Inactive user"
            )

        # Update last login
        user.last_login = datetime.now(timezone.utc)
        db.commit()

        return user

    @staticmethod
    def create_user_tokens(user: User) -> dict:
        """
        Create access and refresh tokens for a user.

        Args:
            user: User object

        Returns:
            Dictionary with access_token, refresh_token, and token_type
        """
        access_token = create_access_token(data={"sub": str(user.id)})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> User:
        """
        Get user by email.

        Args:
            db: Database session
            email: User email

        Returns:
            User object or None
        """
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def verify_email(db: Session, token: str) -> User:
        """
        Verify user's email with verification token.

        Args:
            db: Database session
            token: Email verification token

        Returns:
            User object if verification successful

        Raises:
            HTTPException: If token is invalid or expired
        """
        # Find user by verification token
        user = db.query(User).filter(User.email_verification_token == token).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification token"
            )

        # Check if already verified
        if user.is_email_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already verified"
            )

        # Check if token expired
        if user.email_verification_token_expires and user.email_verification_token_expires < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification token has expired"
            )

        # Verify email and activate user
        user.is_email_verified = True
        user.is_active = True
        user.email_verification_token = None
        user.email_verification_token_expires = None

        db.commit()
        db.refresh(user)

        # Send welcome email
        EmailService.send_welcome_email(user.email, user.username)

        return user

    @staticmethod
    def resend_verification_email(db: Session, email: str) -> bool:
        """
        Resend verification email to user.

        Args:
            db: Database session
            email: User's email address

        Returns:
            True if email sent successfully

        Raises:
            HTTPException: If user not found or already verified
        """
        user = db.query(User).filter(User.email == email).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        if user.is_email_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already verified"
            )

        # Create new verification token
        verification_token = create_email_verification_token()
        verification_token_expires = get_email_verification_token_expiry()

        user.email_verification_token = verification_token
        user.email_verification_token_expires = verification_token_expires

        db.commit()

        # Send verification email
        email_sent = EmailService.send_verification_email(
            to_email=user.email,
            username=user.username,
            verification_token=verification_token
        )

        if not email_sent:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send verification email"
            )

        return True

    @staticmethod
    def request_password_reset(db: Session, email: str) -> bool:
        """
        Request password reset for user.

        Args:
            db: Database session
            email: User's email address

        Returns:
            True if reset email sent successfully

        Raises:
            HTTPException: If user not found
        """
        user = db.query(User).filter(User.email == email).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Create password reset token
        reset_token = create_password_reset_token()
        reset_token_expires = get_password_reset_token_expiry()

        user.password_reset_token = reset_token
        user.password_reset_token_expires = reset_token_expires

        db.commit()

        # Send password reset email
        email_sent = EmailService.send_password_reset_email(
            to_email=user.email,
            username=user.username,
            reset_token=reset_token
        )

        if not email_sent:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send password reset email"
            )

        return True

    @staticmethod
    def reset_password(db: Session, token: str, new_password: str) -> User:
        """
        Reset user's password with reset token.

        Args:
            db: Database session
            token: Password reset token
            new_password: New password

        Returns:
            User object if password reset successful

        Raises:
            HTTPException: If token is invalid or expired
        """
        # Find user by reset token
        user = db.query(User).filter(User.password_reset_token == token).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid reset token"
            )

        # Check if token expired
        if user.password_reset_token_expires and user.password_reset_token_expires < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reset token has expired"
            )

        # Update password and clear reset token
        user.hashed_password = get_password_hash(new_password)
        user.password_reset_token = None
        user.password_reset_token_expires = None

        db.commit()
        db.refresh(user)

        return user
