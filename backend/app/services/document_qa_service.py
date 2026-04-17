"""
Document Q&A Service using Ollama or Gemini.
Allows users to ask questions about documents using LLM.
"""
import logging
from typing import Optional, List
from enum import Enum

from app.core.config import settings

logger = logging.getLogger(__name__)


class AIModel(str, Enum):
    """Available AI models."""
    OLLAMA = "ollama"
    GEMINI = "gemini"


class DocumentQAService:
    """Service for answering questions about documents using LLM."""

    # Ollama settings
    OLLAMA_MODEL = "llama3.1:8b"

    # Gemini settings
    GEMINI_MODEL = "gemini-2.5-flash"

    # Common settings
    MAX_CONTEXT_CHARS = 6000  # Limit context to avoid overflow
    MAX_CONTEXT_CHARS_GEMINI = 30000  # Gemini has larger context window
    MAX_RESPONSE_TOKENS = 1000

    @staticmethod
    def _build_prompt(question: str, document_text: str, document_title: str = "") -> str:
        """Build the prompt for Q&A."""
        title_context = f" בשם '{document_title}'" if document_title else ""

        return f"""אתה עוזר לימודי מועיל. ענה על השאלה הבאה בהתבסס אך ורק על המסמך{title_context} שלהלן.
אם התשובה לא נמצאת במסמך, ציין זאת בבירור ואל תמציא מידע.
ענה בעברית בצורה ברורה ותמציתית.

מסמך:
---
{document_text}
---

שאלה: {question}

תשובה:"""

    @staticmethod
    def _build_multi_doc_prompt(question: str, combined_text: str) -> str:
        """Build the prompt for multi-document Q&A."""
        return f"""אתה עוזר לימודי מועיל. ענה על השאלה הבאה בהתבסס על המסמכים שלהלן.
אם התשובה לא נמצאת במסמכים, ציין זאת בבירור.
ענה בעברית בצורה ברורה ותמציתית.

מסמכים:
{combined_text}

שאלה: {question}

תשובה:"""

    # ==================== OLLAMA METHODS ====================

    @staticmethod
    def _answer_with_ollama(prompt: str) -> Optional[str]:
        """Get answer using Ollama."""
        try:
            import ollama
        except ImportError:
            logger.error("Ollama package not installed. Run: pip install ollama")
            return None

        try:
            response = ollama.chat(
                model=DocumentQAService.OLLAMA_MODEL,
                messages=[{
                    'role': 'user',
                    'content': prompt
                }],
                options={
                    'temperature': 0.3,
                    'num_predict': DocumentQAService.MAX_RESPONSE_TOKENS,
                }
            )
            return response['message']['content'].strip()
        except Exception as e:
            logger.error(f"Ollama Q&A failed: {str(e)}")
            return None

    @staticmethod
    def is_ollama_available() -> bool:
        """Check if Ollama service is running and model is available."""
        try:
            import ollama
            response = ollama.list()
            models = response.models if hasattr(response, 'models') else []
            model_names = [m.model for m in models if hasattr(m, 'model')]
            return any(DocumentQAService.OLLAMA_MODEL in name for name in model_names)
        except Exception as e:
            logger.warning(f"Ollama not available: {str(e)}")
            return False

    # ==================== GEMINI METHODS ====================

    @staticmethod
    def _answer_with_gemini(prompt: str) -> Optional[str]:
        """Get answer using Google Gemini."""
        try:
            import google.generativeai as genai
        except ImportError:
            logger.error("Google Generative AI package not installed. Run: pip install google-generativeai")
            return None

        api_key = settings.GEMINI_API_KEY
        if not api_key:
            logger.error("GEMINI_API_KEY not set in settings")
            return None

        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(DocumentQAService.GEMINI_MODEL)

            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.3,
                    max_output_tokens=DocumentQAService.MAX_RESPONSE_TOKENS,
                )
            )

            return response.text.strip()
        except Exception as e:
            logger.error(f"Gemini Q&A failed: {str(e)}")
            return None

    @staticmethod
    def is_gemini_available() -> bool:
        """Check if Gemini API is configured."""
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            return False

        try:
            import google.generativeai  # noqa: F401
            return True
        except ImportError:
            logger.warning("google-generativeai package not installed")
            return False

    # ==================== MAIN PUBLIC METHODS ====================

    @staticmethod
    def answer_question(
        question: str,
        document_text: str,
        document_title: str = "",
        model: AIModel = AIModel.OLLAMA
    ) -> Optional[str]:
        """
        Answer a question based on document content.

        Args:
            question: The user's question
            document_text: The document content to search for answers
            document_title: Optional document title for context
            model: Which AI model to use (ollama or gemini)

        Returns:
            Answer string, or None if failed
        """
        if not question or not question.strip():
            logger.warning("Empty question provided")
            return None

        if not document_text or len(document_text.strip()) < 20:
            logger.warning("Document text too short for Q&A")
            return None

        # Set max context based on model
        max_chars = (DocumentQAService.MAX_CONTEXT_CHARS_GEMINI
                     if model == AIModel.GEMINI
                     else DocumentQAService.MAX_CONTEXT_CHARS)

        # Truncate document if too long
        truncated_text = document_text[:max_chars] if len(document_text) > max_chars else document_text

        # Build prompt
        prompt = DocumentQAService._build_prompt(question, truncated_text, document_title)

        # Get answer based on model choice
        if model == AIModel.GEMINI:
            answer = DocumentQAService._answer_with_gemini(prompt)
        else:
            answer = DocumentQAService._answer_with_ollama(prompt)

        if answer:
            logger.info(f"Successfully answered question using {model.value}")

        return answer

    @staticmethod
    def answer_question_multi_docs(
        question: str,
        documents: List[dict],
        model: AIModel = AIModel.OLLAMA
    ) -> Optional[dict]:
        """
        Answer a question based on multiple documents.

        Args:
            question: The user's question
            documents: List of dicts with 'text', 'title', and 'id' keys
            model: Which AI model to use (ollama or gemini)

        Returns:
            Dict with 'answer' and 'sources' (list of doc titles used), or None if failed
        """
        if not question or not documents:
            return None

        # Set max context based on model
        max_chars = (DocumentQAService.MAX_CONTEXT_CHARS_GEMINI
                     if model == AIModel.GEMINI
                     else DocumentQAService.MAX_CONTEXT_CHARS)

        # Combine documents, respecting max context
        combined_text = ""
        sources_used = []
        chars_remaining = max_chars

        for doc in documents:
            doc_text = doc.get('text', '')
            doc_title = doc.get('title', 'מסמך ללא שם')

            if not doc_text:
                continue

            # Add document header
            header = f"\n\n=== {doc_title} ===\n"

            if len(header) + min(len(doc_text), chars_remaining) > chars_remaining:
                break

            chars_remaining -= len(header)
            combined_text += header

            text_to_add = doc_text[:chars_remaining]
            combined_text += text_to_add
            chars_remaining -= len(text_to_add)
            sources_used.append(doc_title)

            if chars_remaining <= 100:
                break

        if not combined_text:
            return None

        # Build prompt
        prompt = DocumentQAService._build_multi_doc_prompt(question, combined_text)

        # Get answer based on model choice
        if model == AIModel.GEMINI:
            answer = DocumentQAService._answer_with_gemini(prompt)
        else:
            answer = DocumentQAService._answer_with_ollama(prompt)

        if not answer:
            return None

        return {
            'answer': answer,
            'sources': sources_used
        }

    @staticmethod
    def is_model_available(model: AIModel) -> bool:
        """Check if the specified model is available."""
        if model == AIModel.GEMINI:
            return DocumentQAService.is_gemini_available()
        else:
            return DocumentQAService.is_ollama_available()
