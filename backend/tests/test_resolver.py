"""
Unit tests for field resolver and profile normalizer (resolver.py)
"""
import pytest
from app.schemas.eligibility import EntrepreneurProfileInput
from app.services.eligibility.resolver import resolve_field_value


def test_resolve_direct_key_dict():
    profile = {"age": 27, "gender": "female", "annual_income": 350000}
    assert resolve_field_value("age", profile) == 27
    assert resolve_field_value("gender", profile) == "female"
    assert resolve_field_value("annual_income", profile) == 350000


def test_resolve_with_pydantic_model():
    profile = EntrepreneurProfileInput(
        age=27,
        gender="female",
        category="SC",
        business_stage="new_enterprise",
        is_greenfield=True
    )
    assert resolve_field_value("age", profile) == 27
    assert resolve_field_value("category", profile) == "SC"
    assert resolve_field_value("social_category", profile) == "SC"
    assert resolve_field_value("is_greenfield", profile) is True


def test_resolve_aliases():
    profile = {
        "income": 400000,
        "investment": 1500000,
        "location": "rural",
        "business_type": "new_enterprise"
    }
    assert resolve_field_value("annual_income", profile) == 400000
    assert resolve_field_value("project_cost", profile) == 1500000
    assert resolve_field_value("area_type", profile) == "rural"
    assert resolve_field_value("business_stage", profile) == "new_enterprise"


def test_resolve_compound_field_category_or_gender():
    profile_both = {"category": "SC", "gender": "male"}
    res = resolve_field_value("category_or_gender", profile_both)
    assert "SC" in res
    assert "male" in res

    profile_gender_only = {"gender": "female"}
    res_gen = resolve_field_value("category_or_gender", profile_gender_only)
    assert res_gen == ["female"]

    profile_empty = {}
    assert resolve_field_value("category_or_gender", profile_empty) is None


def test_resolve_missing_and_empty_values():
    profile = {
        "age": None,
        "state": "",
        "sector": "   "
    }
    assert resolve_field_value("age", profile) is None
    assert resolve_field_value("state", profile) is None
    assert resolve_field_value("sector", profile) is None
    assert resolve_field_value("non_existent_field", profile) is None


def test_resolve_case_insensitivity():
    profile = {"AGE": 30, "Social_Category": "OBC"}
    assert resolve_field_value("age", profile) == 30
    assert resolve_field_value("category", profile) == "OBC"
