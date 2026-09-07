"""
Pydantic Schemas and Data Transfer Objects for Deterministic Financial Engine
"""
from typing import List, Optional, Dict, Any, Union
from datetime import datetime, timezone
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict, model_validator


class ProjectCostBreakdownSchema(BaseModel):
    """Optional granular breakdown of project setup components."""
    machinery_equipment: Optional[Decimal] = Field(None, ge=0, description="Plant, machinery, and equipment cost")
    infrastructure_setup: Optional[Decimal] = Field(None, ge=0, description="Civil works, sheds, interior, or premise setup")
    initial_inventory: Optional[Decimal] = Field(None, ge=0, description="Raw materials and initial merchandise stock")
    working_capital: Optional[Decimal] = Field(None, ge=0, description="Initial operating liquidity & working capital margin")
    other_expenses: Optional[Decimal] = Field(None, ge=0, description="Permits, licensing, training, or contingency expenses")

    model_config = ConfigDict(from_attributes=True)


class LoanRepaymentSummarySchema(BaseModel):
    """Detailed loan repayment and reducing-balance interest metrics."""
    principal: Decimal = Field(..., ge=0, description="Proposed loan principal amount in INR")
    annual_interest_rate: Decimal = Field(..., ge=0, description="Annual nominal interest rate percentage (e.g. 10.0 for 10%)")
    tenure_months: int = Field(..., gt=0, description="Loan repayment tenure in total months")
    estimated_emi: Decimal = Field(..., ge=0, description="Estimated monthly installment (EMI) in INR")
    estimated_total_interest: Decimal = Field(..., ge=0, description="Estimated total interest payable over full tenure in INR")
    estimated_total_repayment: Decimal = Field(..., ge=0, description="Estimated total repayment (Principal + Total Interest) in INR")
    is_zero_interest: bool = Field(default=False, description="Flag indicating if the loan scenario is 0% interest")

    model_config = ConfigDict(from_attributes=True)


class AffordabilityIndicatorSchema(BaseModel):
    """Explainable cash flow affordability and debt burden indicator."""
    monthly_income: Optional[Decimal] = Field(None, ge=0, description="Reported monthly income or operating cash flow")
    estimated_emi: Decimal = Field(..., ge=0, description="Proposed monthly loan obligation")
    debt_to_income_pct: Optional[Decimal] = Field(None, description="EMI as percentage of monthly income (DTI / FOIR)")
    status: str = Field(..., description="SUFFICIENT_DATA or INSUFFICIENT_DATA")
    notes: str = Field(..., description="Explainable description of the cash flow observation")

    model_config = ConfigDict(from_attributes=True)


class FinancialCalculationRequest(BaseModel):
    """API Request payload for deterministic financial calculation."""
    project_cost: Decimal = Field(..., ge=0, description="Total estimated business/project cost in INR")
    own_contribution: Decimal = Field(default=Decimal("0.00"), ge=0, description="Entrepreneur's own equity / margin money contribution")
    loan_amount: Optional[Decimal] = Field(None, ge=0, description="Proposed loan amount (defaults to financing gap if omitted)")
    annual_interest_rate: Decimal = Field(default=Decimal("10.00"), ge=0, description="Annual interest rate percentage (e.g. 9.5)")
    tenure_months: int = Field(default=60, gt=0, description="Loan tenure in months (e.g. 36, 60, 84)")
    monthly_income: Optional[Decimal] = Field(None, ge=0, description="Optional monthly income/cash flow for affordability check")
    cost_breakdown: Optional[ProjectCostBreakdownSchema] = Field(None, description="Optional itemized project cost components")
    scheme_id: Optional[Union[int, str]] = Field(None, description="Optional scheme database ID or scheme code for limit validation")

    @model_validator(mode="after")
    def validate_financial_consistency(self) -> "FinancialCalculationRequest":
        if self.own_contribution > self.project_cost:
            raise ValueError(
                f"Own contribution (₹{self.own_contribution:,.2f}) cannot exceed total project cost (₹{self.project_cost:,.2f})."
            )
        if self.loan_amount is not None:
            max_allowed_loan = self.project_cost - self.own_contribution
            if self.loan_amount > max_allowed_loan:
                raise ValueError(
                    f"Requested loan amount (₹{self.loan_amount:,.2f}) cannot exceed the financing gap (₹{max_allowed_loan:,.2f})."
                )
        return self

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "project_cost": 800000,
                "own_contribution": 100000,
                "annual_interest_rate": 10.0,
                "tenure_months": 60,
                "monthly_income": 45000
            }
        }
    )


