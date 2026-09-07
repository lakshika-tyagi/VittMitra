"""
API Integration Tests for POST /matching/schemes and POST /api/v1/matching/schemes
"""
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.main import app
from app.db.session import get_db
from app.models.scheme import Scheme, SchemeSource, SchemeEligibilityRule, SchemeDocument
from app.schemas.matching import MatchCategory


@pytest.fixture
def mock_client_matching():
    """FastAPI TestClient with an in-memory test database seeded with schemes."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    async def init_db():
        tables = [
            Scheme.__table__,
            SchemeSource.__table__,
            SchemeEligibilityRule.__table__,
            SchemeDocument.__table__,
        ]
        async with engine.begin() as conn:
            for t in tables:
                await conn.run_sync(t.create)

        async with session_factory() as session:
            # 1. PMEGP Scheme
            pmegp = Scheme(
                id=1,
                scheme_code="PMEGP",
                scheme_name="Prime Minister's Employment Generation Programme",
                short_description="Credit-linked subsidy programme",
                nodal_ministry="Ministry of MSME",
                geography_level="NATIONAL",
                target_beneficiaries=["General", "SC", "ST", "Women", "OBC"],
                purpose="Employment generation",
                benefits_summary={"max_project_cost_manufacturing_inr": 5000000},
                business_stages=["new_enterprise"],
                sectors=["manufacturing", "services"],
                data_status="VERIFIED",
                is_active=True
            )
            src_pmegp = SchemeSource(
                id=1,
                scheme_id=1,
                source_name="KVIC Portal",
                source_type="OFFICIAL_PORTAL",
                official_url="https://www.kviconline.gov.in",
                version="2022.1",
                last_verified_at=datetime.now(timezone.utc)
            )
            pmegp.sources.append(src_pmegp)
            pmegp.eligibility_rules.append(SchemeEligibilityRule(
                id=1,
                scheme_id=1,
                rule_code="PMEGP_AGE",
                field_name="age",
                operator=">=",
                expected_value=18,
                description="Min age 18",
                is_mandatory=True,
                is_active=True
            ))

            # 2. Stand-Up India Scheme (SC/ST/Women only, 10L - 1Cr)
            sui = Scheme(
                id=2,
                scheme_code="STANDUP_INDIA",
                scheme_name="Stand-Up India Scheme",
                short_description="Bank loans for SC/ST and Women greenfield units",
                nodal_ministry="Ministry of Finance",
                geography_level="NATIONAL",
                target_beneficiaries=["SC", "ST", "Women"],
                purpose="Support SC/ST and Women entrepreneurs",
                benefits_summary={"min_loan_amount_inr": 1000000, "max_loan_amount_inr": 10000000},
                business_stages=["new_enterprise"],
                sectors=["manufacturing", "services", "trading"],
                data_status="VERIFIED",
                is_active=True
            )
            sui.eligibility_rules.append(SchemeEligibilityRule(
                id=2,
                scheme_id=2,
                rule_code="SUI_TARGET",
                field_name="category_or_gender",
                operator="in",
                expected_value=["SC", "ST", "female"],
                description="SC, ST or Woman applicant",
                is_mandatory=True,
                is_active=True
            ))

            # 3. Inactive Scheme
            inactive = Scheme(
                id=3,
                scheme_code="INACTIVE_SCHEME",
                scheme_name="Old Archived Scheme",
                short_description="No longer active",
                nodal_ministry="Ministry of Finance",
                geography_level="NATIONAL",
                target_beneficiaries=["General"],
                purpose="Historical record",
                benefits_summary={},
                business_stages=["new_enterprise"],
                sectors=["manufacturing"],
                data_status="VERIFIED",
                is_active=False
            )

            session.add_all([pmegp, sui, inactive])
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


def test_matching_api_complete_profile_sc_female(mock_client_matching):
    """SC Female entrepreneur should be ELIGIBLE for both PMEGP and Stand-Up India."""
    payload = {
        "profile": {
            "age": 29,
            "gender": "female",
            "category": "SC",
            "state": "Maharashtra",
            "business_stage": "new_enterprise",
            "sector": "manufacturing"
        },
        "financial": {
            "project_cost": 2000000,
            "own_contribution": 300000,
            "loan_amount": 1700000,
            "annual_interest_rate": 9.5,
            "tenure_months": 60
        },
        "limit": 5,
        "include_ineligible": True
    }

    # Test root shortcut
    response = mock_client_matching.post("/matching/schemes", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["total_schemes_evaluated"] == 2 # Inactive excluded
    assert data["eligible_count"] >= 1
    assert "Match Score is a VittMitra relevance/ranking indicator" in data["disclaimer"]
    assert len(data["results"]) == 2

    top_res = data["results"][0]
    assert top_res["rank"] == 1
    assert top_res["match_category"] == MatchCategory.ELIGIBLE.value
    assert len(top_res["reasons"]["positive"]) >= 3
    assert len(top_res["score_breakdown"]) == 6


def test_matching_api_general_male_standup_fail(mock_client_matching):
    """General Male entrepreneur should be ELIGIBLE for PMEGP but NOT_ELIGIBLE for Stand-Up India."""
    payload = {
        "profile": {
            "age": 35,
            "gender": "male",
            "category": "General",
            "state": "Karnataka",
            "business_stage": "new_enterprise",
            "sector": "manufacturing"
        },
        "financial": {
            "project_cost": 1500000,
            "own_contribution": 200000,
            "loan_amount": 1300000
        },
        "include_ineligible": True
    }

    # Test /api/v1/matching/schemes
    response = mock_client_matching.post("/api/v1/matching/schemes", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["eligible_count"] == 1
    assert data["not_eligible_count"] == 1

    pmegp_res = next(r for r in data["results"] if r["scheme_code"] == "PMEGP")
    assert pmegp_res["match_category"] == MatchCategory.ELIGIBLE.value
    assert pmegp_res["rank"] == 1

    sui_res = next(r for r in data["results"] if r["scheme_code"] == "STANDUP_INDIA")
    assert sui_res["match_category"] == MatchCategory.NOT_ELIGIBLE.value
    assert sui_res["rank"] == 2
    assert any("not match" in r.lower() or "failed" in r.lower() for r in sui_res["reasons"]["negative"])


def test_matching_api_exclude_ineligible(mock_client_matching):
    """When include_ineligible is False, NOT_ELIGIBLE schemes must not be returned."""
    payload = {
        "profile": {
            "age": 35,
            "gender": "male",
            "category": "General",
            "state": "Karnataka",
            "business_stage": "new_enterprise",
            "sector": "manufacturing"
        },
        "include_ineligible": False
    }

    response = mock_client_matching.post("/matching/schemes", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert len(data["results"]) == 1
    assert data["results"][0]["scheme_code"] == "PMEGP"


def test_matching_api_limit_parameter(mock_client_matching):
    """Limit parameter should restrict the number of results returned."""
    payload = {
        "profile": {
            "age": 25,
            "gender": "female",
            "category": "ST",
            "state": "Odisha",
            "business_stage": "new_enterprise",
            "sector": "manufacturing"
        },
        "limit": 1
    }

    response = mock_client_matching.post("/matching/schemes", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert len(data["results"]) == 1
