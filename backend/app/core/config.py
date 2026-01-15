"""
Configuration settings for the application.
Uses pydantic-settings for environment variable management.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    APP_NAME: str = "StudyHub"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # API
    API_V1_PREFIX: str = "/api/v1"

    # Security
    SECRET_KEY: str  # Must be set in .env
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    DATABASE_URL: str  # e.g., postgresql://user:password@localhost/studyhub

    # CORS
    #CORS_ORIGINS: list[str] = ["*"]
    CORS_ORIGINS: list[str] = ["http://localhost:3000","http://localhost:3003", "http://localhost:3004", "http://localhost:5173"]

    # File Upload
    MAX_FILE_SIZE_MB: int = 10
    MAX_IMAGE_SIZE_MB: int = 5
    ALLOWED_FILE_EXTENSIONS: list[str] = [".pdf", ".docx", ".pptx"]
    ALLOWED_IMAGE_EXTENSIONS: list[str] = [".jpg", ".jpeg", ".png"]
    UPLOAD_DIR: str = "uploads"

    # AWS S3 (optional, for production)
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: Optional[str] = None
    AWS_S3_BUCKET: Optional[str] = None
    USE_S3: bool = False

    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAIL_FROM: str = "noreply@studyhub.com"
    EMAIL_FROM_NAME: str = "StudyHub"

    # Frontend URL for email links
    FRONTEND_URL: str = "http://localhost:3000"

    # AI Settings
    OPENAI_API_KEY: Optional[str] = None
    GOOGLE_AI_API_KEY: Optional[str] = None  # Google Gemini API key
    AI_MODEL: str = "gpt-4"
    MAX_QUESTIONS_PER_DAY: int = 50
    MAX_QUESTION_LENGTH: int = 500
    MAX_RESPONSE_LENGTH: int = 2000

    # Vector Database
    CHROMA_PERSIST_DIRECTORY: str = "./chroma_db"
    EMBEDDING_MODEL: str = "text-embedding-ada-002"

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60

    # Logging
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )


# Create global settings instance
settings = Settings()
