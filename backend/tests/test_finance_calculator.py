"""
Unit tests for deterministic financial calculator routines (calculator.py)
"""
import pytest
from decimal import Decimal
from app.services.finance.calculator import (
    calculate_financing_gap,
    calculate_emi,
    calculate_repayment_summary,
    calculate_affordability_indicator,
)


# ---------------------------------------------------------------------------
# 1. Financing Gap Tests
# ---------------------------------------------------------------------------

def test_financing_gap_standard():
    """Project cost = 800000, Own contribution = 100000 -> Financing gap = 700000"""
    gap = calculate_financing_gap(Decimal("800000.00"), Decimal("100000.00"))
    assert gap == Decimal("700000.00")


def test_financing_gap_full_equity():
    """Project cost = 800000, Own contribution = 800000 -> Financing gap = 0"""
    gap = calculate_financing_gap(Decimal("800000.00"), Decimal("800000.00"))
    assert gap == Decimal("0.00")


def test_financing_gap_zero_equity():
    """Project cost = 500000, Own contribution = 0 -> Financing gap = 500000"""
    gap = calculate_financing_gap(Decimal("500000.00"), Decimal("0.00"))
    assert gap == Decimal("500000.00")


def test_financing_gap_invalid_negative_project_cost():
    with pytest.raises(ValueError, match="Project cost cannot be negative"):
        calculate_financing_gap(Decimal("-1000.00"), Decimal("100.00"))


def test_financing_gap_invalid_negative_own_contribution():
    with pytest.raises(ValueError, match="Own contribution cannot be negative"):
        calculate_financing_gap(Decimal("100000.00"), Decimal("-5000.00"))


def test_financing_gap_invalid_contribution_exceeds_cost():
    with pytest.raises(ValueError, match="cannot exceed total project cost"):
        calculate_financing_gap(Decimal("500000.00"), Decimal("600000.00"))


# ---------------------------------------------------------------------------
# 2. Reducing-Balance EMI & Repayment Tests
# ---------------------------------------------------------------------------

def test_emi_standard_benchmark():
    """
    Standard Benchmark Test:
    Principal = 7,00,000, Annual Interest Rate = 10.0%, Tenure = 60 months
    Expected Reducing-Balance Monthly EMI = ₹14,872.93
    """
    emi = calculate_emi(
        principal=Decimal("700000.00"),
        annual_interest_rate=Decimal("10.00"),
        tenure_months=60
    )
    assert emi == Decimal("14872.93")


def test_emi_zero_interest():
    """
    Zero-Interest Loan:
    Principal = 6,00,000, Annual Interest Rate = 0.0%, Tenure = 60 months
    Expected EMI = 600000 / 60 = ₹10,000.00
    """
    emi = calculate_emi(
        principal=Decimal("600000.00"),
        annual_interest_rate=Decimal("0.00"),
        tenure_months=60
    )
    assert emi == Decimal("10000.00")


def test_emi_zero_principal():
    """Zero Principal -> EMI = 0.00"""
    emi = calculate_emi(
        principal=Decimal("0.00"),
        annual_interest_rate=Decimal("10.00"),
        tenure_months=60
    )
    assert emi == Decimal("0.00")


def test_emi_invalid_negative_principal():
    with pytest.raises(ValueError, match="Principal cannot be negative"):
        calculate_emi(Decimal("-50000.00"), Decimal("10.00"), 60)


def test_emi_invalid_negative_rate():
    with pytest.raises(ValueError, match="Annual interest rate cannot be negative"):
        calculate_emi(Decimal("500000.00"), Decimal("-1.00"), 60)


def test_emi_invalid_zero_tenure():
    with pytest.raises(ValueError, match="Tenure months must be greater than zero"):
        calculate_emi(Decimal("500000.00"), Decimal("10.00"), 0)


def test_emi_invalid_negative_tenure():
    with pytest.raises(ValueError, match="Tenure months must be greater than zero"):
        calculate_emi(Decimal("500000.00"), Decimal("10.00"), -12)


def test_repayment_summary_totals():
    """
    Verify full repayment schedule math:
    Principal: 700000, Rate: 10%, Tenure: 60 months
    EMI = 14872.93
    Total Repayment = 14872.93 * 60 = 892375.80
    Total Interest = 892375.80 - 700000 = 192375.80
    """
    summary = calculate_repayment_summary(
        principal=Decimal("700000.00"),
        annual_interest_rate=Decimal("10.00"),
        tenure_months=60
    )
    assert summary.principal == Decimal("700000.00")
    assert summary.estimated_emi == Decimal("14872.93")
    assert summary.estimated_total_repayment == Decimal("892375.80")
    assert summary.estimated_total_interest == Decimal("192375.80")
    assert summary.is_zero_interest is False


def test_repayment_summary_zero_interest():
    summary = calculate_repayment_summary(
        principal=Decimal("300000.00"),
        annual_interest_rate=Decimal("0.00"),
        tenure_months=30
    )
    assert summary.estimated_emi == Decimal("10000.00")
    assert summary.estimated_total_repayment == Decimal("300000.00")
    assert summary.estimated_total_interest == Decimal("0.00")
    assert summary.is_zero_interest is True


# ---------------------------------------------------------------------------
# 3. Affordability Indicator Tests
# ---------------------------------------------------------------------------

def test_affordability_with_income():
    affordability = calculate_affordability_indicator(
        estimated_emi=Decimal("14873.18"),
        monthly_income=Decimal("45000.00")
    )
    assert affordability.status == "SUFFICIENT_DATA"
    assert affordability.debt_to_income_pct == Decimal("33.05")
    assert "moderate debt service burden" in affordability.notes


def test_affordability_without_income():
    affordability = calculate_affordability_indicator(
        estimated_emi=Decimal("14873.18"),
        monthly_income=None
    )
    assert affordability.status == "INSUFFICIENT_DATA"
    assert affordability.debt_to_income_pct is None
    assert "cannot be verified" in affordability.notes
