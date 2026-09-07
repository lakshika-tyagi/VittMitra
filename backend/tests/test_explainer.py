"""
Unit tests for deterministic explanation generator (explainer.py)
"""
import pytest
from app.schemas.eligibility import EligibilityStatus
from app.services.eligibility.explainer import generate_criterion_explanation


def test_explainer_matched():
    exp = generate_criterion_explanation(
        field_name="age",
        operator=">=",
        expected_value=18,
        user_value=27,
        status=EligibilityStatus.MATCHED
    )
    assert "Applicant age is 27" in exp
    assert "meets required minimum of >= 18" in exp


def test_explainer_failed():
    exp = generate_criterion_explanation(
        field_name="age",
        operator=">=",
        expected_value=18,
        user_value=17,
        status=EligibilityStatus.FAILED
    )
    assert "Applicant age is 17" in exp
    assert "fails to meet required minimum of >= 18" in exp


def test_explainer_unverified_missing():
    exp = generate_criterion_explanation(
        field_name="age",
        operator=">=",
        expected_value=18,
        user_value=None,
        status=EligibilityStatus.UNVERIFIED
    )
    assert "Age was not provided" in exp
    assert "cannot verify required condition" in exp


def test_explainer_in_operator():
    exp_matched = generate_criterion_explanation(
        field_name="category",
        operator="in",
        expected_value=["SC", "ST", "OBC"],
        user_value="SC",
        status=EligibilityStatus.MATCHED
    )
    assert "is included in eligible group" in exp_matched

    exp_failed = generate_criterion_explanation(
        field_name="category",
        operator="in",
        expected_value=["SC", "ST", "OBC"],
        user_value="General",
        status=EligibilityStatus.FAILED
    )
    assert "is not among eligible group" in exp_failed
