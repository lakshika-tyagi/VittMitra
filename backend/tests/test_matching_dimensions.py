"""
Unit Tests for Scheme Matching Dimension Evaluators
"""
from decimal import Decimal
from datetime import datetime, timezone
import pytest

from app.schemas.eligibility import (
    EligibilityStatus,
    EligibilitySummary,
    EligibilityCheckResponse,
    CriterionResult,
)
from app.schemas.finance import (
    FinancialCalculationRequest,
    FinancialCalculationResponse,
    LoanRepaymentSummarySchema,
    AffordabilityIndicatorSchema,
)
from app.services.matching.dimensions import (
    evaluate_eligibility_dimension,
    evaluate_sector_dimension,
    evaluate_stage_dimension,
    evaluate_geography_dimension,
    evaluate_beneficiary_dimension,
    evaluate_financial_dimension,
)


def test_evaluate_eligibility_dimension_matched():
    resp = EligibilityCheckResponse(
        scheme_id=1,
        scheme_code="PMEGP",
        scheme_name="PMEGP",
        overall_status=EligibilityStatus.MATCHED,
        evaluated_at=datetime.now(timezone.utc),
        summary=EligibilitySummary(total_rules=4, matched_count=4, failed_count=0, unverified_count=0),
        criteria=[],
    )
    res = evaluate_eligibility_dimension(resp)
    assert res.factor == "eligibility"
    assert res.status == EligibilityStatus.MATCHED
    assert res.weight == 35.0
    assert res.score_awarded == 35.0
    assert "All 4 evaluated mandatory eligibility criteria matched" in res.explanation


def test_evaluate_eligibility_dimension_unverified():
    resp = EligibilityCheckResponse(
        scheme_id=1,
        scheme_code="PMEGP",
        scheme_name="PMEGP",
        overall_status=EligibilityStatus.UNVERIFIED,
        evaluated_at=datetime.now(timezone.utc),
        summary=EligibilitySummary(total_rules=4, matched_count=3, failed_count=0, unverified_count=1),
        criteria=[],
    )
    res = evaluate_eligibility_dimension(resp)
    assert res.factor == "eligibility"
    assert res.status == EligibilityStatus.UNVERIFIED
    assert res.score_awarded == 17.5
    assert "1 mandatory eligibility criteria remain unverified" in res.explanation


def test_evaluate_eligibility_dimension_failed():
    resp = EligibilityCheckResponse(
        scheme_id=1,
        scheme_code="PMEGP",
        scheme_name="PMEGP",
        overall_status=EligibilityStatus.FAILED,
        evaluated_at=datetime.now(timezone.utc),
        summary=EligibilitySummary(total_rules=4, matched_count=2, failed_count=1, unverified_count=1),
        criteria=[],
    )
    res = evaluate_eligibility_dimension(resp)
    assert res.factor == "eligibility"
    assert res.status == EligibilityStatus.FAILED
    assert res.score_awarded == 0.0
    assert "1 mandatory eligibility criteria failed evaluation" in res.explanation


def test_evaluate_sector_dimension():
    sectors = ["manufacturing", "services", "handicrafts"]

    # Matched
    res_match = evaluate_sector_dimension("manufacturing", sectors)
    assert res_match.status == EligibilityStatus.MATCHED
    assert res_match.score_awarded == 15.0

    # Failed
    res_fail = evaluate_sector_dimension("agriculture_farming", sectors)
    assert res_fail.status == EligibilityStatus.FAILED
    assert res_fail.score_awarded == 0.0

    # Unverified
    res_unver = evaluate_sector_dimension(None, sectors)
    assert res_unver.status == EligibilityStatus.UNVERIFIED
    assert res_unver.score_awarded == 7.5


def test_evaluate_stage_dimension():
    stages = ["new_enterprise", "expansion"]

    # Matched
    res_match = evaluate_stage_dimension("new_enterprise", stages)
    assert res_match.status == EligibilityStatus.MATCHED
    assert res_match.score_awarded == 10.0

    # Failed
    res_fail = evaluate_stage_dimension("idea", stages)
    assert res_fail.status == EligibilityStatus.FAILED
    assert res_fail.score_awarded == 0.0

    # Unverified
    res_unver = evaluate_stage_dimension(None, stages)
    assert res_unver.status == EligibilityStatus.UNVERIFIED
    assert res_unver.score_awarded == 5.0


