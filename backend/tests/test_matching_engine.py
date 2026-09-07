"""
Unit & Integration Tests for Explainable Scheme Matching & Ranking Engine

Validates all 15 core test cases required by Step 6:
TEST 1: Fully matching entrepreneur -> eligible scheme ranks highly
TEST 2: Mandatory eligibility failure -> scheme is NOT shown as eligible
TEST 3: Eligibility UNVERIFIED -> scheme becomes potentially relevant
TEST 4: Business sector matches -> positive factor
TEST 5: Business sector does not match -> negative factor
TEST 6: National scheme + valid state -> geographic match
TEST 7: State-specific scheme + matching state -> geographic match
TEST 8: State-specific scheme + non-matching state -> negative/inapplicable result
TEST 9: Financial compatibility available and matched -> positive factor
TEST 10: Financial parameter unavailable -> UNVERIFIED, not assumed compatible
TEST 11: Missing profile field -> UNVERIFIED where appropriate
TEST 12: Multiple schemes -> deterministic ranking
TEST 13: Equal scores -> deterministic tie-break
TEST 14: Inactive scheme -> excluded
TEST 15: Malformed/incomplete scheme -> safely handled
"""
from decimal import Decimal
import pytest

from app.models.scheme import Scheme, SchemeEligibilityRule
from app.schemas.eligibility import EligibilityStatus, EntrepreneurProfileInput
from app.schemas.finance import FinancialCalculationRequest
from app.schemas.matching import MatchCategory
from app.services.matching.engine import MatchingEngine
from app.services.matching.ranking import rank_and_shortlist_schemes


def _create_mock_scheme(
    scheme_id: int = 1,
    scheme_code: str = "PMEGP",
    scheme_name: str = "PMEGP",
    nodal_ministry: str = "Ministry of MSME",
    geography_level: str = "NATIONAL",
    target_beneficiaries=None,
    business_stages=None,
    sectors=None,
    benefits_summary=None,
    rules=None,
    is_active: bool = True
) -> Scheme:
    """Helper to construct in-memory Scheme models for unit testing."""
    s = Scheme(
        id=scheme_id,
        scheme_code=scheme_code,
        scheme_name=scheme_name,
        short_description="Mock scheme description",
        nodal_ministry=nodal_ministry,
        geography_level=geography_level,
        target_beneficiaries=target_beneficiaries or ["General", "SC", "ST", "Women"],
        purpose="Self-employment and enterprise setup",
        benefits_summary=benefits_summary if benefits_summary is not None else {"max_project_cost_manufacturing_inr": 5000000},
        business_stages=business_stages or ["new_enterprise"],
        sectors=sectors or ["manufacturing", "services"],
        data_status="VERIFIED",
        is_active=is_active,
        sources=[],
        eligibility_rules=[],
        documents=[],
    )
    if rules:
        for r in rules:
            s.eligibility_rules.append(r)
    return s


# ==============================================================================
# TEST 1: Fully matching entrepreneur -> eligible scheme ranks highly
# ==============================================================================
def test_test1_fully_matching_entrepreneur():
    rule_age = SchemeEligibilityRule(
        id=1, rule_code="PMEGP_MIN_AGE", field_name="age", operator=">=", expected_value=18, description="Min age 18", is_active=True, is_mandatory=True
    )
    rule_stage = SchemeEligibilityRule(
        id=2, rule_code="PMEGP_STAGE", field_name="business_stage", operator="==", expected_value="new_enterprise", description="New enterprise only", is_active=True, is_mandatory=True
    )
    scheme = _create_mock_scheme(rules=[rule_age, rule_stage])

    profile = EntrepreneurProfileInput(
        age=28,
        gender="female",
        category="SC",
        state="Maharashtra",
        sector="manufacturing",
        business_stage="new_enterprise",
    )
    fin_req = FinancialCalculationRequest(
        project_cost=Decimal("1500000"),
        own_contribution=Decimal("200000"),
        loan_amount=Decimal("1300000"),
    )

    resp = MatchingEngine.match_and_rank_schemes(
        schemes=[scheme],
        profile=profile,
        financial=fin_req
    )

    assert resp.total_schemes_evaluated == 1
    assert resp.eligible_count == 1
    assert len(resp.results) == 1
    result = resp.results[0]
    assert result.match_category == MatchCategory.ELIGIBLE
    assert result.eligibility_status == EligibilityStatus.MATCHED
    assert result.match_score == 100.0
    assert len(result.reasons.positive) >= 4
    assert len(result.reasons.negative) == 0


