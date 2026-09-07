"""
Channel Partner API and PostGIS Proximity Unit Tests
"""
import pytest
import pytest_asyncio
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import event

from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.models.scheme import Scheme
from app.models.access import ChannelPartner, SchemeChannelPartner


@pytest.fixture
def sqlite_test_engine():
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )

    @event.listens_for(engine.sync_engine, "connect")
    def register_sqlite_functions(dbapi_connection, connection_record):
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

        def dummy_create_spatial_index(*args):
            return 1

        def dummy_geom_from_ewkt(ewkt):
            return str(ewkt).encode("utf-8") if ewkt else None

        def dummy_as_binary(geom):
            return geom if isinstance(geom, bytes) else (str(geom).encode("utf-8") if geom else None)
        
        dbapi_connection.create_function("AddGeometryColumn", -1, dummy_add_geom)
        dbapi_connection.create_function("RecoverGeometryColumn", -1, dummy_recover_geom)
        dbapi_connection.create_function("DiscardGeometryColumn", -1, lambda *args: 1)
        dbapi_connection.create_function("CreateSpatialIndex", -1, dummy_create_spatial_index)
        dbapi_connection.create_function("GeomFromEWKT", 1, dummy_geom_from_ewkt)
        dbapi_connection.create_function("ST_GeomFromEWKT", 1, dummy_geom_from_ewkt)
        dbapi_connection.create_function("ST_AsBinary", 1, dummy_as_binary)
        dbapi_connection.create_function("AsEWKB", 1, dummy_as_binary)
        dbapi_connection.create_function("AsBinary", 1, dummy_as_binary)

    return engine


@pytest_asyncio.fixture
async def partner_test_db(sqlite_test_engine):
    async with sqlite_test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        for tbl in ["channel_partners", "district_msme_ecosystems", "msme_clusters"]:
            try:
                await conn.exec_driver_sql(f"ALTER TABLE {tbl} ADD COLUMN location BLOB")
            except Exception:
                pass

    session_factory = async_sessionmaker(sqlite_test_engine, expire_on_commit=False, class_=AsyncSession)
    async with session_factory() as session:
        # Seed Scheme
        pmegp = Scheme(
            id=1,
            scheme_code="PMEGP",
            scheme_name="Prime Minister's Employment Generation Programme",
            short_description="Credit-linked subsidy programme",
            nodal_ministry="Ministry of MSME",
            geography_level="NATIONAL",
            target_beneficiaries=["General", "SC", "ST", "OBC", "Women"],
            purpose="Generate employment through micro-enterprises",
            benefits_summary={"max_loan_amount": 5000000, "max_subsidy_pct": 35},
            business_stages=["new_enterprise"],
            sectors=["manufacturing", "services"],
            data_status="VERIFIED",
            is_active=True
        )
        session.add(pmegp)
        await session.flush()

        # Seed Partners
        p1 = ChannelPartner(
            id=1,
            partner_code="DIC_PUNE",
            organization_name="District Industries Centre (DIC) Pune",
            partner_type="DISTRICT_INDUSTRIES_CENTRE",
            state="Maharashtra",
            district="Pune",
            city="Pune",
            pincode="411005",
            address="Shivajinagar, Pune, Maharashtra 411005",
            latitude=Decimal("18.5314"),
            longitude=Decimal("73.8446"),
            services_offered=["APPLICATION_INTAKE", "DOCUMENT_VERIFICATION", "TASK_FORCE_SCRUTINY"],
            contact_person="General Manager",
            contact_phone="020-25537033",
            official_url="https://industry.maharashtra.gov.in",
            verification_status="VERIFIED",
            source_agency="Directorate of Industries, Maharashtra",
            is_active=True
        )
        p2 = ChannelPartner(
            id=2,
            partner_code="SBI_SME_PUNE",
            organization_name="State Bank of India (SBI) SME Branch Pune",
            partner_type="PUBLIC_SECTOR_BANK",
            state="Maharashtra",
            district="Pune",
            city="Pune",
            pincode="411001",
            address="Camp, Pune, Maharashtra 411001",
            latitude=Decimal("18.5167"),
            longitude=Decimal("73.8755"),
            services_offered=["LOAN_APPRAISAL", "CREDIT_DISBURSEMENT"],
            contact_person="Chief Manager",
            official_url="https://sbi.co.in",
            verification_status="VERIFIED",
            source_agency="State Bank of India",
            is_active=True
        )
        p3 = ChannelPartner(
            id=3,
            partner_code="DIC_VARANASI",
            organization_name="District Industries Centre (DIC) Varanasi",
            partner_type="DISTRICT_INDUSTRIES_CENTRE",
            state="Uttar Pradesh",
            district="Varanasi",
            city="Varanasi",
            pincode="221002",
            address="Chowkaghat, Varanasi, UP 221002",
            latitude=Decimal("25.3283"),
            longitude=Decimal("82.9862"),
            services_offered=["APPLICATION_INTAKE", "ARTISAN_VERIFICATION"],
            official_url="https://diupmsme.upsdc.gov.in",
            verification_status="VERIFIED",
            source_agency="Department of MSME, UP",
            is_active=True
        )
        session.add_all([p1, p2, p3])
        await session.flush()

        # Seed Scheme-Partner Links
        l1 = SchemeChannelPartner(
            scheme_id=1,
            channel_partner_id=1,
            role_type="IMPLEMENTING_AGENCY",
            service_scope="District Task Force Committee appraisal",
            is_primary_partner=True,
            verification_status="VERIFIED",
            source_reference="Ministry of MSME"
        )
        l2 = SchemeChannelPartner(
            scheme_id=1,
            channel_partner_id=2,
            role_type="FINANCING_BANK",
            service_scope="Credit appraisal and margin money release",
            is_primary_partner=True,
            verification_status="VERIFIED",
            source_reference="State Bank of India"
        )
        l3 = SchemeChannelPartner(
            scheme_id=1,
            channel_partner_id=3,
            role_type="IMPLEMENTING_AGENCY",
            service_scope="District Task Force appraisal Varanasi",
            is_primary_partner=True,
            verification_status="VERIFIED",
            source_reference="UP MSME"
        )
        session.add_all([l1, l2, l3])
        await session.commit()

    yield session_factory


