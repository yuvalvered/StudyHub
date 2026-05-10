"""
Embedding service using Google Gemini text-embedding-004.
Converts text to 768-dimensional vectors for semantic search.
"""
import logging
from typing import List, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

EMBEDDING_MODEL = "models/gemini-embedding-001"
MAX_CHARS = 8000  # ~2000 tokens, safe limit for the model


def _get_client():
    try:
        from google import genai
        if not settings.GEMINI_API_KEY:
            return None
        return genai.Client(api_key=settings.GEMINI_API_KEY)
    except ImportError:
        logger.warning("google-genai not installed")
        return None


def embed_document(text: str) -> Optional[List[float]]:
    """Generate embedding for a document (material content)."""
    client = _get_client()
    if not client or not text or not text.strip():
        return None
    try:
        result = client.models.embed_content(
            model=EMBEDDING_MODEL,
            contents=text[:MAX_CHARS],
            config={"task_type": "RETRIEVAL_DOCUMENT"},
        )
        return result.embeddings[0].values
    except Exception as e:
        logger.warning(f"embed_document failed: {e}")
        return None


def embed_query(text: str) -> Optional[List[float]]:
    """Generate embedding for a search query."""
    client = _get_client()
    if not client or not text or not text.strip():
        return None
    try:
        result = client.models.embed_content(
            model=EMBEDDING_MODEL,
            contents=text[:MAX_CHARS],
            config={"task_type": "RETRIEVAL_QUERY"},
        )
        return result.embeddings[0].values
    except Exception as e:
        logger.warning(f"embed_query failed: {e}")
        return None


def build_material_text(title: str, description: str, content: str) -> str:
    """Build the text to embed for a material."""
    parts = []
    if title:
        parts.append(title)
    if description:
        parts.append(description)
    if content:
        parts.append(content[:6000])
    return " ".join(parts)
