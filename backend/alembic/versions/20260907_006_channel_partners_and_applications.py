"""Create channel partner and application tracking tables

Revision ID: 006_channel_partners_and_applications
Revises: 005_location_intelligence_tables
Create Date: 2026-09-07 22:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
import geoalchemy2

# revision identifiers, used by Alembic.
revision: str = '006_channel_partners_and_applications'
down_revision: Union[str, None] = '005_location_intelligence_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. channel_partners table
    op.create_table(
        'channel_partners',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('partner_code', sa.String(length=50), nullable=False),
        sa.Column('organization_name', sa.String(length=255), nullable=False),
        sa.Column('partner_type', sa.String(length=100), nullable=False),
        sa.Column('state', sa.String(length=100), nullable=False),
        sa.Column('district', sa.String(length=100), nullable=False),
        sa.Column('city', sa.String(length=100), nullable=True),
        sa.Column('pincode', sa.String(length=10), nullable=True),
        sa.Column('address', sa.Text(), nullable=False),
        sa.Column('latitude', sa.Numeric(precision=9, scale=6), nullable=True),
        sa.Column('longitude', sa.Numeric(precision=9, scale=6), nullable=True),
        sa.Column(
            'location',
            geoalchemy2.types.Geometry(
                geometry_type='POINT',
                srid=4326,
                from_text='ST_GeomFromEWKT',
                name='geometry',
                nullable=True
            ),
            nullable=True
        ),
        sa.Column('services_offered', sa.JSON(), nullable=False),
        sa.Column('contact_person', sa.String(length=255), nullable=True),
        sa.Column('contact_phone', sa.String(length=50), nullable=True),
        sa.Column('contact_email', sa.String(length=100), nullable=True),
        sa.Column('official_url', sa.String(length=500), nullable=True),
        sa.Column('verification_status', sa.String(length=50), server_default='VERIFIED', nullable=False),
        sa.Column('source_agency', sa.String(length=255), nullable=False),
        sa.Column('source_url', sa.String(length=500), nullable=True),
        sa.Column('last_verified_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_channel_partners_partner_code'), 'channel_partners', ['partner_code'], unique=True)
    op.create_index(op.f('ix_channel_partners_organization_name'), 'channel_partners', ['organization_name'], unique=False)
    op.create_index(op.f('ix_channel_partners_partner_type'), 'channel_partners', ['partner_type'], unique=False)
    op.create_index(op.f('ix_channel_partners_state'), 'channel_partners', ['state'], unique=False)
    op.create_index(op.f('ix_channel_partners_district'), 'channel_partners', ['district'], unique=False)

    # 2. scheme_channel_partners table
    op.create_table(
        'scheme_channel_partners',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('scheme_id', sa.Integer(), nullable=False),
        sa.Column('channel_partner_id', sa.Integer(), nullable=False),
        sa.Column('role_type', sa.String(length=100), server_default='LENDING_INSTITUTION', nullable=False),
        sa.Column('service_scope', sa.Text(), nullable=True),
        sa.Column('is_primary_partner', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('verification_status', sa.String(length=50), server_default='VERIFIED', nullable=False),
        sa.Column('source_reference', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['channel_partner_id'], ['channel_partners.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['scheme_id'], ['schemes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_scheme_channel_partners_scheme_id'), 'scheme_channel_partners', ['scheme_id'], unique=False)
    op.create_index(op.f('ix_scheme_channel_partners_channel_partner_id'), 'scheme_channel_partners', ['channel_partner_id'], unique=False)

    # 3. applications table
    op.create_table(
        'applications',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('entrepreneur_id', sa.Integer(), nullable=False),
        sa.Column('scheme_id', sa.Integer(), nullable=False),
        sa.Column('channel_partner_id', sa.Integer(), nullable=True),
        sa.Column('application_reference_number', sa.String(length=100), nullable=True),
        sa.Column('application_date', sa.Date(), nullable=False),
        sa.Column('current_status', sa.String(length=50), server_default='APPLICATION_STARTED', nullable=False),
        sa.Column('status_note', sa.Text(), nullable=True),
        sa.Column('target_loan_amount', sa.Numeric(precision=14, scale=2), nullable=True),
        sa.Column('target_subsidy_amount', sa.Numeric(precision=14, scale=2), nullable=True),
        sa.Column('official_portal_url', sa.String(length=500), nullable=True),
        sa.Column('source_type', sa.String(length=50), server_default='USER_RECORDED', nullable=False),
        sa.Column('last_updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['channel_partner_id'], ['channel_partners.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['entrepreneur_id'], ['entrepreneurs.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['scheme_id'], ['schemes.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_applications_entrepreneur_id'), 'applications', ['entrepreneur_id'], unique=False)
    op.create_index(op.f('ix_applications_scheme_id'), 'applications', ['scheme_id'], unique=False)
    op.create_index(op.f('ix_applications_channel_partner_id'), 'applications', ['channel_partner_id'], unique=False)
    op.create_index(op.f('ix_applications_application_reference_number'), 'applications', ['application_reference_number'], unique=False)
    op.create_index(op.f('ix_applications_current_status'), 'applications', ['current_status'], unique=False)

    # 4. application_status_history table
    op.create_table(
        'application_status_history',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('application_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('status_note', sa.Text(), nullable=True),
        sa.Column('recorded_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('source_type', sa.String(length=50), server_default='USER_RECORDED', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['application_id'], ['applications.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_application_status_history_application_id'), 'application_status_history', ['application_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_application_status_history_application_id'), table_name='application_status_history')
    op.drop_table('application_status_history')
    op.drop_index(op.f('ix_applications_current_status'), table_name='applications')
    op.drop_index(op.f('ix_applications_application_reference_number'), table_name='applications')
    op.drop_index(op.f('ix_applications_channel_partner_id'), table_name='applications')
    op.drop_index(op.f('ix_applications_scheme_id'), table_name='applications')
    op.drop_index(op.f('ix_applications_entrepreneur_id'), table_name='applications')
    op.drop_table('applications')
    op.drop_index(op.f('ix_scheme_channel_partners_channel_partner_id'), table_name='scheme_channel_partners')
    op.drop_index(op.f('ix_scheme_channel_partners_scheme_id'), table_name='scheme_channel_partners')
    op.drop_table('scheme_channel_partners')
    op.drop_index(op.f('ix_channel_partners_district'), table_name='channel_partners')
    op.drop_index(op.f('ix_channel_partners_state'), table_name='channel_partners')
    op.drop_index(op.f('ix_channel_partners_partner_type'), table_name='channel_partners')
    op.drop_index(op.f('ix_channel_partners_organization_name'), table_name='channel_partners')
    op.drop_index(op.f('ix_channel_partners_partner_code'), table_name='channel_partners')
    op.drop_table('channel_partners')
