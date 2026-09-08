"""
Integration and Unit Tests for Integrated Dashboard API Endpoints (Step 12)
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
from app.models.scheme import Scheme, SchemeSource, SchemeDocument, SchemeEligibilityRule
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


@pytest.fixture
def client(sqlite_test_engine):
    async def init_tables():
        async with sqlite_test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            for tbl in ["channel_partners", "district_msme_ecosystems", "msme_clusters"]:
                try:
                    await conn.exec_driver_sql(f"ALTER TABLE {tbl} ADD COLUMN location BLOB")
                except Exception:
                    pass

        session_factory = async_sessionmaker(sqlite_test_engine, expire_on_commit=False, class_=AsyncSession)
        async with session_factory() as session:
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
                business_stages=["new_enterprise", "early_stage"],
                sectors=["manufacturing", "services", "agro_processing"],
                data_status="VERIFIED",
                is_active=True
            )
            src = SchemeSource(
                scheme_id=1,
                source_name="KVIC Official PMEGP Portal",
                source_type="OFFICIAL_PORTAL",
                official_url="https://www.kviconline.gov.in/pmegpeportal",
                version="2024.1",
                is_active=True
            )
            partner = ChannelPartner(
                id=1,
                partner_code="DIC_PUNE_01",
                organization_name="District Industries Centre (DIC) Pune",
                partner_type="DISTRICT_INDUSTRIES_CENTRE",
                state="Maharashtra",
                district="Pune",
                city="Pune",
                pincode="411001",
                address="Agriculture College Campus, Shivajinagar, Pune",
                services_offered=["APPLICATION_INTAKE", "DOCUMENT_VERIFICATION"],
                verification_status="VERIFIED",
                source_agency="Directorate of Industries, Maharashtra",
                is_active=True,
            )
            scheme_partner = SchemeChannelPartner(
                scheme_id=1,
                channel_partner_id=1,
                is_primary_partner=True,
                role_type="IMPLEMENTING_AGENCY",
                verification_status="VERIFIED",
            )
            session.add_all([pmegp, src, partner, scheme_partner])
            await session.commit()

    import asyncio
    asyncio.run(init_tables())

    session_factory = async_sessionmaker(sqlite_test_engine, expire_on_commit=False, class_=AsyncSession)

    async def override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app)
    yield test_client
    app.dependency_overrides.clear()


def test_get_dashboard_default(client):
    """Verify GET /api/v1/dashboard returns valid aggregate structure."""
    response = client.get("/api/v1/dashboard")
    assert response.status_code == 200
    data = response.json()

    assert "has_profile" in data
    assert "progress_journey" in data
    assert "next_actions" in data
    assert "system_status" in data

    journey = data["progress_journey"]
    assert "current_stage_id" in journey
    assert "completion_percentage" in journey
    assert "stages" in journey
    assert len(journey["stages"]) >= 4

    next_actions = data["next_actions"]
    assert isinstance(next_actions, list)
    if next_actions:
        first_action = next_actions[0]
        assert "action_id" in first_action
        assert "priority" in first_action
        assert "title" in first_action
        assert "target_url" in first_action


def test_get_dashboard_for_created_profile(client):
    """Create a profile with business & financial inputs, then verify dashboard aggregation."""
    # 1. Create Onboarding Profile
    profile_payload = {
        "entrepreneur": {
            "full_name": "Radha Rani",
            "age": 29,
            "gender": "female",
            "category": "SC",
            "state": "Maharashtra",
            "district": "Pune",
            "city": "Haveli",
            "pincode": "411001",
            "area_type": "rural",
            "preferred_language": "en"
        },
        "business": {
            "business_name": "Radha Agro Processing",
            "sector": "Agro-Processing",
            "business_stage": "Early Stage",
            "is_greenfield": True
        },
        "financial": {
            "project_cost": 1500000.0,
            "own_contribution": 75000.0,
            "annual_income": 120000.0
        }
    }

    create_res = client.post("/api/v1/profiles", json=profile_payload)
    assert create_res.status_code == 201
    created_profile = create_res.json()
    profile_id = created_profile["entrepreneur"]["id"]

    # 2. Fetch Dashboard for this Profile
    dash_res = client.get(f"/api/v1/profiles/{profile_id}/dashboard")
    assert dash_res.status_code == 200
    dash_data = dash_res.json()

    assert dash_data["has_profile"] is True
    assert dash_data["profile"]["id"] == profile_id
    assert dash_data["profile"]["full_name"] == "Radha Rani"
    assert dash_data["profile"]["completeness"]["is_complete"] is True
    assert dash_data["profile"]["completeness"]["completion_percentage"] == 100.0

    # Business Snapshot
    assert dash_data["business"]["business_name"] == "Radha Agro Processing"
    assert dash_data["business"]["sector"] == "Agro-Processing"

    # Financial Snapshot
    assert dash_data["financial"]["project_cost"] == 1500000.0
    assert dash_data["financial"]["own_contribution_amount"] > 0
    assert dash_data["financial"]["proposed_loan_amount"] > 0
    assert dash_data["financial"]["estimated_monthly_emi"] > 0

    # Feasibility Snapshot
    assert "feasibility" in dash_data
    assert dash_data["feasibility"]["status"] in ["FAVOURABLE", "CAUTION", "HIGH_RISK", "INSUFFICIENT_DATA"]

    # Recommendations from Step 6 Matching Engine
    assert len(dash_data["recommended_schemes"]) > 0
    top_scheme = dash_data["recommended_schemes"][0]
    assert "scheme_code" in top_scheme
    assert "match_score" in top_scheme
    assert top_scheme["match_score"] >= 0.0

    # Progress Journey
    assert dash_data["progress_journey"]["completion_percentage"] > 0.0

    # Deterministic Next Actions
    assert len(dash_data["next_actions"]) > 0
    assert any(a["action_category"] in ["schemes", "access", "feasibility", "application"] for a in dash_data["next_actions"])


def test_get_dashboard_with_application(client):
    """Verify active applications appear with user-recorded tracking indicators."""
    # 1. Create Profile
    profile_payload = {
        "entrepreneur": {
            "full_name": "Deepak Verma",
            "age": 35,
            "gender": "male",
            "category": "OBC",
            "state": "Maharashtra",
            "district": "Pune",
            "pincode": "411002",
            "area_type": "urban",
        },
        "business": {
            "business_name": "Verma Precision Tools",
            "sector": "Manufacturing",
            "business_stage": "Existing Unit",
        },
        "financial": {
            "project_cost": 2500000.0,
            "own_contribution": 250000.0,
        }
    }
    create_res = client.post("/api/v1/profiles", json=profile_payload)
    assert create_res.status_code == 201
    profile_id = create_res.json()["entrepreneur"]["id"]

    # 2. Submit an Application Record
    app_payload = {
        "entrepreneur_id": profile_id,
        "scheme_id": 1,
        "channel_partner_id": 1,
        "target_loan_amount": 2125000.0,
        "target_subsidy_amount": 375000.0,
        "status_note": "Application file submitted to DIC Pune branch for preliminary scrutiny"
    }
    app_res = client.post("/api/v1/applications", json=app_payload)
    assert app_res.status_code == 201

    # 3. Check Dashboard Aggregation
    dash_res = client.get(f"/api/v1/profiles/{profile_id}/dashboard")
    assert dash_res.status_code == 200
    dash_data = dash_res.json()

    assert len(dash_data["active_applications"]) >= 1
    app_summary = dash_data["active_applications"][0]
    assert app_summary["scheme_id"] == 1
    assert app_summary["is_user_recorded"] is True
    assert "DIC" in app_summary["partner_name"] or "District" in app_summary["partner_name"]
