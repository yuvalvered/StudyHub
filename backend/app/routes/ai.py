"""
AI routes: chatbot, summarization, question generation.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.material import Material
from app.schemas.ai import (
    AIQuestionRequest,
    AIQuestionResponse,
    AISummarizeRequest,
    AISummarizeResponse,
    AIGenerateQuestionsRequest,
    AIGenerateQuestionsResponse,
    AIModelChoice
)
from app.services.document_qa_service import DocumentQAService, AIModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["AI"])


@router.post("/ask", response_model=AIQuestionResponse)
async def ask_ai(
    request: AIQuestionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Ask a question about a specific document.
    """
    ai_model = AIModel.GEMINI if request.model == AIModelChoice.gemini else AIModel.OLLAMA

    if not DocumentQAService.is_model_available(ai_model):
        model_name = "Gemini" if ai_model == AIModel.GEMINI else "Ollama"
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"שירות ה-{model_name} אינו זמין כרגע. אנא נסה מודל אחר או נסה שוב מאוחר יותר."
        )

    material = db.query(Material).filter(Material.id == request.material_id).first()
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"מסמך עם מזהה {request.material_id} לא נמצא"
        )

    if not material.file_content_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="לא ניתן לשאול שאלות על מסמך זה - אין תוכן טקסט זמין"
        )

    answer = DocumentQAService.answer_question(
        question=request.question,
        document_text=material.file_content_text,
        document_title=material.title,
        model=ai_model
    )

    if not answer:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="שגיאה בעיבוד השאלה. אנא נסה שוב."
        )

    logger.info(f"User {current_user.id} asked question using {ai_model.value} on material {material.id}")

    return AIQuestionResponse(
        answer=answer,
        sources=[material.title]
    )


@router.post("/summarize", response_model=AISummarizeResponse)
async def summarize_material(
    request: AISummarizeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate an automatic summary of a study material.
    """
    # TODO: Implement AI summarization
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="AI summarization not yet implemented"
    )


@router.post("/generate-questions", response_model=AIGenerateQuestionsResponse)
async def generate_questions(
    request: AIGenerateQuestionsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate practice questions based on study material.
    """
    # TODO: Implement question generation
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Question generation not yet implemented"
    )
