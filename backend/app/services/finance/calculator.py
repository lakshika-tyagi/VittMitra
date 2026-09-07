"""
Deterministic Mathematical Routines for Financial Calculations

Implements precision-safe financial math using Python's Decimal module with ROUND_HALF_UP.
Includes reducing-balance EMI calculations, financing gap analysis, and debt burden indicators.
"""
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional
from app.schemas.finance import (
    LoanRepaymentSummarySchema,
    AffordabilityIndicatorSchema,
)

TWO_PLACES = Decimal("0.01")


def _quantize_money(amount: Decimal) -> Decimal:
    """Quantize decimal value to 2 decimal places using ROUND_HALF_UP."""
    return amount.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


def calculate_financing_gap(project_cost: Decimal, own_contribution: Decimal) -> Decimal:
    """
    Computes the net financing gap required after entrepreneur equity contribution.
    
    Formula:
        financing_gap = project_cost - own_contribution
    """
    if project_cost < Decimal("0.00"):
        raise ValueError("Project cost cannot be negative.")
    if own_contribution < Decimal("0.00"):
        raise ValueError("Own contribution cannot be negative.")
    if own_contribution > project_cost:
        raise ValueError(f"Own contribution ({own_contribution}) cannot exceed total project cost ({project_cost}).")

    gap = project_cost - own_contribution
    return _quantize_money(gap)


def calculate_emi(
    principal: Decimal,
    annual_interest_rate: Decimal,
    tenure_months: int
) -> Decimal:
    """
    Calculates monthly installment (EMI) using the standard reducing-balance amortization formula.
    
    Formula (for r > 0):
        EMI = [P * r * (1 + r)^n] / [(1 + r)^n - 1]
        where r = annual_interest_rate / 12 / 100
              n = tenure_months
              P = principal

    Formula (for r == 0):
        EMI = P / n
    """
    if principal < Decimal("0.00"):
        raise ValueError("Principal cannot be negative.")
    if annual_interest_rate < Decimal("0.00"):
        raise ValueError("Annual interest rate cannot be negative.")
    if tenure_months <= 0:
        raise ValueError("Tenure months must be greater than zero.")

    if principal == Decimal("0.00"):
        return Decimal("0.00")

    # Handle 0% interest loan scenario (e.g. government subvention / interest-free tranches)
    if annual_interest_rate == Decimal("0.00"):
        raw_emi = principal / Decimal(tenure_months)
        return _quantize_money(raw_emi)

    # Decimal-precision calculation
    monthly_rate = annual_interest_rate / Decimal("1200.00")
    growth_factor = (Decimal("1.00") + monthly_rate) ** tenure_months

    if growth_factor == Decimal("1.00"):
        raw_emi = principal / Decimal(tenure_months)
    else:
        raw_emi = (principal * monthly_rate * growth_factor) / (growth_factor - Decimal("1.00"))

    return _quantize_money(raw_emi)


def calculate_repayment_summary(
    principal: Decimal,
    annual_interest_rate: Decimal,
    tenure_months: int
) -> LoanRepaymentSummarySchema:
    """
    Calculates comprehensive reducing-balance loan repayment summary.
    """
    principal_q = _quantize_money(principal)
    rate_q = _quantize_money(annual_interest_rate)
    emi = calculate_emi(principal=principal_q, annual_interest_rate=rate_q, tenure_months=tenure_months)

    if principal_q == Decimal("0.00"):
        total_repayment = Decimal("0.00")
        total_interest = Decimal("0.00")
    else:
        total_repayment = _quantize_money(emi * Decimal(tenure_months))
        total_interest = _quantize_money(max(Decimal("0.00"), total_repayment - principal_q))

    return LoanRepaymentSummarySchema(
        principal=principal_q,
        annual_interest_rate=rate_q,
        tenure_months=tenure_months,
        estimated_emi=emi,
        estimated_total_interest=total_interest,
        estimated_total_repayment=total_repayment,
        is_zero_interest=(rate_q == Decimal("0.00")),
    )


def calculate_affordability_indicator(
    estimated_emi: Decimal,
    monthly_income: Optional[Decimal]
) -> AffordabilityIndicatorSchema:
    """
    Calculates debt-to-income (DTI) ratio / installment burden if cash flow input is provided.
    """
    if monthly_income is None or monthly_income <= Decimal("0.00"):
        return AffordabilityIndicatorSchema(
            monthly_income=None,
            estimated_emi=_quantize_money(estimated_emi),
            debt_to_income_pct=None,
            status="INSUFFICIENT_DATA",
            notes="Monthly income or business cash flow was not provided; debt burden cannot be verified."
        )

    income_q = _quantize_money(monthly_income)
    emi_q = _quantize_money(estimated_emi)

    if emi_q == Decimal("0.00"):
        dti = Decimal("0.00")
    else:
        dti = _quantize_money((emi_q / income_q) * Decimal("100.00"))

    if dti <= Decimal("30.00"):
        notes = f"Estimated EMI is {dti}% of reported monthly income (low debt service burden)."
    elif dti <= Decimal("50.00"):
        notes = f"Estimated EMI is {dti}% of reported monthly income (moderate debt service burden)."
    else:
        notes = f"Estimated EMI is {dti}% of reported monthly income (high debt service burden, exceeding 50%)."

    return AffordabilityIndicatorSchema(
        monthly_income=income_q,
        estimated_emi=emi_q,
        debt_to_income_pct=dti,
        status="SUFFICIENT_DATA",
        notes=notes
    )
