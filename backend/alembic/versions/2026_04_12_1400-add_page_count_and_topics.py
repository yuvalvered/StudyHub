"""add page_count and topics_covered to materials

Revision ID: add_topics_001
Revises: improve_fts_001
Create Date: 2026-04-12

This migration adds:
1. page_count - Number of pages in PDF files
2. topics_covered - Comma-separated list of topics extracted by AI (Ollama)
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = 'add_topics_001'
down_revision = 'improve_fts_001'
branch_labels = None
depends_on = None


def column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column already exists in the table."""
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns


def upgrade() -> None:
    # Add page_count column if it doesn't exist
    if not column_exists('materials', 'page_count'):
        op.add_column('materials', sa.Column('page_count', sa.Integer(), nullable=True))

    # Add topics_covered column if it doesn't exist
    if not column_exists('materials', 'topics_covered'):
        op.add_column('materials', sa.Column('topics_covered', sa.Text(), nullable=True))


def downgrade() -> None:
    if column_exists('materials', 'topics_covered'):
        op.drop_column('materials', 'topics_covered')
    if column_exists('materials', 'page_count'):
        op.drop_column('materials', 'page_count')