# ==============================================================================
# TEST 2: Mandatory eligibility failure -> scheme is NOT shown as eligible
# ==============================================================================
def test_test2_mandatory_eligibility_failure():
    rule_age = SchemeEligibilityRule(
        id=1, rule_code="PMEGP_MIN_AGE", field_name="age", operator=">=", expected_value=18, description="Min age 18", is_active=True, is_mandatory=True
    )
    scheme = _create_mock_scheme(rules=[rule_age])

    # Applicant is 16 years old (fails mandatory age condition)
    profile = EntrepreneurProfileInput(
        age=16,
        gender="male",
        category="General",
        state="Karnataka",
        sector="manufacturing",
        business_stage="new_enterprise",
    )

    resp = MatchingEngine.match_and_rank_schemes(
        schemes=[scheme],
        profile=profile,
    )

    assert resp.not_eligible_count == 1
    assert resp.eligible_count == 0
    result = resp.results[0]
    assert result.match_category == MatchCategory.NOT_ELIGIBLE
    assert result.eligibility_status == EligibilityStatus.FAILED
    assert any("failed" in r.lower() for r in result.reasons.negative)


# ==============================================================================
# TEST 3: Eligibility UNVERIFIED -> scheme becomes potentially relevant
# ==============================================================================
def test_test3_eligibility_unverified():
    rule_age = SchemeEligibilityRule(
        id=1, rule_code="PMEGP_MIN_AGE", field_name="age", operator=">=", expected_value=18, description="Min age 18", is_active=True, is_mandatory=True
    )
    scheme = _create_mock_scheme(rules=[rule_age])

    # Age is missing
    profile = EntrepreneurProfileInput(
        age=None,
        state="Delhi",
        sector="manufacturing",
        business_stage="new_enterprise",
    )

    resp = MatchingEngine.match_and_rank_schemes(
        schemes=[scheme],
        profile=profile,
    )

    assert resp.potentially_relevant_count == 1
    assert resp.eligible_count == 0
    result = resp.results[0]
    assert result.match_category == MatchCategory.POTENTIALLY_RELEVANT
    assert result.eligibility_status == EligibilityStatus.UNVERIFIED


# ==============================================================================
# TEST 4: Business sector matches -> positive factor
# ==============================================================================
def test_test4_business_sector_matches():
    scheme = _create_mock_scheme(sectors=["manufacturing", "services"])
    profile = EntrepreneurProfileInput(sector="manufacturing")

    result = MatchingEngine.match_single_scheme(scheme=scheme, profile=profile)
    assert result is not None
    sec_score = next(d for d in result.score_breakdown if d.factor == "sector_fit")
    assert sec_score.status == EligibilityStatus.MATCHED
    assert sec_score.score_awarded == 15.0
    assert any("manufacturing" in r for r in result.reasons.positive)


# ==============================================================================
# TEST 5: Business sector does not match -> negative factor
# ==============================================================================
def test_test5_business_sector_mismatch():
    scheme = _create_mock_scheme(sectors=["manufacturing", "services"])
    profile = EntrepreneurProfileInput(sector="mining_coal")

    result = MatchingEngine.match_single_scheme(scheme=scheme, profile=profile)
    assert result is not None
    sec_score = next(d for d in result.score_breakdown if d.factor == "sector_fit")
    assert sec_score.status == EligibilityStatus.FAILED
    assert sec_score.score_awarded == 0.0
    assert result.match_category == MatchCategory.NOT_ELIGIBLE
    assert any("not in the scheme's supported sectors" in r for r in result.reasons.negative)


# ==============================================================================
# TEST 6: National scheme + valid state -> geographic match
# ==============================================================================
def test_test6_national_scheme_geography():
    scheme = _create_mock_scheme(geography_level="NATIONAL")
    profile = EntrepreneurProfileInput(state="Gujarat")

    result = MatchingEngine.match_single_scheme(scheme=scheme, profile=profile)
    assert result is not None
    geo_score = next(d for d in result.score_breakdown if d.factor == "geography_fit")
    assert geo_score.status == EligibilityStatus.MATCHED
    assert geo_score.score_awarded == 10.0
    assert "Gujarat" in geo_score.explanation


