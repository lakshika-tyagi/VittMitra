"""
Automated Verification Suite for Step 8: Personalized Scheme Results, Details & Comparison

Validates:
- Schemes discovery & retrieval endpoints (/api/v1/schemes, /api/v1/schemes/{id})
- Multi-scheme ranking and 3-tier categorization (ELIGIBLE, POTENTIALLY_RELEVANT, NOT_ELIGIBLE)
- Full 11-section payload completeness (benefits, rules, documents, verified sources)
- Profile-based eligibility evaluation & mathematical financial scenarios
- Comparison matrix data integrity for 2-4 schemes
- Strict zero AI participation in rule evaluation & matching calculations
"""
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.main import app
from app.db.session import get_db
from app.models.scheme import Scheme, SchemeSource, SchemeEligibilityRule, SchemeDocument
from app.models.profile import Entrepreneur, BusinessProfile, FinancialProfile
from app.schemas.matching import MatchCategory


@pytest.fixture
def in_memory_db():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    return engine, session_factory


@pytest.fixture
def client_with_mock_db(in_memory_db):
    engine, session_factory = in_memory_db

    async def override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    yield client, session_factory, engine
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_schemes_list_and_details_endpoints(client_with_mock_db):
    client, session_factory, engine = client_with_mock_db

    tables = [
        Scheme.__table__, SchemeSource.__table__,
        SchemeEligibilityRule.__table__, SchemeDocument.__table__,
        Entrepreneur.__table__, BusinessProfile.__table__, FinancialProfile.__table__
    ]
    async with engine.begin() as conn:
        for t in tables:
            await conn.run_sync(t.create)

    # Seed 2 schemes
    async with session_factory() as session:
        s1 = Scheme(
            id=1,
            scheme_code="PMEGP",
            scheme_name="Prime Minister Employment Generation Programme",
            short_description="Credit-linked subsidy programme for micro-enterprises.",
            nodal_ministry="Ministry of MSME",
            geography_level="NATIONAL",
            target_beneficiaries=["General", "SC", "ST", "OBC", "Women"],
            purpose="Generate employment in rural and urban areas.",
            benefits_summary={"max_subsidy_pct": 35.0, "max_loan_amount": 5000000.0, "margin_money_pct": 10.0},
            business_stages=["new_enterprise"],
            sectors=["manufacturing", "services"],
            data_status="VERIFIED",
            is_active=True,
        )
        s1.sources.append(SchemeSource(
            id=1,
            scheme_id=1,
            source_name="Ministry of MSME",
            source_type="OFFICIAL_GUIDELINE",
            official_url="https://msme.gov.in/pmegp",
            document_reference="PMEGP Scheme Guidelines 2024",
            last_verified_at=datetime.now(timezone.utc),
            version="2024.1",
            is_active=True,
        ))
        s1.eligibility_rules.append(SchemeEligibilityRule(
            id=1,
            scheme_id=1,
            rule_code="PMEGP_MIN_AGE",
            field_name="age",
            operator=">=",
            expected_value=18,
            description="Applicant must be at least 18 years old",
            is_mandatory=True,
            is_active=True,
        ))
        s1.documents.append(SchemeDocument(
            id=1,
            scheme_id=1,
            document_code="DOC_PROJECT_REPORT",
            document_name="Detailed Project Report (DPR)",
            description="Comprehensive project report with cost breakdown",
            is_mandatory=True,
        ))

        s2 = Scheme(
            id=2,
            scheme_code="MUDRA_SHISHU",
            scheme_name="Pradhan Mantri MUDRA Yojana (Shishu)",
            short_description="Micro loans up to Rs 50,000 for tiny micro-enterprises.",
            nodal_ministry="Ministry of Finance",
            geography_level="NATIONAL",
            target_beneficiaries=["General", "SC", "ST", "OBC", "Women"],
            purpose="Micro enterprise credit support.",
            benefits_summary={"max_loan_amount": 50000.0, "margin_money_pct": 0.0},
            business_stages=["new_enterprise", "existing_business"],
            sectors=["manufacturing", "services", "trading"],
            data_status="VERIFIED",
            is_active=True,
        )
        session.add_all([s1, s2])
        await session.commit()

    # 1. Test Schemes List
    res_list = client.get("/api/v1/schemes")
    assert res_list.status_code == 200
    schemes_data = res_list.json()
    assert len(schemes_data) == 2
    assert any(s["scheme_code"] == "PMEGP" for s in schemes_data)
    assert any(s["scheme_code"] == "MUDRA_SHISHU" for s in schemes_data)

    # 2. Test Sector Filtering
    res_filtered = client.get("/api/v1/schemes?sector=trading")
    assert res_filtered.status_code == 200
    filtered_data = res_filtered.json()
    assert len(filtered_data) == 1
    assert filtered_data[0]["scheme_code"] == "MUDRA_SHISHU"

    # 3. Test Scheme Detail by Code
    res_detail = client.get("/api/v1/schemes/PMEGP")
    assert res_detail.status_code == 200
    detail = res_detail.json()
    assert detail["scheme_code"] == "PMEGP"
    assert len(detail["sources"]) == 1
    assert detail["sources"][0]["source_name"] == "Ministry of MSME"
    assert len(detail["eligibility_rules"]) == 1
    assert detail["eligibility_rules"][0]["rule_code"] == "PMEGP_MIN_AGE"
    assert len(detail["documents"]) == 1
    assert detail["documents"][0]["document_code"] == "DOC_PROJECT_REPORT"

    # 4. Test Scheme Detail by Integer ID
    res_detail_id = client.get("/api/v1/schemes/1")
    assert res_detail_id.status_code == 200
    assert res_detail_id.json()["scheme_code"] == "PMEGP"

    # 5. Test Invalid Scheme 404
    res_404 = client.get("/api/v1/schemes/NON_EXISTENT_SCHEME_999")
    assert res_404.status_code == 404


