"""
Pydantic Schemas for Application Assistance and User-Recorded Application Tracking
"""
from typing import List, Optional, Any, Dict
from datetime import datetime, date, timezone
from decimal import Decimal
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.partner import SchemePartnerResponse


class ApplicationStatus(str, Enum):
    """Controlled lifecycle statuses for user application tracking."""
    DRAFT = "DRAFT"
    APPLICATION_STARTED = "APPLICATION_STARTED"
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    ADDITIONAL_INFORMATION_REQUIRED = "ADDITIONAL_INFORMATION_REQUIRED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    COMPLETED = "COMPLETED"
    UNKNOWN = "UNKNOWN"


class StatusSourceType(str, Enum):
    """Provenance indicator for application tracking events."""
    USER_RECORDED = "USER_RECORDED"
    OFFICIAL_INTEGRATION = "OFFICIAL_INTEGRATION"


class ApplicationCreate(BaseModel):
    entrepreneur_id: int
    scheme_id: int
    channel_partner_id: Optional[int] = None
    application_reference_number: Optional[str] = None
    application_date: Optional[date] = None
    initial_status: ApplicationStatus = ApplicationStatus.APPLICATION_STARTED
    status_note: Optional[str] = "Application initiated by applicant"
    target_loan_amount: Optional[Decimal] = None
    target_subsidy_amount: Optional[Decimal] = None
    official_portal_url: Optional[str] = None


class ApplicationUpdate(BaseModel):
    channel_partner_id: Optional[int] = None
    application_reference_number: Optional[str] = None
    target_loan_amount: Optional[Decimal] = None
    target_subsidy_amount: Optional[Decimal] = None
    official_portal_url: Optional[str] = None
    is_active: Optional[bool] = None


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus
    status_note: Optional[str] = None
    source_type: StatusSourceType = StatusSourceType.USER_RECORDED


class ApplicationStatusHistoryResponse(BaseModel):
    id: int
    application_id: int
    status: str
    status_note: Optional[str] = None
    recorded_at: datetime
    source_type: str = "USER_RECORDED"

    model_config = ConfigDict(from_attributes=True)


class ApplicationResponse(BaseModel):
    id: int
    entrepreneur_id: int
    scheme_id: int
    scheme_code: str
    scheme_name: str
    nodal_ministry: str
    channel_partner_id: Optional[int] = None
    partner_name: Optional[str] = None
    partner_type: Optional[str] = None
    application_reference_number: Optional[str] = None
    application_date: date
    current_status: str
    status_explanation: str
    status_note: Optional[str] = None
    target_loan_amount: Optional[Decimal] = None
    target_subsidy_amount: Optional[Decimal] = None
    official_portal_url: Optional[str] = None
    source_type: str = "USER_RECORDED"
    last_updated_at: datetime
    created_at: datetime
    is_active: bool = True
    next_recommended_action: str

    model_config = ConfigDict(from_attributes=True)


class ApplicationDetailResponse(ApplicationResponse):
    status_history: List[ApplicationStatusHistoryResponse] = Field(default_factory=list)
    channel_partner: Optional[SchemePartnerResponse] = None
    disclaimer: str = (
        "Application status shown here is based on information recorded by the user unless verified "
        "through an official integration. Final approval is determined solely by the respective government authority or bank."
    )


class RequiredDocumentChecklistItem(BaseModel):
    document_code: str
    document_name: str
    description: Optional[str] = None
    is_mandatory: bool = True
    issuing_authority: Optional[str] = None
    purpose: Optional[str] = None


class ApplicationAssistanceResponse(BaseModel):
    """Complete pre-application guidance package connecting all prior engine stages."""
    scheme_id: int
    scheme_code: str
    scheme_name: str
    nodal_ministry: str
    short_description: str
    official_portal_url: Optional[str] = None

    # Step 4 Eligibility Snapshot
    eligibility_status: str # MATCHED, FAILED, UNVERIFIED
    eligibility_summary_message: str

    # Step 5 Financial Snapshot
    project_cost: Optional[Decimal] = None
    own_contribution: Optional[Decimal] = None
    loan_requirement: Optional[Decimal] = None
    estimated_monthly_emi: Optional[Decimal] = None
    estimated_subsidy_amount: Optional[Decimal] = None

    # Step 3 Verified Documents
    required_documents: List[RequiredDocumentChecklistItem] = Field(default_factory=list)

    # Step 10 Relevant Channel Partners
    recommended_partners: List[SchemePartnerResponse] = Field(default_factory=list)

    # Guidance Steps & Disclaimer
    application_steps: List[str] = Field(default_factory=list)
    important_prerequisites: List[str] = Field(default_factory=list)
    disclaimer: str = (
        "VittMitra provides guidance and application tracking support. Final eligibility, approval and application status "
        "are determined exclusively by the respective government department, bank, or implementing authority."
    )
