"""
Unit tests for core EligibilityEngine and the 18 Mandatory Milestone Requirements
"""
import pytest
from app.models.scheme import Scheme, SchemeEligibilityRule, SchemeSource
from app.schemas.eligibility import EligibilityStatus
from app.services.eligibility.engine import EligibilityEngine


# ---------------------------------------------------------------------------
# Individual Criterion Tests (Tests 1 to 13)
# ---------------------------------------------------------------------------

def test_1_age_27_gte_18_matched():
    """TEST 1: Age 27, Rule age >= 18 -> MATCHED"""
    rule = SchemeEligibilityRule(
        id=1, rule_code="R1", field_name="age", operator=">=", expected_value=18,
        description="Min age 18", is_mandatory=True, is_active=True
    )
    result = EligibilityEngine.evaluate_rule(rule, {"age": 27})
    assert result.status == EligibilityStatus.MATCHED
    assert result.user_value == 27
    assert "meets required minimum of >= 18" in result.explanation


def test_2_age_17_gte_18_failed():
    """TEST 2: Age 17, Rule age >= 18 -> FAILED"""
    rule = SchemeEligibilityRule(
        id=2, rule_code="R2", field_name="age", operator=">=", expected_value=18,
        description="Min age 18", is_mandatory=True, is_active=True
    )
    result = EligibilityEngine.evaluate_rule(rule, {"age": 17})
    assert result.status == EligibilityStatus.FAILED
    assert result.user_value == 17
    assert "fails to meet required minimum of >= 18" in result.explanation


def test_3_age_missing_gte_18_unverified():
    """TEST 3: Age missing, Rule age >= 18 -> UNVERIFIED"""
    rule = SchemeEligibilityRule(
        id=3, rule_code="R3", field_name="age", operator=">=", expected_value=18,
        description="Min age 18", is_mandatory=True, is_active=True
    )
    result = EligibilityEngine.evaluate_rule(rule, {"age": None})
    assert result.status == EligibilityStatus.UNVERIFIED
    assert result.user_value is None
    assert "not provided in applicant profile" in result.explanation


def test_4_correct_categorical_value_matched():
    """TEST 4: Correct categorical value -> MATCHED"""
    rule = SchemeEligibilityRule(
        id=4, rule_code="R4", field_name="business_stage", operator="==", expected_value="new_enterprise",
        description="New enterprise only", is_mandatory=True, is_active=True
    )
    result = EligibilityEngine.evaluate_rule(rule, {"business_stage": "new_enterprise"})
    assert result.status == EligibilityStatus.MATCHED
    assert result.user_value == "new_enterprise"


def test_5_incorrect_categorical_value_failed():
    """TEST 5: Incorrect categorical value -> FAILED"""
    rule = SchemeEligibilityRule(
        id=5, rule_code="R5", field_name="business_stage", operator="==", expected_value="new_enterprise",
        description="New enterprise only", is_mandatory=True, is_active=True
    )
    result = EligibilityEngine.evaluate_rule(rule, {"business_stage": "expansion"})
    assert result.status == EligibilityStatus.FAILED
    assert result.user_value == "expansion"


def test_6_missing_categorical_value_unverified():
    """TEST 6: Missing categorical value -> UNVERIFIED"""
    rule = SchemeEligibilityRule(
        id=6, rule_code="R6", field_name="business_stage", operator="==", expected_value="new_enterprise",
        description="New enterprise only", is_mandatory=True, is_active=True
    )
    result = EligibilityEngine.evaluate_rule(rule, {})
    assert result.status == EligibilityStatus.UNVERIFIED
    assert result.user_value is None


def test_7_correct_numeric_upper_bound_matched():
    """TEST 7: Correct numeric upper bound -> MATCHED"""
    rule = SchemeEligibilityRule(
        id=7, rule_code="R7", field_name="annual_income", operator="<=", expected_value=500000,
        description="Max income 5 Lakhs", is_mandatory=True, is_active=True
    )
    result = EligibilityEngine.evaluate_rule(rule, {"annual_income": 450000})
    assert result.status == EligibilityStatus.MATCHED


def test_8_value_exceeding_numeric_upper_bound_failed():
    """TEST 8: Value exceeding numeric upper bound -> FAILED"""
    rule = SchemeEligibilityRule(
        id=8, rule_code="R8", field_name="annual_income", operator="<=", expected_value=500000,
        description="Max income 5 Lakhs", is_mandatory=True, is_active=True
    )
    result = EligibilityEngine.evaluate_rule(rule, {"annual_income": 500001})
    assert result.status == EligibilityStatus.FAILED


