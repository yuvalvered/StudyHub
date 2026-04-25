"""
Topic Extraction Service using Google Gemini.
Extracts main topics from document text using Gemini Flash.
"""
import logging
from typing import List, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


class TopicExtractionService:
    """Service for extracting topics from document text using Gemini."""

    GEMINI_MODEL = "gemini-2.5-flash"
    MAX_TOPICS = 15

    @staticmethod
    def extract_topics(text: str) -> Optional[List[str]]:
        """Extract main topics from full document text using Gemini."""
        if not text or len(text.strip()) < 50:
            logger.warning("Text too short for topic extraction")
            return None

        api_key = settings.GEMINI_API_KEY
        if not api_key:
            logger.error("GEMINI_API_KEY not configured")
            return None

        try:
            import google.generativeai as genai
        except ImportError:
            logger.error("google-generativeai not installed")
            return None

        prompt = f"""קרא את הטקסט הבא וחלץ ממנו עד 15 נושאים עיקריים, ממוינים מהמרכזי ביותר לפחות מרכזי.
הוראות קפדניות:
- החזר אך ורק את הנושאים עצמם, מופרדים בפסיקים
- אל תוסיף כותרות, הסברים, מספרים או כל טקסט אחר
- דוגמה לפורמט תקין: מוטיבציה, מנהיגות, קבלת החלטות, תקשורת ארגונית

טקסט:
{text}

נושאים (מופרדים בפסיקים בלבד, מהמרכזי לפחות מרכזי):"""

        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(TopicExtractionService.GEMINI_MODEL)
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.3,
                )
            )

            topics_text = response.text.strip()
            topics = TopicExtractionService._parse_topics(topics_text)
            logger.info(f"Extracted {len(topics)} topics via Gemini")
            return topics

        except Exception as e:
            logger.error(f"Gemini topic extraction failed: {str(e)}")
            return None

    @staticmethod
    def _parse_topics(raw_text: str) -> List[str]:
        """Parse topics from LLM response (comma, newline, or numbered list)."""
        text = raw_text.strip()

        # Strip any preamble line that doesn't contain a comma (likely an intro sentence)
        lines = text.split('\n')
        for i, line in enumerate(lines):
            if ',' in line or (i == len(lines) - 1):
                text = '\n'.join(lines[i:])
                break

        # Remove known prefixes
        for prefix in ['נושאים:', 'הנושאים:', 'Topics:', 'נושאים עיקריים:', 'הנושאים העיקריים:', 'להלן']:
            if text.startswith(prefix):
                text = text[len(prefix):].strip()

        if ',' in text:
            topics = [t.strip() for t in text.split(',')]
        elif '\n' in text:
            topics = [t.strip() for t in text.split('\n')]
        else:
            topics = [text.strip()]

        cleaned = []
        for topic in topics:
            topic = topic.lstrip('0123456789.-) ').strip()
            topic = topic.lstrip('•*- ').strip()
            # Skip lines that look like preamble (too long or contain certain patterns)
            if topic and 2 < len(topic) < 60:
                cleaned.append(topic)

        return cleaned[:TopicExtractionService.MAX_TOPICS]

    @staticmethod
    def topics_to_string(topics: List[str]) -> str:
        """Convert list of topics to comma-separated string for storage."""
        return ', '.join(topics)

    @staticmethod
    def string_to_topics(topics_str: str) -> List[str]:
        """Convert stored comma-separated string to list of topics."""
        if not topics_str:
            return []
        return [t.strip() for t in topics_str.split(',') if t.strip()]
