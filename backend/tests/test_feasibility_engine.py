"""
Unit Tests for Deterministic Business Feasibility Engine (Step 9)
"""
import pytest
from decimal import Decimal

from app.schemas.feasibility import (
    FeasibilityOutcome,
    FeasibilityInputContext,
    FeasibilityAnalysisResponse,
)
from app.services.feasibility.engine import FeasibilityEngine
from app.models.intelligence import DistrictMSMEEcosystem, MSMECluster


def test_feasibility_favourable_case():
    ctx = FeasibilityInputContext(
        business_name="Priya Organic Spices",
        sector="manufacturing",
        sub_sector="food_processing",
        business_stage="new_enterprise",
        state="Maharashtra",
        district="Pune",
        area_type="rural",
        latitude=18.5204,
        longitude=73.8567,
        project_cost=Decimal("1500000.00"),
        own_contribution=Decimal("300000.00"), # 20% equity
        loan_requirement=Decimal("1200000.00"),
        monthly_income=Decimal("80000.00"), # ~31% DTI
        is_defaulter=False,
    )
    mock_district = DistrictMSMEEcosystem(
        state="Maharashtra",
        district="Pune",
        prominent_sectors=["manufacturing", "services", "agro_allied"],
        industrial_areas_count=14,
        raw_material_availability="HIGH",
        market_connectivity="HIGH",
        source_name="Ministry of MSME",
    )
    mock_cluster = MSMECluster(
        cluster_code="PUNE_AGRO",
        cluster_name="Pune Agro Cluster",
        state="Maharashtra",
        district="Pune",
        sector="manufacturing",
        specialization="Spices & food",
        latitude=18.5204,
        longitude=73.8567,
        raw_material_access="HIGH",
        market_linkage="HIGH",
    )
    setattr(mock_cluster, "distance_km", 4.0)

    res = FeasibilityEngine.evaluate_feasibility(
        context=ctx,
        district_ecosystem=mock_district,
        nearby_clusters=[mock_cluster],
    )

    assert isinstance(res, FeasibilityAnalysisResponse)
    assert res.overall_status == FeasibilityOutcome.FAVOURABLE
    assert len(res.positive_signals) > 0
    assert len(res.recommendations) > 0
    assert len(res.missing_information) == 0
    assert "disclaimer" in res.model_dump()


def test_feasibility_caution_case_low_equity():
    ctx = FeasibilityInputContext(
        business_name="Ajay Auto Repair",
        sector="services",
        business_stage="new_enterprise",
        state="Maharashtra",
        district="Pune",
        project_cost=Decimal("800000.00"),
        own_contribution=Decimal("40000.00"), # 5% equity (marginal)
        monthly_income=Decimal("40000.00"),
        is_defaulter=False,
    )
    res = FeasibilityEngine.evaluate_feasibility(context=ctx)
    assert res.overall_status == FeasibilityOutcome.CAUTION
    assert len(res.risk_signals) > 0 or len(res.missing_information) > 0


def test_feasibility_high_risk_case_defaulter():
    ctx = FeasibilityInputContext(
        business_name="Sunil Trading",
        sector="trading",
        business_stage="new_enterprise",
        state="Maharashtra",
        district="Pune",
        project_cost=Decimal("500000.00"),
        own_contribution=Decimal("100000.00"),
        is_defaulter=True, # Past default flag
    )
    res = FeasibilityEngine.evaluate_feasibility(context=ctx)
    assert res.overall_status == FeasibilityOutcome.HIGH_RISK
    assert any("default" in r.lower() for r in res.risk_signals)


def test_feasibility_insufficient_data_case():
    ctx = FeasibilityInputContext(
        business_name=None,
        sector=None,
        project_cost=None,
        state=None,
        district=None,
    )
    res = FeasibilityEngine.evaluate_feasibility(context=ctx)
    assert res.overall_status == FeasibilityOutcome.INSUFFICIENT_DATA
    assert len(res.missing_information) >= 4


def test_feasibility_deterministic_reproducibility():
    ctx = FeasibilityInputContext(
        business_name="Standard Food Processing",
        sector="manufacturing",
        business_stage="new_enterprise",
        state="Maharashtra",
        district="Pune",
        project_cost=Decimal("1000000.00"),
        own_contribution=Decimal("200000.00"),
        monthly_income=Decimal("50000.00"),
    )
    res1 = FeasibilityEngine.evaluate_feasibility(context=ctx)
    res2 = FeasibilityEngine.evaluate_feasibility(context=ctx)

    assert res1.overall_status == res2.overall_status
    assert res1.positive_signals == res2.positive_signals
    assert res1.risk_signals == res2.risk_signals
    assert res1.missing_information == res2.missing_information
