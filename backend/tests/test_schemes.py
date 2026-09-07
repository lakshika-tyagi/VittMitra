import pytest
import json
import asyncio
from pathlib import Path
from datetime import datetime, timezone
from pydantic import ValidationError
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select, exc

from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.models.scheme import Scheme, SchemeSource, SchemeEligibilityRule, SchemeDocument
from app.schemas.scheme import SchemeSeedPayload, SchemeDetailResponse, SchemeListResponse

SEEDS_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "seed" / "schemes"

# ---------------------------------------------------------------------------
# 1. Seed Data Quality & Validation Tests
# ---------------------------------------------------------------------------

def test_seed_data_files_exist():
    """Verify that authoritative scheme seed files exist in data/seed/schemes/."""
    assert SEEDS_DIR.is_dir(), f"Seed directory {SEEDS_DIR} does not exist"
    seed_files = list(SEEDS_DIR.glob("*.json"))
    assert len(seed_files) >= 5, f"Expected at least 5 seed schemes, found {len(seed_files)}"

def test_all_seed_files_pass_pydantic_validation():
    """Validate every scheme seed file against SchemeSeedPayload."""
    seed_files = list(SEEDS_DIR.glob("*.json"))
    scheme_codes = set()

    for f in seed_files:
        with open(f, "r", encoding="utf-8") as fp:
            data = json.load(fp)
        
        payload = SchemeSeedPayload.model_validate(data)
        assert payload.scheme_code not in scheme_codes, f"Duplicate scheme code found: {payload.scheme_code}"
        scheme_codes.add(payload.scheme_code)
        
        # Verify source metadata
        assert len(payload.sources) >= 1, f"Scheme {payload.scheme_code} has no sources"
        for s in payload.sources:
            assert s.source_name
            assert s.official_url.startswith("http")
            assert s.last_verified_at is not None
        
        # Verify data status is explicitly VERIFIED
        assert payload.data_status == "VERIFIED"
        
        # Verify rules and documents exist
        assert len(payload.eligibility_rules) >= 1
        assert len(payload.documents) >= 1

def test_invalid_scheme_seed_rejected():
    """Verify that invalid/corrupt scheme payloads are rejected with ValidationError."""
    invalid_data = {
        "scheme_code": "INVALID",
        # missing scheme_name, nodal_ministry, sources, etc.
    }
    with pytest.raises(ValidationError):
        SchemeSeedPayload.model_validate(invalid_data)


# ---------------------------------------------------------------------------
# 2. Database Model & Relationship Tests (In-Memory Async DB)
# ---------------------------------------------------------------------------

def test_scheme_model_crud_and_relationships():
    """Test Scheme insertion with cascading child sources, rules, and documents."""
    async def run_test():
        engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
        tables_to_create = [
            Scheme.__table__,
            SchemeSource.__table__,
            SchemeEligibilityRule.__table__,
            SchemeDocument.__table__,
        ]
        
        async with engine.begin() as conn:
            for t in tables_to_create:
                await conn.run_sync(t.create)
                
        session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
        
        async with session_factory() as session:
            scheme = Scheme(
                scheme_code="TEST_PMEGP",
                scheme_name="Test PMEGP Scheme",
                short_description="Test Description",
                nodal_ministry="Ministry of MSME",
                geography_level="NATIONAL",
                target_beneficiaries=["SC", "ST", "Women"],
                purpose="Self-employment generation",
                benefits_summary={"subsidy": 25.0},
                business_stages=["new_enterprise"],
                sectors=["manufacturing"],
                data_status="VERIFIED",
                is_active=True
            )
            
            source = SchemeSource(
                source_name="MSME Official Portal",
                source_type="OFFICIAL_PORTAL",
                official_url="https://msme.gov.in",
                last_verified_at=datetime.now(timezone.utc),
                version="1.0"
            )
            scheme.sources.append(source)
            
            rule = SchemeEligibilityRule(
                rule_code="TEST_AGE_18",
                field_name="age",
                operator=">=",
                expected_value=18,
                description="Minimum age 18 years"
            )
            scheme.eligibility_rules.append(rule)
            
            doc = SchemeDocument(
                document_code="AADHAAR",
                document_name="Aadhaar Card",
                is_mandatory=True
            )
            scheme.documents.append(doc)
            
            session.add(scheme)
            await session.commit()
            
            # Query back and verify relationships
            query = select(Scheme).where(Scheme.scheme_code == "TEST_PMEGP")
            result = await session.execute(query)
            fetched = result.scalar_one()
            
            assert fetched.scheme_name == "Test PMEGP Scheme"
            assert len(fetched.sources) == 1
            assert fetched.sources[0].source_name == "MSME Official Portal"
            assert len(fetched.eligibility_rules) == 1
            assert fetched.eligibility_rules[0].field_name == "age"
            assert len(fetched.documents) == 1
            assert fetched.documents[0].document_code == "AADHAAR"

        await engine.dispose()

    asyncio.run(run_test())