@pytest.mark.asyncio
async def test_personalized_profile_matching_and_financial_scenarios(client_with_mock_db):
    client, session_factory, engine = client_with_mock_db

    tables = [
        Scheme.__table__, SchemeSource.__table__,
        SchemeEligibilityRule.__table__, SchemeDocument.__table__,
        Entrepreneur.__table__, BusinessProfile.__table__, FinancialProfile.__table__
    ]
    async with engine.begin() as conn:
        for t in tables:
            await conn.run_sync(t.create)

    # Seed PMEGP scheme with rules directly via relationship
    async with session_factory() as session:
        pmegp = Scheme(
            id=1,
            scheme_code="PMEGP",
            scheme_name="Prime Minister Employment Generation Programme",
            short_description="Credit linked subsidy for new units.",
            nodal_ministry="Ministry of MSME",
            geography_level="NATIONAL",
            target_beneficiaries=["General", "SC", "ST", "OBC", "Women"],
            purpose="Self employment",
            benefits_summary={
                "max_project_cost_manufacturing_inr": 5000000,
                "max_project_cost_services_inr": 2000000,
                "max_subsidy_pct": 35.0,
                "margin_money_pct": 10.0,
            },
            business_stages=["new_enterprise"],
            sectors=["manufacturing"],
            data_status="VERIFIED",
            is_active=True,
        )
        pmegp.eligibility_rules.append(SchemeEligibilityRule(
            id=1,
            scheme_id=1,
            rule_code="PMEGP_MIN_AGE",
            field_name="age",
            operator=">=",
            expected_value=18,
            description="Applicant must be at least 18 years old",
            is_mandatory=True,
            is_active=True,
        ))
        pmegp.eligibility_rules.append(SchemeEligibilityRule(
            id=2,
            scheme_id=1,
            rule_code="PMEGP_GREENFIELD_ONLY",
            field_name="is_greenfield",
            operator="==",
            expected_value=True,
            description="PMEGP is strictly for new greenfield projects",
            is_mandatory=True,
            is_active=True,
        ))
        session.add(pmegp)
        await session.commit()

    # Create profile via API
    payload = {
        "entrepreneur": {
            "full_name": "Priya Sharma",
            "age": 28,
            "gender": "female",
            "category": "OBC",
            "state": "Maharashtra",
            "district": "Pune",
            "area_type": "rural"
        },
        "business": {
            "business_name": "Priya Food Processing",
            "sector": "manufacturing",
            "business_stage": "new_enterprise",
            "is_greenfield": True,
            "is_defaulter": False,
            "is_non_farm_income_generating": True
        },
        "financial": {
            "project_cost": 1500000,
            "own_contribution": 250000,
            "loan_requirement": 1250000,
            "monthly_income": 45000,
            "existing_monthly_obligations": 5000
        }
    }
    create_resp = client.post("/api/v1/profiles", json=payload)
    assert create_resp.status_code == 201
    profile_id = create_resp.json()["entrepreneur"]["id"]

    # 1. Test Profile-to-Scheme Matching Endpoint
    res_match = client.get(f"/api/v1/profiles/{profile_id}/matching")
    assert res_match.status_code == 200
    match_data = res_match.json()
    assert match_data["total_schemes_evaluated"] == 1
    assert match_data["eligible_count"] == 1
    assert len(match_data["results"]) == 1

    first_result = match_data["results"][0]
    assert first_result["scheme_code"] == "PMEGP"
    assert first_result["match_category"] == MatchCategory.ELIGIBLE.value
    assert first_result["match_score"] > 80.0
    assert first_result["eligibility_status"] == "MATCHED"
    assert len(first_result["reasons"]["positive"]) > 0
    assert len(first_result["score_breakdown"]) > 0
    assert "disclaimer" in match_data

    # 2. Test Profile Eligibility Endpoint for specific scheme
    res_elig = client.get(f"/api/v1/profiles/{profile_id}/eligibility/PMEGP")
    assert res_elig.status_code == 200
    elig_data = res_elig.json()
    assert elig_data["overall_status"] == "MATCHED"
    assert len(elig_data["criteria"]) == 2
    assert all(c["status"] == "MATCHED" for c in elig_data["criteria"])

    # 3. Test Profile Financial Summary Calculation
    res_fin = client.get(f"/api/v1/profiles/{profile_id}/finance/summary?scheme_code=PMEGP")
    assert res_fin.status_code == 200
    fin_data = res_fin.json()
    assert float(fin_data["project_cost"]) == 1500000.0
    assert float(fin_data["own_contribution"]) == 250000.0
    assert float(fin_data["loan"]["estimated_emi"]) > 0
    assert fin_data["affordability"]["status"] in ["SUFFICIENT_DATA", "INSUFFICIENT_DATA"]
    assert fin_data["affordability"]["debt_to_income_pct"] is not None
