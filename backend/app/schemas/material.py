"""
Pydantic schemas for Material-related requests and responses.
"""
from pydantic import BaseModel, Field, ConfigDict, HttpUrl, field_validator
from typing import Optional, List
from datetime import datetime
from app.models.material import MaterialType


class MaterialBase(BaseModel):
    """Base material schema."""
    title: str = Field(..., max_length=200)
    description: Optional[str] = None
    material_type: MaterialType
    course_id: int

    @field_validator('material_type', mode='before')
    @classmethod
    def normalize_material_type(cls, v):
        """Convert material_type to lowercase to match enum values."""
        if isinstance(v, str):
            return v.lower()
        return v


class MaterialCreate(MaterialBase):
    """Schema for creating a material (without file upload)."""
    external_url: Optional[HttpUrl] = None


class MaterialUpdate(BaseModel):
    """Schema for updating material metadata."""
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    material_type: Optional[MaterialType] = None

    @field_validator('material_type', mode='before')
    @classmethod
    def normalize_material_type(cls, v):
        """Convert material_type to lowercase to match enum values."""
        if isinstance(v, str):
            return v.lower()
        return v


class MaterialResponse(MaterialBase):
    """Schema for material response."""
    id: int
    file_path: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    file_extension: Optional[str] = None
    external_url: Optional[str] = None
    # AI-extracted metadata
    page_count: Optional[int] = None
    topics: Optional[List[str]] = None
    ai_processed: bool = False
    # Stats
    view_count: int
    download_count: int
    average_rating: float
    rating_count: int
    reports_count: int = 0
    created_at: datetime
    uploader_id: int

    model_config = ConfigDict(from_attributes=True)


class MaterialWithUploader(MaterialResponse):
    """Material response with uploader info."""
    uploader_username: str
    uploader_full_name: str

    model_config = ConfigDict(from_attributes=True)