def test_9_missing_numeric_value_unverified():
    """TEST 9: Missing numeric value -> UNVERIFIED"""
    rule = SchemeEligibilityRule(
        id=9, rule_code="R9", field_name="annual_income", operator="<=", expected_value=500000,
        description="Max income 5 Lakhs", is_mandatory=True, is_active=True
    )
    result = EligibilityEngine.evaluate_rule(rule, {"annual_income": None})
    assert result.status == EligibilityStatus.UNVERIFIED


def test_10_in_operator_with_matching_value_matched():
    """TEST 10: IN operator with matching value -> MATCHED"""
    rule = SchemeEligibilityRule(
        id=10, rule_code="R10", field_name="category", operator="in", expected_value=["SC", "ST", "OBC"],
        description="Target category", is_mandatory=True, is_active=True
    )
    result = EligibilityEngine.evaluate_rule(rule, {"category": "SC"})
    assert result.status == EligibilityStatus.MATCHED


def test_11_in_operator_with_non_matching_value_failed():
    """TEST 11: IN operator with non-matching value -> FAILED"""
    rule = SchemeEligibilityRule(
        id=11, rule_code="R11", field_name="category", operator="in", expected_value=["SC", "ST", "OBC"],
        description="Target category", is_mandatory=True, is_active=True
    )
    result = EligibilityEngine.evaluate_rule(rule, {"category": "General"})
    assert result.status == EligibilityStatus.FAILED


def test_12_unsupported_operator_unverified():
    """TEST 12: Unsupported operator -> UNVERIFIED"""
    rule = SchemeEligibilityRule(
        id=12, rule_code="R12", field_name="age", operator="CUSTOM_ALGO", expected_value=18,
        description="Custom operator rule", is_mandatory=True, is_active=True
    )
    result = EligibilityEngine.evaluate_rule(rule, {"age": 25})
    assert result.status == EligibilityStatus.UNVERIFIED


def test_13_invalid_input_type_unverified():
    """TEST 13: Invalid input type -> UNVERIFIED"""
    rule = SchemeEligibilityRule(
        id=13, rule_code="R13", field_name="age", operator=">=", expected_value=18,
        description="Min age 18", is_mandatory=True, is_active=True
    )
    result = EligibilityEngine.evaluate_rule(rule, {"age": "twenty_five"})
    assert result.status == EligibilityStatus.UNVERIFIED


# ---------------------------------------------------------------------------
# Scheme-Level & Multi-Criteria Tests (Tests 14 to 18)
# ---------------------------------------------------------------------------

@pytest.fixture
def sample_scheme():
    scheme = Scheme(
        id=101,
        scheme_code="TEST_SCHEME",
        scheme_name="Test Government Scheme",
        short_description="Description",
        nodal_ministry="Ministry",
        target_beneficiaries=["General", "SC", "ST"],
        purpose="Purpose",
        benefits_summary={},
        business_stages=["new_enterprise"],
        sectors=["manufacturing"],
        data_status="VERIFIED",
        is_active=True
    )
    scheme.sources.append(SchemeSource(
        id=201,
        scheme_id=101,
        source_name="Official Gazette 2026",
        source_type="OFFICIAL_GUIDELINE",
        official_url="https://gov.in/guidelines",
        version="1.0"
    ))
    return scheme


def test_14_inactive_rule_not_evaluated(sample_scheme):
    """TEST 14: Inactive rule -> NOT evaluated"""
    active_rule = SchemeEligibilityRule(
        id=1, rule_code="ACTIVE_RULE", field_name="age", operator=">=", expected_value=18,
        description="Active", is_mandatory=True, is_active=True
    )
    inactive_rule = SchemeEligibilityRule(
        id=2, rule_code="INACTIVE_RULE", field_name="annual_income", operator="<=", expected_value=500000,
        description="Inactive", is_mandatory=True, is_active=False
    )
    sample_scheme.eligibility_rules = [active_rule, inactive_rule]

    response = EligibilityEngine.evaluate_scheme(sample_scheme, {"age": 25, "annual_income": 600000})
    assert response.summary.total_rules == 1
    assert len(response.criteria) == 1
    assert response.criteria[0].rule_code == "ACTIVE_RULE"


def test_15_multiple_criteria_all_matched(sample_scheme):
    """TEST 15: Multiple criteria: all matched -> MATCHED"""
    sample_scheme.eligibility_rules = [
        SchemeEligibilityRule(id=1, rule_code="R_AGE", field_name="age", operator=">=", expected_value=18, description="Age", is_mandatory=True, is_active=True),
        SchemeEligibilityRule(id=2, rule_code="R_STAGE", field_name="business_stage", operator="==", expected_value="new_enterprise", description="Stage", is_mandatory=True, is_active=True),
        SchemeEligibilityRule(id=3, rule_code="R_DEF", field_name="is_defaulter", operator="==", expected_value=False, description="Default", is_mandatory=True, is_active=True),
    ]
    profile = {
        "age": 28,
        "business_stage": "new_enterprise",
        "is_defaulter": False
    }
    response = EligibilityEngine.evaluate_scheme(sample_scheme, profile)
    assert response.overall_status == EligibilityStatus.MATCHED
    assert response.summary.matched_count == 3
    assert response.summary.failed_count == 0
    assert response.summary.unverified_count == 0


