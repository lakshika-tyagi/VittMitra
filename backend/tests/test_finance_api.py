"""
API Integration tests for POST /api/v1/finance/calculate and POST /api/v1/finance/scenarios
"""
import pytest
import asyncio
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.main import app
from app.db.session import get_db
from app.models.scheme import Scheme, SchemeSource, SchemeEligibilityRule, SchemeDocument


@pytest.fixture
def mock_client():
    """Client with in-memory database."""
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
            pmegp = Scheme(
                id=1,
                scheme_code="PMEGP",
                scheme_name="Prime Minister's Employment Generation Programme",
                short_description="Credit-linked subsidy programme",
                nodal_ministry="Ministry of MSME",
                geography_level="NATIONAL",
                target_beneficiaries=["General", "SC", "ST"],
                purpose="Employment",
                benefits_summary={"max_project_cost_manufacturing_inr": 5000000},
                business_stages=["new_enterprise"],
                sectors=["manufacturing"],
                data_status="VERIFIED",
                is_active=True
            )
            session.add(pmegp)
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


def test_api_calculate_finance_standard(mock_client):
    """Test POST /api/v1/finance/calculate with valid parameters."""
    payload = {
        "project_cost": 800000,
        "own_contribution": 100000,
        "annual_interest_rate": 10.0,
        "tenure_months": 60,
        "monthly_income": 45000
    }
    response = mock_client.post("/api/v1/finance/calculate", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert float(data["project_cost"]) == 800000.0
    assert float(data["own_contribution"]) == 100000.0
    assert float(data["own_contribution_pct"]) == 12.5
    assert float(data["financing_gap"]) == 700000.0

    loan = data["loan"]
    assert float(loan["principal"]) == 700000.0
    assert float(loan["annual_interest_rate"]) == 10.0
    assert loan["tenure_months"] == 60
    assert float(loan["estimated_emi"]) == 14872.93
    assert float(loan["estimated_total_repayment"]) == 892375.80
    assert float(loan["estimated_total_interest"]) == 192375.80
    assert loan["is_zero_interest"] is False

    affordability = data["affordability"]
    assert affordability["status"] == "SUFFICIENT_DATA"
    assert float(affordability["debt_to_income_pct"]) == 33.05


def test_api_calculate_finance_root_shortcut(mock_client):
    """Test root shortcut POST /finance/calculate."""
    payload = {
        "project_cost": 500000,
        "own_contribution": 50000,
        "annual_interest_rate": 9.5,
        "tenure_months": 36
    }
    response = mock_client.post("/finance/calculate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert float(data["financing_gap"]) == 450000.0
    assert float(data["loan"]["estimated_emi"]) == 14414.83


def test_api_calculate_finance_with_scheme_id(mock_client):
    """Test POST /api/v1/finance/calculate with scheme_id parameter."""
    payload = {
        "project_cost": 6000000,
        "own_contribution": 1000000,
        "annual_interest_rate": 10.0,
        "tenure_months": 60,
        "scheme_id": "PMEGP"
    }
    response = mock_client.post("/api/v1/finance/calculate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert any("exceeds scheme manufacturing ceiling of ₹5,000,000.00" in n for n in data["calculation_notes"])


def test_api_calculate_finance_validation_error_contribution_exceeds(mock_client):
    """Test 422 error when own contribution exceeds project cost."""
    payload = {
        "project_cost": 500000,
        "own_contribution": 600000,
        "annual_interest_rate": 10.0,
        "tenure_months": 60
    }
    response = mock_client.post("/api/v1/finance/calculate", json=payload)
    assert response.status_code == 422
    assert "cannot exceed total project cost" in response.text


def test_api_compare_scenarios(mock_client):
    """Test POST /api/v1/finance/scenarios comparison endpoint."""
    payload = {
        "project_cost": 800000,
        "base_own_contribution": 100000,
        "scenarios": [
            {
                "scenario_name": "36-month",
                "annual_interest_rate": 10.0,
                "tenure_months": 36
            },
            {
                "scenario_name": "60-month",
                "annual_interest_rate": 10.0,
                "tenure_months": 60
            }
        ]
    }
    response = mock_client.post("/api/v1/finance/scenarios", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert float(data["project_cost"]) == 800000.0
    assert data["scenario_count"] == 2
    assert len(data["scenarios"]) == 2
    assert data["scenarios"][0]["scenario_name"] == "36-month"
    assert float(data["scenarios"][0]["estimated_emi"]) == 22587.03
    assert data["scenarios"][1]["scenario_name"] == "60-month"
    assert float(data["scenarios"][1]["estimated_emi"]) == 14872.93


def test_api_compare_scenarios_root_shortcut(mock_client):
    """Test root shortcut POST /finance/scenarios."""
    payload = {
        "project_cost": 500000,
        "base_own_contribution": 50000,
        "scenarios": [
            {
                "scenario_name": "Scenario 1",
                "annual_interest_rate": 8.0,
                "tenure_months": 24
            }
        ]
    }
    response = mock_client.post("/finance/scenarios", json=payload)
    assert response.status_code == 200
    assert response.json()["scenario_count"] == 1
