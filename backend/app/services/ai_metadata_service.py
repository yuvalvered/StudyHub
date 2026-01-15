"""
AI Metadata Service - Extract metadata from documents using Google Gemini.
"""
import json
import logging
from typing import Optional, Dict, Any

import google.generativeai as genai

from app.core.config import settings

logger = logging.getLogger(__name__)


class AIMetadataService:
    """Service for extracting metadata from documents using AI."""

    _model = None

    @classmethod
    def _get_model(cls):
        """Get or initialize the Gemini model."""
        if cls._model is None and settings.GOOGLE_AI_API_KEY:
            genai.configure(api_key=settings.GOOGLE_AI_API_KEY)
            cls._model = genai.GenerativeModel('gemini-2.0-flash')
        return cls._model

    @classmethod
    def extract_metadata(cls, text: str) -> Dict[str, Any]:
        """
        Extract metadata from document text using Gemini.

        Args:
            text: The extracted text from a PDF document

        Returns:
            Dictionary with page_count and topics, or empty dict on failure
        """
        print(f"[AI] extract_metadata called with text length: {len(text)}")
        print(f"[AI] GOOGLE_AI_API_KEY configured: {bool(settings.GOOGLE_AI_API_KEY)}")

        if not settings.GOOGLE_AI_API_KEY:
            logger.warning("GOOGLE_AI_API_KEY not configured, skipping AI metadata extraction")
            print("[AI] No API key, returning empty")
            return {}

        model = cls._get_model()
        print(f"[AI] Model initialized: {model is not None}")
        if not model:
            return {}

        # Limit text to avoid token limits (approximately 30K characters)
        max_chars = 30000
        truncated_text = text[:max_chars] if len(text) > max_chars else text

        prompt = f"""אתה מנתח מסמכים אקדמיים. נתח את הטקסט הבא וחלץ:
1. page_count - הערכה של מספר העמודים במסמך המקורי (בהתבסס על אורך הטקסט, בממוצע כ-500 מילים לעמוד)
2. topics - רשימה של 3-7 נושאים מרכזיים שמופיעים במסמך (בעברית)

החזר JSON בלבד בפורמט הבא, ללא טקסט נוסף:
{{"page_count": מספר, "topics": ["נושא 1", "נושא 2", "נושא 3"]}}

הטקסט:
{truncated_text}"""

        try:
            print("[AI] Calling Gemini API...")
            response = model.generate_content(prompt)
            response_text = response.text.strip()
            print(f"[AI] Got response: {response_text[:200]}...")

            # Clean the response - remove markdown code blocks if present
            if response_text.startswith('```'):
                lines = response_text.split('\n')
                # Remove first and last lines (```json and ```)
                response_text = '\n'.join(lines[1:-1])

            # Parse JSON response
            result = json.loads(response_text)

            # Validate the response
            if 'page_count' in result and 'topics' in result:
                # Ensure page_count is an integer
                result['page_count'] = int(result['page_count'])
                # Ensure topics is a list
                if not isinstance(result['topics'], list):
                    result['topics'] = []

                logger.info(f"Successfully extracted metadata: {result['page_count']} pages, {len(result['topics'])} topics")
                print(f"[AI] SUCCESS! page_count={result['page_count']}, topics={result['topics']}")
                return result
            else:
                logger.warning(f"Invalid response format from Gemini: {response_text}")
                return {}

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini response as JSON: {e}")
            print(f"[AI] JSON parse error: {e}")
            return {}
        except Exception as e:
            logger.error(f"Error calling Gemini API: {e}")
            print(f"[AI] Exception: {e}")
            return {}
