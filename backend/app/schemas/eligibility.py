"""
Pydantic Schemas and Data Transfer Objects for Deterministic Eligibility Engine
"""
from typing import List, Optional, Any, Dict, Union
from datetime import datetime, timezone
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict


class EligibilityStatus(str, Enum):
    """Authoritative three-state eligibility outcome."""
    MATCHED = "MATCHED"
    FAILED = "FAILED"
    UNVERIFIED = "UNVERIFIED"


class EntrepreneurProfileInput(BaseModel):
    """
    Structured applicant/enterprise input profile for eligibility evaluation.
    Allows extra arbitrary fields safely for domain extensibility.
    """
    age: Optional[Any] = Field(None, description="Applicant age in completed years")
    gender: Optional[str] = Field(None, description="Applicant gender (e.g. female, male, other)")
    category: Optional[str] = Field(None, description="Social category (e.g. SC, ST, OBC, General, Minorities)")
    social_category: Optional[str] = Field(None, description="Alias for category")
    state: Optional[str] = Field(None, description="Business or applicant state of residence")
    district: Optional[str] = Field(None, description="District location")
    area_type: Optional[str] = Field(None, description="Location area type: urban, rural, peri_urban")
    business_stage: Optional[str] = Field(None, description="Enterprise phase: idea, new_enterprise, expansion")
    business_type: Optional[str] = Field(None, description="Alias for business_stage or business activity")
    sector: Optional[str] = Field(None, description="Industry sector (e.g. manufacturing, services, trading, handicrafts)")
    annual_income: Optional[Any] = Field(None, description="Annual household/applicant income in INR")
    project_cost: Optional[Any] = Field(None, description="Proposed total project or investment cost in INR")
    investment: Optional[Any] = Field(None, description="Alias for project_cost")
    enterprise_size: Optional[str] = Field(None, description="Enterprise classification: micro, small, medium")
    is_greenfield: Optional[Any] = Field(None, description="Whether the enterprise is a first-time/new setup")
    is_defaulter: Optional[Any] = Field(None, description="Whether the applicant has past institutional loan defaults")
    has_vending_proof: Optional[Any] = Field(None, description="Possession of Certificate of Vending or ULB recommendation")
    is_notified_trade: Optional[Any] = Field(None, description="Engagement in one of the notified traditional artisan trades")
    is_single_family_applicant: Optional[Any] = Field(None, description="Whether this is the sole applicant from the family unit")
    has_govt_employee_in_family: Optional[Any] = Field(None, description="Whether any family member is in government service")
    availed_pmegp_mudra_last_5yr: Optional[Any] = Field(None, description="Whether similar central credit was availed in last 5 years")
    is_non_farm_income_generating: Optional[Any] = Field(None, description="Whether activity is non-farm and income-generating")
    education_mfg_above_10lakh: Optional[str] = Field(None, description="Educational qualification for mfg > 10 Lakhs")
    education_srv_above_5lakh: Optional[str] = Field(None, description="Educational qualification for services > 5 Lakhs")

    model_config = ConfigDict(extra="allow")


class EligibilityCheckRequest(BaseModel):
    """API Request Payload for evaluating a scheme against an applicant profile."""
    scheme_id: Union[int, str] = Field(
        ...,
        description="Target government scheme integer database ID (e.g. 1) or unique scheme code (e.g. 'PMEGP', 'MUDRA_PMMY')"
    )
    profile: Union[EntrepreneurProfileInput, Dict[str, Any]] = Field(
        ...,
        description="Structured entrepreneur and enterprise attributes for evaluation"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "scheme_id": "PMEGP",
                "profile": {
                    "age": 27,
                    "gender": "female",
                    "category": "OBC",
                    "business_stage": "new_enterprise",
                    "sector": "manufacturing",
                    "area_type": "rural"
                }
            }
        }
    )


class CriterionResult(BaseModel):
    """Detailed deterministic result for a single evaluated rule/criterion."""
    rule_id: Optional[int] = Field(None, description="Database ID of the evaluated rule")
    rule_code: str = Field(..., description="Authoritative rule identifier code")
    criterion: str = Field(..., description="Target attribute or human-friendly criterion name")
    status: EligibilityStatus = Field(..., description="Rule evaluation outcome: MATCHED, FAILED, or UNVERIFIED")
    user_value: Any = Field(None, description="Evaluated applicant value resolved from profile")
    required_condition: str = Field(..., description="Human-readable condition format (e.g. '>= 18')")
    explanation: str = Field(..., description="Deterministic explanation of why the rule matched, failed, or is unverified")
    is_mandatory: bool = Field(default=True, description="Whether this criterion is mandatory for scheme eligibility")
    source_id: Optional[int] = Field(None, description="ID of the authoritative guideline source")
    source_name: Optional[str] = Field(None, description="Official publisher or scheme guideline title")
    source_url: Optional[str] = Field(None, description="Official government web URL")
    rule_version: str = Field(default="1.0", description="Version of the evaluated rule specification")

    model_config = ConfigDict(from_attributes=True)


class EligibilitySummary(BaseModel):
    """High-level aggregation metrics for the evaluation."""
    total_rules: int = Field(..., description="Total active rules evaluated")
    matched_count: int = Field(..., description="Number of criteria evaluated as MATCHED")
    failed_count: int = Field(..., description="Number of criteria evaluated as FAILED")
    unverified_count: int = Field(..., description="Number of criteria evaluated as UNVERIFIED")


class EligibilityCheckResponse(BaseModel):
    """Complete, explainable, and source-linked response payload for scheme eligibility check."""
    scheme_id: int = Field(..., description="Scheme database ID")
    scheme_code: str = Field(..., description="Unique scheme code (e.g. 'PMEGP')")
    scheme_name: str = Field(..., description="Full official title of the government scheme")
    overall_status: EligibilityStatus = Field(..., description="Aggregated scheme status: MATCHED, FAILED, or UNVERIFIED")
    evaluated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Evaluation timestamp (UTC)")
    summary: EligibilitySummary = Field(..., description="Metric summary of criteria outcomes")
    criteria: List[CriterionResult] = Field(default_factory=list, description="Criterion-by-criterion deterministic evaluation results")

    model_config = ConfigDict(from_attributes=True)
