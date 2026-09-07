"""Create location and MSME cluster intelligence tables

Revision ID: 005_location_intelligence_tables
Revises: 004_entrepreneur_profile_tables
Create Date: 2026-09-07 17:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
import geoalchemy2

# revision identifiers, used by Alembic.
revision: str = '005_location_intelligence_tables'
down_revision: Union[str, None] = '004_entrepreneur_profile_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. district_msme_ecosystems table
    op.create_table(
        'district_msme_ecosystems',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('state', sa.String(length=100), nullable=False),
        sa.Column('district', sa.String(length=100), nullable=False),
        sa.Column('state_code', sa.String(length=10), nullable=True),
        sa.Column('district_code', sa.String(length=20), nullable=True),
        sa.Column('prominent_sectors', sa.JSON(), nullable=False),
        sa.Column('industrial_areas_count', sa.Integer(), server_default='0', nullable=False),
        sa.Column('lead_bank_name', sa.String(length=255), nullable=True),
        sa.Column('dic_office_address', sa.Text(), nullable=True),
        sa.Column('raw_material_availability', sa.String(length=50), server_default='INSUFFICIENT_DATA', nullable=False),
        sa.Column('market_connectivity', sa.String(length=50), server_default='INSUFFICIENT_DATA', nullable=False),
        sa.Column('power_infrastructure', sa.String(length=50), server_default='INSUFFICIENT_DATA', nullable=False),
        sa.Column('labor_availability', sa.String(length=50), server_default='INSUFFICIENT_DATA', nullable=False),
        sa.Column('latitude', sa.Numeric(precision=9, scale=6), nullable=True),
        sa.Column('longitude', sa.Numeric(precision=9, scale=6), nullable=True),
        sa.Column(
            'location',
            geoalchemy2.types.Geometry(
                geometry_type='POINT',
                srid=4326,
                from_text='ST_GeomFromEWKT',
                name='geometry',
                spatial_index=True
            ),
            nullable=True
        ),
        sa.Column('data_status', sa.String(length=30), server_default='VERIFIED', nullable=False),
        sa.Column('source_name', sa.String(length=255), server_default='Ministry of MSME - District Industrial Profile', nullable=False),
        sa.Column('source_url', sa.String(length=1000), nullable=True),
        sa.Column('last_verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_district_msme_ecosystems'))
    )
    op.create_index(op.f('ix_district_msme_ecosystems_state'), 'district_msme_ecosystems', ['state'], unique=False)
    op.create_index(op.f('ix_district_msme_ecosystems_district'), 'district_msme_ecosystems', ['district'], unique=False)

    # 2. msme_clusters table
    op.create_table(
        'msme_clusters',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('cluster_code', sa.String(length=100), nullable=False),
        sa.Column('cluster_name', sa.String(length=255), nullable=False),
        sa.Column('state', sa.String(length=100), nullable=False),
        sa.Column('district', sa.String(length=100), nullable=False),
        sa.Column('sector', sa.String(length=100), nullable=False),
        sa.Column('sub_sector', sa.String(length=150), nullable=True),
        sa.Column('specialization', sa.Text(), nullable=False),
        sa.Column('key_products', sa.JSON(), nullable=False),
        sa.Column('common_facility_centers', sa.JSON(), nullable=False),
        sa.Column('latitude', sa.Numeric(precision=9, scale=6), nullable=False),
        sa.Column('longitude', sa.Numeric(precision=9, scale=6), nullable=False),
        sa.Column(
            'location',
            geoalchemy2.types.Geometry(
                geometry_type='POINT',
                srid=4326,
                from_text='ST_GeomFromEWKT',
                name='geometry',
                spatial_index=True
            ),
            nullable=False
        ),
        sa.Column('raw_material_access', sa.String(length=50), server_default='HIGH', nullable=False),
        sa.Column('market_linkage', sa.String(length=50), server_default='HIGH', nullable=False),
        sa.Column('data_status', sa.String(length=30), server_default='VERIFIED', nullable=False),
        sa.Column('source_name', sa.String(length=255), server_default='Ministry of MSME - Cluster Development Programme (MSE-CDP)', nullable=False),
        sa.Column('source_url', sa.String(length=1000), nullable=True),
        sa.Column('last_verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_msme_clusters'))
    )
    op.create_index(op.f('ix_msme_clusters_cluster_code'), 'msme_clusters', ['cluster_code'], unique=True)
    op.create_index(op.f('ix_msme_clusters_state'), 'msme_clusters', ['state'], unique=False)
    op.create_index(op.f('ix_msme_clusters_district'), 'msme_clusters', ['district'], unique=False)
    op.create_index(op.f('ix_msme_clusters_sector'), 'msme_clusters', ['sector'], unique=False)


def downgrade() -> None:
    op.drop_table('msme_clusters')
    op.drop_table('district_msme_ecosystems')
