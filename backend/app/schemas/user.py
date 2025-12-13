"""
Pydantic schemas for User-related requests and responses.
"""
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    """Base user schema with common fields."""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=100)

    @field_validator('email')
    @classmethod
    def validate_university_email(cls, v: str) -> str:
        """Validate that email is from BGU university domain."""
        if not v.endswith('@post.bgu.ac.il'):
            raise ValueError('Only BGU university emails (@post.bgu.ac.il) are allowed')
        return v


class UserCreate(UserBase):
    """Schema for user registration."""
    password: str = Field(..., min_length=6, max_length=100)


class UserUpdate(BaseModel):
    """Schema for updating user profile."""
    full_name: Optional[str] = Field(None, min_length=1, max_length=100)
    year_of_study: Optional[int] = Field(None, ge=1, le=10)
    department: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = None
    looking_for_study_partner: Optional[bool] = None


class UserResponse(UserBase):
    """Schema for user response (public info)."""
    id: int
    year_of_study: Optional[int] = None
    department: Optional[str] = None
    profile_image_url: Optional[str] = None
    bio: Optional[str] = None
    is_active: bool
    looking_for_study_partner: bool
    uploads_count: int
    downloads_received: int
    average_rating: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserProfile(UserResponse):
    """Extended user profile with additional info (for /me endpoint)."""
    is_admin: bool
    is_email_verified: bool
    last_login: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UserStats(BaseModel):
    """User statistics schema."""
    uploads_count: int
    downloads_received: int
    average_rating: float

    model_config = ConfigDict(from_attributes=True)


class UserInDB(UserBase):
    """User schema as stored in database (internal use only)."""
    id: int
    hashed_password: str
    is_active: bool
    is_admin: bool

    model_config = ConfigDict(from_attributes=True)
