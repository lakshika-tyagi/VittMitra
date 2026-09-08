from typing import AsyncGenerator, Dict, Any
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text, event, select
from pathlib import Path
import json

from app.core.config import settings
from app.db.base import Base

# Determine engine type and configuration
is_sqlite = "sqlite" in settings.DATABASE_URL

if is_sqlite:
    async_engine = create_async_engine(
        settings.DATABASE_URL,
        echo=settings.DEBUG,
        future=True,
        connect_args={"check_same_thread": False},
    )

    @event.listens_for(async_engine.sync_engine, "connect")
    def register_sqlite_spatial_functions(dbapi_connection, connection_record):
        """Emulates PostGIS geometry and spatial functions in SQLite for development."""
        def dummy_add_geom(table, col, *args):
            try:
                dbapi_connection.execute(f"ALTER TABLE {table} ADD COLUMN {col} BLOB")
            except Exception:
                pass
            return 1

        def dummy_recover_geom(table, col, *args):
            try:
                dbapi_connection.execute(f"ALTER TABLE {table} ADD COLUMN {col} BLOB")
            except Exception:
                pass
            return 1

        def dummy_geom_from_ewkt(ewkt):
            return str(ewkt).encode("utf-8") if ewkt else None

        def dummy_as_binary(geom):
            return geom if isinstance(geom, bytes) else (str(geom).encode("utf-8") if geom else None)

        dbapi_connection.create_function("AddGeometryColumn", -1, dummy_add_geom)
        dbapi_connection.create_function("RecoverGeometryColumn", -1, dummy_recover_geom)
        dbapi_connection.create_function("DiscardGeometryColumn", -1, lambda *args: 1)
        dbapi_connection.create_function("CreateSpatialIndex", -1, lambda *args: 1)
        dbapi_connection.create_function("GeomFromEWKT", 1, dummy_geom_from_ewkt)
        dbapi_connection.create_function("ST_GeomFromEWKT", 1, dummy_geom_from_ewkt)
        dbapi_connection.create_function("ST_AsBinary", 1, dummy_as_binary)
        dbapi_connection.create_function("AsEWKB", 1, dummy_as_binary)
        dbapi_connection.create_function("AsBinary", 1, dummy_as_binary)
else:
    async_engine = create_async_engine(
        settings.DATABASE_URL,
        echo=settings.DEBUG,
        future=True,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        connect_args={"timeout": 5} if "asyncpg" in settings.DATABASE_URL else {},
    )

# Async session factory
async_session_factory = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)
AsyncSessionLocal = async_session_factory


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that yields an asynchronous database session.
    Automatically commits on success or rolls back on exception.
    """
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db_schema() -> None:
    """
    Ensures that all database tables exist and seeds default data if tables are empty.
    Useful for local standalone development and testing.
    """
    import app.models  # Ensure all model entities are imported
    from app.models.scheme import Scheme, SchemeSource, SchemeEligibilityRule, SchemeDocument
    from app.models.intelligence import DistrictMSMEEcosystem, MSMECluster
    from app.models.access import ChannelPartner, SchemeChannelPartner

    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Check if schemes need initial seeding
    async with async_session_factory() as session:
        result = await session.execute(select(Scheme).limit(1))
        existing_scheme = result.scalar_one_or_none()

        if existing_scheme is None:
            # Seed schemes
            root_dir = Path(__file__).resolve().parent.parent.parent.parent
            schemes_dir = root_dir / "data" / "seed" / "schemes"
            if schemes_dir.is_dir():
                for f in schemes_dir.glob("*.json"):
                    try:
                        with open(f, "r", encoding="utf-8") as fp:
                            data = json.load(fp)
                        
                        scheme = Scheme(
                            scheme_code=data["scheme_code"],
                            scheme_name=data["scheme_name"],
                            ministry=data.get("ministry"),
                            nodal_agency=data.get("nodal_agency"),
                            objective=data.get("objective"),
                            scheme_type=data.get("scheme_type", "CREDIT_LINKED_SUBSIDY"),
                            applicable_sectors=data.get("applicable_sectors", []),
                            target_beneficiaries=data.get("target_beneficiaries", []),
                            max_loan_amount=data.get("max_loan_amount"),
                            max_subsidy_percentage=data.get("max_subsidy_percentage"),
                            is_active=data.get("is_active", True),
                        )
                        session.add(scheme)
                        await session.flush()

                        for s_data in data.get("sources", []):
                            source = SchemeSource(scheme_id=scheme.id, **s_data)
                            session.add(source)

                        for r_data in data.get("eligibility_rules", []):
                            rule = SchemeEligibilityRule(scheme_id=scheme.id, **r_data)
                            session.add(rule)

                        for d_data in data.get("documents", []):
                            doc = SchemeDocument(scheme_id=scheme.id, **d_data)
                            session.add(doc)

                        await session.commit()
                    except Exception as e:
                        await session.rollback()

            # Seed partners
            partners_file = root_dir / "data" / "partners" / "partners_seed.json"
            if partners_file.exists():
                try:
                    with open(partners_file, "r", encoding="utf-8") as fp:
                        p_data = json.load(fp)
                    for item in p_data:
                        partner = ChannelPartner(
                            partner_name=item["partner_name"],
                            partner_type=item["partner_type"],
                            district=item["district"],
                            state=item["state"],
                            city=item.get("city"),
                            address=item.get("address"),
                            pincode=item.get("pincode"),
                            contact_phone=item.get("contact_phone"),
                            contact_email=item.get("contact_email"),
                            is_verified=item.get("is_verified", True),
                            operating_hours=item.get("operating_hours"),
                        )
                        session.add(partner)
                    await session.commit()
                except Exception:
                    await session.rollback()


async def check_db_connection() -> Dict[str, Any]:
    """
    Executes a lightweight query to verify active database connectivity.
    Returns operational metadata without exposing credentials.
    """
    async with async_engine.connect() as conn:
        if is_sqlite:
            result = await conn.execute(text("SELECT 1 AS alive"))
            return {
                "status": "connected",
                "database_name": "sqlite_db",
                "server_version": "SQLite 3",
            }
        else:
            result = await conn.execute(text("SELECT 1 AS alive, current_database() AS db_name, version() AS pg_version"))
            row = result.mappings().one()
            return {
                "status": "connected",
                "database_name": row["db_name"],
                "server_version": row["pg_version"].split(",")[0] if row["pg_version"] else "unknown",
            }


async def check_postgis_extension() -> Dict[str, Any]:
    """
    Verifies that the PostGIS spatial extension is enabled and returns version specs.
    """
    if is_sqlite:
        return {
            "status": "enabled",
            "postgis_full_version": "SQLite Spatial Emulation Engine",
        }

    async with async_engine.connect() as conn:
        result = await conn.execute(text("SELECT postgis_full_version() AS full_version"))
        row = result.mappings().one()
        return {
            "status": "enabled",
            "postgis_full_version": row["full_version"],
        }