# ==============================================================================
# TEST 7: State-specific scheme + matching state -> geographic match
# ==============================================================================
def test_test7_state_scheme_matching_state():
    scheme = _create_mock_scheme(geography_level="STATE_ODISHA")
    profile = EntrepreneurProfileInput(state="Odisha")

    result = MatchingEngine.match_single_scheme(scheme=scheme, profile=profile)
    assert result is not None
    geo_score = next(d for d in result.score_breakdown if d.factor == "geography_fit")
    assert geo_score.status == EligibilityStatus.MATCHED
    assert geo_score.score_awarded == 10.0


# ==============================================================================
# TEST 8: State-specific scheme + non-matching state -> negative result
# ==============================================================================
def test_test8_state_scheme_non_matching_state():
    scheme = _create_mock_scheme(geography_level="STATE_ODISHA")
    profile = EntrepreneurProfileInput(state="Haryana")

    result = MatchingEngine.match_single_scheme(scheme=scheme, profile=profile)
    assert result is not None
    geo_score = next(d for d in result.score_breakdown if d.factor == "geography_fit")
    assert geo_score.status == EligibilityStatus.FAILED
    assert geo_score.score_awarded == 0.0
    assert result.match_category == MatchCategory.NOT_ELIGIBLE


# ==============================================================================
# TEST 9: Financial compatibility available and matched -> positive factor
# ==============================================================================
def test_test9_financial_compatibility_matched():
    scheme = _create_mock_scheme(
        benefits_summary={
            "max_project_cost_manufacturing_inr": 5000000,
            "min_loan_amount_inr": 100000,
            "max_loan_amount_inr": 5000000,
        }
    )
    fin_req = FinancialCalculationRequest(
        project_cost=Decimal("2000000"),
        own_contribution=Decimal("300000"),
        loan_amount=Decimal("1700000"),
    )
    profile = EntrepreneurProfileInput(sector="manufacturing")

    result = MatchingEngine.match_single_scheme(scheme=scheme, profile=profile, financial_req=fin_req)
    assert result is not None
    fin_score = next(d for d in result.score_breakdown if d.factor == "financial_fit")
    assert fin_score.status == EligibilityStatus.MATCHED
    assert fin_score.score_awarded == 20.0
    assert any("fits within verified scheme financial parameters" in r for r in result.reasons.positive)


# ==============================================================================
# TEST 10: Financial parameter unavailable -> UNVERIFIED, not assumed compatible
# ==============================================================================
def test_test10_financial_parameter_unavailable():
    # Scheme has empty benefits summary
    scheme = _create_mock_scheme(benefits_summary={})
    fin_req = FinancialCalculationRequest(
        project_cost=Decimal("2000000"),
        own_contribution=Decimal("300000"),
    )

    result = MatchingEngine.match_single_scheme(scheme=scheme, profile=EntrepreneurProfileInput(), financial_req=fin_req)
    assert result is not None
    fin_score = next(d for d in result.score_breakdown if d.factor == "financial_fit")
    assert fin_score.status == EligibilityStatus.UNVERIFIED
    assert fin_score.score_awarded == 10.0 # 50% uncertainty score
    assert any("financial" in r.lower() for r in result.reasons.unverified)


# ==============================================================================
# TEST 11: Missing profile field -> UNVERIFIED where appropriate
# ==============================================================================
def test_test11_missing_profile_fields():
    scheme = _create_mock_scheme(
        sectors=["manufacturing"],
        business_stages=["new_enterprise"],
        target_beneficiaries=["SC", "ST"]
    )
    # Empty profile (all fields None)
    profile = EntrepreneurProfileInput()

    result = MatchingEngine.match_single_scheme(scheme=scheme, profile=profile)
    assert result is not None
    assert result.match_category == MatchCategory.POTENTIALLY_RELEVANT
    unverified_factors = [d.factor for d in result.score_breakdown if d.status == EligibilityStatus.UNVERIFIED]
    assert "sector_fit" in unverified_factors
    assert "stage_fit" in unverified_factors
    assert "beneficiary_fit" in unverified_factors


