"""add_ai_metadata_to_materials

Revision ID: add_ai_metadata_001
Revises: 06f6a6660452
Create Date: 2026-01-15 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'add_ai_metadata_001'
down_revision = '06f6a6660452'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add page_count column
    op.add_column('materials', sa.Column('page_count', sa.Integer(), nullable=True))

    # Add topics column (JSON array)
    op.add_column('materials', sa.Column('topics', sa.JSON(), nullable=True))

    # Add ai_processed column with default False
    op.add_column('materials', sa.Column('ai_processed', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    op.drop_column('materials', 'ai_processed')
    op.drop_column('materials', 'topics')
    op.drop_column('materials', 'page_count')
