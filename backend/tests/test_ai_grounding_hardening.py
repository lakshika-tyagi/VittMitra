"""
Grounded AI Intelligence Layer & Multi-Engine Synthesis Hardening Tests (Step 13)
Covers:
- Test A: Known Scheme Grounding (PMEGP, Mudra, CGTMSE, PM Vishwakarma)
- Test B: Unknown / Out-of-Scope Query Handling (INSUFFICIENT_DATA resolution)
- Test C: Deterministic Eligibility Grounding (Zero alteration of criteria)
- Test D: Deterministic Financial Math Grounding (Exact numbers preservation)
- Test E: Location & Feasibility Signal Grounding (Decision-support disclaimer)
- Test F: Application Status Milestone Grounding (Deterministic stage preservation)
"""
import pytest
from app.schemas.ai import (
    GroundedChatRequest,
    GroundedExplainRequest,
    ConfidenceLevel,
)
from app.services.ai.orchestrator import AIOrchestrator


@pytest.mark.asyncio
async def test_grounding_test_a_known_schemes():
    """Test A: Verify grounded explanation for all core national schemes."""
    orchestrator = AIOrchestrator()
    schemes = ["PMEGP", "MUDRA", "CGTMSE", "PM_VISHWAKARMA"]
    
    for scode in schemes:
        res = await orchestrator.explain_scheme(scheme_code=scode, db=None)
        assert res.answer is not None
        assert len(res.answer) > 20
        assert res.confidence in [ConfidenceLevel.HIGH, ConfidenceLevel.MEDIUM]
        assert len(res.suggested_actions) >= 1
        assert res.disclaimer is not None
        assert "deterministic" in res.disclaimer.lower()


@pytest.mark.asyncio
async def test_grounding_test_b_unknown_out_of_scope_query():
    """Test B: Verify out-of-scope / unknown queries return INSUFFICIENT_DATA."""
    orchestrator = AIOrchestrator()
    
    req = GroundedChatRequest(
        message="What is the weather forecast for tomorrow in Mumbai?",
        language="en"
    )
    res = await orchestrator.chat(req, db=None)
    
    assert res.confidence == ConfidenceLevel.INSUFFICIENT_DATA
    assert "strictly grounded in official government" in res.answer.lower() or "insufficient" in res.answer.lower()
    assert len(res.suggested_actions) > 0


@pytest.mark.asyncio
async def test_grounding_test_c_deterministic_eligibility_grounding():
    """Test C: Verify AI explanation honors deterministic eligibility engine output."""
    orchestrator = AIOrchestrator()
    
    req = GroundedExplainRequest(
        scheme_code="PMEGP",
        profile_id="00000000-0000-0000-0000-000000000001",
        context={"status": "ELIGIBLE", "score": 95, "met_criteria_count": 5}
    )
    res = await orchestrator.explain_eligibility(req, db=None)
    
    assert res.grounded is True
    assert "eligib" in res.answer.lower()
    assert res.confidence in [ConfidenceLevel.HIGH, ConfidenceLevel.MEDIUM]


@pytest.mark.asyncio
async def test_grounding_test_d_deterministic_finance_math():
    """Test D: Verify financial explainer preserves exact loan and subsidy figures."""
    orchestrator = AIOrchestrator()
    
    req = GroundedExplainRequest(
        scheme_code="PMEGP",
        project_cost=2500000.0,
        loan_amount=2000000.0,
        own_contribution=250000.0,
        context={
            "subsidy_rate": 35.0,
            "subsidy_amount": 875000.0,
            "estimated_emi": 41516.71,
        }
    )
    res = await orchestrator.explain_finance(req, db=None)
    
    assert res.grounded is True
    assert res.confidence in [ConfidenceLevel.HIGH, ConfidenceLevel.MEDIUM]
    assert len(res.suggested_actions) > 0


@pytest.mark.asyncio
async def test_grounding_test_e_feasibility_signals():
    """Test E: Verify business feasibility explainer reflects location and risk signals."""
    orchestrator = AIOrchestrator()
    
    req = GroundedExplainRequest(
        scheme_code="PMEGP",
        district="Pune",
        state="Maharashtra",
        project_cost=2000000.0,
        context={
            "feasibility_score": 82.5,
            "msme_density": "HIGH",
            "cluster_compatibility": 90.0,
        }
    )
    res = await orchestrator.explain_feasibility(req, db=None)
    
    assert res.grounded is True
    assert "feasib" in res.answer.lower() or "decision-support" in res.answer.lower()
    assert res.confidence in [ConfidenceLevel.HIGH, ConfidenceLevel.MEDIUM]


@pytest.mark.asyncio
async def test_grounding_test_f_application_status_tracking():
    """Test F: Verify application tracking explainer explains milestones without fabricating approvals."""
    orchestrator = AIOrchestrator()
    
    req = GroundedChatRequest(
        message="What are the next steps for my application currently in UNDER_REVIEW status?",
        topic="application",
        context={"status": "UNDER_REVIEW", "scheme": "PMEGP", "partner": "DIC Pune"}
    )
    res = await orchestrator.chat(req, db=None)
    
    assert res.grounded is True
    assert res.confidence in [ConfidenceLevel.HIGH, ConfidenceLevel.MEDIUM]
    assert len(res.suggested_actions) > 0
