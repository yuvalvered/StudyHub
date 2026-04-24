"""
Topic Extraction Service using Ollama (Llama 3.1).
Extracts main topics from document text using local LLM.
"""
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)


class TopicExtractionService:
    """Service for extracting topics from document text using Ollama."""

    MODEL_NAME = "llama3.1:8b"
    MAX_TEXT_CHARS = 4000  # Limit text to avoid context overflow
    MAX_TOPICS = 10

    @staticmethod
    def extract_topics(text: str) -> Optional[List[str]]:
        """
        Extract main topics from text using Ollama.

        Args:
            text: Document text content

        Returns:
            List of topic strings, or None if extraction failed
        """
        if not text or len(text.strip()) < 50:
            logger.warning("Text too short for topic extraction")
            return None

        try:
            import ollama
        except ImportError:
            logger.error("Ollama package not installed. Run: pip install ollama")
            return None

        # Truncate text if too long
        truncated_text = text[:TopicExtractionService.MAX_TEXT_CHARS] if len(text) > TopicExtractionService.MAX_TEXT_CHARS else text

        prompt = f"""חלץ את הנושאים העיקריים מהטקסט הבא.
החזר רשימה של עד 10 נושאים, מופרדים בפסיקים.
אל תוסיף הסברים או טקסט נוסף - רק את הנושאים עצמם.

טקסט:
{truncated_text}

נושאים:"""

        try:
            response = ollama.chat(
                model=TopicExtractionService.MODEL_NAME,
                messages=[{
                    'role': 'user',
                    'content': prompt
                }],
                options={
                    'temperature': 0.3,  # Lower temperature for more consistent results
                    'num_predict': 200,  # Limit response length
                }
            )

            topics_text = response['message']['content'].strip()

            # Parse topics from response
            topics = TopicExtractionService._parse_topics(topics_text)

            logger.info(f"Extracted {len(topics)} topics")
            return topics

        except Exception as e:
            logger.error(f"Ollama topic extraction failed: {str(e)}")
            return None

    @staticmethod
    def _parse_topics(raw_text: str) -> List[str]:
        """
        Parse topics from LLM response.
        Handles various formats: comma-separated, newline-separated, numbered lists.
        """
        # Remove common prefixes
        text = raw_text.strip()
        for prefix in ['נושאים:', 'הנושאים:', 'Topics:', 'נושאים עיקריים:']:
            if text.startswith(prefix):
                text = text[len(prefix):].strip()

        # Try comma-separated first
        if ',' in text:
            topics = [t.strip() for t in text.split(',')]
        # Try newline-separated
        elif '\n' in text:
            topics = [t.strip() for t in text.split('\n')]
        else:
            topics = [text.strip()]

        # Clean up each topic
        cleaned_topics = []
        for topic in topics:
            # Remove numbering (1. 2. etc)
            topic = topic.lstrip('0123456789.-) ').strip()
            # Remove bullet points
            topic = topic.lstrip('•*- ').strip()

            if topic and len(topic) > 1:
                cleaned_topics.append(topic)

        # Limit number of topics
        return cleaned_topics[:TopicExtractionService.MAX_TOPICS]

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

    @staticmethod
    def is_ollama_available() -> bool:
        """Check if Ollama service is running and model is available."""
        try:
            import ollama
            # Try to list models
            response = ollama.list()
            # Response is an object with 'models' attribute containing Model objects
            models = response.models if hasattr(response, 'models') else []
            model_names = [m.model for m in models if hasattr(m, 'model')]
            return any(TopicExtractionService.MODEL_NAME in name for name in model_names)
        except Exception as e:
            logger.warning(f"Ollama not available: {str(e)}")
            return False