def test_evaluate_geography_dimension():
    # National
    res_nat = evaluate_geography_dimension("Rajasthan", "NATIONAL")
    assert res_nat.status == EligibilityStatus.MATCHED
    assert res_nat.score_awarded == 10.0

    # State specific - matched
    res_st_match = evaluate_geography_dimension("Tamil Nadu", "STATE_TAMIL_NADU")
    assert res_st_match.status == EligibilityStatus.MATCHED
    assert res_st_match.score_awarded == 10.0

    # State specific - failed
    res_st_fail = evaluate_geography_dimension("Punjab", "STATE_TAMIL_NADU")
    assert res_st_fail.status == EligibilityStatus.FAILED
    assert res_st_fail.score_awarded == 0.0

    # State specific - unverified
    res_st_unver = evaluate_geography_dimension(None, "STATE_TAMIL_NADU")
    assert res_st_unver.status == EligibilityStatus.UNVERIFIED
    assert res_st_unver.score_awarded == 5.0


def test_evaluate_beneficiary_dimension():
    # Universal / Open
    res_open = evaluate_beneficiary_dimension(None, None, ["General", "SC", "ST", "Women"])
    assert res_open.status == EligibilityStatus.MATCHED
    assert res_open.score_awarded == 10.0

    # Restrictive (SC/ST/Women only, Stand-Up India)
    restrictive = ["SC", "ST", "Women"]

    res_match_sc = evaluate_beneficiary_dimension("SC", "male", restrictive)
    assert res_match_sc.status == EligibilityStatus.MATCHED
    assert res_match_sc.score_awarded == 10.0

    res_match_women = evaluate_beneficiary_dimension("General", "female", restrictive)
    assert res_match_women.status == EligibilityStatus.MATCHED
    assert res_match_women.score_awarded == 10.0

    res_fail = evaluate_beneficiary_dimension("General", "male", restrictive)
    assert res_fail.status == EligibilityStatus.FAILED
    assert res_fail.score_awarded == 0.0

    res_unver = evaluate_beneficiary_dimension(None, None, restrictive)
    assert res_unver.status == EligibilityStatus.UNVERIFIED
    assert res_unver.score_awarded == 5.0


def test_evaluate_financial_dimension():
    benefits = {
        "max_project_cost_manufacturing_inr": 5000000,
        "max_project_cost_services_inr": 2000000,
        "min_loan_amount_inr": 1000000,
        "max_loan_amount_inr": 10000000,
    }

    # Within limits
    fin_req = FinancialCalculationRequest(
        project_cost=Decimal("2500000"),
        own_contribution=Decimal("500000"),
        loan_amount=Decimal("2000000"),
    )
    res_match = evaluate_financial_dimension(
        financial_req=fin_req,
        profile_project_cost=2500000,
        profile_sector="manufacturing",
        benefits_summary=benefits,
    )
    assert res_match.status == EligibilityStatus.MATCHED
    assert res_match.score_awarded == 20.0

    # Exceeds cost ceiling
    fin_req_high = FinancialCalculationRequest(
        project_cost=Decimal("6000000"),
        own_contribution=Decimal("1000000"),
        loan_amount=Decimal("5000000"),
    )
    res_fail_cost = evaluate_financial_dimension(
        financial_req=fin_req_high,
        profile_project_cost=6000000,
        profile_sector="manufacturing",
        benefits_summary=benefits,
    )
    assert res_fail_cost.status == EligibilityStatus.FAILED
    assert res_fail_cost.score_awarded == 0.0
    assert "exceeds manufacturing ceiling" in res_fail_cost.explanation

    # Below min loan threshold (Stand-Up India min 10 Lakhs)
    fin_req_low = FinancialCalculationRequest(
        project_cost=Decimal("500000"),
        own_contribution=Decimal("50000"),
        loan_amount=Decimal("450000"),
    )
    res_fail_loan = evaluate_financial_dimension(
        financial_req=fin_req_low,
        profile_project_cost=500000,
        profile_sector="manufacturing",
        benefits_summary=benefits,
    )
    assert res_fail_loan.status == EligibilityStatus.FAILED
    assert res_fail_loan.score_awarded == 0.0
    assert "below the scheme minimum threshold" in res_fail_loan.explanation

    # Scheme without limits
    res_no_limit = evaluate_financial_dimension(
        financial_req=fin_req,
        profile_project_cost=2500000,
        profile_sector="manufacturing",
        benefits_summary={},
    )
    assert res_no_limit.status == EligibilityStatus.UNVERIFIED
    assert res_no_limit.score_awarded == 10.0

    # No financial input provided
    res_no_input = evaluate_financial_dimension(
        financial_req=None,
        profile_project_cost=None,
        profile_sector="manufacturing",
        benefits_summary=benefits,
    )
    assert res_no_input.status == EligibilityStatus.UNVERIFIED
    assert res_no_input.score_awarded == 10.0
