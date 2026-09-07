"""
Pydantic Schemas and Data Transfer Objects for Explainable Scheme Matching & Ranking Engine
"""
from typing import List, Optional, Dict, Any, Union
from datetime import datetime, timezone
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict

from app.schemas.eligibility import (
    EligibilityStatus,
    EligibilitySummary,
    EntrepreneurProfileInput,
)
from app.schemas.finance import FinancialCalculationRequest


class MatchCategory(str, Enum):
    """
    Authoritative classification of matching recommendation categories.
    """
    ELIGIBLE = "ELIGIBLE"
    POTENTIALLY_RELEVANT = "POTENTIALLY_RELEVANT"
    NOT_ELIGIBLE = "NOT_ELIGIBLE"


class DimensionScore(BaseModel):
    """
    Score contribution and evaluation for a single matching dimension.
    """
    factor: str = Field(..., description="Dimension key (e.g. eligibility, financial_fit, sector_fit, stage_fit, beneficiary_fit, geography_fit)")
    status: EligibilityStatus = Field(..., description="Evaluation outcome: MATCHED, FAILED, or UNVERIFIED")
    weight: float = Field(..., ge=0, le=100, description="Configured maximum points allocated to this dimension")
    score_awarded: float = Field(..., ge=0, le=100, description="Points earned on this dimension based on evaluation status")
    explanation: str = Field(..., description="Deterministic explanation of the factor contribution")

    model_config = ConfigDict(from_attributes=True)


class MatchReasons(BaseModel):
    """
    Explainability container providing structured, human-readable reasons.
    """
    positive: List[str] = Field(default_factory=list, description="Positive alignment factors ('Why this scheme is ranked highly')")
    negative: List[str] = Field(default_factory=list, description="Failed factors or incompatibilities ('Why not currently eligible')")
    unverified: List[str] = Field(default_factory=list, description="Missing applicant profile data or unverified scheme parameters")

    model_config = ConfigDict(from_attributes=True)


class SchemeMatchResult(BaseModel):
    """
    Complete ranked scheme match result with transparent score and explainability reasons.
    """
    rank: int = Field(..., ge=1, description="Deterministic 1-based rank position")
    scheme_id: int = Field(..., description="Scheme database ID")
    scheme_code: str = Field(..., description="Unique scheme identifier code (e.g. 'PMEGP', 'STANDUP_INDIA')")
    scheme_name: str = Field(..., description="Official name of the government scheme")
    nodal_ministry: str = Field(..., description="Nodal ministry administering the scheme")
    match_category: MatchCategory = Field(..., description="Recommendation category: ELIGIBLE, POTENTIALLY_RELEVANT, or NOT_ELIGIBLE")
    match_score: float = Field(..., ge=0, le=100, description="Overall transparent match score (0.0 to 100.0)")
    eligibility_status: EligibilityStatus = Field(..., description="Authoritative Step 4 overall eligibility status")
    reasons: MatchReasons = Field(..., description="Structured positive, negative, and unverified explainability facts")
    score_breakdown: List[DimensionScore] = Field(default_factory=list, description="Factor-by-factor score contribution breakdown")
    eligibility_summary: EligibilitySummary = Field(..., description="Summary of evaluated eligibility criteria")
    financial_summary: Optional[Dict[str, Any]] = Field(None, description="Optional financial assessment details if financial inputs were provided")

    model_config = ConfigDict(from_attributes=True)


class SchemeMatchingRequest(BaseModel):
    """
    API Request payload for evaluating and ranking schemes for an entrepreneur.
    """
    profile: Union[EntrepreneurProfileInput, Dict[str, Any]] = Field(
        ...,
        description="Structured entrepreneur, business, and geographic profile inputs"
    )
    financial: Optional[FinancialCalculationRequest] = Field(
        None,
        description="Optional financial parameters (project cost, own contribution, loan requirement, income)"
    )
    limit: Optional[int] = Field(
        default=10,
        ge=1,
        le=50,
        description="Maximum number of ranked scheme results to return"
    )
    include_ineligible: bool = Field(
        default=True,
        description="Whether to include NOT_ELIGIBLE schemes with failure explanations"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "profile": {
                    "age": 28,
                    "gender": "female",
                    "category": "SC",
                    "state": "Maharashtra",
                    "business_stage": "new_enterprise",
                    "sector": "manufacturing",
                    "area_type": "rural"
                },
                "financial": {
                    "project_cost": 1500000,
                    "own_contribution": 250000,
                    "annual_interest_rate": 9.5,
                    "tenure_months": 60,
                    "monthly_income": 50000
                },
                "limit": 5,
                "include_ineligible": True
            }
        }
    )


class SchemeMatchingResponse(BaseModel):
    """
    Complete explainable scheme matching and ranking response payload.
    """
    total_schemes_evaluated: int = Field(..., description="Total active schemes retrieved and evaluated")
    eligible_count: int = Field(..., description="Count of schemes categorized as ELIGIBLE")
    potentially_relevant_count: int = Field(..., description="Count of schemes categorized as POTENTIALLY_RELEVANT")
    not_eligible_count: int = Field(..., description="Count of schemes categorized as NOT_ELIGIBLE")
    results: List[SchemeMatchResult] = Field(default_factory=list, description="Deterministically ranked scheme shortlist")
    disclaimer: str = Field(
        default="Match Score is a VittMitra relevance/ranking indicator and is not an official government eligibility or loan-approval score.",
        description="Required non-guarantee regulatory disclaimer"
    )
    evaluated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Evaluation timestamp (UTC)"
    )

    model_config = ConfigDict(from_attributes=True)
