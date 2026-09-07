"""
Deterministic Financial Engine Core Service

Coordinates precision-safe project cost evaluation, own contribution ratios,
financing gaps, reducing-balance EMI calculations, affordability indicators,
and verified scheme parameters with ZERO AI involvement.
"""
from typing import Optional, List
from decimal import Decimal
from datetime import datetime, timezone
from app.models.scheme import Scheme
from app.schemas.finance import (
    FinancialCalculationRequest,
    FinancialCalculationResponse,
    LoanRepaymentSummarySchema,
    AffordabilityIndicatorSchema,
)
from app.services.finance.calculator import (
    calculate_financing_gap,
    calculate_repayment_summary,
    calculate_affordability_indicator,
    _quantize_money,
)


class FinancialEngine:
    """
    Authoritative, deterministic, and explainable financial calculation engine.
    """

    @classmethod
    def calculate_financial_structure(
        cls,
        request: FinancialCalculationRequest,
        scheme: Optional[Scheme] = None
    ) -> FinancialCalculationResponse:
        """
        Calculates the complete financial structure and repayment amortization for a business proposal.
        """
        project_cost = _quantize_money(request.project_cost)
        own_contribution = _quantize_money(request.own_contribution)

        # 1. Calculate financing gap
        financing_gap = calculate_financing_gap(project_cost=project_cost, own_contribution=own_contribution)

        # 2. Calculate own contribution percentage
        if project_cost > Decimal("0.00"):
            own_contribution_pct = _quantize_money((own_contribution / project_cost) * Decimal("100.00"))
        else:
            own_contribution_pct = Decimal("0.00")

        # 3. Determine loan principal (defaults to financing gap if not specified)
        if request.loan_amount is not None:
            principal = _quantize_money(request.loan_amount)
        else:
            principal = financing_gap

        # 4. Calculate reducing-balance loan repayment summary
        loan_summary: LoanRepaymentSummarySchema = calculate_repayment_summary(
            principal=principal,
            annual_interest_rate=request.annual_interest_rate,
            tenure_months=request.tenure_months
        )

        # 5. Calculate affordability & cash flow metrics
        affordability: AffordabilityIndicatorSchema = calculate_affordability_indicator(
            estimated_emi=loan_summary.estimated_emi,
            monthly_income=request.monthly_income
        )

        # 6. Generate transparent, deterministic calculation notes
        notes: List[str] = [
            f"Financing gap computed as Project Cost (₹{project_cost:,.2f}) - Own Contribution (₹{own_contribution:,.2f}) = ₹{financing_gap:,.2f}.",
            f"Entrepreneur equity/margin money covers {own_contribution_pct}% of the total estimated project cost.",
        ]

        if loan_summary.is_zero_interest:
            notes.append(
                f"0.0% interest applied. Monthly installment computed as Principal (₹{principal:,.2f}) / {request.tenure_months} months = ₹{loan_summary.estimated_emi:,.2f}."
            )
        else:
            notes.append(
                f"Reducing-balance EMI computed at {loan_summary.annual_interest_rate}% annual interest over {loan_summary.tenure_months} months: ₹{loan_summary.estimated_emi:,.2f}/month."
            )
            notes.append(
                f"Estimated total interest over full tenure: ₹{loan_summary.estimated_total_interest:,.2f}; Total repayment: ₹{loan_summary.estimated_total_repayment:,.2f}."
            )

        # 7. Check verified scheme parameters if scheme is provided
        if scheme is not None:
            notes.append(f"Evaluated against scheme parameters for '{scheme.scheme_name}' ({scheme.scheme_code}).")
            if scheme.benefits_summary:
                # E.g. PMEGP manufacturing cost ceiling
                max_mfg = scheme.benefits_summary.get("max_project_cost_manufacturing_inr")
                if max_mfg and project_cost > Decimal(str(max_mfg)):
                    notes.append(
                        f"Notice: Project cost ₹{project_cost:,.2f} exceeds scheme manufacturing ceiling of ₹{Decimal(str(max_mfg)):,.2f}."
                    )

        return FinancialCalculationResponse(
            project_cost=project_cost,
            own_contribution=own_contribution,
            own_contribution_pct=own_contribution_pct,
            financing_gap=financing_gap,
            loan=loan_summary,
            cost_breakdown=request.cost_breakdown,
            affordability=affordability,
            calculation_notes=notes,
            evaluated_at=datetime.now(timezone.utc),
        )
