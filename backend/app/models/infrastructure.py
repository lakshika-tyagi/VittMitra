"""
Infrastructure & Development Verification Model

IMPORTANT NOTICE:
This model is strictly an infrastructure testing artifact created for Step 2
to verify SQLAlchemy ORM, PostGIS spatial geometry mapping, and Alembic migrations.
It is NOT a business domain entity.
"""
from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from geoalchemy2 import Geometry
from app.db.base import Base, TimestampMixin

class InfrastructureHeartbeat(Base, TimestampMixin):
    """
    Minimal development testing entity used strictly to validate:
    1. PostgreSQL table creation and primary key indexing
    2. PostGIS geometry column support (Point geometry)
    3. Alembic migration execution
    """
    __tablename__ = "_dev_infrastructure_heartbeat"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    component_name: Mapped[str] = mapped_column(String(100), nullable=False)
    status_note: Mapped[str] = mapped_column(String(255), default="healthy")
    
    # PostGIS spatial point for geometry validation (SRID 4326 - WGS 84)
    test_location: Mapped[str] = mapped_column(
        Geometry(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=True
    )
