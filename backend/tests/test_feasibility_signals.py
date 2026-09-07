"""
Unit Tests for Deterministic Business & Location Signal Generator (Step 9)
"""
import pytest
from decimal import Decimal

from app.schemas.feasibility import (
    SignalCategory,
    DataConfidenceStatus,
    FeasibilityInputContext,
)
from app.services.feasibility.signals import SignalGenerator, haversine_distance_km
from app.models.intelligence import DistrictMSMEEcosystem, MSMECluster


def test_haversine_distance_calculation():
    # Distance between Pune (18.5204, 73.8567) and Mumbai (19.0760, 72.8777) is approx 120-130 km
    dist = haversine_distance_km(18.5204, 73.8567, 19.0760, 72.8777)
    assert 115.0 <= dist <= 135.0
    # Same point distance is 0.0
    assert haversine_distance_km(18.5204, 73.8567, 18.5204, 73.8567) == 0.0


def test_location_signal_missing_location():
    ctx = FeasibilityInputContext(state=None, district=None)
    signals = SignalGenerator.generate_location_signals(ctx)
    assert len(signals) == 1
    assert signals[0].signal_code == "LOC_MISSING_DISTRICT"
    assert signals[0].status == DataConfidenceStatus.INSUFFICIENT_DATA
    assert signals[0].is_positive is False


def test_location_signal_verified_district_and_cluster():
    ctx = FeasibilityInputContext(
        state="Maharashtra",
        district="Pune",
        sector="manufacturing",
        latitude=18.5204,
        longitude=73.8567,
    )
    mock_district = DistrictMSMEEcosystem(
        state="Maharashtra",
        district="Pune",
        prominent_sectors=["manufacturing", "services"],
        industrial_areas_count=14,
        raw_material_availability="HIGH",
        market_connectivity="HIGH",
        source_name="Ministry of MSME",
    )
    mock_cluster = MSMECluster(
        cluster_code="PUNE_FOOD",
        cluster_name="Pune Food Cluster",
        state="Maharashtra",
        district="Pune",
        sector="manufacturing",
        specialization="Agro food",
        latitude=18.5204,
        longitude=73.8567,
        raw_material_access="HIGH",
        market_linkage="HIGH",
    )
    setattr(mock_cluster, "distance_km", 2.5)

    signals = SignalGenerator.generate_location_signals(
        context=ctx,
        district_ecosystem=mock_district,
        nearby_clusters=[mock_cluster],
    )
    assert len(signals) >= 2
    codes = [s.signal_code for s in signals]
    assert "LOC_DISTRICT_SECTOR_ALIGNED" in codes
    assert "LOC_CLUSTER_PROXIMITY" in codes
    assert all(s.is_positive for s in signals)


def test_sector_signals():
    # Manufacturing
    ctx_mfg = FeasibilityInputContext(sector="manufacturing", sub_sector="food_processing")
    signals_mfg = SignalGenerator.generate_sector_signals(ctx_mfg)
    assert signals_mfg[0].signal_code == "SEC_MANUFACTURING_CONTEXT"
    assert signals_mfg[0].is_positive is True

    # Handicrafts
    ctx_craft = FeasibilityInputContext(sector="handicrafts")
    signals_craft = SignalGenerator.generate_sector_signals(ctx_craft)
    assert signals_craft[0].signal_code == "SEC_HANDICRAFTS_CONTEXT"

    # Missing sector
    ctx_empty = FeasibilityInputContext(sector=None)
    signals_empty = SignalGenerator.generate_sector_signals(ctx_empty)
    assert signals_empty[0].signal_code == "SEC_MISSING"
    assert signals_empty[0].status == DataConfidenceStatus.INSUFFICIENT_DATA


def test_stage_signals():
    # Greenfield
    ctx_gf = FeasibilityInputContext(business_stage="new_enterprise")
    sig_gf = SignalGenerator.generate_stage_signals(ctx_gf)
    assert sig_gf[0].signal_code == "STAGE_GREENFIELD_READY"
    assert sig_gf[0].is_positive is True

    # Idea
    ctx_idea = FeasibilityInputContext(business_stage="idea")
    sig_idea = SignalGenerator.generate_stage_signals(ctx_idea)
    assert sig_idea[0].signal_code == "STAGE_IDEA_CAUTION"
    assert sig_idea[0].is_positive is False


def test_financial_signals_equity_and_affordability():
    # Healthy equity (20%) and healthy DTI (₹26k EMI on ₹100k income = 26% DTI)
    ctx_healthy = FeasibilityInputContext(
        project_cost=Decimal("1500000.00"),
        own_contribution=Decimal("300000.00"),
        loan_requirement=Decimal("1200000.00"),
        monthly_income=Decimal("100000.00"),
    )
    sig_healthy = SignalGenerator.generate_financial_signals(ctx_healthy)
    codes = [s.signal_code for s in sig_healthy]
    assert "FIN_HEALTHY_EQUITY" in codes
    assert "FIN_DTI_HEALTHY" in codes

    # Low equity (3%) and high DTI (₹30k income, ₹26k EMI = 87% DTI)
    ctx_risk = FeasibilityInputContext(
        project_cost=Decimal("1500000.00"),
        own_contribution=Decimal("45000.00"),
        monthly_income=Decimal("30000.00"),
    )
    sig_risk = SignalGenerator.generate_financial_signals(ctx_risk)
    risk_codes = [s.signal_code for s in sig_risk]
    assert "FIN_LOW_EQUITY_RISK" in risk_codes
    assert "FIN_DTI_HIGH_RISK" in risk_codes


def test_risk_signals_defaulter():
    ctx_defaulter = FeasibilityInputContext(is_defaulter=True)
    sig_def = SignalGenerator.generate_risk_signals(ctx_defaulter)
    assert len(sig_def) == 1
    assert sig_def[0].signal_code == "RISK_PAST_DEFAULT"
    assert sig_def[0].is_positive is False


def test_completeness_signals():
    # Complete
    ctx_complete = FeasibilityInputContext(
        sector="manufacturing",
        business_stage="new_enterprise",
        state="Maharashtra",
        district="Pune",
        project_cost=Decimal("1000000.00"),
        monthly_income=Decimal("50000.00"),
    )
    sig_comp, missing = SignalGenerator.generate_completeness_signals(ctx_complete)
    assert len(missing) == 0
    assert sig_comp[0].signal_code == "COMPLETENESS_HIGH"

    # Incomplete
    ctx_inc = FeasibilityInputContext(sector="services")
    sig_inc, missing_inc = SignalGenerator.generate_completeness_signals(ctx_inc)
    assert len(missing_inc) >= 4
    assert sig_inc[0].signal_code == "COMPLETENESS_LOW"
