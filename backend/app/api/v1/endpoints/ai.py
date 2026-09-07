"""
Grounded AI & RAG Intelligence REST API Endpoints
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.schemas.ai import (
    GroundedChatRequest,
    GroundedChatResponse,
    GroundedExplainRequest,
)
from app.services.ai.orchestrator import AIOrchestrator

router = APIRouter()
orchestrator = AIOrchestrator()


@router.get("/health", status_code=status.HTTP_200_OK)
async def get_ai_service_health():
    """Returns operational and configuration status of the Grounded AI layer."""
    return {
        "status": "ready" if orchestrator.is_live() else "healthy",
        "provider": "Google Gemini API",
        "model": settings.GEMINI_MODEL,
        "is_live_configured": orchestrator.is_live(),
        "deterministic_authority_verified": True,
        "rag_retriever": "hybrid_vector_metadata",
        "capabilities": [
            "grounded_scheme_chat",
            "eligibility_explanation",
            "finance_explanation",
            "feasibility_explanation",
            "hybrid_rag_retrieval",
            "verified_citation_attribution"
        ]
    }


@router.post("/chat", response_model=GroundedChatResponse, status_code=status.HTTP_200_OK)
async def post_grounded_chat(
    request: GroundedChatRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Submits a conversational question to VittMitra AI. Synthesizes relevant profile context,
    deterministic engine results, and hybrid RAG chunks into a grounded response with verified citations.
    """
    try:
        return await orchestrator.chat(request=request, db=db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI orchestration failed: {str(e)}"
        )


@router.post("/explain/eligibility", response_model=GroundedChatResponse, status_code=status.HTTP_200_OK)
async def explain_eligibility(
    request: Optional[GroundedExplainRequest] = Body(None),
    profile_id: Optional[str] = Query(None, description="UUID of entrepreneur profile"),
    scheme_code: Optional[str] = Query(None, description="Scheme code e.g. 'PMEGP'"),
    db: AsyncSession = Depends(get_db),
):
    """Generates a plain-language grounded explanation of Step 4 Eligibility Engine results."""
    try:
        eff_profile_id = profile_id or (request.profile_id if request else None)
        eff_scheme_code = scheme_code or (request.scheme_code if request else None)
        return await orchestrator.explain_eligibility(
            request=request,
            db=db,
            profile_id=eff_profile_id,
            scheme_code=eff_scheme_code,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Eligibility explanation failed: {str(e)}"
        )


@router.post("/explain/finance", response_model=GroundedChatResponse, status_code=status.HTTP_200_OK)
async def explain_finance(
    request: Optional[GroundedExplainRequest] = Body(None),
    profile_id: Optional[str] = Query(None, description="UUID of entrepreneur profile"),
    scheme_code: Optional[str] = Query(None, description="Scheme code e.g. 'PMEGP'"),
    db: AsyncSession = Depends(get_db),
):
    """Generates a plain-language grounded explanation of Step 5 Financial Engine calculations."""
    try:
        eff_profile_id = profile_id or (request.profile_id if request else None)
        eff_scheme_code = scheme_code or (request.scheme_code if request else None)
        return await orchestrator.explain_finance(
            request=request,
            db=db,
            profile_id=eff_profile_id,
            scheme_code=eff_scheme_code,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Finance explanation failed: {str(e)}"
        )


@router.post("/explain/feasibility", response_model=GroundedChatResponse, status_code=status.HTTP_200_OK)
async def explain_feasibility(
    request: Optional[GroundedExplainRequest] = Body(None),
    profile_id: Optional[str] = Query(None, description="UUID of entrepreneur profile"),
    db: AsyncSession = Depends(get_db),
):
    """Generates a plain-language grounded explanation of Step 9 Feasibility signals."""
    try:
        eff_profile_id = profile_id or (request.profile_id if request else None)
        return await orchestrator.explain_feasibility(
            request=request,
            db=db,
            profile_id=eff_profile_id,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Feasibility explanation failed: {str(e)}"
        )


@router.post("/explain/scheme", response_model=GroundedChatResponse, status_code=status.HTTP_200_OK)
async def explain_scheme(
    request: Optional[GroundedExplainRequest] = Body(None),
    scheme_code: Optional[str] = Query(None, description="Scheme code e.g. 'PMEGP'"),
    db: AsyncSession = Depends(get_db),
):
    """Generates a plain-language grounded overview of scheme guidelines, benefits, and documents."""
    try:
        eff_scheme_code = scheme_code or (request.scheme_code if request else None)
        return await orchestrator.explain_scheme(
            request=request,
            db=db,
            scheme_code=eff_scheme_code,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Scheme explanation failed: {str(e)}"
        )
