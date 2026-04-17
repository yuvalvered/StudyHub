"""
AI routes: chatbot, summarization, question generation.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

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
    Ask a question about a specific document or course materials.

    - If material_id is provided: answers based on that specific document
    - If course_id is provided: answers based on all materials in that course
    - If neither: returns error (must specify context)
    """
    # Validate that at least one context is provided
    if not request.material_id and not request.course_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="יש לציין material_id או course_id כדי לשאול שאלה"
        )

    # Convert schema model choice to service model enum
    ai_model = AIModel.GEMINI if request.model == AIModelChoice.gemini else AIModel.OLLAMA

    # Check if selected model is available
    if not DocumentQAService.is_model_available(ai_model):
        model_name = "Gemini" if ai_model == AIModel.GEMINI else "Ollama"
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"שירות ה-{model_name} אינו זמין כרגע. אנא נסה מודל אחר או נסה שוב מאוחר יותר."
        )

    sources: List[str] = []

    # Case 1: Question about a specific material
    if request.material_id:
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

        # Get answer from single document
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

        sources = [material.title]

    # Case 2: Question about course materials
    elif request.course_id:
        # Get all materials in the course with text content
        materials = db.query(Material).filter(
            Material.course_id == request.course_id,
            Material.file_content_text.isnot(None),
            Material.file_content_text != ""
        ).limit(10).all()  # Limit to prevent context overflow

        if not materials:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="לא נמצאו מסמכים עם תוכן טקסט בקורס זה"
            )

        # Prepare documents for multi-doc Q&A
        documents = [
            {
                'id': m.id,
                'title': m.title,
                'text': m.file_content_text
            }
            for m in materials
        ]

        result = DocumentQAService.answer_question_multi_docs(
            question=request.question,
            documents=documents,
            model=ai_model
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="שגיאה בעיבוד השאלה. אנא נסה שוב."
            )

        answer = result['answer']
        sources = result.get('sources', [])

    logger.info(f"User {current_user.id} asked question using {ai_model.value}, answered from {len(sources)} source(s)")

    return AIQuestionResponse(
        answer=answer,
        sources=sources if sources else None
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
