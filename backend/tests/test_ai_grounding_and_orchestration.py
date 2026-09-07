"""
Grounded AI Orchestrator & Multi-Engine Synthesis Unit Tests
"""
import pytest
from app.schemas.ai import (
    GroundedChatRequest,
    GroundedExplainRequest,
    ConfidenceLevel,
)
from app.services.ai.orchestrator import AIOrchestrator
from app.services.ai.prompts import SYSTEM_GROUNDING_PROMPT, build_grounded_prompt


def test_system_prompt_principles():
    """Verify system grounding prompt contains mandatory anti-hallucination and deterministic rules."""
    assert "STRICT SOURCE GROUNDING" in SYSTEM_GROUNDING_PROMPT
    assert "ZERO HALLUCINATIONS" in SYSTEM_GROUNDING_PROMPT
    assert "DETERMINISTIC AUTHORITY" in SYSTEM_GROUNDING_PROMPT
    assert "PROMPT INJECTION DEFENSE" in SYSTEM_GROUNDING_PROMPT
    assert "INSUFFICIENT DATA RULE" in SYSTEM_GROUNDING_PROMPT


def test_build_grounded_prompt_structure():
    """Verify prompt builder formats XML tags for grounding."""
    prompt = build_grounded_prompt(
        user_query="Can I get 35% subsidy under PMEGP in a rural area?",
        retrieved_chunks=[],
        user_context={"location": "Pune Rural", "category": "OBC"},
        engine_results={"eligibility": {"status": "ELIGIBLE", "score": 90}},
        topic="eligibility",
    )

    assert "<GROUNDED_SCHEME_KNOWLEDGE>" in prompt
    assert "</GROUNDED_SCHEME_KNOWLEDGE>" in prompt
    assert "<DETERMINISTIC_ENGINE_RESULTS>" in prompt
    assert "[ELIGIBILITY OUTPUT]" in prompt
    assert "<USER_CONTEXT>" in prompt
    assert "Pune Rural" in prompt
    assert "<USER_QUERY>" in prompt
    assert "Can I get 35% subsidy" in prompt


@pytest.mark.asyncio
async def test_ai_orchestrator_chat_general():
    """Verify general chat orchestration without specific scheme code."""
    orchestrator = AIOrchestrator()
    
    req = GroundedChatRequest(
        message="What documents do I need to prepare for a government MSME loan?",
        language="en",
    )
    
    # We pass db=None since mock/fallback handles queries when DB chunks are empty
    res = await orchestrator.chat(req, db=None)

    assert res.answer is not None
    assert len(res.answer) > 10
    assert res.confidence in [ConfidenceLevel.HIGH, ConfidenceLevel.MEDIUM, ConfidenceLevel.LOW, ConfidenceLevel.INSUFFICIENT_DATA]
    assert len(res.suggested_actions) > 0


@pytest.mark.asyncio
async def test_ai_orchestrator_explain_scheme():
    """Verify scheme explainer synthesis."""
    orchestrator = AIOrchestrator()
    
    res = await orchestrator.explain_scheme(scheme_code="PMEGP", db=None)

    assert res.answer is not None
    assert res.confidence in [ConfidenceLevel.HIGH, ConfidenceLevel.MEDIUM]
    assert len(res.suggested_actions) > 0


@pytest.mark.asyncio
async def test_ai_orchestrator_explain_finance():
    """Verify financial explainer integration with deterministic loan calculations."""
    orchestrator = AIOrchestrator()
    
    req = GroundedExplainRequest(
        scheme_code="PMEGP",
        project_cost=2500000.0,
        loan_amount=2000000.0,
        location="Rural",
        social_category="OBC",
    )
    
    res = await orchestrator.explain_finance(req, db=None)

    assert res.answer is not None
    assert res.confidence in [ConfidenceLevel.HIGH, ConfidenceLevel.MEDIUM]
    assert len(res.suggested_actions) > 0


@pytest.mark.asyncio
async def test_ai_orchestrator_explain_feasibility():
    """Verify location & business feasibility explanation synthesis."""
    orchestrator = AIOrchestrator()
    
    req = GroundedExplainRequest(
        scheme_code="PMEGP",
        district="Pune",
        state="Maharashtra",
        project_cost=2500000.0,
    )
    
    res = await orchestrator.explain_feasibility(req, db=None)

    assert res.answer is not None
    assert res.confidence in [ConfidenceLevel.HIGH, ConfidenceLevel.MEDIUM]
    assert len(res.suggested_actions) > 0
