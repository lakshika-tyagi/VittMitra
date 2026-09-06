"""Initial PostGIS extension and infrastructure heartbeat table

Revision ID: 001_postgis_init
Revises: 
Create Date: 2026-09-06 18:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
import geoalchemy2

# revision identifiers, used by Alembic.
revision: str = '001_postgis_init'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Enable PostGIS extension
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis;")

    # 2. Create minimal infrastructure development table
    op.create_table(
        '_dev_infrastructure_heartbeat',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('component_name', sa.String(length=100), nullable=False),
        sa.Column('status_note', sa.String(length=255), nullable=False, server_default='healthy'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id', name=op.f('pk__dev_infrastructure_heartbeat'))
    )

    # 3. Add geometry column for PostGIS verification
    op.add_column(
        '_dev_infrastructure_heartbeat',
        sa.Column(
            'test_location',
            geoalchemy2.types.Geometry(
                geometry_type='POINT',
                srid=4326,
                from_text='ST_GeomFromEWKT',
                name='geometry',
                spatial_index=True
            ),
            nullable=True
        )
    )


def downgrade() -> None:
    op.drop_table('_dev_infrastructure_heartbeat')
    # Optional: op.execute("DROP EXTENSION IF EXISTS postgis CASCADE;")
