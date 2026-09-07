"""
Explainable Scheme Matching & Ranking API Endpoints

Provides transparent, deterministic, and explainable multi-scheme matching and ranking.
Zero AI/LLM models participate in matching, scoring, or ranking.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.scheme import Scheme
from app.schemas.matching import (
    SchemeMatchingRequest,
    SchemeMatchingResponse,
)
from app.services.matching.engine import MatchingEngine

router = APIRouter()


@router.post(
    "/matching/schemes",
    response_model=SchemeMatchingResponse,
    status_code=status.HTTP_200_OK,
    summary="Match & Rank Government Schemes Explainably",
    description=(
        "Evaluates active government schemes against structured entrepreneur, business, geographic, "
        "and financial inputs. Produces transparent match scores, deterministic ranking, and criterion-level "
        "reasons ('Why this scheme?', 'Why not currently eligible?'). ZERO AI/LLM models are used."
    )
)
async def match_schemes(
    payload: SchemeMatchingRequest,
    db: AsyncSession = Depends(get_db)
) -> SchemeMatchingResponse:
    """
    Evaluates and ranks all active government schemes against applicant profile and financial inputs.
    Reuses Step 4 Eligibility Engine and Step 5 Financial Engine.
    """
    query = select(Scheme).where(Scheme.is_active == True).order_by(Scheme.scheme_name)
    result = await db.execute(query)
    schemes = list(result.scalars().all())

    response = MatchingEngine.match_and_rank_schemes(
        schemes=schemes,
        profile=payload.profile,
        financial=payload.financial,
        limit=payload.limit or 10,
        include_ineligible=payload.include_ineligible,
    )
    return response
