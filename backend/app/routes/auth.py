"""
Authentication routes: registration, login, password reset.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field

from app.core.dependencies import get_db
from app.schemas.auth import Token, LoginRequest, PasswordResetRequest
from app.schemas.user import UserCreate, UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


class EmailVerificationRequest(BaseModel):
    """Schema for resending verification email."""
    email: EmailStr


class EmailVerificationResponse(BaseModel):
    """Schema for email verification response."""
    message: str
    user: UserResponse


class PasswordResetConfirmRequest(BaseModel):
    """Schema for confirming password reset."""
    token: str
    new_password: str = Field(..., min_length=6, max_length=100)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user with BGU university email.

    - **username**: Unique username (3-50 characters)
    - **email**: Valid BGU email address (@post.bgu.ac.il)
    - **password**: Password (minimum 6 characters)
    - **full_name**: User's full name

    A verification email will be sent to the provided email address.
    The user must verify their email before they can login.
    """
    user = AuthService.register_user(db, user_data)
    return user


@router.post("/login", response_model=Token)
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """
    Login with username and password.

    Returns JWT access token and refresh token.
    """
    user = AuthService.authenticate_user(db, login_data.username, login_data.password)
    tokens = AuthService.create_user_tokens(user)
    return tokens


@router.post("/refresh", response_model=Token)
async def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    """
    Refresh access token using refresh token.
    """
    # TODO: Implement token refresh logic
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Token refresh not yet implemented"
    )


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(request: PasswordResetRequest, db: Session = Depends(get_db)):
    """
    Request password reset email.

    - **email**: User's email address

    Sends a password reset email with a token valid for 1 hour.
    """
    AuthService.request_password_reset(db, request.email)
    return {"message": "Password reset email sent successfully"}


@router.get("/verify-email", response_model=EmailVerificationResponse)
async def verify_email(token: str, db: Session = Depends(get_db)):
    """
    Verify user's email address using verification token.

    - **token**: Email verification token (sent via email)

    Returns user information and confirmation message.
    """
    user = AuthService.verify_email(db, token)
    return {
        "message": "Email verified successfully. You can now login.",
        "user": user
    }


@router.post("/resend-verification", status_code=status.HTTP_200_OK)
async def resend_verification_email(request: EmailVerificationRequest, db: Session = Depends(get_db)):
    """
    Resend verification email to user.

    - **email**: User's email address

    Sends a new verification email with a fresh token.
    """
    AuthService.resend_verification_email(db, request.email)
    return {"message": "Verification email sent successfully"}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(request: PasswordResetConfirmRequest, db: Session = Depends(get_db)):
    """
    Reset password using reset token.

    - **token**: Password reset token (sent via email)
    - **new_password**: New password (minimum 6 characters)

    Resets the user's password if the token is valid.
    """
    AuthService.reset_password(db, request.token, request.new_password)
    return {"message": "Password reset successfully. You can now login with your new password."}
