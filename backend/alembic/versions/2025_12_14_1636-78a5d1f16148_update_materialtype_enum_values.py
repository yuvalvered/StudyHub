"""update_materialtype_enum_values

Revision ID: 78a5d1f16148
Revises: 22c9fc4babb5
Create Date: 2025-12-14 16:36:36.513422

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '78a5d1f16148'
down_revision = '22c9fc4babb5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop and recreate the enum type with new values
    # First, we need to convert the column to use text temporarily
    op.execute("ALTER TABLE materials ALTER COLUMN material_type TYPE VARCHAR(50)")

    # Drop the old enum type
    op.execute("DROP TYPE IF EXISTS materialtype")

    # Create the new enum type with lowercase values
    op.execute("""
        CREATE TYPE materialtype AS ENUM (
            'summaries',
            'homework',
            'lectures',
            'exercises',
            'exam_prep',
            'quiz_prep',
            'quizme'
        )
    """)

    # Convert the column back to use the enum type
    op.execute("ALTER TABLE materials ALTER COLUMN material_type TYPE materialtype USING material_type::materialtype")


def downgrade() -> None:
    # Revert back to old enum values
    op.execute("ALTER TABLE materials ALTER COLUMN material_type TYPE VARCHAR(50)")
    op.execute("DROP TYPE IF EXISTS materialtype")
    op.execute("""
        CREATE TYPE materialtype AS ENUM (
            'SUMMARIES',
            'HOMEWORK',
            'LECTURES',
            'EXERCISES',
            'EXAM_PREP',
            'QUIZ_PREP',
            'QUIZME'
        )
    """)
    op.execute("ALTER TABLE materials ALTER COLUMN material_type TYPE materialtype USING material_type::materialtype")