class FinancialCalculationResponse(BaseModel):
    """Complete, transparent financial structure and repayment response."""
    project_cost: Decimal = Field(..., ge=0, description="Total project cost in INR")
    own_contribution: Decimal = Field(..., ge=0, description="Entrepreneur's own margin contribution in INR")
    own_contribution_pct: Decimal = Field(..., ge=0, le=100, description="Own contribution as percentage of project cost")
    financing_gap: Decimal = Field(..., ge=0, description="Financing gap (Project Cost - Own Contribution) in INR")
    loan: LoanRepaymentSummarySchema = Field(..., description="Loan structure and reducing-balance repayment schedule")
    cost_breakdown: Optional[ProjectCostBreakdownSchema] = Field(None, description="Validated itemized cost components")
    affordability: AffordabilityIndicatorSchema = Field(..., description="Debt burden and cash flow ratio analysis")
    calculation_notes: List[str] = Field(default_factory=list, description="Step-by-step mathematical reasoning notes")
    evaluated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Calculation UTC timestamp")

    model_config = ConfigDict(from_attributes=True)


class FinancialScenarioInput(BaseModel):
    """Specification of an individual financial comparison scenario."""
    scenario_name: str = Field(..., min_length=1, description="Label for the scenario (e.g. '36 Months - 9%')")
    own_contribution: Optional[Decimal] = Field(None, ge=0, description="Custom own contribution for this scenario")
    loan_amount: Optional[Decimal] = Field(None, ge=0, description="Custom loan amount for this scenario")
    annual_interest_rate: Decimal = Field(..., ge=0, description="Annual interest rate percentage")
    tenure_months: int = Field(..., gt=0, description="Loan tenure in months")


class ScenarioComparisonRequest(BaseModel):
    """API Request payload for comparing multiple financial scenarios."""
    project_cost: Decimal = Field(..., ge=0, description="Total project cost in INR")
    base_own_contribution: Decimal = Field(default=Decimal("0.00"), ge=0, description="Default own contribution if not overridden in scenario")
    scenarios: List[FinancialScenarioInput] = Field(..., min_length=1, description="List of comparative scenarios to evaluate")

    @model_validator(mode="after")
    def validate_scenarios(self) -> "ScenarioComparisonRequest":
        for idx, sc in enumerate(self.scenarios):
            effective_contrib = sc.own_contribution if sc.own_contribution is not None else self.base_own_contribution
            if effective_contrib > self.project_cost:
                raise ValueError(
                    f"Scenario '{sc.scenario_name}' own contribution (₹{effective_contrib:,.2f}) exceeds project cost (₹{self.project_cost:,.2f})."
                )
            if sc.loan_amount is not None:
                max_allowed = self.project_cost - effective_contrib
                if sc.loan_amount > max_allowed:
                    raise ValueError(
                        f"Scenario '{sc.scenario_name}' loan amount (₹{sc.loan_amount:,.2f}) exceeds financing gap (₹{max_allowed:,.2f})."
                    )
        return self

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "project_cost": 800000,
                "base_own_contribution": 100000,
                "scenarios": [
                    {
                        "scenario_name": "36-month short tenure",
                        "annual_interest_rate": 10.0,
                        "tenure_months": 36
                    },
                    {
                        "scenario_name": "60-month standard tenure",
                        "annual_interest_rate": 10.0,
                        "tenure_months": 60
                    },
                    {
                        "scenario_name": "Higher down-payment (₹2 Lakhs)",
                        "own_contribution": 200000,
                        "annual_interest_rate": 10.0,
                        "tenure_months": 60
                    }
                ]
            }
        }
    )


class FinancialScenarioResult(BaseModel):
    """Evaluated metrics for a single financial scenario."""
    scenario_name: str
    own_contribution: Decimal
    financing_gap: Decimal
    principal: Decimal
    annual_interest_rate: Decimal
    tenure_months: int
    estimated_emi: Decimal
    estimated_total_interest: Decimal
    estimated_total_repayment: Decimal

    model_config = ConfigDict(from_attributes=True)


class ScenarioComparisonResponse(BaseModel):
    """Response payload containing comparative evaluation of all submitted scenarios."""
    project_cost: Decimal
    scenario_count: int
    scenarios: List[FinancialScenarioResult]
    evaluated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(from_attributes=True)
