"""
Search service for finding materials by text query.
Uses PostgreSQL Full-Text Search with support for Hebrew and English.
"""
from sqlalchemy.orm import Session
from sqlalchemy import or_, case, text, func
from typing import List
import re

from app.models.material import Material
from app.schemas.search import SearchResult


class SearchService:
    """Service for searching materials using PostgreSQL Full-Text Search."""

    @staticmethod
    def generate_snippet(text_content: str, search_term: str, context_length: int = 100, max_snippets: int = 3) -> str:
        """
        Generate text snippets around ALL occurrences of the search term with highlighting.

        Args:
            text_content: Full text to search in
            search_term: Term to find and highlight
            context_length: Number of characters before/after the match to include
            max_snippets: Maximum number of snippets to return (default 3)

        Returns:
            Snippets with search term highlighted using **bold** format, separated by newlines
        """
        if not text_content or not search_term:
            return ""

        # Find all occurrences (case-insensitive)
        pattern = re.compile(re.escape(search_term), re.IGNORECASE)
        matches = list(pattern.finditer(text_content))

        if not matches:
            # No match found, return beginning of text
            snippet = text_content[:context_length * 2].strip()
            return f"{snippet}..." if len(text_content) > context_length * 2 else snippet

        snippets = []
        used_ranges = []  # Track used ranges to avoid overlapping snippets

        for match in matches[:max_snippets * 2]:  # Check more matches in case some overlap
            if len(snippets) >= max_snippets:
                break

            start_pos = match.start()
            end_pos = match.end()

            # Calculate snippet boundaries
            snippet_start = max(0, start_pos - context_length)
            snippet_end = min(len(text_content), end_pos + context_length)

            # Check if this snippet overlaps with an existing one
            overlaps = False
            for used_start, used_end in used_ranges:
                if not (snippet_end < used_start or snippet_start > used_end):
                    overlaps = True
                    break

            if overlaps:
                continue

            used_ranges.append((snippet_start, snippet_end))

            # Extract snippet
            snippet = text_content[snippet_start:snippet_end]

            # Add ellipsis if not at start/end of text
            if snippet_start > 0:
                snippet = "..." + snippet
            if snippet_end < len(text_content):
                snippet = snippet + "..."

            # Highlight the search term with **bold**
            highlighted_snippet = pattern.sub(
                lambda m: f"**{m.group(0)}**",
                snippet
            )

            snippets.append(highlighted_snippet.strip())

        # Join snippets with a separator
        return "\n\n".join(snippets)

    # Keyboard layout mapping: English keys -> Hebrew letters (standard Israeli keyboard)
    # When someone types in Hebrew but forgot to switch keyboard layout
    ENGLISH_TO_HEBREW = {
        'q': '/', 'w': "'", 'e': 'ק', 'r': 'ר', 't': 'א', 'y': 'ט', 'u': 'ו', 'i': 'ן', 'o': 'ם', 'p': 'פ',
        'a': 'ש', 's': 'ד', 'd': 'ג', 'f': 'כ', 'g': 'ע', 'h': 'י', 'j': 'ח', 'k': 'ל', 'l': 'ך', ';': 'ף',
        'z': 'ז', 'x': 'ס', 'c': 'ב', 'v': 'ה', 'b': 'נ', 'n': 'מ', 'm': 'צ', ',': 'ת', '.': 'ץ', '/': '.',
        # Capital letters (with Shift)
        'Q': '/', 'W': "'", 'E': 'ק', 'R': 'ר', 'T': 'א', 'Y': 'ט', 'U': 'ו', 'I': 'ן', 'O': 'ם', 'P': 'פ',
        'A': 'ש', 'S': 'ד', 'D': 'ג', 'F': 'כ', 'G': 'ע', 'H': 'י', 'J': 'ח', 'K': 'ל', 'L': 'ך',
        'Z': 'ז', 'X': 'ס', 'C': 'ב', 'V': 'ה', 'B': 'נ', 'N': 'מ', 'M': 'צ',
    }

    # Reverse mapping: Hebrew letters -> English keys
    HEBREW_TO_ENGLISH = {
        '/': 'q', "'": 'w', 'ק': 'e', 'ר': 'r', 'א': 't', 'ט': 'y', 'ו': 'u', 'ן': 'i', 'ם': 'o', 'פ': 'p',
        'ש': 'a', 'ד': 's', 'ג': 'd', 'כ': 'f', 'ע': 'g', 'י': 'h', 'ח': 'j', 'ל': 'k', 'ך': 'l', 'ף': ';',
        'ז': 'z', 'ס': 'x', 'ב': 'c', 'ה': 'v', 'נ': 'b', 'מ': 'n', 'צ': 'm', 'ת': ',', 'ץ': '.',
    }

    # Common Hebrew letter swaps (final letters confusion)
    HEBREW_FINAL_LETTER_FIXES = {
        'ם': 'מ',  # final mem -> mem
        'ן': 'נ',  # final nun -> nun
        'ץ': 'צ',  # final tsadi -> tsadi
        'ף': 'פ',  # final pe -> pe
        'ך': 'כ',  # final kaf -> kaf
    }

    @staticmethod
    def _fix_keyboard_layout(text: str) -> str:
        """
        Fix text typed with wrong keyboard layout.
        Converts English characters to Hebrew equivalents.
        """
        # Count Hebrew and English characters
        hebrew_count = sum(1 for c in text if '\u0590' <= c <= '\u05FF')
        english_count = sum(1 for c in text if c.isascii() and c.isalpha())

        if english_count > 0 and hebrew_count == 0:
            # Text is all English - might be Hebrew typed with English keyboard
            result_chars = []
            for char in text:
                result_chars.append(SearchService.ENGLISH_TO_HEBREW.get(char.lower(), char))
            return ''.join(result_chars)

        return text

    # Map between regular and final forms of Hebrew letters
    HEBREW_REGULAR_TO_FINAL = {
        'מ': 'ם', 'נ': 'ן', 'צ': 'ץ', 'פ': 'ף', 'כ': 'ך'
    }
    HEBREW_FINAL_TO_REGULAR = {
        'ם': 'מ', 'ן': 'נ', 'ץ': 'צ', 'ף': 'פ', 'ך': 'כ'
    }

    # Common keyboard neighbor mistakes (Hebrew letters on adjacent keys)
    # Maps each Hebrew letter to its neighbors on the keyboard
    HEBREW_KEYBOARD_NEIGHBORS = {
        # Top row: / ' ק ר א ט ו ן ם פ
        '/': ["'"],
        "'": ['/', 'ק'],
        'ק': ["'", 'ר', 'ש'],
        'ר': ['ק', 'א', 'ד'],
        'א': ['ר', 'ט', 'ג'],
        'ט': ['א', 'ו', 'כ'],
        'ו': ['ט', 'ן', 'ע'],
        'ן': ['ו', 'ם', 'י'],
        'ם': ['ן', 'פ', 'ח'],
        'פ': ['ם', 'ל'],
        # Middle row: ש ד ג כ ע י ח ל ך ף
        'ש': ['ק', 'ד', 'ז'],
        'ד': ['ש', 'ג', 'ר', 'ס'],
        'ג': ['ד', 'כ', 'א', 'ב'],
        'כ': ['ג', 'ע', 'ט', 'ה'],
        'ע': ['כ', 'י', 'ו', 'נ'],
        'י': ['ע', 'ח', 'ן', 'מ'],
        'ח': ['י', 'ל', 'ם', 'צ'],
        'ל': ['ח', 'ך', 'פ', 'ת'],
        'ך': ['ל', 'ף'],
        'ף': ['ך'],
        # Bottom row: ז ס ב ה נ מ צ ת ץ
        'ז': ['ש', 'ס'],
        'ס': ['ז', 'ב', 'ד'],
        'ב': ['ס', 'ה', 'ג'],
        'ה': ['ב', 'נ', 'כ'],
        'נ': ['ה', 'מ', 'ע'],
        'מ': ['נ', 'צ', 'י'],
        'צ': ['מ', 'ת', 'ח'],
        'ת': ['צ', 'ץ', 'ל'],
        'ץ': ['ת'],
    }

    @staticmethod
    def _fix_final_letters(text: str) -> str:
        """
        Fix common Hebrew final letter mistakes.
        Converts final letters to regular forms when they appear mid-word.
        e.g., םיצוץ -> מיצוץ
        """
        result = []
        text_len = len(text)
        for i, char in enumerate(text):
            # If it's a final letter NOT at the end of a word, convert to regular
            if char in SearchService.HEBREW_FINAL_TO_REGULAR:
                is_end_of_word = (i == text_len - 1) or not ('\u0590' <= text[i + 1] <= '\u05FF')
                if not is_end_of_word:
                    result.append(SearchService.HEBREW_FINAL_TO_REGULAR[char])
                else:
                    result.append(char)
            else:
                result.append(char)
        return ''.join(result)

    @staticmethod
    def _normalize_hebrew_finals(text: str) -> str:
        """
        Normalize all final letters to regular forms for comparison.
        This helps with fuzzy matching when final letters are misused.
        """
        result = []
        for char in text:
            if char in SearchService.HEBREW_FINAL_TO_REGULAR:
                result.append(SearchService.HEBREW_FINAL_TO_REGULAR[char])
            else:
                result.append(char)
        return ''.join(result)

    @staticmethod
    def _fix_keyboard_neighbors(text: str) -> List[str]:
        """
        Generate variants by replacing characters with their keyboard neighbors.
        Useful for typos where adjacent keys were pressed.
        Returns list of possible corrections (up to a reasonable limit).
        """
        variants = []

        # Check each character position for possible neighbor typos
        for i, char in enumerate(text):
            if char in SearchService.HEBREW_KEYBOARD_NEIGHBORS:
                neighbors = SearchService.HEBREW_KEYBOARD_NEIGHBORS[char]
                for neighbor in neighbors:
                    # Create variant with this character replaced
                    variant = text[:i] + neighbor + text[i+1:]
                    if variant not in variants:
                        variants.append(variant)

            # Limit variants to avoid explosion
            if len(variants) >= 10:
                break

        return variants

    @staticmethod
    def _get_search_variants(query: str) -> List[str]:
        """
        Generate search variants for the query to handle typos and keyboard issues.

        Returns list of query variants to search for.
        """
        variants = [query]

        # Try keyboard layout fix (English -> Hebrew)
        keyboard_fixed = SearchService._fix_keyboard_layout(query)
        if keyboard_fixed != query:
            variants.append(keyboard_fixed)

        # Try final letter fixes for Hebrew text (fix misplaced finals)
        final_fixed = SearchService._fix_final_letters(query)
        if final_fixed != query and final_fixed not in variants:
            variants.append(final_fixed)

        # Try normalizing all finals to regular forms
        normalized = SearchService._normalize_hebrew_finals(query)
        if normalized != query and normalized not in variants:
            variants.append(normalized)

        # Try keyboard neighbor fixes (for typos like ם instead of פ)
        neighbor_variants = SearchService._fix_keyboard_neighbors(query)
        for nv in neighbor_variants:
            if nv not in variants:
                variants.append(nv)
            # Also try with final letter fix
            nv_fixed = SearchService._fix_final_letters(nv)
            if nv_fixed not in variants:
                variants.append(nv_fixed)

        # Also try final letter fix on keyboard-fixed version
        if keyboard_fixed != query:
            keyboard_and_final = SearchService._fix_final_letters(keyboard_fixed)
            if keyboard_and_final not in variants:
                variants.append(keyboard_and_final)

        return variants

    @staticmethod
    def _prepare_search_query(query: str) -> str:
        """
        Prepare search query for PostgreSQL Full-Text Search.
        Handles Hebrew and English, supports partial word matching.

        Args:
            query: Raw search query from user

        Returns:
            Prepared query string for to_tsquery
        """
        # Clean the query
        query = query.strip()

        # Split into words
        words = query.split()

        # For each word, add prefix matching (:*) to support partial matches
        # This allows searching for "אלג" to find "אלגוריתם"
        prepared_words = []
        for word in words:
            # Remove special characters that might break the query
            clean_word = re.sub(r'[^\w\u0590-\u05FF]', '', word)
            if clean_word:
                # Add :* for prefix matching
                prepared_words.append(f"{clean_word}:*")

        # Join with & (AND) operator
        return ' & '.join(prepared_words) if prepared_words else query

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
        Search for materials using PostgreSQL Full-Text Search.

        Supports:
        - Hebrew and English text
        - Partial word matching (prefix search)
        - Fuzzy matching with trigrams (catches typos)
        - Search in: title, description, filename, and file content

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

        # Get search variants (original + keyboard layout fix)
        search_variants = SearchService._get_search_variants(search_term)

        # Build search conditions for all variants
        all_conditions = []

        for variant in search_variants:
            variant_pattern = f"%{variant}%"
            fts_variant = SearchService._prepare_search_query(variant)

            # Full-Text Search conditions using 'simple' tokenizer
            fts_title = text("to_tsvector('simple', COALESCE(title, '')) @@ to_tsquery('simple', :query)")
            fts_description = text("to_tsvector('simple', COALESCE(description, '')) @@ to_tsquery('simple', :query)")
            fts_content = text("to_tsvector('simple', COALESCE(file_content_text, '')) @@ to_tsquery('simple', :query)")

            # Trigram similarity for fuzzy matching (catches typos)
            # Lower threshold to catch more typos (0.2 for title, 0.15 for content)
            trgm_title = text("similarity(COALESCE(title, ''), :raw_query) > 0.2")
            trgm_content = text("similarity(COALESCE(file_content_text, ''), :raw_query) > 0.15")

            all_conditions.extend([
                # Full-Text Search (primary method)
                fts_title.bindparams(query=fts_variant),
                fts_description.bindparams(query=fts_variant),
                fts_content.bindparams(query=fts_variant),
                # ILIKE fallback (for exact substring matches)
                Material.title.ilike(variant_pattern),
                Material.description.ilike(variant_pattern),
                Material.file_name.ilike(variant_pattern),
                Material.file_content_text.ilike(variant_pattern),
                # Trigram similarity (for fuzzy/typo tolerance)
                trgm_title.bindparams(raw_query=variant),
                trgm_content.bindparams(raw_query=variant),
            ])

        # Combined search with all variants
        materials_query = db.query(Material).filter(or_(*all_conditions))

        # Use the first variant (or corrected one) for snippet generation
        effective_search_term = search_variants[-1] if len(search_variants) > 1 else search_term
        search_pattern = f"%{effective_search_term}%"

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
            # For relevance sorting, use a simpler approach with ILIKE-based scoring
            # Order by: title match first, then description, then content
            relevance_score = (
                case(
                    (Material.title.ilike(search_pattern), 10),
                    else_=0
                ) +
                case(
                    (Material.description.ilike(search_pattern), 5),
                    else_=0
                ) +
                case(
                    (Material.file_content_text.ilike(search_pattern), 2),
                    else_=0
                )
            )
            materials_query = materials_query.order_by(relevance_score.desc(), Material.created_at.desc())

        # Apply limit
        materials_query = materials_query.limit(limit)

        materials = materials_query.all()

        # Convert to SearchResult objects with snippets
        results = []
        for material in materials:
            # Determine match type and generate snippet
            # Try all search variants to find the best match
            snippet = ""
            match_type = "content"  # Default
            matched_term = effective_search_term  # The term that actually matched

            # Try each variant to find where the match is
            for variant in search_variants:
                # Check title first (highest priority)
                if material.title and variant.lower() in material.title.lower():
                    snippet = SearchService.generate_snippet(material.title, variant, 50)
                    match_type = "title"
                    matched_term = variant
                    break

                # Check description
                if material.description and variant.lower() in material.description.lower():
                    snippet = SearchService.generate_snippet(material.description, variant, 100)
                    match_type = "description"
                    matched_term = variant
                    break

                # Check filename
                if material.file_name and variant.lower() in material.file_name.lower():
                    snippet = SearchService.generate_snippet(material.file_name, variant, 50)
                    match_type = "filename"
                    matched_term = variant
                    break

                # Check file content
                if material.file_content_text and variant.lower() in material.file_content_text.lower():
                    snippet = SearchService.generate_snippet(material.file_content_text, variant, 100)
                    match_type = "content"
                    matched_term = variant
                    break

            # Fuzzy match - search term not exact but similar (trigram match)
            if not snippet and material.file_content_text:
                # Try to find partial match for snippet with effective search term
                snippet = SearchService.generate_snippet(material.file_content_text, effective_search_term, 100)
                if not snippet or "**" not in snippet:
                    # No exact match found, show beginning of content
                    snippet = material.file_content_text[:200] + "..." if len(material.file_content_text) > 200 else material.file_content_text
                match_type = "content"

            # If still no snippet, use title or description
            if not snippet:
                snippet = material.description[:100] if material.description else material.title
                if snippet and len(snippet) > 100:
                    snippet = snippet[:100] + "..."

            # Create SearchResult
            result = SearchResult(
                material_id=material.id,
                title=material.title,
                material_type=material.material_type,
                course_name=material.course.course_name if material.course else "Unknown",
                course_id=material.course_id,
                uploader_username=material.uploader.username if material.uploader else "Unknown",
                snippet=snippet or "",
                match_type=match_type,
                created_at=material.created_at
            )
            results.append(result)

        return results

    @staticmethod
    def search_materials_simple(
        db: Session,
        query: str,
        limit: int = 5,
        course_id: int = None,
        material_type: str = None,
        sort_by: str = "relevance"
    ) -> List[SearchResult]:
        """
        Fallback simple search using ILIKE (no FTS).
        Use this if PostgreSQL extensions are not available.
        """
        if not query or not query.strip():
            return []

        search_term = query.strip()
        search_pattern = f"%{search_term}%"

        materials_query = db.query(Material).filter(
            or_(
                Material.title.ilike(search_pattern),
                Material.description.ilike(search_pattern),
                Material.file_name.ilike(search_pattern),
                Material.file_content_text.ilike(search_pattern)
            )
        )

        if course_id is not None:
            materials_query = materials_query.filter(Material.course_id == course_id)

        if material_type is not None:
            materials_query = materials_query.filter(Material.material_type == material_type)

        if sort_by == "date":
            materials_query = materials_query.order_by(Material.created_at.desc())
        elif sort_by == "rating":
            materials_query = materials_query.order_by(Material.average_rating.desc())
        else:
            materials_query = materials_query.order_by(Material.created_at.desc())

        materials_query = materials_query.limit(limit)
        materials = materials_query.all()

        results = []
        for material in materials:
            snippet = ""
            match_type = "content"

            if material.title and search_term.lower() in material.title.lower():
                snippet = SearchService.generate_snippet(material.title, search_term, 50)
                match_type = "title"
            elif material.description and search_term.lower() in material.description.lower():
                snippet = SearchService.generate_snippet(material.description, search_term, 100)
                match_type = "description"
            elif material.file_name and search_term.lower() in material.file_name.lower():
                snippet = SearchService.generate_snippet(material.file_name, search_term, 50)
                match_type = "filename"
            elif material.file_content_text and search_term.lower() in material.file_content_text.lower():
                snippet = SearchService.generate_snippet(material.file_content_text, search_term, 100)
                match_type = "content"

            if not snippet:
                snippet = material.description[:100] if material.description else material.title
                if snippet and len(snippet) > 100:
                    snippet = snippet[:100] + "..."

            result = SearchResult(
                material_id=material.id,
                title=material.title,
                material_type=material.material_type,
                course_name=material.course.course_name if material.course else "Unknown",
                course_id=material.course_id,
                uploader_username=material.uploader.username if material.uploader else "Unknown",
                snippet=snippet or "",
                match_type=match_type,
                created_at=material.created_at
            )
            results.append(result)

        return results
