"""
Deterministic Eligibility API Endpoints

Provides transparent, explainable, and source-linked government scheme eligibility check API.
Zero AI/LLM models participate in rule decisioning.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.scheme import Scheme
from app.schemas.eligibility import (
    EligibilityCheckRequest,
    EligibilityCheckResponse,
)
from app.services.eligibility.engine import EligibilityEngine

router = APIRouter()


@router.post(
    "/eligibility/check",
    response_model=EligibilityCheckResponse,
    summary="Evaluate Scheme Eligibility Deterministically",
    description="Evaluates an entrepreneur's structured profile inputs against authoritative scheme eligibility rules stored in the database."
)
async def check_scheme_eligibility(
    payload: EligibilityCheckRequest,
    db: AsyncSession = Depends(get_db)
) -> EligibilityCheckResponse:
    """
    Evaluate eligibility for a specified government scheme.
    Retrieves authoritative active rules from database and computes MATCHED/FAILED/UNVERIFIED results.
    """
    scheme_identifier = str(payload.scheme_id).strip()

    if scheme_identifier.isdigit():
        query = select(Scheme).where(Scheme.id == int(scheme_identifier), Scheme.is_active == True)
    else:
        query = select(Scheme).where(Scheme.scheme_code.ilike(scheme_identifier), Scheme.is_active == True)

    result = await db.execute(query)
    scheme = result.scalar_one_or_none()

    if not scheme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scheme with identifier '{payload.scheme_id}' not found or inactive."
        )

    response = EligibilityEngine.evaluate_scheme(scheme=scheme, profile=payload.profile)
    return response
