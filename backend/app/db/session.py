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
    from app.models.profile import Entrepreneur, BusinessProfile, FinancialProfile
    from geoalchemy2.elements import WKTElement

    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    root_dir = Path(__file__).resolve().parent.parent.parent.parent
    if not (root_dir / "data").exists():
        root_dir = Path(__file__).resolve().parent.parent.parent

    # Seed Schemes if empty
    async with async_session_factory() as session:
        result = await session.execute(select(Scheme).limit(1))
        existing_scheme = result.scalar_one_or_none()

        if existing_scheme is None:
            from app.schemas.scheme import SchemeSeedPayload
            schemes_dir = root_dir / "data" / "seed" / "schemes"
            if schemes_dir.is_dir():
                for f in schemes_dir.glob("*.json"):
                    try:
                        with open(f, "r", encoding="utf-8") as fp:
                            raw_json = json.load(fp)
                        
                        payload = SchemeSeedPayload.model_validate(raw_json)
                        scheme = Scheme(
                            scheme_code=payload.scheme_code,
                            scheme_name=payload.scheme_name,
                            short_description=payload.short_description,
                            nodal_ministry=payload.nodal_ministry,
                            nodal_department=payload.nodal_department,
                            geography_level=payload.geography_level,
                            target_beneficiaries=payload.target_beneficiaries,
                            purpose=payload.purpose,
                            benefits_summary=payload.benefits_summary,
                            business_stages=payload.business_stages,
                            sectors=payload.sectors,
                            data_status=payload.data_status,
                            is_active=payload.is_active,
                        )
                        session.add(scheme)
                        await session.flush()

                        for s in payload.sources:
                            source = SchemeSource(
                                scheme_id=scheme.id,
                                source_name=s.source_name,
                                source_type=s.source_type,
                                official_url=s.official_url,
                                document_reference=s.document_reference,
                                publication_date=s.publication_date,
                                last_verified_at=s.last_verified_at,
                                version=s.version,
                                notes=s.notes,
                                is_active=s.is_active,
                            )
                            session.add(source)

                        for r in payload.eligibility_rules:
                            rule = SchemeEligibilityRule(
                                scheme_id=scheme.id,
                                rule_code=r.rule_code,
                                field_name=r.field_name,
                                operator=r.operator,
                                expected_value=r.expected_value,
                                description=r.description,
                                rule_version=r.rule_version,
                                is_mandatory=r.is_mandatory,
                                is_active=r.is_active,
                            )
                            session.add(rule)

                        for d in payload.documents:
                            doc = SchemeDocument(
                                scheme_id=scheme.id,
                                document_code=d.document_code,
                                document_name=d.document_name,
                                description=d.description,
                                is_mandatory=d.is_mandatory,
                            )
                            session.add(doc)

                        await session.commit()
                    except Exception as e:
                        await session.rollback()

        # Seed Intelligence if empty
        result_eco = await session.execute(select(DistrictMSMEEcosystem).limit(1))
        if result_eco.scalar_one_or_none() is None:
            clusters_file = root_dir / "data" / "intelligence" / "clusters_seed.json"
            if clusters_file.is_file():
                try:
                    with open(clusters_file, "r", encoding="utf-8") as fp:
                        intel_data = json.load(fp)
                    
                    for d in intel_data.get("district_ecosystems", []):
                        lat = float(d["latitude"]) if d.get("latitude") is not None else None
                        lng = float(d["longitude"]) if d.get("longitude") is not None else None
                        loc_geom = WKTElement(f"POINT({lng} {lat})", srid=4326) if lat and lng else None
                        session.add(DistrictMSMEEcosystem(
                            state=d["state"],
                            district=d["district"],
                            state_code=d.get("state_code"),
                            district_code=d.get("district_code"),
                            prominent_sectors=d["prominent_sectors"],
                            industrial_areas_count=d.get("industrial_areas_count", 0),
                            lead_bank_name=d.get("lead_bank_name"),
                            dic_office_address=d.get("dic_office_address"),
                            raw_material_availability=d.get("raw_material_availability", "INSUFFICIENT_DATA"),
                            market_connectivity=d.get("market_connectivity", "INSUFFICIENT_DATA"),
                            power_infrastructure=d.get("power_infrastructure", "INSUFFICIENT_DATA"),
                            labor_availability=d.get("labor_availability", "INSUFFICIENT_DATA"),
                            latitude=lat,
                            longitude=lng,
                            location=loc_geom,
                            data_status=d.get("data_status", "VERIFIED"),
                            source_name=d.get("source_name", "Ministry of MSME"),
                            source_url=d.get("source_url"),
                            is_active=d.get("is_active", True),
                        ))
                    
                    for c in intel_data.get("msme_clusters", []):
                        lat = float(c["latitude"])
                        lng = float(c["longitude"])
                        loc_geom = WKTElement(f"POINT({lng} {lat})", srid=4326)
                        session.add(MSMECluster(
                            cluster_code=c["cluster_code"],
                            cluster_name=c["cluster_name"],
                            state=c["state"],
                            district=c["district"],
                            sector=c["sector"],
                            sub_sector=c.get("sub_sector"),
                            specialization=c["specialization"],
                            key_products=c["key_products"],
                            common_facility_centers=c.get("common_facility_centers", []),
                            latitude=lat,
                            longitude=lng,
                            location=loc_geom,
                            raw_material_access=c.get("raw_material_access", "HIGH"),
                            market_linkage=c.get("market_linkage", "HIGH"),
                            data_status=c.get("data_status", "VERIFIED"),
                            source_name=c.get("source_name", "Ministry of MSME"),
                            source_url=c.get("source_url"),
                            is_active=c.get("is_active", True),
                        ))
                    await session.commit()
                except Exception:
                    await session.rollback()

        # Seed Partners if empty
        result_p = await session.execute(select(ChannelPartner).limit(1))
        if result_p.scalar_one_or_none() is None:
            partners_file = root_dir / "data" / "partners" / "partners_seed.json"
            if partners_file.exists():
                try:
                    with open(partners_file, "r", encoding="utf-8") as fp:
                        partners_data = json.load(fp)
                    for p_data in partners_data:
                        lat = p_data.get("latitude")
                        lon = p_data.get("longitude")
                        geom = WKTElement(f"POINT({lon} {lat})", srid=4326) if (lat is not None and lon is not None) else None
                        partner = ChannelPartner(
                            partner_code=p_data["partner_code"],
                            organization_name=p_data["organization_name"],
                            partner_type=p_data["partner_type"],
                            state=p_data["state"],
                            district=p_data["district"],
                            city=p_data.get("city"),
                            pincode=p_data.get("pincode"),
                            address=p_data["address"],
                            latitude=lat,
                            longitude=lon,
                            location=geom,
                            services_offered=p_data.get("services_offered", []),
                            contact_person=p_data.get("contact_person"),
                            contact_phone=p_data.get("contact_phone"),
                            contact_email=p_data.get("contact_email"),
                            official_url=p_data.get("official_url"),
                            verification_status=p_data.get("verification_status", "VERIFIED"),
                            source_agency=p_data["source_agency"],
                            source_url=p_data.get("source_url"),
                            notes=p_data.get("notes"),
                            is_active=True,
                        )
                        session.add(partner)
                        await session.flush()

                        for s_map in p_data.get("supported_schemes", []):
                            sc_code = s_map["scheme_code"]
                            s_res = await session.execute(select(Scheme).where(Scheme.scheme_code == sc_code))
                            sc_obj = s_res.scalar_one_or_none()
                            if sc_obj:
                                session.add(SchemeChannelPartner(
                                    scheme_id=sc_obj.id,
                                    channel_partner_id=partner.id,
                                    role_type=s_map.get("role_type", "LENDING_INSTITUTION"),
                                    service_scope=s_map.get("service_scope"),
                                    is_primary_partner=s_map.get("is_primary_partner", False),
                                    verification_status="VERIFIED",
                                    source_reference=p_data["source_agency"],
                                ))
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

