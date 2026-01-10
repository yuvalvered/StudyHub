"""add_file_content_text_to_materials

Revision ID: 06f6a6660452
Revises: 9d9c655b3d7c
Create Date: 2026-01-10 11:14:18.467967

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '06f6a6660452'
down_revision = '9d9c655b3d7c'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add file_content_text column to materials table
    op.add_column('materials', sa.Column('file_content_text', sa.Text(), nullable=True))

    # Create GIN index for full-text search (PostgreSQL specific)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_materials_content_text_gin
        ON materials USING gin(to_tsvector('english', COALESCE(file_content_text, '')))
    """)


def downgrade() -> None:
    # Drop GIN index
    op.execute("DROP INDEX IF EXISTS idx_materials_content_text_gin")

    # Drop file_content_text column
    op.drop_column('materials', 'file_content_text')
