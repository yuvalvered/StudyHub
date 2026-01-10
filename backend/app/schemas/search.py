"""
Search schemas for API responses.
"""
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from app.models.material import MaterialType


class SearchResult(BaseModel):
    """Single search result for a material."""
    material_id: int
    title: str
    material_type: MaterialType
    course_name: str
    course_id: int
    uploader_username: str
    snippet: str  # Text snippet with highlighted search term
    match_type: str  # "title", "description", "filename", or "content"
    created_at: datetime

    class Config:
        from_attributes = True


class SearchResponse(BaseModel):
    """Response for material search containing multiple results."""
    query: str
    results: List[SearchResult]
    total_results: int
