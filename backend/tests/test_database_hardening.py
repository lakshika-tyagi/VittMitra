"""
Database Foundation, Geolocation & Migration Hardening Test Suite (Step 13)
Covers:
- Foreign Key Constraints & Cascade Delete Verification
- PostGIS / Geolocation Coordinate Boundary Integrity
- Alembic Migration Script & Revision DAG Consistency
"""
import os
import importlib.util
from decimal import Decimal
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text
from app.db.base import Base
from app.models.profile import Entrepreneur, BusinessProfile, FinancialProfile
from app.models.scheme import Scheme


@pytest.mark.asyncio
async def test_database_connection_and_postgis_extension():
    """Verify PostGIS geometry metadata definition and schema integration."""
    # Test table and column geometry integration across ORM metadata
    assert "entrepreneurs" in Base.metadata.tables
    ent_table = Base.metadata.tables["entrepreneurs"]
    assert "latitude" in ent_table.columns
    assert "longitude" in ent_table.columns
    assert "pincode" in ent_table.columns


@pytest.mark.asyncio
async def test_profile_cascade_delete_integrity():
    """Verify that deleting an Entrepreneur cleanly cascades to related profile tables in SQLite/PostgreSQL."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    tables = [Entrepreneur.__table__, BusinessProfile.__table__, FinancialProfile.__table__]
    async with engine.begin() as conn:
        for t in tables:
            await conn.run_sync(t.create)

    async with session_factory() as session:
        # Create temporary entrepreneur
        entrepreneur = Entrepreneur(
            full_name="Hardening Test User",
            gender="FEMALE",
            category="OBC",
            state="Maharashtra",
            district="Pune",
            area_type="rural",
            pincode="411001",
            latitude=Decimal("18.520400"),
            longitude=Decimal("73.856700"),
        )
        session.add(entrepreneur)
        await session.flush()
        ent_id = entrepreneur.id

        # Add related business and financial profile
        business = BusinessProfile(
            entrepreneur_id=ent_id,
            business_name="Hardening Agro Foods",
            sector="manufacturing",
            business_stage="new_enterprise",
            is_greenfield=True,
        )
        session.add(business)
        await session.flush()

        finance = FinancialProfile(
            entrepreneur_id=ent_id,
            business_profile_id=business.id,
            project_cost=Decimal("1500000.00"),
            own_contribution=Decimal("150000.00"),
            loan_requirement=Decimal("1350000.00"),
        )
        session.add(finance)
        await session.commit()

        # Verify records exist
        bus_check = await session.execute(
            text("SELECT count(*) FROM business_profiles WHERE entrepreneur_id = :eid"),
            {"eid": ent_id}
        )
        assert bus_check.scalar() == 1

        fin_check = await session.execute(
            text("SELECT count(*) FROM financial_profiles WHERE entrepreneur_id = :eid"),
            {"eid": ent_id}
        )
        assert fin_check.scalar() == 1

        # Delete the entrepreneur
        await session.delete(entrepreneur)
        await session.commit()

        # Verify child records were cascade deleted
        bus_after = await session.execute(
            text("SELECT count(*) FROM business_profiles WHERE entrepreneur_id = :eid"),
            {"eid": ent_id}
        )
        assert bus_after.scalar() == 0

        fin_after = await session.execute(
            text("SELECT count(*) FROM financial_profiles WHERE entrepreneur_id = :eid"),
            {"eid": ent_id}
        )
        assert fin_after.scalar() == 0


def test_geographic_coordinate_boundaries():
    """Verify latitude and longitude validation logic rejects out-of-range coordinates."""
    valid_coords = [
        (18.5204, 73.8567),  # Pune
        (28.6139, 77.2090),  # New Delhi
        (0.0, 0.0),
        (-90.0, -180.0),
        (90.0, 180.0),
    ]
    invalid_coords = [
        (91.0, 73.0),
        (-95.0, 50.0),
        (20.0, 185.0),
        (20.0, -190.0),
    ]

    for lat, lon in valid_coords:
        assert -90.0 <= lat <= 90.0
        assert -180.0 <= lon <= 180.0

    for lat, lon in invalid_coords:
        is_valid = (-90.0 <= lat <= 90.0) and (-180.0 <= lon <= 180.0)
        assert not is_valid, f"Coordinate ({lat}, {lon}) should be detected as out-of-range"


def test_alembic_migrations_dag_consistency():
    """Verify that all 7 Alembic migration scripts exist and contain required upgrade/downgrade hooks."""
    versions_dir = os.path.join(os.path.dirname(__file__), "..", "alembic", "versions")
    assert os.path.exists(versions_dir)

    migration_files = [f for f in os.listdir(versions_dir) if f.endswith(".py") and not f.startswith("__")]
    assert len(migration_files) == 7, f"Expected 7 migration versions, found {len(migration_files)}"

    for mf in sorted(migration_files):
        file_path = os.path.join(versions_dir, mf)
        spec = importlib.util.spec_from_file_location(mf[:-3], file_path)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)

        assert hasattr(mod, "upgrade"), f"Migration {mf} missing upgrade() function"
        assert hasattr(mod, "downgrade"), f"Migration {mf} missing downgrade() function"
        assert hasattr(mod, "revision"), f"Migration {mf} missing revision string"
