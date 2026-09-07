"""
API Integration Tests for Entrepreneur Onboarding and Profile REST Endpoints
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


@pytest.fixture
def mock_profile_client():
    """FastAPI TestClient with an in-memory test database initialized with profile tables."""
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

    import asyncio
    asyncio.run(init_db())

    async def override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


def test_create_unified_profile_api(mock_profile_client):
    """Test POST /api/v1/profiles creates full hierarchy atomically."""
    payload = {
        "entrepreneur": {
            "full_name": "Priya Sharma",
            "age": 28,
            "gender": "female",
            "category": "OBC",
            "preferred_language": "en",
            "phone_number": "9876543210",
            "state": "Maharashtra",
            "district": "Pune",
            "city": "Pune",
            "pincode": "411001",
            "area_type": "rural"
        },
        "business": {
            "business_name": "Sahyadri Spices",
            "business_type": "proprietorship",
            "sector": "manufacturing",
            "sub_sector": "food_processing",
            "business_stage": "new_enterprise",
            "is_greenfield": True
        },
        "financial": {
            "project_cost": 1500000,
            "own_contribution": 250000,
            "loan_requirement": 1250000,
            "monthly_income": 45000,
            "existing_monthly_obligations": 5000
        }
    }

    response = mock_profile_client.post("/api/v1/profiles", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["entrepreneur"]["id"] is not None
    assert data["entrepreneur"]["full_name"] == "Priya Sharma"
    assert len(data["business_profiles"]) == 1
    assert data["business_profiles"][0]["business_name"] == "Sahyadri Spices"
    assert len(data["financial_profiles"]) == 1
    assert float(data["financial_profiles"][0]["project_cost"]) == 1500000.0
    assert data["completeness"]["is_complete"] is True
    assert data["completeness"]["completion_percentage"] == 100.0


def test_get_and_update_profile_api(mock_profile_client):
    """Test GET /api/v1/profiles/{id} and PUT /api/v1/profiles/{id}."""
    # Create profile
    payload = {
        "entrepreneur": {
            "full_name": "Ramesh Kumar",
            "age": 35,
            "state": "Rajasthan",
            "district": "Jaipur"
        }
    }
    create_resp = mock_profile_client.post("/api/v1/profiles", json=payload)
    assert create_resp.status_code == 201
    profile_id = create_resp.json()["entrepreneur"]["id"]

    # Get profile
    get_resp = mock_profile_client.get(f"/api/v1/profiles/{profile_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["entrepreneur"]["full_name"] == "Ramesh Kumar"
    assert get_resp.json()["completeness"]["is_complete"] is False # Missing business & financial

    # Update profile
    update_payload = {
        "full_name": "Ramesh Chandra Kumar",
        "gender": "male",
        "category": "General"
    }
    put_resp = mock_profile_client.put(f"/api/v1/profiles/{profile_id}", json=update_payload)
    assert put_resp.status_code == 200
    assert put_resp.json()["full_name"] == "Ramesh Chandra Kumar"
    assert put_resp.json()["gender"] == "male"


def test_add_business_and_financial_sub_resources(mock_profile_client):
    """Test adding business and financial profiles via sub-endpoints."""
    # 1. Create base entrepreneur
    create_resp = mock_profile_client.post("/api/v1/profiles", json={
        "entrepreneur": {
            "full_name": "Ananya Sen",
            "age": 26,
            "gender": "female",
            "category": "General",
            "state": "West Bengal"
        }
    })
    profile_id = create_resp.json()["entrepreneur"]["id"]

    # 2. Add Business Profile
    biz_payload = {
        "business_name": "Sen Boutique",
        "sector": "services",
        "business_stage": "new_enterprise",
        "is_greenfield": True
    }
    biz_resp = mock_profile_client.post(f"/api/v1/profiles/{profile_id}/business", json=biz_payload)
    assert biz_resp.status_code == 201
    biz_id = biz_resp.json()["id"]

    # 3. Add Financial Profile
    fin_payload = {
        "business_profile_id": biz_id,
        "project_cost": 500000,
        "own_contribution": 50000,
        "monthly_income": 30000
    }
    fin_resp = mock_profile_client.post(f"/api/v1/profiles/{profile_id}/financial", json=fin_payload)
    assert fin_resp.status_code == 201

    # 4. Check unified profile completeness is now complete
    full_resp = mock_profile_client.get(f"/api/v1/profiles/{profile_id}")
    assert full_resp.status_code == 200
    assert full_resp.json()["completeness"]["is_complete"] is True
    assert len(full_resp.json()["business_profiles"]) == 1
    assert len(full_resp.json()["financial_profiles"]) == 1


def test_delete_profile_cascade(mock_profile_client):
    """Test DELETE /api/v1/profiles/{id} properly cascades."""
    create_resp = mock_profile_client.post("/api/v1/profiles", json={
        "entrepreneur": {"full_name": "Temporary User", "age": 40, "state": "Delhi"},
        "business": {"sector": "trading", "business_stage": "expansion"},
        "financial": {"project_cost": 100000}
    })
    profile_id = create_resp.json()["entrepreneur"]["id"]

    del_resp = mock_profile_client.delete(f"/api/v1/profiles/{profile_id}")
    assert del_resp.status_code == 200

    # Ensure profile is 404
    get_resp = mock_profile_client.get(f"/api/v1/profiles/{profile_id}")
    assert get_resp.status_code == 404