def test_duplicate_scheme_code_rejected():
    """Verify unique constraint on scheme_code."""
    async def run_test():
        engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
        tables = [Scheme.__table__, SchemeSource.__table__, SchemeEligibilityRule.__table__, SchemeDocument.__table__]
        async with engine.begin() as conn:
            for t in tables:
                await conn.run_sync(t.create)

        session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
        async with session_factory() as session:
            scheme1 = Scheme(
                scheme_code="UNIQUE_CODE",
                scheme_name="First Scheme",
                short_description="Desc",
                nodal_ministry="Ministry",
                target_beneficiaries=[],
                purpose="Purpose",
                benefits_summary={},
                business_stages=[],
                sectors=[],
            )
            session.add(scheme1)
            await session.commit()
            
            scheme2 = Scheme(
                scheme_code="UNIQUE_CODE",
                scheme_name="Duplicate Scheme",
                short_description="Desc 2",
                nodal_ministry="Ministry",
                target_beneficiaries=[],
                purpose="Purpose 2",
                benefits_summary={},
                business_stages=[],
                sectors=[],
            )
            session.add(scheme2)
            with pytest.raises(exc.IntegrityError):
                await session.commit()

        await engine.dispose()

    asyncio.run(run_test())


# ---------------------------------------------------------------------------
# 3. Read-Only API Endpoints Tests
# ---------------------------------------------------------------------------

@pytest.fixture
def mock_client_with_schemes():
    """Client with an in-memory database preloaded with sample scheme."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    
    # Initialize schema and preload 1 scheme
    async def init_db():
        tables = [Scheme.__table__, SchemeSource.__table__, SchemeEligibilityRule.__table__, SchemeDocument.__table__]
        async with engine.begin() as conn:
            for t in tables:
                await conn.run_sync(t.create)
        
        async with session_factory() as session:
            s = Scheme(
                scheme_code="PMEGP",
                scheme_name="Prime Minister's Employment Generation Programme",
                short_description="Credit-linked subsidy programme",
                nodal_ministry="Ministry of Micro, Small and Medium Enterprises",
                geography_level="NATIONAL",
                target_beneficiaries=["General", "SC", "ST", "Women"],
                purpose="Employment generation",
                benefits_summary={"max_cost_mfg": 5000000},
                business_stages=["new_enterprise"],
                sectors=["manufacturing", "services"],
                data_status="VERIFIED",
                is_active=True
            )
            s.sources.append(SchemeSource(
                source_name="KVIC Portal",
                source_type="OFFICIAL_PORTAL",
                official_url="https://www.kviconline.gov.in",
                last_verified_at=datetime.now(timezone.utc)
            ))
            s.eligibility_rules.append(SchemeEligibilityRule(
                rule_code="PMEGP_MIN_AGE",
                field_name="age",
                operator=">=",
                expected_value=18,
                description="Minimum age 18"
            ))
            s.documents.append(SchemeDocument(
                document_code="AADHAAR",
                document_name="Aadhaar Card",
                is_mandatory=True
            ))
            session.add(s)
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

def test_get_schemes_list_api(mock_client_with_schemes):
    """Test GET /api/v1/schemes and root /schemes returns list of active schemes."""
    response = mock_client_with_schemes.get("/api/v1/schemes")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["scheme_code"] == "PMEGP"
    assert data[0]["data_status"] == "VERIFIED"

def test_get_scheme_by_identifier_api(mock_client_with_schemes):
    """Test GET /api/v1/schemes/{scheme_code} returns detailed specification."""
    response = mock_client_with_schemes.get("/api/v1/schemes/PMEGP")
    assert response.status_code == 200
    data = response.json()
    assert data["scheme_code"] == "PMEGP"
    assert len(data["sources"]) == 1
    assert data["sources"][0]["source_name"] == "KVIC Portal"
    assert len(data["eligibility_rules"]) == 1
    assert len(data["documents"]) == 1

def test_get_unknown_scheme_returns_404(mock_client_with_schemes):
    """Test GET /api/v1/schemes/{unknown} returns 404 Not Found."""
    response = mock_client_with_schemes.get("/api/v1/schemes/NON_EXISTENT_SCHEME")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

def test_confirm_no_matching_or_ai_endpoints():
    """Verify that matching engine, recommendations, and AI endpoints do NOT exist."""
    client = TestClient(app)
    
    # Assert eligibility engine exists and enforces validation
    res_eligibility = client.post("/api/v1/eligibility/check", json={})
    assert res_eligibility.status_code == 422 # Pydantic validation error since endpoint is active
    
    # Assert matching engine does not exist
    res_match = client.post("/api/v1/schemes/match", json={})
    assert res_match.status_code in [404, 405]
    
    # Assert AI/RAG endpoints do not exist
    res_ai = client.post("/api/v1/ai/chat", json={})
    assert res_ai.status_code in [404, 405]
