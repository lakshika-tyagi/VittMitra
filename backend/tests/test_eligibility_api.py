"""
API Integration tests for POST /api/v1/eligibility/check and POST /eligibility/check
"""
import pytest
import asyncio
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.main import app
from app.db.session import get_db
from app.models.scheme import Scheme, SchemeSource, SchemeEligibilityRule, SchemeDocument
from app.schemas.eligibility import EligibilityStatus


@pytest.fixture
def mock_client_with_schemes():
    """FastAPI TestClient with an in-memory database preloaded with PMEGP & Stand-Up India."""
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
                target_beneficiaries=["General", "SC", "ST", "Women"],
                purpose="Employment generation",
                benefits_summary={"max_cost_mfg": 5000000},
                business_stages=["new_enterprise"],
                sectors=["manufacturing", "services"],
                data_status="VERIFIED",
                is_active=True
            )
            src_pmegp = SchemeSource(
                id=1,
                scheme_id=1,
                source_name="KVIC Official Portal",
                source_type="OFFICIAL_PORTAL",
                official_url="https://www.kviconline.gov.in",
                version="2022.1",
                last_verified_at=datetime.now(timezone.utc)
            )
            pmegp.sources.append(src_pmegp)
            pmegp.eligibility_rules.append(SchemeEligibilityRule(
                id=1,
                scheme_id=1,
                rule_code="PMEGP_MIN_AGE",
                field_name="age",
                operator=">=",
                expected_value=18,
                description="Applicant must be at least 18 years of age.",
                source_id=1,
                rule_version="1.0",
                is_mandatory=True,
                is_active=True
            ))
            pmegp.eligibility_rules.append(SchemeEligibilityRule(
                id=2,
                scheme_id=1,
                rule_code="PMEGP_UNIT_STAGE",
                field_name="business_stage",
                operator="==",
                expected_value="new_enterprise",
                description="Assistance strictly for setting up new micro-enterprises.",
                source_id=1,
                rule_version="1.0",
                is_mandatory=True,
                is_active=True
            ))
            session.add(pmegp)

            # 2. Stand-Up India Scheme
            sui = Scheme(
                id=2,
                scheme_code="STANDUP_INDIA",
                scheme_name="Stand-Up India Scheme",
                short_description="Bank loans between 10L and 1Cr for SC/ST and Women",
                nodal_ministry="Ministry of Finance",
                geography_level="NATIONAL",
                target_beneficiaries=["SC", "ST", "Women"],
                purpose="Promote entrepreneurship among SC/ST and Women",
                benefits_summary={"min_loan": 1000000, "max_loan": 10000000},
                business_stages=["new_enterprise"],
                sectors=["manufacturing", "services"],
                data_status="VERIFIED",
                is_active=True
            )
            src_sui = SchemeSource(
                id=2,
                scheme_id=2,
                source_name="Stand-Up Mitra Portal",
                source_type="OFFICIAL_PORTAL",
                official_url="https://www.standupmitra.in",
                version="2.0",
                last_verified_at=datetime.now(timezone.utc)
            )
            sui.sources.append(src_sui)
            sui.eligibility_rules.append(SchemeEligibilityRule(
                id=3,
                scheme_id=2,
                rule_code="SUI_TARGET_GROUP",
                field_name="category_or_gender",
                operator="in",
                expected_value=["SC", "ST", "female"],
                description="Applicant must be SC/ST or a Woman entrepreneur.",
                source_id=2,
                rule_version="2.0",
                is_mandatory=True,
                is_active=True
            ))
            session.add(sui)
            await session.commit()

    asyncio.run(init_db())

    async def override_get_db():
        async with session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()
    asyncio.run(engine.dispose())


