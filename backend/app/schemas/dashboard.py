"""
Dashboard Aggregation Schemas & Data Transfer Objects

Provides structured Pydantic models for the integrated entrepreneur dashboard,
orchestrating profile completion, financial overview, location feasibility,
scheme recommendations, application tracking, progress journey, and next actions.
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from pydantic import BaseModel, Field, ConfigDict

from app.schemas.profile import ProfileCompleteness
from app.schemas.feasibility import FeasibilityOutcome
from app.schemas.matching import MatchCategory, EligibilityStatus
from app.schemas.application import ApplicationStatus


class ProfileSummary(BaseModel):
    """Summarized entrepreneur personal and geographic information."""
    id: int
    full_name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    category: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = None
    area_type: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    preferred_language: str = "en"
    completeness: ProfileCompleteness

    model_config = ConfigDict(from_attributes=True)


class BusinessSummary(BaseModel):
    """Summarized enterprise and sector details."""
    id: Optional[int] = None
    business_name: Optional[str] = None
    sector: Optional[str] = None
    sub_sector: Optional[str] = None
    business_stage: Optional[str] = None
    business_type: Optional[str] = None
    is_greenfield: Optional[bool] = None
    existing_business_vintage_years: Optional[int] = None
    location_label: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class FinancialSummary(BaseModel):
    """Summarized financial parameters and structured loan calculations."""
    project_cost: float = Field(0.0, description="Total project investment in INR")
    own_contribution_amount: float = Field(0.0, description="Promoter equity investment in INR")
    own_contribution_percentage: float = Field(0.0, description="Promoter equity share percentage")
    proposed_loan_amount: float = Field(0.0, description="Calculated term loan requirement in INR")
    subsidy_amount: float = Field(0.0, description="Estimated government capital / margin subsidy in INR")
    subsidy_percentage: float = Field(0.0, description="Subsidy percentage of project cost")
    estimated_monthly_emi: float = Field(0.0, description="Estimated monthly repayment EMI in INR")
    interest_rate_applied: float = Field(0.0, description="Annual percentage interest rate applied")
    tenure_months_applied: int = Field(0, description="Repayment tenure in months")
    annual_income: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


class FeasibilitySummary(BaseModel):
    """Location intelligence and business feasibility summary."""
    status: FeasibilityOutcome = Field(..., description="FAVOURABLE, CAUTION, HIGH_RISK, or INSUFFICIENT_DATA")
    status_label: str = Field(..., description="Human-readable status label")
    summary: str = Field(..., description="Concise explainable feasibility verdict")
    district: Optional[str] = None
    state: Optional[str] = None
    total_signals: int = 0
    positive_signals_count: int = 0
    caution_signals_count: int = 0
    high_risk_signals_count: int = 0
    nearby_clusters_count: int = 0
    top_signals: List[Dict[str, Any]] = Field(default_factory=list)
    has_sufficient_data: bool = True

    model_config = ConfigDict(from_attributes=True)


class RecommendedSchemeSummary(BaseModel):
    """Ranked scheme match item for dashboard display."""
    rank: int
    scheme_id: int
    scheme_code: str
    scheme_name: str
    nodal_ministry: str
    match_category: MatchCategory
    match_score: float = Field(..., ge=0.0, le=100.0)
    eligibility_status: EligibilityStatus
    key_benefit: Optional[str] = None
    primary_reason: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    subsidy_display: Optional[str] = None
    max_loan_display: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ApplicationSummary(BaseModel):
    """Active tracked application summary with verified / user-recorded indicators."""
    id: int
    scheme_id: int
    scheme_code: str
    scheme_name: str
    application_reference_number: Optional[str] = None
    current_status: str
    status_display: str
    application_date: Optional[date] = None
    last_updated_at: datetime
    partner_name: Optional[str] = None
    partner_type: Optional[str] = None
    next_recommended_action: Optional[str] = None
    is_user_recorded: bool = True

    model_config = ConfigDict(from_attributes=True)


class JourneyStage(BaseModel):
    """Individual milestone stage in the entrepreneur user journey."""
    stage_id: str
    title: str
    description: str
    is_completed: bool
    is_current: bool
    target_url: str
    completed_at_label: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ProgressJourney(BaseModel):
    """Overall workflow progression across the 8 core VittMitra stages."""
    current_stage_id: str
    current_stage_title: str
    completion_percentage: float = Field(..., ge=0.0, le=100.0)
    stages: List[JourneyStage] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class NextBestAction(BaseModel):
    """Deterministic, state-aware recommendation for the entrepreneur's immediate next step."""
    action_id: str
    priority: int = Field(..., ge=1, le=12, description="1 is highest priority")
    title: str
    description: str
    badge_label: str
    badge_type: str = Field("blue", description="emerald, blue, amber, purple")
    cta_label: str
    target_url: str
    action_category: str = Field(..., description="profile, feasibility, schemes, access, application")

    model_config = ConfigDict(from_attributes=True)


class DashboardResponse(BaseModel):
    """Comprehensive aggregated response for the VittMitra entrepreneur dashboard."""
    has_profile: bool = True
    profile: Optional[ProfileSummary] = None
    business: Optional[BusinessSummary] = None
    financial: Optional[FinancialSummary] = None
    feasibility: Optional[FeasibilitySummary] = None
    recommended_schemes: List[RecommendedSchemeSummary] = Field(default_factory=list)
    active_applications: List[ApplicationSummary] = Field(default_factory=list)
    progress_journey: ProgressJourney
    next_actions: List[NextBestAction] = Field(default_factory=list)
    system_status: Dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(from_attributes=True)
