"""
Unit tests for deterministic rule operators (operators.py)
"""
import pytest
from app.schemas.eligibility import EligibilityStatus
from app.services.eligibility.operators import (
    evaluate_operator,
    format_required_condition,
    _safe_to_number,
    _safe_to_bool,
    _safe_to_str,
)


# ---------------------------------------------------------------------------
# 1. Numeric Comparison Tests (>=, >, <=, <)
# ---------------------------------------------------------------------------

def test_operator_gte():
    status, cond = evaluate_operator(">=", 27, 18)
    assert status == EligibilityStatus.MATCHED
    assert cond == ">= 18"

    status, _ = evaluate_operator(">=", 18, 18)
    assert status == EligibilityStatus.MATCHED

    status, _ = evaluate_operator(">=", 17, 18)
    assert status == EligibilityStatus.FAILED

    status, _ = evaluate_operator(">=", "25", 18)
    assert status == EligibilityStatus.MATCHED

    status, _ = evaluate_operator(">=", "invalid_number", 18)
    assert status == EligibilityStatus.UNVERIFIED

    status, _ = evaluate_operator(">=", None, 18)
    assert status == EligibilityStatus.UNVERIFIED


def test_operator_gt():
    status, _ = evaluate_operator(">", 19, 18)
    assert status == EligibilityStatus.MATCHED

    status, _ = evaluate_operator(">", 18, 18)
    assert status == EligibilityStatus.FAILED

    status, _ = evaluate_operator(">", 17, 18)
    assert status == EligibilityStatus.FAILED


def test_operator_lte():
    status, _ = evaluate_operator("<=", 499999, 500000)
    assert status == EligibilityStatus.MATCHED

    status, _ = evaluate_operator("<=", 500000, 500000)
    assert status == EligibilityStatus.MATCHED

    status, _ = evaluate_operator("<=", 500001, 500000)
    assert status == EligibilityStatus.FAILED

    status, _ = evaluate_operator("<=", None, 500000)
    assert status == EligibilityStatus.UNVERIFIED


def test_operator_lt():
    status, _ = evaluate_operator("<", 499999, 500000)
    assert status == EligibilityStatus.MATCHED

    status, _ = evaluate_operator("<", 500000, 500000)
    assert status == EligibilityStatus.FAILED


# ---------------------------------------------------------------------------
# 2. Equality and Inequality Tests (==, !=)
# ---------------------------------------------------------------------------

def test_operator_eq_strings():
    status, _ = evaluate_operator("==", "new_enterprise", "new_enterprise")
    assert status == EligibilityStatus.MATCHED

    status, _ = evaluate_operator("==", "NEW_ENTERPRISE", "new_enterprise")
    assert status == EligibilityStatus.MATCHED

    status, _ = evaluate_operator("==", "expansion", "new_enterprise")
    assert status == EligibilityStatus.FAILED

    status, _ = evaluate_operator("==", None, "new_enterprise")
    assert status == EligibilityStatus.UNVERIFIED


def test_operator_eq_booleans():
    status, _ = evaluate_operator("==", False, False)
    assert status == EligibilityStatus.MATCHED

    status, _ = evaluate_operator("==", True, False)
    assert status == EligibilityStatus.FAILED

    status, _ = evaluate_operator("==", "false", False)
    assert status == EligibilityStatus.MATCHED

    status, _ = evaluate_operator("==", "invalid", False)
    assert status == EligibilityStatus.UNVERIFIED


def test_operator_ne():
    status, _ = evaluate_operator("!=", "General", "SC")
    assert status == EligibilityStatus.MATCHED

    status, _ = evaluate_operator("!=", "SC", "SC")
    assert status == EligibilityStatus.FAILED

    status, _ = evaluate_operator("!=", None, "SC")
    assert status == EligibilityStatus.UNVERIFIED


# ---------------------------------------------------------------------------
# 3. Membership Tests (IN, NOT_IN)
# ---------------------------------------------------------------------------

def test_operator_in_scalar():
    allowed = ["SC", "ST", "female"]
    status, _ = evaluate_operator("in", "SC", allowed)
    assert status == EligibilityStatus.MATCHED

    status, _ = evaluate_operator("in", "female", allowed)
    assert status == EligibilityStatus.MATCHED

    status, _ = evaluate_operator("in", "General", allowed)
    assert status == EligibilityStatus.FAILED

    status, _ = evaluate_operator("in", None, allowed)
    assert status == EligibilityStatus.UNVERIFIED


def test_operator_in_list_intersection():
    allowed = ["SC", "ST", "female"]
    # User provides list of attributes (e.g. category and gender compound)
    status, _ = evaluate_operator("in", ["OBC", "female"], allowed)
    assert status == EligibilityStatus.MATCHED

    status, _ = evaluate_operator("in", ["General", "male"], allowed)
    assert status == EligibilityStatus.FAILED


def test_operator_not_in():
    restricted = ["Tier-1", "Metropolitan"]
    status, _ = evaluate_operator("not_in", "Rural", restricted)
    assert status == EligibilityStatus.MATCHED

    status, _ = evaluate_operator("not_in", "Tier-1", restricted)
    assert status == EligibilityStatus.FAILED

    status, _ = evaluate_operator("not_in", None, restricted)
    assert status == EligibilityStatus.UNVERIFIED


# ---------------------------------------------------------------------------
# 4. Containment Tests (CONTAINS, NOT_CONTAINS)
# ---------------------------------------------------------------------------

def test_operator_contains():
    user_sectors = ["manufacturing", "services"]
    status, _ = evaluate_operator("contains", user_sectors, "manufacturing")
    assert status == EligibilityStatus.MATCHED

    status, _ = evaluate_operator("contains", user_sectors, "trading")
    assert status == EligibilityStatus.FAILED

    status, _ = evaluate_operator("contains", "Uttar Pradesh", "Pradesh")
    assert status == EligibilityStatus.MATCHED

    status, _ = evaluate_operator("contains", None, "Pradesh")
    assert status == EligibilityStatus.UNVERIFIED


def test_operator_not_contains():
    user_sectors = ["services", "trading"]
    status, _ = evaluate_operator("not_contains", user_sectors, "hazardous_chemical")
    assert status == EligibilityStatus.MATCHED

    status, _ = evaluate_operator("not_contains", ["hazardous_chemical"], "hazardous_chemical")
    assert status == EligibilityStatus.FAILED


# ---------------------------------------------------------------------------
# 5. Unsupported Operators and Safe Parsing
# ---------------------------------------------------------------------------

def test_unsupported_operator_returns_unverified():
    status, _ = evaluate_operator("REGEXP_MATCH", "abc", "^a.*")
    assert status == EligibilityStatus.UNVERIFIED

    status, _ = evaluate_operator("FUZZY_SIMILARITY", 100, 100)
    assert status == EligibilityStatus.UNVERIFIED


def test_format_required_condition():
    assert format_required_condition(">=", 18) == ">= 18"
    assert format_required_condition("==", "new_enterprise") == "== new_enterprise"
    assert format_required_condition("in", ["SC", "ST"]) == "in ['SC', 'ST']"
