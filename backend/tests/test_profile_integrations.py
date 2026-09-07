"""
Integration Tests for Stored Profile with Eligibility, Finance, and Scheme Matching Engines
"""
import pytest
from datetime import datetime, timezone
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.main import app
from app.db.session import get_db
from app.models.profile import Entrepreneur, BusinessProfile, FinancialProfile
from app.models.scheme import Scheme, SchemeSource, SchemeEligibilityRule, SchemeDocument
from app.schemas.eligibility import EligibilityStatus
from app.schemas.matching import MatchCategory


@pytest.fixture
def mock_integration_client():
    """FastAPI TestClient with in-memory SQLite seeded with schemes and profiles."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    async def init_db():
        tables = [
            Entrepreneur.__table__,
            BusinessProfile.__table__,
            FinancialProfile.__table__,
            Scheme.__table__,
            SchemeSource.__table__,
            SchemeEligibilityRule.__table__,
            SchemeDocument.__table__,
        ]
        async with engine.begin() as conn:
            for t in tables:
                await conn.run_sync(t.create)

        async with session_factory() as session:
            # Seed PMEGP Scheme
            pmegp = Scheme(
                id=1,
                scheme_code="PMEGP",
                scheme_name="Prime Minister's Employment Generation Programme",
                short_description="Credit linked subsidy scheme for micro-enterprises",
                nodal_ministry="Ministry of MSME",
                geography_level="NATIONAL",
                target_beneficiaries=["General", "SC", "ST", "OBC", "Women"],
                purpose="Self-employment and micro-enterprise creation",
                benefits_summary={
                    "max_project_cost_manufacturing_inr": 5000000,
                    "max_project_cost_services_inr": 2000000,
                    "subsidy_rate_rural_special": 0.35,
                },
                business_stages=["new_enterprise"],
                sectors=["manufacturing", "services"],
                data_status="VERIFIED",
                is_active=True
            )
            pmegp.eligibility_rules.append(SchemeEligibilityRule(
                id=1,
                scheme_id=1,
                rule_code="PMEGP_AGE_18",
                field_name="age",
                operator=">=",
                expected_value=18,
                description="Applicant must be at least 18 years old",
                is_mandatory=True,
                is_active=True
            ))
            pmegp.eligibility_rules.append(SchemeEligibilityRule(
                id=2,
                scheme_id=1,
                rule_code="PMEGP_GREENFIELD_ONLY",
                field_name="is_greenfield",
                operator="==",
                expected_value=True,
                description="Assistance available only for new units",
                is_mandatory=True,
                is_active=True
            ))

            # Seed Stand-Up India Scheme
            sui = Scheme(
                id=2,
                scheme_code="STANDUP_INDIA",
                scheme_name="Stand-Up India Scheme",
                short_description="Facilitating bank loans between 10 lakh and 1 crore to SC/ST or Women",
                nodal_ministry="Ministry of Finance",
                geography_level="NATIONAL",
                target_beneficiaries=["SC", "ST", "Women"],
                purpose="Promote entrepreneurship among women and SC/ST communities",
                benefits_summary={"min_loan_inr": 1000000, "max_loan_inr": 10000000},
                business_stages=["new_enterprise"],
                sectors=["manufacturing", "services", "trading"],
                data_status="VERIFIED",
                is_active=True
            )
            sui.eligibility_rules.append(SchemeEligibilityRule(
                id=3,
                scheme_id=2,
                rule_code="SUI_TARGET",
                field_name="category_or_gender",
                operator="in",
                expected_value=["SC", "ST", "female"],
                description="SC, ST or Woman applicant",
                is_mandatory=True,
                is_active=True
            ))

            session.add_all([pmegp, sui])
            await session.commit()

    import asyncio
    asyncio.run(init_db())

    async def override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


def test_profile_eligibility_integration(mock_integration_client):
    """Test GET /profiles/{id}/eligibility/{scheme_id} executes Step 4 engine for stored profile."""
    # Create profile
    payload = {
        "entrepreneur": {
            "full_name": "Pooja Hegde",
            "age": 27,
            "gender": "female",
            "category": "SC",
            "state": "Karnataka",
            "area_type": "rural"
        },
        "business": {
            "sector": "manufacturing",
            "business_stage": "new_enterprise",
            "is_greenfield": True
        },
        "financial": {
            "project_cost": 1500000,
            "own_contribution": 150000
        }
    }
    create_resp = mock_integration_client.post("/api/v1/profiles", json=payload)
    assert create_resp.status_code == 201
    profile_id = create_resp.json()["entrepreneur"]["id"]

    # Check eligibility for PMEGP
    pmegp_resp = mock_integration_client.get(f"/api/v1/profiles/{profile_id}/eligibility/PMEGP")
    assert pmegp_resp.status_code == 200
    pmegp_data = pmegp_resp.json()
    assert pmegp_data["overall_status"] == EligibilityStatus.MATCHED.value
    assert pmegp_data["summary"]["matched_count"] == 2

    # Check eligibility for Stand-Up India
    sui_resp = mock_integration_client.get(f"/api/v1/profiles/{profile_id}/eligibility/STANDUP_INDIA")
    assert sui_resp.status_code == 200
    sui_data = sui_resp.json()
    assert sui_data["overall_status"] == EligibilityStatus.MATCHED.value


def test_profile_finance_summary_integration(mock_integration_client):
    """Test GET /profiles/{id}/finance/summary executes Step 5 financial engine for stored profile."""
    payload = {
        "entrepreneur": {
            "full_name": "Vikram Rathore",
            "age": 30,
            "gender": "male",
            "category": "OBC",
            "state": "Rajasthan",
            "area_type": "rural"
        },
        "business": {
            "sector": "manufacturing",
            "business_stage": "new_enterprise"
        },
        "financial": {
            "project_cost": 2000000,
            "own_contribution": 300000,
            "monthly_income": 60000,
            "existing_monthly_obligations": 5000,
            "machinery_equipment_cost": 1400000,
            "infrastructure_cost": 400000,
            "working_capital_cost": 200000
        }
    }
    create_resp = mock_integration_client.post("/api/v1/profiles", json=payload)
    profile_id = create_resp.json()["entrepreneur"]["id"]

    fin_resp = mock_integration_client.get(f"/api/v1/profiles/{profile_id}/finance/summary?scheme_code=PMEGP")
    assert fin_resp.status_code == 200
    fin_data = fin_resp.json()

    assert float(fin_data["project_cost"]) == 2000000.0
    assert float(fin_data["own_contribution"]) == 300000.0
    assert float(fin_data["financing_gap"]) == 1700000.0
    assert float(fin_data["loan"]["estimated_emi"]) > 0
    assert fin_data["affordability"]["debt_to_income_pct"] is not None


def test_profile_matching_integration(mock_integration_client):
    """Test GET /profiles/{id}/matching executes Step 6 scheme matching engine for stored profile."""
    payload = {
        "entrepreneur": {
            "full_name": "Deepa Nair",
            "age": 29,
            "gender": "female",
            "category": "General",
            "state": "Kerala",
            "area_type": "urban"
        },
        "business": {
            "sector": "services",
            "business_stage": "new_enterprise",
            "is_greenfield": True
        },
        "financial": {
            "project_cost": 1200000,
            "own_contribution": 200000,
            "monthly_income": 50000
        }
    }
    create_resp = mock_integration_client.post("/api/v1/profiles", json=payload)
    profile_id = create_resp.json()["entrepreneur"]["id"]

    match_resp = mock_integration_client.get(f"/api/v1/profiles/{profile_id}/matching?limit=5")
    assert match_resp.status_code == 200
    match_data = match_resp.json()

    assert match_data["total_schemes_evaluated"] == 2
    assert len(match_data["results"]) == 2
    # Female entrepreneur should match Stand-Up India and PMEGP
    eligible_schemes = [r["scheme_code"] for r in match_data["results"] if r["match_category"] == MatchCategory.ELIGIBLE.value]
    assert "STANDUP_INDIA" in eligible_schemes
    assert "PMEGP" in eligible_schemes
