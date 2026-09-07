"""
Deterministic Scenario Comparison Engine for Financing Options
"""
from typing import List
from decimal import Decimal
from app.schemas.finance import (
    ScenarioComparisonRequest,
    ScenarioComparisonResponse,
    FinancialScenarioResult,
)
from app.services.finance.calculator import (
    calculate_financing_gap,
    calculate_repayment_summary,
    _quantize_money,
)


def evaluate_financial_scenarios(
    request: ScenarioComparisonRequest
) -> ScenarioComparisonResponse:
    """
    Evaluates multiple financial scenarios (e.g. varying tenures, rates, or down-payments)
    deterministically and independently.
    """
    project_cost = _quantize_money(request.project_cost)
    base_contrib = _quantize_money(request.base_own_contribution)

    results: List[FinancialScenarioResult] = []

    for sc in request.scenarios:
        own_contrib = _quantize_money(sc.own_contribution) if sc.own_contribution is not None else base_contrib
        gap = calculate_financing_gap(project_cost=project_cost, own_contribution=own_contrib)
        principal = _quantize_money(sc.loan_amount) if sc.loan_amount is not None else gap

        repayment = calculate_repayment_summary(
            principal=principal,
            annual_interest_rate=sc.annual_interest_rate,
            tenure_months=sc.tenure_months
        )

        results.append(
            FinancialScenarioResult(
                scenario_name=sc.scenario_name,
                own_contribution=own_contrib,
                financing_gap=gap,
                principal=principal,
                annual_interest_rate=_quantize_money(sc.annual_interest_rate),
                tenure_months=sc.tenure_months,
                estimated_emi=repayment.estimated_emi,
                estimated_total_interest=repayment.estimated_total_interest,
                estimated_total_repayment=repayment.estimated_total_repayment,
            )
        )

    return ScenarioComparisonResponse(
        project_cost=project_cost,
        scenario_count=len(results),
        scenarios=results
    )
