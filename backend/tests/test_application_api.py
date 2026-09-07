"""
Application Tracking and Assistance API Unit & Integration Tests
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
from app.models.scheme import Scheme, SchemeDocument, SchemeSource
from app.models.profile import Entrepreneur, BusinessProfile, FinancialProfile
from app.models.access import ChannelPartner, SchemeChannelPartner, Application, ApplicationStatusHistory


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
async def app_test_db(sqlite_test_engine):
    async with sqlite_test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        for tbl in ["channel_partners", "district_msme_ecosystems", "msme_clusters"]:
            try:
                await conn.exec_driver_sql(f"ALTER TABLE {tbl} ADD COLUMN location BLOB")
            except Exception:
                pass

    session_factory = async_sessionmaker(sqlite_test_engine, expire_on_commit=False, class_=AsyncSession)
    async with session_factory() as session:
        # 1. Scheme
        pmegp = Scheme(
            id=1,
            scheme_code="PMEGP",
            scheme_name="Prime Minister's Employment Generation Programme",
            short_description="Credit-linked subsidy programme",
            nodal_ministry="Ministry of MSME",
            geography_level="NATIONAL",
            target_beneficiaries=["General", "SC", "ST", "OBC", "Women"],
            purpose="Generate employment through micro-enterprises",
            benefits_summary={"max_loan_amount": 5000000, "subsidy_percentage": 25},
            business_stages=["new_enterprise"],
            sectors=["manufacturing", "services"],
            data_status="VERIFIED",
            is_active=True
        )
        session.add(pmegp)

        # 2. Scheme Source & Document
        src = SchemeSource(
            scheme_id=1,
            source_name="KVIC Official PMEGP Portal",
            source_type="OFFICIAL_PORTAL",
            official_url="https://www.kviconline.gov.in/pmegpeportal",
            version="2024.1",
            is_active=True
        )
        doc1 = SchemeDocument(
            scheme_id=1,
            document_code="PMEGP_AADHAAR",
            document_name="Aadhaar Card",
            description="Identity and address proof",
            is_mandatory=True
        )
        doc2 = SchemeDocument(
            scheme_id=1,
            document_code="PMEGP_DPR",
            document_name="Detailed Project Report (DPR)",
            description="Project cost and machinery breakdown",
            is_mandatory=True
        )
        session.add_all([src, doc1, doc2])
        await session.flush()

        # 3. Entrepreneur
        ent = Entrepreneur(
            id=1,
            full_name="Priya Sharma",
            age=28,
            gender="female",
            category="OBC",
            state="Maharashtra",
            district="Pune",
            city="Pune",
            pincode="411001",
            area_type="rural",
            is_active=True
        )
        session.add(ent)
        await session.flush()

        # 4. Business & Financial Profile
        biz = BusinessProfile(
            entrepreneur_id=1,
            business_name="Sahyadri Spices",
            sector="manufacturing",
            business_stage="new_enterprise",
            is_greenfield=True
        )
        fin = FinancialProfile(
            entrepreneur_id=1,
            project_cost=Decimal("1500000.00"),
            own_contribution=Decimal("250000.00"),
            loan_requirement=Decimal("1250000.00"),
            monthly_income=Decimal("45000.00")
        )
        session.add_all([biz, fin])

        # 5. Channel Partner
        partner = ChannelPartner(
            id=1,
            partner_code="DIC_PUNE",
            organization_name="District Industries Centre (DIC) Pune",
            partner_type="DISTRICT_INDUSTRIES_CENTRE",
            state="Maharashtra",
            district="Pune",
            address="Shivajinagar, Pune 411005",
            services_offered=["APPLICATION_INTAKE", "DOCUMENT_VERIFICATION"],
            source_agency="Directorate of Industries",
            is_active=True
        )
        session.add(partner)
        await session.flush()

        link = SchemeChannelPartner(
            scheme_id=1,
            channel_partner_id=1,
            role_type="IMPLEMENTING_AGENCY",
            is_primary_partner=True,
            verification_status="VERIFIED"
        )
        session.add(link)
        await session.commit()

    yield session_factory


def test_get_application_assistance_api(app_test_db):
    async def override_get_db():
        async with app_test_db() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    response = client.get("/api/v1/applications/assistance?entrepreneur_id=1&scheme_id=1")
    assert response.status_code == 200
    data = response.json()
    assert data["scheme_code"] == "PMEGP"
    assert data["official_portal_url"] == "https://www.kviconline.gov.in/pmegpeportal"
    assert float(data["project_cost"]) == 1500000.0
    assert len(data["recommended_partners"]) >= 1
    assert data["recommended_partners"][0]["organization_name"] == "District Industries Centre (DIC) Pune"
    assert "disclaimer" in data
    assert "VittMitra provides guidance" in data["disclaimer"]

    app.dependency_overrides.clear()


def test_create_and_track_application_lifecycle(app_test_db):
    async def override_get_db():
        async with app_test_db() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    # 1. Create Application
    payload = {
        "entrepreneur_id": 1,
        "scheme_id": 1,
        "channel_partner_id": 1,
        "application_reference_number": "PMEGP/2026/MH/00192",
        "initial_status": "APPLICATION_STARTED",
        "status_note": "Initiated via DIC Pune facilitation desk",
        "target_loan_amount": 1250000.0,
        "target_subsidy_amount": 375000.0
    }
    create_res = client.post("/api/v1/applications", json=payload)
    assert create_res.status_code == 201
    app_data = create_res.json()
    app_id = app_data["id"]
    assert app_data["current_status"] == "APPLICATION_STARTED"
    assert app_data["application_reference_number"] == "PMEGP/2026/MH/00192"
    assert app_data["source_type"] == "USER_RECORDED"
    assert "status_explanation" in app_data

    # 2. List Applications for Entrepreneur
    list_res = client.get("/api/v1/applications?entrepreneur_id=1")
    assert list_res.status_code == 200
    list_data = list_res.json()
    assert len(list_data) == 1
    assert list_data[0]["id"] == app_id

    # 3. Update Status to SUBMITTED
    update_res = client.post(
        f"/api/v1/applications/{app_id}/status",
        json={"status": "SUBMITTED", "status_note": "Uploaded to KVIC e-portal with ack receipt"}
    )
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["current_status"] == "SUBMITTED"

    # 4. Update Status to UNDER_REVIEW
    update_res2 = client.post(
        f"/api/v1/applications/{app_id}/status",
        json={"status": "UNDER_REVIEW", "status_note": "District Task Force interview scheduled"}
    )
    assert update_res2.status_code == 200

    # 5. Get Detailed Application View with Full History Timeline
    detail_res = client.get(f"/api/v1/applications/{app_id}")
    assert detail_res.status_code == 200
    detail_data = detail_res.json()
    assert detail_data["current_status"] == "UNDER_REVIEW"
    assert len(detail_data["status_history"]) == 3  # STARTED -> SUBMITTED -> UNDER_REVIEW
    assert detail_data["status_history"][0]["status"] == "UNDER_REVIEW"
    assert detail_data["status_history"][1]["status"] == "SUBMITTED"
    assert detail_data["status_history"][2]["status"] == "APPLICATION_STARTED"
    assert detail_data["channel_partner"]["organization_name"] == "District Industries Centre (DIC) Pune"
    assert "disclaimer" in detail_data

    app.dependency_overrides.clear()


def test_create_application_invalid_scheme_rejected(app_test_db):
    async def override_get_db():
        async with app_test_db() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    payload = {
        "entrepreneur_id": 1,
        "scheme_id": 9999,  # Non-existent
        "initial_status": "APPLICATION_STARTED"
    }
    res = client.post("/api/v1/applications", json=payload)
    assert res.status_code == 404
    assert "Scheme ID 9999 not found" in res.json()["detail"]

    app.dependency_overrides.clear()
