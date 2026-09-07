"""
Pydantic Schemas and DTOs for Business & Location Intelligence + Business Feasibility
"""
from typing import List, Optional, Dict, Any, Union
from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict


class SignalCategory(str, Enum):
    """Categories of explainable business and location signals."""
    LOCATION_SIGNAL = "LOCATION_SIGNAL"
    SECTOR_SIGNAL = "SECTOR_SIGNAL"
    BUSINESS_STAGE_SIGNAL = "BUSINESS_STAGE_SIGNAL"
    FINANCIAL_FEASIBILITY_SIGNAL = "FINANCIAL_FEASIBILITY_SIGNAL"
    MARKET_CONTEXT_SIGNAL = "MARKET_CONTEXT_SIGNAL"
    DATA_COMPLETENESS_SIGNAL = "DATA_COMPLETENESS_SIGNAL"
    RISK_SIGNAL = "RISK_SIGNAL"


class DataConfidenceStatus(str, Enum):
    """Data provenance and confidence level."""
    VERIFIED = "VERIFIED"
    ESTIMATED = "ESTIMATED"
    UNVERIFIED = "UNVERIFIED"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"


class FeasibilityOutcome(str, Enum):
    """Overall feasibility decision-support status."""
    FAVOURABLE = "FAVOURABLE"
    CAUTION = "CAUTION"
    HIGH_RISK = "HIGH_RISK"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"


class BusinessSignal(BaseModel):
    """Individual structured business or location signal."""
    signal_type: SignalCategory
    signal_code: str
    title: str
    status: DataConfidenceStatus
    is_positive: bool = True
    interpretation: str
    explanation: str
    source_name: Optional[str] = None
    source_url: Optional[str] = None
    raw_metric: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)


class FeasibilityInputContext(BaseModel):
    """Structured context attributes for standalone or combined feasibility analysis."""
    entrepreneur_id: Optional[int] = None
    full_name: Optional[str] = None
    business_name: Optional[str] = None
    sector: Optional[str] = None
    sub_sector: Optional[str] = None
    business_stage: Optional[str] = None
    is_greenfield: Optional[bool] = None
    existing_business_vintage_years: Optional[int] = None
    
    # Location
    state: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = None
    area_type: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    # Financial Structure
    project_cost: Optional[Decimal] = None
    own_contribution: Optional[Decimal] = None
    loan_requirement: Optional[Decimal] = None
    monthly_income: Optional[Decimal] = None
    existing_monthly_obligations: Optional[Decimal] = None
    is_defaulter: Optional[bool] = False

    model_config = ConfigDict(from_attributes=True)


class FeasibilityAnalysisRequest(BaseModel):
    """API payload to trigger feasibility analysis."""
    profile_id: Optional[int] = Field(None, description="Optional stored entrepreneur ID")
    context: Optional[FeasibilityInputContext] = Field(None, description="Optional structured input override")


class FeasibilityAnalysisResponse(BaseModel):
    """Comprehensive explainable feasibility analysis response."""
    overall_status: FeasibilityOutcome
    headline: str
    summary_notes: str
    evaluated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    profile_summary: Dict[str, Any] = Field(default_factory=dict)
    signals: List[BusinessSignal] = Field(default_factory=list)
    positive_signals: List[str] = Field(default_factory=list)
    risk_signals: List[str] = Field(default_factory=list)
    missing_information: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    disclaimer: str = Field(
        default="Feasibility analysis is an explainable decision-support indicator and does not guarantee business success, profitability, demand, loan approval, or scheme approval."
    )

    model_config = ConfigDict(from_attributes=True)


class DistrictEcosystemResponse(BaseModel):
    """District-level MSME profile and industrial indicators."""
    id: int
    state: str
    district: str
    state_code: Optional[str] = None
    district_code: Optional[str] = None
    prominent_sectors: List[str] = Field(default_factory=list)
    industrial_areas_count: int = 0
    lead_bank_name: Optional[str] = None
    dic_office_address: Optional[str] = None
    raw_material_availability: str
    market_connectivity: str
    power_infrastructure: str
    labor_availability: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    data_status: str
    source_name: str
    source_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class NearbyClusterResponse(BaseModel):
    """MSME industrial or artisan cluster with proximity metrics."""
    cluster_code: str
    cluster_name: str
    state: str
    district: str
    sector: str
    sub_sector: Optional[str] = None
    specialization: str
    key_products: List[str] = Field(default_factory=list)
    common_facility_centers: List[str] = Field(default_factory=list)
    latitude: float
    longitude: float
    distance_km: Optional[float] = None
    raw_material_access: str
    market_linkage: str
    data_status: str
    source_name: str
    source_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
