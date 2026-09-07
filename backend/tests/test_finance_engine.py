"""
Unit tests for FinancialEngine covering the 14 Mandatory Milestone Requirements and Boundary Cases
"""
import pytest
from decimal import Decimal
from pydantic import ValidationError
from app.models.scheme import Scheme
from app.schemas.finance import (
    FinancialCalculationRequest,
    ProjectCostBreakdownSchema,
    ScenarioComparisonRequest,
    FinancialScenarioInput,
)
from app.services.finance.engine import FinancialEngine
from app.services.finance.scenarios import evaluate_financial_scenarios


# ---------------------------------------------------------------------------
# 14 Mandatory Milestone Tests
# ---------------------------------------------------------------------------

def test_1_financing_gap_standard():
    """TEST 1: Project cost = 800000, Own contribution = 100000 -> Financing gap = 700000"""
    req = FinancialCalculationRequest(
        project_cost=Decimal("800000.00"),
        own_contribution=Decimal("100000.00"),
        annual_interest_rate=Decimal("10.00"),
        tenure_months=60
    )
    res = FinancialEngine.calculate_financial_structure(req)
    assert res.financing_gap == Decimal("700000.00")
    assert res.own_contribution_pct == Decimal("12.50")


def test_2_financing_gap_full_equity():
    """TEST 2: Project cost = 800000, Own contribution = 800000 -> Financing gap = 0"""
    req = FinancialCalculationRequest(
        project_cost=Decimal("800000.00"),
        own_contribution=Decimal("800000.00"),
        annual_interest_rate=Decimal("10.00"),
        tenure_months=60
    )
    res = FinancialEngine.calculate_financial_structure(req)
    assert res.financing_gap == Decimal("0.00")
    assert res.own_contribution_pct == Decimal("100.00")
    assert res.loan.estimated_emi == Decimal("0.00")


def test_3_own_contribution_exceeds_project_cost():
    """TEST 3: Own contribution > project cost -> validation error"""
    with pytest.raises(ValidationError, match="cannot exceed total project cost"):
        FinancialCalculationRequest(
            project_cost=Decimal("800000.00"),
            own_contribution=Decimal("850000.00")
        )


def test_4_negative_project_cost():
    """TEST 4: Negative project cost -> validation error"""
    with pytest.raises(ValidationError, match="Input should be greater than or equal to 0"):
        FinancialCalculationRequest(
            project_cost=Decimal("-1000.00"),
            own_contribution=Decimal("0.00")
        )


def test_5_negative_contribution():
    """TEST 5: Negative contribution -> validation error"""
    with pytest.raises(ValidationError, match="Input should be greater than or equal to 0"):
        FinancialCalculationRequest(
            project_cost=Decimal("500000.00"),
            own_contribution=Decimal("-500.00")
        )


def test_6_valid_reducing_balance_emi():
    """TEST 6: Valid EMI calculation -> mathematically correct result"""
    req = FinancialCalculationRequest(
        project_cost=Decimal("800000.00"),
        own_contribution=Decimal("100000.00"),
        annual_interest_rate=Decimal("10.00"),
        tenure_months=60
    )
    res = FinancialEngine.calculate_financial_structure(req)
    assert res.loan.estimated_emi == Decimal("14872.93")


def test_7_zero_interest_loan():
    """TEST 7: Zero-interest loan -> principal / installments"""
    req = FinancialCalculationRequest(
        project_cost=Decimal("600000.00"),
        own_contribution=Decimal("0.00"),
        annual_interest_rate=Decimal("0.00"),
        tenure_months=60
    )
    res = FinancialEngine.calculate_financial_structure(req)
    assert res.loan.is_zero_interest is True
    assert res.loan.estimated_emi == Decimal("10000.00")
    assert res.loan.estimated_total_interest == Decimal("0.00")
    assert res.loan.estimated_total_repayment == Decimal("600000.00")


def test_8_negative_interest_rate():
    """TEST 8: Negative interest -> validation error"""
    with pytest.raises(ValidationError, match="Input should be greater than or equal to 0"):
        FinancialCalculationRequest(
            project_cost=Decimal("500000.00"),
            own_contribution=Decimal("50000.00"),
            annual_interest_rate=Decimal("-2.50")
        )


def test_9_zero_tenure():
    """TEST 9: Zero tenure -> validation error"""
    with pytest.raises(ValidationError, match="Input should be greater than 0"):
        FinancialCalculationRequest(
            project_cost=Decimal("500000.00"),
            own_contribution=Decimal("50000.00"),
            tenure_months=0
        )


def test_10_negative_tenure():
    """TEST 10: Negative tenure -> validation error"""
    with pytest.raises(ValidationError, match="Input should be greater than 0"):
        FinancialCalculationRequest(
            project_cost=Decimal("500000.00"),
            own_contribution=Decimal("50000.00"),
            tenure_months=-12
        )


