"""
Search routes for finding materials.
"""
from fastapi import APIRouter, Depends, Query
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session
from typing import Optional

from app.core.dependencies import get_db
from app.schemas.search import SearchResponse
from app.services.search_service import SearchService
from app.services.gemini_query_expander import expand_query_with_gemini

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

    Combines:
    1. Vector semantic search (ChromaDB + Gemini embeddings) — finds conceptually similar content
    2. Keyword/FTS search (PostgreSQL) — finds exact/partial text matches
    3. Semantic query expansion (Gemini) — broadens keyword search with synonyms

    Returns up to `limit` results (default 5, max 20) with highlighted snippets.
    """
    # Run expansion and vector search in parallel via threadpool
    semantic_terms, semantic_ids = await _get_semantic_results(q, course_id, material_type, limit)

    results = SearchService.search_materials(
        db=db,
        query=q,
        limit=limit,
        course_id=course_id,
        material_type=material_type,
        sort_by=sort_by,
        semantic_terms=semantic_terms,
        semantic_material_ids=semantic_ids,
    )

    return SearchResponse(
        query=q,
        results=results,
        total_results=len(results)
    )


async def _get_semantic_results(q: str, course_id, material_type, limit: int):
    """Run query expansion and vector search concurrently."""
    import asyncio

    async def expand():
        return await run_in_threadpool(expand_query_with_gemini, q)

    async def vector_search():
        return await run_in_threadpool(_vector_query, q, course_id, material_type, limit)

    terms, ids = await asyncio.gather(expand(), vector_search())
    return terms, ids


def _vector_query(q: str, course_id, material_type, limit: int):
    """Blocking vector search — called from threadpool."""
    try:
        from app.core.config import settings
        if not settings.GEMINI_API_KEY:
            return []
        from app.services.embedding_service import embed_query
        from app.services.chroma_service import query_similar
        embedding = embed_query(q)
        if not embedding:
            return []
        return query_similar(
            query_embedding=embedding,
            n_results=limit * 2,
            course_id=course_id,
            material_type=material_type,
        )
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Vector search failed: {e}")
        return []
