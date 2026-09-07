"""
Unit and Schema Tests for Entrepreneur, BusinessProfile, and FinancialProfile Models
"""
import pytest
from datetime import date
from decimal import Decimal
from pydantic import ValidationError

from app.models.profile import Entrepreneur, BusinessProfile, FinancialProfile
from app.schemas.profile import (
    EntrepreneurCreate,
    EntrepreneurUpdate,
    BusinessProfileCreate,
    FinancialProfileCreate,
    UnifiedProfileCreate,
    ProfileCompleteness,
)
from app.services.profile.service import evaluate_profile_completeness


def test_entrepreneur_create_schema_valid():
    payload = EntrepreneurCreate(
        full_name="Priya Sharma",
        date_of_birth=date(1996, 5, 15),
        age=28,
        gender="female",
        category="OBC",
        state="Maharashtra",
        district="Pune",
        pincode="411001",
        phone_number="9876543210",
    )
    assert payload.full_name == "Priya Sharma"
    assert payload.age == 28
    assert payload.gender == "female"
    assert payload.pincode == "411001"


def test_entrepreneur_schema_pincode_validation_failure():
    with pytest.raises(ValidationError) as exc:
        EntrepreneurCreate(
            full_name="Invalid Pincode User",
            state="Maharashtra",
            pincode="123", # Invalid length
        )
    assert "PIN code must be exactly 6 digits" in str(exc.value)


def test_entrepreneur_schema_phone_validation_failure():
    with pytest.raises(ValidationError) as exc:
        EntrepreneurCreate(
            full_name="Invalid Phone User",
            state="Maharashtra",
            phone_number="12345", # Less than 10 digits
        )
    assert "Phone number must contain at least 10 digits" in str(exc.value)


def test_business_profile_schema_valid():
    payload = BusinessProfileCreate(
        business_name="Sahyadri Agro Processing",
        business_type="proprietorship",
        sector="manufacturing",
        sub_sector="food_processing",
        business_stage="new_enterprise",
        is_greenfield=True,
        has_vending_proof=False,
        is_notified_trade=False,
        is_defaulter=False,
    )
    assert payload.business_name == "Sahyadri Agro Processing"
    assert payload.sector == "manufacturing"
    assert payload.is_greenfield is True
    assert payload.is_defaulter is False


def test_financial_profile_schema_valid():
    payload = FinancialProfileCreate(
        project_cost=Decimal("1500000.00"),
        own_contribution=Decimal("250000.00"),
        loan_requirement=Decimal("1250000.00"),
        monthly_income=Decimal("45000.00"),
        existing_monthly_obligations=Decimal("5000.00"),
        machinery_equipment_cost=Decimal("1000000.00"),
        infrastructure_cost=Decimal("300000.00"),
        working_capital_cost=Decimal("200000.00"),
        other_expenses_cost=Decimal("0.00"),
    )
    assert payload.project_cost == Decimal("1500000.00")
    assert payload.own_contribution == Decimal("250000.00")
    assert payload.machinery_equipment_cost == Decimal("1000000.00")


def test_unified_profile_create_payload():
    payload = UnifiedProfileCreate(
        entrepreneur=EntrepreneurCreate(
            full_name="Sunita Devi",
            age=32,
            gender="female",
            category="SC",
            state="Bihar",
            district="Patna",
            area_type="rural",
        ),
        business=BusinessProfileCreate(
            business_name="Devi Handicrafts",
            sector="handicrafts",
            business_stage="new_enterprise",
            is_greenfield=True,
            is_notified_trade=True,
        ),
        financial=FinancialProfileCreate(
            project_cost=Decimal("300000.00"),
            own_contribution=Decimal("30000.00"),
            monthly_income=Decimal("20000.00"),
        ),
    )
    assert payload.entrepreneur.full_name == "Sunita Devi"
    assert payload.business.sector == "handicrafts"
    assert payload.financial.project_cost == Decimal("300000.00")


def test_evaluate_profile_completeness_all_complete():
    entrepreneur = Entrepreneur(
        id=1,
        full_name="Aarav Patel",
        age=29,
        state="Gujarat",
        district="Ahmedabad",
        area_type="urban",
        preferred_language="en",
    )
    business = BusinessProfile(
        id=1,
        entrepreneur_id=1,
        sector="services",
        business_stage="new_enterprise",
    )
    financial = FinancialProfile(
        id=1,
        entrepreneur_id=1,
        project_cost=Decimal("1000000.00"),
    )

    completeness = evaluate_profile_completeness(entrepreneur, business, financial)
    assert completeness.is_complete is True
    assert completeness.completion_percentage == 100.0
    assert len(completeness.missing_fields) == 0
    assert "personal" in completeness.completed_sections
    assert "business" in completeness.completed_sections
    assert "financial" in completeness.completed_sections


def test_evaluate_profile_completeness_missing_business_and_financial():
    entrepreneur = Entrepreneur(
        id=2,
        full_name="Rahul Verma",
        age=30,
        state="Uttar Pradesh",
        preferred_language="hi",
    )

    completeness = evaluate_profile_completeness(entrepreneur, None, None)
    assert completeness.is_complete is False
    assert completeness.completion_percentage < 100.0
    assert "personal" in completeness.completed_sections
    assert "business" not in completeness.completed_sections
    assert "financial" not in completeness.completed_sections
    assert any("business" in f for f in completeness.missing_fields)
    assert any("financial" in f for f in completeness.missing_fields)


def test_evaluate_profile_completeness_missing_personal_state():
    entrepreneur = Entrepreneur(
        id=3,
        full_name="Kavita Rao",
        age=27,
        state=None, # Missing state
        preferred_language="en",
    )
    business = BusinessProfile(
        id=2,
        entrepreneur_id=3,
        sector="manufacturing",
        business_stage="new_enterprise",
    )
    financial = FinancialProfile(
        id=2,
        entrepreneur_id=3,
        project_cost=Decimal("500000.00"),
    )

    completeness = evaluate_profile_completeness(entrepreneur, business, financial)
    assert completeness.is_complete is False
    assert "personal.state" in completeness.missing_fields
    assert "personal" not in completeness.completed_sections
    assert "business" in completeness.completed_sections
    assert "financial" in completeness.completed_sections
