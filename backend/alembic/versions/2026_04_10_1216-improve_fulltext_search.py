"""improve_fulltext_search

Revision ID: improve_fts_001
Revises: 06f6a6660452
Create Date: 2026-04-10

This migration improves full-text search to support both Hebrew and English:
1. Drops the old English-only GIN index
2. Creates a new GIN index using 'simple' tokenizer (works for all languages)
3. Adds pg_trgm extension for fuzzy/similarity search
4. Creates trigram index for typo-tolerant search
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'improve_fts_001'
down_revision = '06f6a6660452'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop old English-only GIN index
    op.execute("DROP INDEX IF EXISTS idx_materials_content_text_gin")

    # Create pg_trgm extension for fuzzy search (requires superuser or extension already available)
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")

    # Create new GIN index with 'simple' tokenizer (works for Hebrew, English, and all languages)
    # 'simple' tokenizer splits on whitespace and lowercases - doesn't depend on language dictionaries
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_materials_content_fts
        ON materials USING gin(to_tsvector('simple', COALESCE(file_content_text, '')))
    """)

    # Create GIN index on title for full-text search
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_materials_title_fts
        ON materials USING gin(to_tsvector('simple', COALESCE(title, '')))
    """)

    # Create GIN index on description for full-text search
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_materials_description_fts
        ON materials USING gin(to_tsvector('simple', COALESCE(description, '')))
    """)

    # Create trigram index for fuzzy search on title (catches typos)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_materials_title_trgm
        ON materials USING gin(title gin_trgm_ops)
    """)

    # Create trigram index for fuzzy search on content
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_materials_content_trgm
        ON materials USING gin(file_content_text gin_trgm_ops)
    """)


def downgrade() -> None:
    # Drop new indexes
    op.execute("DROP INDEX IF EXISTS idx_materials_content_trgm")
    op.execute("DROP INDEX IF EXISTS idx_materials_title_trgm")
    op.execute("DROP INDEX IF EXISTS idx_materials_description_fts")
    op.execute("DROP INDEX IF EXISTS idx_materials_title_fts")
    op.execute("DROP INDEX IF EXISTS idx_materials_content_fts")

    # Recreate old English-only index
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_materials_content_text_gin
        ON materials USING gin(to_tsvector('english', COALESCE(file_content_text, '')))
    """)
