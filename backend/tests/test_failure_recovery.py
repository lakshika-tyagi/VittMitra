"""
Failure Recovery, Offline Degradation & Edge Case Hardening Tests (Step 13)
Covers:
- Gemini API Offline / Network Error graceful degradation to Grounded Synthesizer
- Missing Profile / Non-existent UUID resilience
- Boundary math and zero-division resilience in deterministic engines
- Out-of-bounds parameter handling without 500 errors
"""
from decimal import Decimal
import pytest
from app.schemas.ai import GroundedChatRequest
from app.schemas.feasibility import FeasibilityInputContext
from app.services.ai.orchestrator import AIOrchestrator
from app.services.finance.calculator import (
    calculate_financing_gap,
    calculate_emi,
    calculate_repayment_summary,
    calculate_affordability_indicator,
)
from app.services.feasibility.engine import FeasibilityEngine


@pytest.mark.asyncio
async def test_gemini_api_offline_fallback():
    """Verify that when Gemini client raises an exception or is offline, orchestrator degrades gracefully."""
    # Force client to simulate an API exception
    orchestrator = AIOrchestrator(api_key="invalid_mock_key_for_testing")
    
    req = GroundedChatRequest(
        message="What are the key documents needed for PMEGP?",
        scheme_code="PMEGP",
        topic="documents",
    )
    res = await orchestrator.chat(req, db=None)
    
    assert res is not None
    assert res.grounded is True
    assert len(res.answer) > 0
    assert len(res.suggested_actions) > 0


@pytest.mark.asyncio
async def test_non_existent_profile_ai_chat_resilience():
    """Verify AI chat handles non-existent or null profile IDs safely without database error."""
    orchestrator = AIOrchestrator()
    
    req = GroundedChatRequest(
        message="Explain my eligibility for PMEGP",
        profile_id="99999999-9999-9999-9999-999999999999",
        scheme_code="PMEGP",
        topic="eligibility"
    )
    res = await orchestrator.chat(req, db=None)
    
    assert res is not None
    assert res.grounded is True
    assert len(res.answer) > 0


def test_financial_calculator_zero_interest_and_small_principals():
    """Verify repayment calculation handles zero interest or small principal amounts cleanly."""
    summary = calculate_repayment_summary(
        principal=Decimal("100000.00"),
        annual_interest_rate=Decimal("0.00"),
        tenure_months=12
    )
    assert summary.estimated_emi == Decimal("8333.33")
    assert summary.estimated_total_interest == Decimal("0.00")
    assert summary.estimated_total_repayment == Decimal("100000.00")
    assert summary.is_zero_interest is True


def test_financing_gap_equal_equity():
    """Verify financing gap calculation when own contribution equals 100% of project cost."""
    gap = calculate_financing_gap(
        project_cost=Decimal("500000.00"),
        own_contribution=Decimal("500000.00")
    )
    assert gap == Decimal("0.00")


def test_affordability_zero_or_null_income():
    """Verify affordability indicator with missing or zero monthly income returns INSUFFICIENT_DATA status."""
    aff = calculate_affordability_indicator(
        estimated_emi=Decimal("15000.00"),
        monthly_income=None
    )
    assert aff.status == "INSUFFICIENT_DATA"
    assert aff.debt_to_income_pct is None

    aff_zero = calculate_affordability_indicator(
        estimated_emi=Decimal("15000.00"),
        monthly_income=Decimal("0.00")
    )
    assert aff_zero.status == "INSUFFICIENT_DATA"


def test_feasibility_engine_missing_optional_ecosystem_data():
    """Verify feasibility engine evaluates cleanly when district ecosystem or clusters are None."""
    ctx = FeasibilityInputContext(
        state="Maharashtra",
        district="Pune",
        sector="MANUFACTURING",
        industry_type="Agro Processing",
        project_cost=Decimal("1500000.00"),
        own_contribution=Decimal("150000.00"),
    )
    response = FeasibilityEngine.evaluate_feasibility(
        context=ctx,
        district_ecosystem=None,
        nearby_clusters=None,
    )
    assert response.overall_status is not None
    assert len(response.signals) > 0
    assert len(response.recommendations) > 0
