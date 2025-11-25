"""
Base class for all SQLAlchemy models.
Import all models here to make them available for Alembic migrations.
"""
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

# Import all models here so Alembic can detect them
# This will be populated as we create models