# ==============================================================================
# TEST 12: Multiple schemes -> deterministic ranking
# ==============================================================================
def test_test12_multiple_schemes_deterministic_ranking():
    # Scheme A: Fully matched -> Score 100
    scheme_a = _create_mock_scheme(
        scheme_id=1, scheme_code="SCHEME_A", scheme_name="Scheme Alpha",
        sectors=["manufacturing"], business_stages=["new_enterprise"]
    )
    # Scheme B: Sector missing -> Score ~92.5
    scheme_b = _create_mock_scheme(
        scheme_id=2, scheme_code="SCHEME_B", scheme_name="Scheme Beta",
        sectors=["services"], business_stages=["new_enterprise"]
    )

    profile = EntrepreneurProfileInput(
        age=30, state="Bihar", sector="manufacturing", business_stage="new_enterprise", category="General"
    )

    resp = MatchingEngine.match_and_rank_schemes(schemes=[scheme_b, scheme_a], profile=profile)
    assert len(resp.results) == 2
    # Scheme A must be rank 1 despite scheme B passed first in the list
    assert resp.results[0].scheme_code == "SCHEME_A"
    assert resp.results[0].rank == 1
    assert resp.results[1].scheme_code == "SCHEME_B"
    assert resp.results[1].rank == 2


# ==============================================================================
# TEST 13: Equal scores -> deterministic tie-break
# ==============================================================================
def test_test13_equal_scores_tie_breaking():
    # Two schemes with identical parameters and identical scores
    scheme_z = _create_mock_scheme(scheme_id=10, scheme_code="SCHEME_Z", scheme_name="Scheme Z")
    scheme_a = _create_mock_scheme(scheme_id=11, scheme_code="SCHEME_A", scheme_name="Scheme A")

    profile = EntrepreneurProfileInput(sector="manufacturing", business_stage="new_enterprise")

    resp1 = MatchingEngine.match_and_rank_schemes(schemes=[scheme_z, scheme_a], profile=profile)
    resp2 = MatchingEngine.match_and_rank_schemes(schemes=[scheme_a, scheme_z], profile=profile)

    # In both runs, alphabetical scheme_code tie-breaker must place SCHEME_A before SCHEME_Z
    assert resp1.results[0].scheme_code == "SCHEME_A"
    assert resp1.results[1].scheme_code == "SCHEME_Z"

    assert resp2.results[0].scheme_code == "SCHEME_A"
    assert resp2.results[1].scheme_code == "SCHEME_Z"


# ==============================================================================
# TEST 14: Inactive scheme -> excluded
# ==============================================================================
def test_test14_inactive_scheme_excluded():
    active_scheme = _create_mock_scheme(scheme_id=1, scheme_code="ACTIVE_1", is_active=True)
    inactive_scheme = _create_mock_scheme(scheme_id=2, scheme_code="INACTIVE_1", is_active=False)

    resp = MatchingEngine.match_and_rank_schemes(
        schemes=[active_scheme, inactive_scheme],
        profile=EntrepreneurProfileInput()
    )

    assert resp.total_schemes_evaluated == 1
    assert len(resp.results) == 1
    assert resp.results[0].scheme_code == "ACTIVE_1"


# ==============================================================================
# TEST 15: Malformed/incomplete scheme -> safely handled
# ==============================================================================
def test_test15_incomplete_scheme_handled_safely():
    malformed_scheme = Scheme(
        id=99,
        scheme_code="INCOMPLETE_SCHEME",
        scheme_name="Incomplete Scheme",
        short_description="No rules or benefits",
        nodal_ministry="Unknown",
        geography_level="NATIONAL",
        target_beneficiaries=[],
        purpose="Testing safety",
        benefits_summary={},
        business_stages=[],
        sectors=[],
        data_status="UNVERIFIED",
        is_active=True,
        sources=[],
        eligibility_rules=[],
        documents=[],
    )

    resp = MatchingEngine.match_and_rank_schemes(
        schemes=[malformed_scheme],
        profile=EntrepreneurProfileInput()
    )

    assert resp.total_schemes_evaluated == 1
    assert len(resp.results) == 1
    res = resp.results[0]
    assert res.scheme_code == "INCOMPLETE_SCHEME"
    assert res.match_score >= 0.0