def test_11_decimal_precision_rounding():
    """TEST 11: Decimal precision -> correct deterministic rounding"""
    req = FinancialCalculationRequest(
        project_cost=Decimal("123456.78"),
        own_contribution=Decimal("23456.78"),
        annual_interest_rate=Decimal("8.75"),
        tenure_months=36
    )
    res = FinancialEngine.calculate_financial_structure(req)
    assert res.financing_gap == Decimal("100000.00")
    assert res.loan.estimated_emi == Decimal("3168.35")


def test_12_total_repayment():
    """TEST 12: Total repayment -> EMI * installments"""
    req = FinancialCalculationRequest(
        project_cost=Decimal("800000.00"),
        own_contribution=Decimal("100000.00"),
        annual_interest_rate=Decimal("10.00"),
        tenure_months=60
    )
    res = FinancialEngine.calculate_financial_structure(req)
    assert res.loan.estimated_total_repayment == Decimal("892375.80")


def test_13_total_interest():
    """TEST 13: Total interest -> total repayment - principal"""
    req = FinancialCalculationRequest(
        project_cost=Decimal("800000.00"),
        own_contribution=Decimal("100000.00"),
        annual_interest_rate=Decimal("10.00"),
        tenure_months=60
    )
    res = FinancialEngine.calculate_financial_structure(req)
    expected_interest = Decimal("892375.80") - Decimal("700000.00")
    assert res.loan.estimated_total_interest == expected_interest


def test_14_multiple_scenarios_independence():
    """TEST 14: Multiple scenarios -> independently correct results"""
    req = ScenarioComparisonRequest(
        project_cost=Decimal("1000000.00"),
        base_own_contribution=Decimal("150000.00"),
        scenarios=[
            FinancialScenarioInput(scenario_name="S1-36M", annual_interest_rate=Decimal("9.00"), tenure_months=36),
            FinancialScenarioInput(scenario_name="S2-60M", annual_interest_rate=Decimal("9.00"), tenure_months=60),
        ]
    )
    res = evaluate_financial_scenarios(req)
    assert len(res.scenarios) == 2
    assert res.scenarios[0].principal == Decimal("850000.00")
    assert res.scenarios[1].principal == Decimal("850000.00")
    assert res.scenarios[0].estimated_emi == Decimal("27029.77")
    assert res.scenarios[1].estimated_emi == Decimal("17644.60")


# ---------------------------------------------------------------------------
# Boundary and Scheme Parameter Tests
# ---------------------------------------------------------------------------

def test_boundary_own_contribution():
    # 1. 0 equity
    res_0 = FinancialEngine.calculate_financial_structure(
        FinancialCalculationRequest(project_cost=Decimal("100000.00"), own_contribution=Decimal("0.00"))
    )
    assert res_0.financing_gap == Decimal("100000.00")

    # 2. project_cost - 1
    res_sub = FinancialEngine.calculate_financial_structure(
        FinancialCalculationRequest(project_cost=Decimal("100000.00"), own_contribution=Decimal("99999.00"))
    )
    assert res_sub.financing_gap == Decimal("1.00")

    # 3. project_cost
    res_exact = FinancialEngine.calculate_financial_structure(
        FinancialCalculationRequest(project_cost=Decimal("100000.00"), own_contribution=Decimal("100000.00"))
    )
    assert res_exact.financing_gap == Decimal("0.00")


def test_boundary_tenures():
    # 1 month tenure
    res_1m = FinancialEngine.calculate_financial_structure(
        FinancialCalculationRequest(project_cost=Decimal("100000.00"), own_contribution=Decimal("0.00"), annual_interest_rate=Decimal("12.00"), tenure_months=1)
    )
    assert res_1m.loan.estimated_emi == Decimal("101000.00")
    assert res_1m.loan.estimated_total_interest == Decimal("1000.00")

    # 84 months (7 years)
    res_84m = FinancialEngine.calculate_financial_structure(
        FinancialCalculationRequest(project_cost=Decimal("1000000.00"), own_contribution=Decimal("100000.00"), annual_interest_rate=Decimal("10.00"), tenure_months=84)
    )
    assert res_84m.loan.estimated_emi == Decimal("14941.07")


def test_scheme_linked_cost_limit_note():
    scheme = Scheme(
        id=1,
        scheme_code="PMEGP",
        scheme_name="Prime Minister's Employment Generation Programme",
        short_description="Subsidy scheme",
        nodal_ministry="MSME",
        target_beneficiaries=[],
        purpose="Self employment",
        benefits_summary={"max_project_cost_manufacturing_inr": 5000000},
        business_stages=[],
        sectors=[],
        data_status="VERIFIED"
    )
    req_exceed = FinancialCalculationRequest(
        project_cost=Decimal("6000000.00"),
        own_contribution=Decimal("1000000.00")
    )
    res = FinancialEngine.calculate_financial_structure(req_exceed, scheme=scheme)
    assert any("exceeds scheme manufacturing ceiling of ₹5,000,000.00" in n for n in res.calculation_notes)
