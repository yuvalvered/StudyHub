"""
Search service for finding materials by text query.
"""
from sqlalchemy.orm import Session
from sqlalchemy import or_, case
from typing import List
import re

from app.models.material import Material
from app.schemas.search import SearchResult


class SearchService:
    """Service for searching materials."""

    @staticmethod
    def generate_snippet(text: str, search_term: str, context_length: int = 100) -> str:
        """
        Generate a text snippet around the search term with highlighting.

        Args:
            text: Full text to search in
            search_term: Term to find and highlight
            context_length: Number of characters before/after the match to include

        Returns:
            Snippet with search term highlighted using **bold** format
        """
        if not text or not search_term:
            return ""

        # Find first occurrence (case-insensitive)
        pattern = re.compile(re.escape(search_term), re.IGNORECASE)
        match = pattern.search(text)

        if not match:
            # No match found, return beginning of text
            snippet = text[:context_length * 2].strip()
            return f"{snippet}..." if len(text) > context_length * 2 else snippet

        # Get match position
        start_pos = match.start()
        end_pos = match.end()

        # Calculate snippet boundaries
        snippet_start = max(0, start_pos - context_length)
        snippet_end = min(len(text), end_pos + context_length)

        # Extract snippet
        snippet = text[snippet_start:snippet_end]

        # Add ellipsis if not at start/end of text
        if snippet_start > 0:
            snippet = "..." + snippet
        if snippet_end < len(text):
            snippet = snippet + "..."

        # Highlight the search term with **bold**
        # Find the term again in the snippet (case-insensitive)
        highlighted_snippet = pattern.sub(
            lambda m: f"**{m.group(0)}**",
            snippet
        )

        return highlighted_snippet.strip()

    @staticmethod
    def search_materials(
        db: Session,
        query: str,
        limit: int = 5,
        course_id: int = None,
        material_type: str = None,
        sort_by: str = "relevance"
    ) -> List[SearchResult]:
        """
        Search for materials by text query with filters and sorting.

        Searches in: title, description, filename, and file content (PDF).

        Args:
            db: Database session
            query: Search query string
            limit: Maximum number of results (default 5)
            course_id: Filter by course ID (optional)
            material_type: Filter by material type (optional)
            sort_by: Sort order - "relevance", "date", or "rating" (default "relevance")

        Returns:
            List of SearchResult objects with highlighted snippets
        """
        if not query or not query.strip():
            return []

        search_term = query.strip()
        search_pattern = f"%{search_term}%"

        # Build query to search across multiple fields
        materials_query = db.query(Material).filter(
            or_(
                Material.title.ilike(search_pattern),
                Material.description.ilike(search_pattern),
                Material.file_name.ilike(search_pattern),
                Material.file_content_text.ilike(search_pattern)
            )
        )

        # Apply filters
        if course_id is not None:
            materials_query = materials_query.filter(Material.course_id == course_id)

        if material_type is not None:
            materials_query = materials_query.filter(Material.material_type == material_type)

        # Apply sorting
        if sort_by == "date":
            materials_query = materials_query.order_by(Material.created_at.desc())
        elif sort_by == "rating":
            materials_query = materials_query.order_by(Material.average_rating.desc())
        elif sort_by == "relevance":
            # Calculate relevance score based on where the match was found
            # Higher weight for matches in title > description > filename > content
            relevance_score = (
                case(
                    (Material.title.ilike(search_pattern), 10),  # Title match = highest priority
                    else_=0
                ) +
                case(
                    (Material.description.ilike(search_pattern), 5),  # Description match
                    else_=0
                ) +
                case(
                    (Material.file_name.ilike(search_pattern), 3),  # Filename match
                    else_=0
                ) +
                case(
                    (Material.file_content_text.ilike(search_pattern), 1),  # Content match = lowest priority
                    else_=0
                )
            )
            materials_query = materials_query.order_by(relevance_score.desc())

        # Apply limit
        materials_query = materials_query.limit(limit)

        materials = materials_query.all()

        # Convert to SearchResult objects with snippets
        results = []
        for material in materials:
            # Determine match type and generate snippet
            snippet = ""
            match_type = "content"  # Default

            # Check title first (highest priority)
            if material.title and search_term.lower() in material.title.lower():
                snippet = SearchService.generate_snippet(material.title, search_term, 50)
                match_type = "title"

            # Check description
            elif material.description and search_term.lower() in material.description.lower():
                snippet = SearchService.generate_snippet(material.description, search_term, 100)
                match_type = "description"

            # Check filename
            elif material.file_name and search_term.lower() in material.file_name.lower():
                snippet = SearchService.generate_snippet(material.file_name, search_term, 50)
                match_type = "filename"

            # Check file content
            elif material.file_content_text and search_term.lower() in material.file_content_text.lower():
                snippet = SearchService.generate_snippet(material.file_content_text, search_term, 100)
                match_type = "content"

            # If no match found (shouldn't happen due to query filter, but safety check)
            if not snippet:
                snippet = material.description[:100] if material.description else material.title
                if len(snippet) > 100:
                    snippet += "..."

            # Create SearchResult
            result = SearchResult(
                material_id=material.id,
                title=material.title,
                material_type=material.material_type,
                course_name=material.course.course_name if material.course else "Unknown",
                course_id=material.course_id,
                uploader_username=material.uploader.username if material.uploader else "Unknown",
                snippet=snippet,
                match_type=match_type,
                created_at=material.created_at
            )
            results.append(result)

        return results
