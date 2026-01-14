"""
StudyHub Backend - FastAPI Application
Main entry point for the application.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.core.config import settings
from app.routes import auth, users, materials, ai, courses, ratings, comments, discussions, notifications, search

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="StudyHub - Platform for sharing study materials and AI-powered learning",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS - Allow specific origins with credentials
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,  # Specific allowed origins from config
    allow_credentials=True,  # Allow cookies and Authorization headers
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Mount static files directory for uploads
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)  # Create if doesn't exist
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(discussions.router, prefix="/api/v1")  # Must be before courses for /courses/{id}/discussions
app.include_router(courses.router, prefix="/api/v1")
app.include_router(materials.router, prefix="/api/v1")
app.include_router(ratings.router, prefix="/api/v1")
app.include_router(comments.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")
app.include_router(search.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")

# TODO: Add more routers as they are implemented
# from app.routes import courses, ratings, discussions, comments, messages, notifications, search
# app.include_router(courses.router, prefix="/api/v1")
# app.include_router(ratings.router, prefix="/api/v1")
# app.include_router(discussions.router, prefix="/api/v1")
# app.include_router(comments.router, prefix="/api/v1")
# app.include_router(messages.router, prefix="/api/v1")
# app.include_router(notifications.router, prefix="/api/v1")
# app.include_router(search.router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint - API health check."""
    return {
        "message": "Welcome to StudyHub API",
        "version": settings.APP_VERSION,
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )


