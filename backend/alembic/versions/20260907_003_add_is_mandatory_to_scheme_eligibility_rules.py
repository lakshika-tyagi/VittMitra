"""Add is_mandatory column to scheme_eligibility_rules

Revision ID: 003_rule_mandatory_flag
Revises: 002_scheme_knowledge
Create Date: 2026-09-07 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '003_rule_mandatory_flag'
down_revision: Union[str, None] = '002_scheme_knowledge'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'scheme_eligibility_rules',
        sa.Column('is_mandatory', sa.Boolean(), server_default=sa.text('true'), nullable=False)
    )


def downgrade() -> None:
    op.drop_column('scheme_eligibility_rules', 'is_mandatory')