def test_16_multiple_criteria_one_mandatory_failed(sample_scheme):
    """TEST 16: Multiple criteria: one mandatory failed -> FAILED"""
    sample_scheme.eligibility_rules = [
        SchemeEligibilityRule(id=1, rule_code="R_AGE", field_name="age", operator=">=", expected_value=18, description="Age", is_mandatory=True, is_active=True),
        SchemeEligibilityRule(id=2, rule_code="R_STAGE", field_name="business_stage", operator="==", expected_value="new_enterprise", description="Stage", is_mandatory=True, is_active=True),
    ]
    profile = {
        "age": 16, # FAILS
        "business_stage": "new_enterprise" # MATCHES
    }
    response = EligibilityEngine.evaluate_scheme(sample_scheme, profile)
    assert response.overall_status == EligibilityStatus.FAILED
    assert response.summary.matched_count == 1
    assert response.summary.failed_count == 1


def test_17_multiple_criteria_no_failures_one_required_unverified(sample_scheme):
    """TEST 17: Multiple criteria: no failures but one required unverified -> UNVERIFIED"""
    sample_scheme.eligibility_rules = [
        SchemeEligibilityRule(id=1, rule_code="R_AGE", field_name="age", operator=">=", expected_value=18, description="Age", is_mandatory=True, is_active=True),
        SchemeEligibilityRule(id=2, rule_code="R_INC", field_name="annual_income", operator="<=", expected_value=500000, description="Income", is_mandatory=True, is_active=True),
    ]
    profile = {
        "age": 28,
        "annual_income": None # UNVERIFIED
    }
    response = EligibilityEngine.evaluate_scheme(sample_scheme, profile)
    assert response.overall_status == EligibilityStatus.UNVERIFIED
    assert response.summary.matched_count == 1
    assert response.summary.unverified_count == 1


def test_18_multiple_criteria_all_required_criteria_matched(sample_scheme):
    """TEST 18: Multiple criteria: all required criteria matched (optional unverified) -> MATCHED"""
    sample_scheme.eligibility_rules = [
        SchemeEligibilityRule(id=1, rule_code="MANDATORY_AGE", field_name="age", operator=">=", expected_value=18, description="Age", is_mandatory=True, is_active=True),
        SchemeEligibilityRule(id=2, rule_code="OPTIONAL_RURAL", field_name="area_type", operator="==", expected_value="rural", description="Rural preference", is_mandatory=False, is_active=True),
    ]
    profile = {
        "age": 28,
        "area_type": None # Optional unverified does NOT block overall matched
    }
    response = EligibilityEngine.evaluate_scheme(sample_scheme, profile)
    assert response.overall_status == EligibilityStatus.MATCHED
    assert response.summary.matched_count == 1
    assert response.summary.unverified_count == 1


# ---------------------------------------------------------------------------
# Source Traceability and Boundary Tests
# ---------------------------------------------------------------------------

def test_source_traceability_linkage(sample_scheme):
    rule = SchemeEligibilityRule(
        id=1, rule_code="R_SRC", field_name="age", operator=">=", expected_value=18,
        description="Age", is_mandatory=True, is_active=True, source_id=201, rule_version="2.0"
    )
    sample_scheme.eligibility_rules = [rule]
    response = EligibilityEngine.evaluate_scheme(sample_scheme, {"age": 22})

    crit = response.criteria[0]
    assert crit.source_id == 201
    assert crit.source_name == "Official Gazette 2026"
    assert crit.source_url == "https://gov.in/guidelines"
    assert crit.rule_version == "2.0"


def test_boundary_conditions():
    rule = SchemeEligibilityRule(
        id=1, rule_code="BOUND", field_name="project_cost", operator="<=", expected_value=500000,
        description="Limit", is_mandatory=True, is_active=True
    )
    res_below = EligibilityEngine.evaluate_rule(rule, {"project_cost": 499999})
    assert res_below.status == EligibilityStatus.MATCHED

    res_exact = EligibilityEngine.evaluate_rule(rule, {"project_cost": 500000})
    assert res_exact.status == EligibilityStatus.MATCHED

    res_above = EligibilityEngine.evaluate_rule(rule, {"project_cost": 500001})
    assert res_above.status == EligibilityStatus.FAILED
