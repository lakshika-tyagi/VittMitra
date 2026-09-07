"""
Unit tests for financial scenarios comparison (scenarios.py)
"""
import pytest
from decimal import Decimal
from pydantic import ValidationError
from app.schemas.finance import (
    ScenarioComparisonRequest,
    FinancialScenarioInput,
)
from app.services.finance.scenarios import evaluate_financial_scenarios


def test_scenario_comparison_multiple_tenures():
    """
    Compare 36-month vs 60-month loan for ₹7,00,000 principal at 10% interest.
    - 36-month EMI: ₹22,583.56, Total Interest: ₹1,13,008.16
    - 60-month EMI: ₹14,873.18, Total Interest: ₹1,92,390.80
    """
    request = ScenarioComparisonRequest(
        project_cost=Decimal("800000.00"),
        base_own_contribution=Decimal("100000.00"),
        scenarios=[
            FinancialScenarioInput(
                scenario_name="36-month tenure",
                annual_interest_rate=Decimal("10.00"),
                tenure_months=36
            ),
            FinancialScenarioInput(
                scenario_name="60-month tenure",
                annual_interest_rate=Decimal("10.00"),
                tenure_months=60
            ),
            FinancialScenarioInput(
                scenario_name="Higher down-payment (₹2 Lakhs)",
                own_contribution=Decimal("200000.00"),
                annual_interest_rate=Decimal("10.00"),
                tenure_months=60
            )
        ]
    )

    response = evaluate_financial_scenarios(request)

    assert response.project_cost == Decimal("800000.00")
    assert response.scenario_count == 3
    assert len(response.scenarios) == 3

    sc36 = response.scenarios[0]
    assert sc36.scenario_name == "36-month tenure"
    assert sc36.principal == Decimal("700000.00")
    assert sc36.estimated_emi == Decimal("22587.03")
    assert sc36.estimated_total_repayment == Decimal("813133.08")
    assert sc36.estimated_total_interest == Decimal("113133.08")

    sc60 = response.scenarios[1]
    assert sc60.scenario_name == "60-month tenure"
    assert sc60.principal == Decimal("700000.00")
    assert sc60.estimated_emi == Decimal("14872.93")
    assert sc60.estimated_total_repayment == Decimal("892375.80")
    assert sc60.estimated_total_interest == Decimal("192375.80")

    sc_down = response.scenarios[2]
    assert sc_down.scenario_name == "Higher down-payment (₹2 Lakhs)"
    assert sc_down.own_contribution == Decimal("200000.00")
    assert sc_down.financing_gap == Decimal("600000.00")
    assert sc_down.principal == Decimal("600000.00")
    assert sc_down.estimated_emi == Decimal("12748.23")
    assert sc_down.estimated_total_interest == Decimal("164893.80")

    # Mathematical consistency checks
    assert sc36.estimated_emi > sc60.estimated_emi
    assert sc36.estimated_total_interest < sc60.estimated_total_interest
    assert sc_down.estimated_emi < sc60.estimated_emi


def test_scenario_validation_contribution_exceeds_project_cost():
    with pytest.raises(ValidationError, match="exceeds project cost"):
        ScenarioComparisonRequest(
            project_cost=Decimal("500000.00"),
            base_own_contribution=Decimal("100000.00"),
            scenarios=[
                FinancialScenarioInput(
                    scenario_name="Invalid Scenario",
                    own_contribution=Decimal("600000.00"),
                    annual_interest_rate=Decimal("10.00"),
                    tenure_months=36
                )
            ]
        )
