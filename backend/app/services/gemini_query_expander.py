"""
Semantic query expansion using Google Gemini.
Takes a search query and returns related/synonymous terms to broaden the search.
"""
import json
import logging
import re
from typing import List

from app.core.config import settings

logger = logging.getLogger(__name__)


def expand_query_with_gemini(query: str, num_terms: int = 8) -> List[str]:
    """
    Use Gemini to expand a search query with related academic/technical terms.

    Example:
        "אלגוריתם דירוג" -> ["page rank", "ranking algorithm", "דירוג גרפים",
                              "web ranking", "link analysis", ...]

    Returns empty list on any failure so search still works without expansion.
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        logger.warning("GEMINI_API_KEY not set — skipping semantic expansion")
        return []

    prompt = (
        f'אתה עוזר לחיפוש אקדמי. המשתמש חיפש: "{query}".\n'
        f"תן לי עד {num_terms} מונחים טכניים/אקדמיים נרדפים או קשורים — בעברית ובאנגלית.\n"
        "כלול: שמות אחרים לאותו מושג, תרגומים, מונחים ספציפיים יותר או כלליים יותר, ראשי תיבות.\n"
        "חשוב: החזר אך ורק שורה אחת של JSON תקני — ללא markdown, ללא ```json, ללא הסברים.\n"
        "דוגמה לפורמט הנדרש:\n"
        '["term1", "term2", "term3"]'
    )

    try:
        from google import genai
        from google.genai import types as genai_types
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=genai_types.GenerateContentConfig(
                temperature=0.2,
                max_output_tokens=600,
            ),
        )
        raw = response.text.strip()

        # Strip markdown code fences if Gemini added them anyway
        if raw.startswith("```"):
            raw = re.sub(r"^```[a-z]*\n?", "", raw)
            raw = re.sub(r"\n?```$", "", raw)
            raw = raw.strip()

        # Extract JSON array
        start = raw.find("[")
        end = raw.rfind("]") + 1
        if start == -1 or end <= start:
            logger.warning(f"Gemini returned unexpected format: {raw[:200]}")
            return []

        terms = json.loads(raw[start:end])
        cleaned = [t.strip() for t in terms if isinstance(t, str) and t.strip()]
        logger.info(f"Semantic expansion for '{query}': {cleaned}")
        return cleaned[:num_terms]

    except Exception as e:
        logger.warning(f"Gemini query expansion failed: {e}")
        return []
