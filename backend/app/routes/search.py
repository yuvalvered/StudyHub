"""
Search routes for finding materials.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.dependencies import get_db
from app.schemas.search import SearchResponse
from app.services.search_service import SearchService

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("/materials", response_model=SearchResponse)
async def search_materials(
    q: str = Query(..., description="Search query", min_length=1),
    limit: int = Query(5, description="Maximum number of results", ge=1, le=20),
    course_id: Optional[int] = Query(None, description="Filter by course ID"),
    material_type: Optional[str] = Query(None, description="Filter by material type (summaries, exams, exercises, links)"),
    sort_by: str = Query("relevance", description="Sort by: relevance, date, rating"),
    db: Session = Depends(get_db)
):
    """
    Search for materials by text query with filters and sorting.

    Searches across:
    - Material title
    - Material description
    - File name
    - File content (PDF files)

    Filters:
    - course_id: Filter results by specific course
    - material_type: Filter by type (summaries, exams, exercises, links)

    Sorting:
    - relevance: Best matches first (default)
    - date: Newest first
    - rating: Highest rated first

    Returns up to `limit` results (default 5, max 20) with highlighted snippets.
    """
    results = SearchService.search_materials(
        db=db,
        query=q,
        limit=limit,
        course_id=course_id,
        material_type=material_type,
        sort_by=sort_by
    )

    return SearchResponse(
        query=q,
        results=results,
        total_results=len(results)
    )
