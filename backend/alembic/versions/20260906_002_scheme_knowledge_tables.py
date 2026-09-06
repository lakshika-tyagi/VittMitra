"""Create scheme knowledge tables (schemes, sources, rules, documents)

Revision ID: 002_scheme_knowledge
Revises: 001_postgis_init
Create Date: 2026-09-06 18:40:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '002_scheme_knowledge'
down_revision: Union[str, None] = '001_postgis_init'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create schemes master table
    op.create_table(
        'schemes',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('scheme_code', sa.String(length=50), nullable=False),
        sa.Column('scheme_name', sa.String(length=255), nullable=False),
        sa.Column('short_description', sa.Text(), nullable=False),
        sa.Column('nodal_ministry', sa.String(length=255), nullable=False),
        sa.Column('nodal_department', sa.String(length=255), nullable=True),
        sa.Column('geography_level', sa.String(length=50), server_default='NATIONAL', nullable=False),
        sa.Column('target_beneficiaries', sa.JSON(), nullable=False),
        sa.Column('purpose', sa.Text(), nullable=False),
        sa.Column('benefits_summary', sa.JSON(), nullable=False),
        sa.Column('business_stages', sa.JSON(), nullable=False),
        sa.Column('sectors', sa.JSON(), nullable=False),
        sa.Column('data_status', sa.String(length=20), server_default='VERIFIED', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_schemes'))
    )
    op.create_index(op.f('ix_schemes_scheme_code'), 'schemes', ['scheme_code'], unique=True)

    # 2. Create scheme_sources table
    op.create_table(
        'scheme_sources',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('scheme_id', sa.Integer(), nullable=False),
        sa.Column('source_name', sa.String(length=255), nullable=False),
        sa.Column('source_type', sa.String(length=50), nullable=False),
        sa.Column('official_url', sa.String(length=1000), nullable=False),
        sa.Column('document_reference', sa.String(length=255), nullable=True),
        sa.Column('publication_date', sa.String(length=50), nullable=True),
        sa.Column('last_verified_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('version', sa.String(length=50), server_default='1.0', nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['scheme_id'], ['schemes.id'], name=op.f('fk_scheme_sources_scheme_id_schemes'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_scheme_sources'))
    )
    op.create_index(op.f('ix_scheme_sources_scheme_id'), 'scheme_sources', ['scheme_id'], unique=False)

    # 3. Create scheme_eligibility_rules table
    op.create_table(
        'scheme_eligibility_rules',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('scheme_id', sa.Integer(), nullable=False),
        sa.Column('rule_code', sa.String(length=100), nullable=False),
        sa.Column('field_name', sa.String(length=100), nullable=False),
        sa.Column('operator', sa.String(length=20), nullable=False),
        sa.Column('expected_value', sa.JSON(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('source_id', sa.Integer(), nullable=True),
        sa.Column('rule_version', sa.String(length=50), server_default='1.0', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['scheme_id'], ['schemes.id'], name=op.f('fk_scheme_eligibility_rules_scheme_id_schemes'), ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['source_id'], ['scheme_sources.id'], name=op.f('fk_scheme_eligibility_rules_source_id_scheme_sources'), ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_scheme_eligibility_rules'))
    )
    op.create_index(op.f('ix_scheme_eligibility_rules_scheme_id'), 'scheme_eligibility_rules', ['scheme_id'], unique=False)

    # 4. Create scheme_documents table
    op.create_table(
        'scheme_documents',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('scheme_id', sa.Integer(), nullable=False),
        sa.Column('document_code', sa.String(length=100), nullable=False),
        sa.Column('document_name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_mandatory', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('source_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['scheme_id'], ['schemes.id'], name=op.f('fk_scheme_documents_scheme_id_schemes'), ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['source_id'], ['scheme_sources.id'], name=op.f('fk_scheme_documents_source_id_scheme_sources'), ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_scheme_documents'))
    )
    op.create_index(op.f('ix_scheme_documents_scheme_id'), 'scheme_documents', ['scheme_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_scheme_documents_scheme_id'), table_name='scheme_documents')
    op.drop_table('scheme_documents')
    op.drop_index(op.f('ix_scheme_eligibility_rules_scheme_id'), table_name='scheme_eligibility_rules')
    op.drop_table('scheme_eligibility_rules')
    op.drop_index(op.f('ix_scheme_sources_scheme_id'), table_name='scheme_sources')
    op.drop_table('scheme_sources')
    op.drop_index(op.f('ix_schemes_scheme_code'), table_name='schemes')
    op.drop_table('schemes')
