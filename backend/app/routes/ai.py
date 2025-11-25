"""
AI routes: chatbot, summarization, question generation.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.ai import (
    AIQuestionRequest,
    AIQuestionResponse,
    AISummarizeRequest,
    AISummarizeResponse,
    AIGenerateQuestionsRequest,
    AIGenerateQuestionsResponse
)

router = APIRouter(prefix="/ai", tags=["AI"])


@router.post("/ask", response_model=AIQuestionResponse)
async def ask_ai(
    request: AIQuestionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Ask a question to the AI chatbot.

    The AI will use RAG (Retrieval Augmented Generation) to answer
    based on uploaded study materials.
    """
    # TODO: Implement AI question answering
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="AI chatbot not yet implemented"
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