def test_eligibility_check_pmegp_matched(mock_client_with_schemes):
    """Test POST /api/v1/eligibility/check with valid PMEGP profile returning MATCHED."""
    payload = {
        "scheme_id": "PMEGP",
        "profile": {
            "age": 27,
            "business_stage": "new_enterprise"
        }
    }
    response = mock_client_with_schemes.post("/api/v1/eligibility/check", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["scheme_code"] == "PMEGP"
    assert data["overall_status"] == EligibilityStatus.MATCHED
    assert data["summary"]["total_rules"] == 2
    assert data["summary"]["matched_count"] == 2
    assert data["summary"]["failed_count"] == 0
    assert data["summary"]["unverified_count"] == 0

    # Verify criterion explanations and source links
    criteria = data["criteria"]
    assert len(criteria) == 2
    age_crit = next(c for c in criteria if c["rule_code"] == "PMEGP_MIN_AGE")
    assert age_crit["status"] == EligibilityStatus.MATCHED
    assert age_crit["user_value"] == 27
    assert age_crit["source_name"] == "KVIC Official Portal"
    assert age_crit["source_url"] == "https://www.kviconline.gov.in"
    assert "meets required minimum of >= 18" in age_crit["explanation"]


def test_eligibility_check_pmegp_failed(mock_client_with_schemes):
    """Test POST /api/v1/eligibility/check with underage applicant returning FAILED."""
    payload = {
        "scheme_id": "PMEGP",
        "profile": {
            "age": 17,
            "business_stage": "new_enterprise"
        }
    }
    response = mock_client_with_schemes.post("/api/v1/eligibility/check", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["overall_status"] == EligibilityStatus.FAILED
    assert data["summary"]["matched_count"] == 1
    assert data["summary"]["failed_count"] == 1

    age_crit = next(c for c in data["criteria"] if c["rule_code"] == "PMEGP_MIN_AGE")
    assert age_crit["status"] == EligibilityStatus.FAILED
    assert "fails to meet required minimum of >= 18" in age_crit["explanation"]


def test_eligibility_check_pmegp_unverified(mock_client_with_schemes):
    """Test POST /api/v1/eligibility/check with missing age returning UNVERIFIED."""
    payload = {
        "scheme_id": "PMEGP",
        "profile": {
            "business_stage": "new_enterprise"
        }
    }
    response = mock_client_with_schemes.post("/api/v1/eligibility/check", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["overall_status"] == EligibilityStatus.UNVERIFIED
    assert data["summary"]["matched_count"] == 1
    assert data["summary"]["unverified_count"] == 1


def test_eligibility_check_by_integer_id(mock_client_with_schemes):
    """Test POST /api/v1/eligibility/check lookup by numeric ID."""
    payload = {
        "scheme_id": 1,
        "profile": {
            "age": 30,
            "business_stage": "new_enterprise"
        }
    }
    response = mock_client_with_schemes.post("/api/v1/eligibility/check", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["scheme_id"] == 1
    assert data["overall_status"] == EligibilityStatus.MATCHED


def test_root_eligibility_check_shortcut(mock_client_with_schemes):
    """Test shortcut POST /eligibility/check."""
    payload = {
        "scheme_id": "PMEGP",
        "profile": {
            "age": 22,
            "business_stage": "new_enterprise"
        }
    }
    response = mock_client_with_schemes.post("/eligibility/check", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["overall_status"] == EligibilityStatus.MATCHED


def test_standup_india_compound_field(mock_client_with_schemes):
    """Test Stand-Up India category or gender compound field evaluation."""
    # Test Women entrepreneur matching
    payload_woman = {
        "scheme_id": "STANDUP_INDIA",
        "profile": {
            "gender": "female",
            "category": "General"
        }
    }
    res_w = mock_client_with_schemes.post("/api/v1/eligibility/check", json=payload_woman)
    assert res_w.status_code == 200
    assert res_w.json()["overall_status"] == EligibilityStatus.MATCHED

    # Test General Male failing
    payload_male = {
        "scheme_id": "STANDUP_INDIA",
        "profile": {
            "gender": "male",
            "category": "General"
        }
    }
    res_m = mock_client_with_schemes.post("/api/v1/eligibility/check", json=payload_male)
    assert res_m.status_code == 200
    assert res_m.json()["overall_status"] == EligibilityStatus.FAILED


def test_eligibility_check_unknown_scheme_404(mock_client_with_schemes):
    """Test POST /api/v1/eligibility/check with non-existent scheme returning 404."""
    payload = {
        "scheme_id": "UNKNOWN_SCHEME",
        "profile": {"age": 25}
    }
    response = mock_client_with_schemes.post("/api/v1/eligibility/check", json=payload)
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_eligibility_check_invalid_payload_422(mock_client_with_schemes):
    """Test POST /api/v1/eligibility/check with missing scheme_id returning 422."""
    payload = {
        "profile": {"age": 25}
    }
    response = mock_client_with_schemes.post("/api/v1/eligibility/check", json=payload)
    assert response.status_code == 422