def test_list_partners_api(partner_test_db):
    async def override_get_db():
        async with partner_test_db() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    response = client.get("/api/v1/partners?state=Maharashtra")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    org_names = [p["organization_name"] for p in data]
    assert "District Industries Centre (DIC) Pune" in org_names
    assert "State Bank of India (SBI) SME Branch Pune" in org_names

    app.dependency_overrides.clear()


def test_get_scheme_partners_prioritizes_district(partner_test_db):
    async def override_get_db():
        async with partner_test_db() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    response = client.get("/api/v1/schemes/1/partners?district=Pune&state=Maharashtra")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3
    # Top matches should be Pune partners
    assert data[0]["district"] == "Pune"
    assert data[1]["district"] == "Pune"
    assert data[2]["district"] == "Varanasi"
    assert "why_this_partner" in data[0]
    assert "authorized" in data[0]["why_this_partner"].lower()

    app.dependency_overrides.clear()


def test_get_nearby_partners_api(partner_test_db):
    async def override_get_db():
        async with partner_test_db() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    # Near Pune Shivajinagar (18.53, 73.84) with 25km radius
    response = client.get("/api/v1/partners/nearby?lat=18.53&lon=73.84&radius_km=25")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2  # Pune DIC and Pune SBI
    assert data[0]["distance_km"] < data[1]["distance_km"] or data[0]["distance_km"] <= 25.0
    assert data[0]["distance_km"] < 10.0

    app.dependency_overrides.clear()


def test_get_partner_detail_api(partner_test_db):
    async def override_get_db():
        async with partner_test_db() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    response = client.get("/api/v1/partners/1")
    assert response.status_code == 200
    data = response.json()
    assert data["partner_code"] == "DIC_PUNE"
    assert len(data["supported_schemes"]) == 1
    assert data["supported_schemes"][0]["scheme_code"] == "PMEGP"

    # Non-existent partner returns 404
    not_found = client.get("/api/v1/partners/999")
    assert not_found.status_code == 404

    app.dependency_overrides.clear()
