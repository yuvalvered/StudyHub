"""
CORS middleware configuration.
Already configured in main.py, but can be customized here.
"""
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings


def setup_cors(app):
    """
    Configure CORS middleware for the application.

    Args:
        app: FastAPI application instance
    """
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
