"""
Pydantic schemas for MaterialReport-related requests and responses.
"""
from pydantic import BaseModel, ConfigDict
from datetime import datetime


class MaterialReportResponse(BaseModel):
    """Schema for material report response."""
    id: int
    material_id: int
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
