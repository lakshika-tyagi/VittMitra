"""
Deterministic Financial API Endpoints

Provides transparent, reproducible mathematical calculations for project financing,
reducing-balance EMI schedules, and comparative financial scenarios.
Zero AI/LLM models participate in calculations.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.scheme import Scheme
from app.schemas.finance import (
    FinancialCalculationRequest,
    FinancialCalculationResponse,
    ScenarioComparisonRequest,
    ScenarioComparisonResponse,
)
from app.services.finance.engine import FinancialEngine
from app.services.finance.scenarios import evaluate_financial_scenarios

router = APIRouter()


@router.post(
    "/finance/calculate",
    response_model=FinancialCalculationResponse,
    summary="Calculate Project Financial Structure & Reducing-Balance EMI",
    description="Deterministically calculates financing gap, own contribution percentage, monthly EMI, total interest, and cash flow affordability."
)
async def calculate_finance(
    payload: FinancialCalculationRequest,
    db: AsyncSession = Depends(get_db)
) -> FinancialCalculationResponse:
    """
    Calculate financial structure for a proposed business project.
    """
    scheme: Optional[Scheme] = None
    if payload.scheme_id is not None:
        scheme_identifier = str(payload.scheme_id).strip()
        if scheme_identifier.isdigit():
            query = select(Scheme).where(Scheme.id == int(scheme_identifier), Scheme.is_active == True)
        else:
            query = select(Scheme).where(Scheme.scheme_code.ilike(scheme_identifier), Scheme.is_active == True)
        result = await db.execute(query)
        scheme = result.scalar_one_or_none()

    response = FinancialEngine.calculate_financial_structure(request=payload, scheme=scheme)
    return response


@router.post(
    "/finance/scenarios",
    response_model=ScenarioComparisonResponse,
    summary="Compare Financial Scenarios",
    description="Compares multiple loan repayment scenarios across tenures, interest rates, or own contribution levels."
)
async def compare_finance_scenarios(
    payload: ScenarioComparisonRequest
) -> ScenarioComparisonResponse:
    """
    Evaluates and compares multiple deterministic financial scenarios.
    """
    response = evaluate_financial_scenarios(request=payload)
    return response
