"""Create knowledge chunks table for RAG intelligence layer

Revision ID: 007_knowledge_chunks_table
Revises: 006_channel_partners_and_applications
Create Date: 2026-09-07 23:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '007_knowledge_chunks_table'
down_revision: Union[str, None] = '006_channel_partners_and_applications'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'knowledge_chunks',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('chunk_id', sa.String(length=100), nullable=False),
        sa.Column('scheme_id', sa.Integer(), nullable=True),
        sa.Column('scheme_code', sa.String(length=50), nullable=True),
        sa.Column('source_id', sa.Integer(), nullable=True),
        sa.Column('source_name', sa.String(length=255), nullable=False),
        sa.Column('source_type', sa.String(length=50), nullable=False, server_default='OFFICIAL_GUIDELINE'),
        sa.Column('official_url', sa.String(length=1000), nullable=True),
        sa.Column('section_type', sa.String(length=50), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('token_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('content_hash', sa.String(length=64), nullable=False),
        sa.Column('embedding', sa.JSON(), nullable=True),
        sa.Column('embedding_model', sa.String(length=100), nullable=False, server_default='text-embedding-004'),
        sa.Column('chunk_metadata', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('version', sa.String(length=50), nullable=False, server_default='1.0'),
        sa.Column('last_verified_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['scheme_id'], ['schemes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['source_id'], ['scheme_sources.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_knowledge_chunks_chunk_id'), 'knowledge_chunks', ['chunk_id'], unique=True)
    op.create_index(op.f('ix_knowledge_chunks_scheme_id'), 'knowledge_chunks', ['scheme_id'], unique=False)
    op.create_index(op.f('ix_knowledge_chunks_scheme_code'), 'knowledge_chunks', ['scheme_code'], unique=False)
    op.create_index(op.f('ix_knowledge_chunks_source_id'), 'knowledge_chunks', ['source_id'], unique=False)
    op.create_index(op.f('ix_knowledge_chunks_section_type'), 'knowledge_chunks', ['section_type'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_knowledge_chunks_section_type'), table_name='knowledge_chunks')
    op.drop_index(op.f('ix_knowledge_chunks_source_id'), table_name='knowledge_chunks')
    op.drop_index(op.f('ix_knowledge_chunks_scheme_code'), table_name='knowledge_chunks')
    op.drop_index(op.f('ix_knowledge_chunks_scheme_id'), table_name='knowledge_chunks')
    op.drop_index(op.f('ix_knowledge_chunks_chunk_id'), table_name='knowledge_chunks')
    op.drop_table('knowledge_chunks')
