"""
ChromaDB service for vector-based semantic search.
Stores Gemini text-embedding-004 vectors (768-dim) for materials.
"""
import logging
import os
from typing import List, Optional

logger = logging.getLogger(__name__)

# Path to persist ChromaDB data
_CHROMA_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "chroma")
_COLLECTION_NAME = "materials"

_client = None
_collection = None


def _get_collection():
    global _client, _collection
    if _collection is not None:
        return _collection
    try:
        import chromadb
        os.makedirs(_CHROMA_PATH, exist_ok=True)
        _client = chromadb.PersistentClient(path=_CHROMA_PATH)
        _collection = _client.get_or_create_collection(
            name=_COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
        logger.info(f"ChromaDB collection '{_COLLECTION_NAME}' ready, count={_collection.count()}")
        return _collection
    except Exception as e:
        logger.warning(f"ChromaDB unavailable: {e}")
        return None


def index_material(material_id: int, embedding: List[float], course_id: int, material_type: str) -> bool:
    """Add or update a material's embedding in ChromaDB."""
    col = _get_collection()
    if col is None:
        return False
    try:
        doc_id = f"material_{material_id}"
        # upsert: delete existing entry if present, then add
        try:
            col.delete(ids=[doc_id])
        except Exception:
            pass
        col.add(
            embeddings=[embedding],
            ids=[doc_id],
            metadatas=[{"material_id": material_id, "course_id": course_id, "material_type": material_type or ""}],
        )
        return True
    except Exception as e:
        logger.warning(f"ChromaDB index_material({material_id}) failed: {e}")
        return False


MAX_DISTANCE = 0.35  # cosine distance threshold — above this is considered irrelevant


def query_similar(
    query_embedding: List[float],
    n_results: int = 10,
    course_id: Optional[int] = None,
    material_type: Optional[str] = None,
) -> List[int]:
    """
    Query ChromaDB for the most similar materials.
    Returns material_ids ordered by similarity, filtered by MAX_DISTANCE.
    """
    col = _get_collection()
    if col is None:
        return []
    if col.count() == 0:
        return []
    try:
        where = {}
        if course_id is not None:
            where["course_id"] = course_id
        if material_type is not None:
            where["material_type"] = material_type

        kwargs = dict(
            query_embeddings=[query_embedding],
            n_results=min(n_results, col.count()),
            include=["metadatas", "distances"],
        )
        if where:
            kwargs["where"] = where

        results = col.query(**kwargs)
        metadatas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]

        return [
            m["material_id"]
            for m, d in zip(metadatas, distances)
            if d <= MAX_DISTANCE
        ]
    except Exception as e:
        logger.warning(f"ChromaDB query_similar failed: {e}")
        return []


def delete_material(material_id: int) -> None:
    """Remove a material's embedding from ChromaDB."""
    col = _get_collection()
    if col is None:
        return
    try:
        col.delete(ids=[f"material_{material_id}"])
    except Exception as e:
        logger.warning(f"ChromaDB delete_material({material_id}) failed: {e}")
