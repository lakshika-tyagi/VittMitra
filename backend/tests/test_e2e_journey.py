"""
Comprehensive End-to-End User Journey Integration Test (Step 12)

Validates the full 17-step entrepreneur lifecycle from onboarding through
feasibility, personalized matching, eligibility breakdown, financial structuring,
comparison, channel partner discovery, application assistance, tracking,
dashboard orchestration, and grounded AI assistance.
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
            mudra = Scheme(
                id=2,
                scheme_code="MUDRA_TARUN",
                scheme_name="Pradhan Mantri MUDRA Yojana - Tarun",
                short_description="Institutional credit for micro-units up to 10 lakhs",
                nodal_ministry="Department of Financial Services",
                geography_level="NATIONAL",
                target_beneficiaries=["General", "SC", "ST", "OBC", "Women"],
                purpose="Working capital and expansion loans",
                benefits_summary={"max_loan_amount": 1000000},
                business_stages=["early_stage", "scaling"],
                sectors=["manufacturing", "services", "trading"],
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
            doc1 = SchemeDocument(
                scheme_id=1,
                document_code="PMEGP_AADHAAR",
                document_name="Aadhaar Card",
                description="Identity proof",
                is_mandatory=True
            )
            doc2 = SchemeDocument(
                scheme_id=1,
                document_code="PMEGP_DPR",
                document_name="Detailed Project Report",
                description="Project financial model",
                is_mandatory=True
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
            session.add_all([pmegp, mudra, src, doc1, doc2, partner, scheme_partner])
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


def test_complete_end_to_end_entrepreneur_journey(client):
    """
    Executes the 17-step full product journey end-to-end using verified APIs.
    """
    # -------------------------------------------------------------
    # Step 1: Create entrepreneur profile
    # -------------------------------------------------------------
    profile_payload = {
        "entrepreneur": {
            "full_name": "Kavita Shinde",
            "age": 31,
            "gender": "female",
            "category": "SC",
            "state": "Maharashtra",
            "district": "Pune",
            "city": "Haveli",
            "pincode": "411014",
            "area_type": "rural",
            "latitude": 18.5204,
            "longitude": 73.8567,
            "preferred_language": "en"
        },
        "business": {
            "business_name": "Shinde Organic Food Processing",
            "sector": "Agro-Processing",
            "sub_sector": "Fruit Pulp & Jam",
            "business_stage": "Early Stage",
            "is_greenfield": True
        },
        "financial": {
            "project_cost": 2000000.0,
            "own_contribution": 100000.0,
            "annual_income": 150000.0
        }
    }

    create_res = client.post("/api/v1/profiles", json=profile_payload)
    assert create_res.status_code == 201
    profile_data = create_res.json()
    profile_id = profile_data["entrepreneur"]["id"]
    assert profile_id > 0
    assert profile_data["completeness"]["is_complete"] is True

    # -------------------------------------------------------------
    # Step 2: Fetch and verify stored profile hierarchy
    # -------------------------------------------------------------
    get_profile_res = client.get(f"/api/v1/profiles/{profile_id}")
    assert get_profile_res.status_code == 200
    assert get_profile_res.json()["entrepreneur"]["full_name"] == "Kavita Shinde"

    # -------------------------------------------------------------
    # Step 3: Run Business & Location Feasibility (Step 9)
    # -------------------------------------------------------------
    feasibility_res = client.get(f"/api/v1/profiles/{profile_id}/feasibility")
    assert feasibility_res.status_code == 200
    feasibility_data = feasibility_res.json()
    assert feasibility_data["overall_status"] in ["FAVOURABLE", "CAUTION", "HIGH_RISK", "INSUFFICIENT_DATA"]

    # -------------------------------------------------------------
    # Step 4: Retrieve Personalized Schemes For You (Step 6)
    # -------------------------------------------------------------
    matching_res = client.get(f"/api/v1/profiles/{profile_id}/matching?limit=5")
    assert matching_res.status_code == 200
    matching_data = matching_res.json()
    assert len(matching_data["results"]) > 0
    top_scheme = matching_data["results"][0]
    top_scheme_code = top_scheme["scheme_code"]
    top_scheme_id = top_scheme["scheme_id"]
    assert top_scheme["match_score"] >= 0

    # -------------------------------------------------------------
    # Step 5: Open Scheme Details (Step 3 / Step 8)
    # -------------------------------------------------------------
    scheme_detail_res = client.get(f"/api/v1/schemes/{top_scheme_code}")
    assert scheme_detail_res.status_code == 200
    scheme_detail = scheme_detail_res.json()
    assert scheme_detail["scheme_code"] == top_scheme_code
    assert len(scheme_detail["sources"]) > 0

    # -------------------------------------------------------------
    # Step 6: View Deterministic Eligibility Breakdown (Step 4)
    # -------------------------------------------------------------
    eligibility_res = client.get(f"/api/v1/profiles/{profile_id}/eligibility/{top_scheme_code}")
    assert eligibility_res.status_code == 200
    eligibility_data = eligibility_res.json()
    assert eligibility_data["overall_status"] in ["MATCHED", "FAILED", "UNVERIFIED"]

    # -------------------------------------------------------------
    # Step 7: View Financial Structuring & Loan Breakdown (Step 5)
    # -------------------------------------------------------------
    finance_res = client.get(f"/api/v1/profiles/{profile_id}/finance/summary?scheme_code={top_scheme_code}")
    assert finance_res.status_code == 200
    finance_data = finance_res.json()
    assert float(finance_data["project_cost"]) == 2000000.0
    assert float(finance_data["own_contribution"]) > 0
    assert float(finance_data["loan"]["principal"]) > 0
    assert float(finance_data["loan"]["estimated_emi"]) > 0

    # -------------------------------------------------------------
    # Step 8: Compare Top Schemes (Step 8)
    # -------------------------------------------------------------
    all_schemes_res = client.get("/api/v1/schemes")
    assert all_schemes_res.status_code == 200
    schemes_list = all_schemes_res.json()
    assert len(schemes_list) >= 2

    # -------------------------------------------------------------
    # Step 9: Discover Verified Channel Partners (Step 10)
    # -------------------------------------------------------------
    partners_res = client.get(f"/api/v1/schemes/{top_scheme_id}/partners?district=Pune&state=Maharashtra")
    assert partners_res.status_code == 200
    partners = partners_res.json()
    assert len(partners) > 0
    selected_partner_id = partners[0]["id"]

    # -------------------------------------------------------------
    # Step 10: Retrieve Application Assistance Package (Step 10)
    # -------------------------------------------------------------
    assistance_res = client.get(f"/api/v1/applications/assistance?entrepreneur_id={profile_id}&scheme_id={top_scheme_id}")
    assert assistance_res.status_code == 200
    assistance_data = assistance_res.json()
    assert len(assistance_data["required_documents"]) > 0

    # -------------------------------------------------------------
    # Step 11: Create Application Record (Step 10)
    # -------------------------------------------------------------
    app_payload = {
        "entrepreneur_id": profile_id,
        "scheme_id": top_scheme_id,
        "channel_partner_id": selected_partner_id,
        "target_loan_amount": 1700000.0,
        "target_subsidy_amount": 700000.0,
        "status_note": "Application packet lodged at DIC Pune."
    }
    app_create_res = client.post("/api/v1/applications", json=app_payload)
    assert app_create_res.status_code == 201
    application = app_create_res.json()
    app_id = application["id"]

    # -------------------------------------------------------------
    # Step 12: Update Application Status & Timeline (Step 10)
    # -------------------------------------------------------------
    status_update_payload = {
        "status": "UNDER_REVIEW",
        "status_note": "Bank manager scheduled spot inspection of unit location"
    }
    status_res = client.post(f"/api/v1/applications/{app_id}/status", json=status_update_payload)
    assert status_res.status_code == 200
    assert status_res.json()["current_status"] == "UNDER_REVIEW"

    # -------------------------------------------------------------
    # Step 13: Fetch Application Timeline Detail (Step 10)
    # -------------------------------------------------------------
    app_detail_res = client.get(f"/api/v1/applications/{app_id}")
    assert app_detail_res.status_code == 200
    app_detail = app_detail_res.json()
    assert len(app_detail["status_history"]) >= 2

    # -------------------------------------------------------------
    # Step 14: Check Consolidated Dashboard Aggregation (Step 12)
    # -------------------------------------------------------------
    dashboard_res = client.get(f"/api/v1/profiles/{profile_id}/dashboard")
    assert dashboard_res.status_code == 200
    dashboard = dashboard_res.json()
    assert dashboard["has_profile"] is True
    assert dashboard["profile"]["full_name"] == "Kavita Shinde"
    assert len(dashboard["recommended_schemes"]) > 0
    assert len(dashboard["active_applications"]) >= 1
    assert dashboard["active_applications"][0]["current_status"] == "UNDER_REVIEW"
    assert dashboard["progress_journey"]["completion_percentage"] >= 50.0

    # -------------------------------------------------------------
    # Step 15: Ask Grounded AI Copilot a contextual question (Step 11)
    # -------------------------------------------------------------
    ai_req = {
        "message": "What is the PMEGP subsidy percentage for a rural woman entrepreneur in Pune?",
        "scheme_code": "PMEGP",
        "language": "en"
    }
    ai_res = client.post("/api/v1/ai/chat", json=ai_req)
    assert ai_res.status_code == 200
    ai_data = ai_res.json()
    assert "answer" in ai_data
    assert len(ai_data["answer"]) > 0
    assert ai_data["confidence"] in ["HIGH", "MEDIUM", "LOW", "INSUFFICIENT_DATA"]

    # -------------------------------------------------------------
    # Step 16: Verify AI Health & Deterministic Authority (Step 11)
    # -------------------------------------------------------------
    ai_health = client.get("/api/v1/ai/health")
    assert ai_health.status_code == 200
    assert ai_health.json()["deterministic_authority_verified"] is True

    # -------------------------------------------------------------
    # Step 17: Verify Journey Completed Successfully
    # -------------------------------------------------------------
    assert dashboard["progress_journey"]["stages"][0]["is_completed"] is True
    assert dashboard["progress_journey"]["stages"][1]["is_completed"] is True
