"""
Pydantic Schemas for Government Scheme Knowledge Data & API Contracts
"""
from typing import List, Optional, Any, Dict
from datetime import datetime
from pydantic import BaseModel, Field, HttpUrl, ConfigDict

class SchemeSourceSchema(BaseModel):
    id: Optional[int] = None
    source_name: str = Field(..., min_length=2, description="Authoritative publisher or agency name")
    source_type: str = Field(..., description="Source type: OFFICIAL_WEBSITE, OFFICIAL_GUIDELINE, OFFICIAL_PORTAL")
    official_url: str = Field(..., description="Official accessible URL")
    document_reference: Optional[str] = Field(None, description="Official gazette, guideline number or circular title")
    publication_date: Optional[str] = Field(None, description="Publication date string")
    last_verified_at: datetime = Field(..., description="UTC verification timestamp")
    version: str = Field(default="1.0", description="Source document version")
    notes: Optional[str] = Field(None, description="Contextual verification notes")
    is_active: bool = Field(default=True)

    model_config = ConfigDict(from_attributes=True)


class SchemeEligibilityRuleSchema(BaseModel):
    id: Optional[int] = None
    rule_code: str = Field(..., description="Machine-readable rule identifier")
    field_name: str = Field(..., description="Target profile/business field (e.g. age, social_category, sector)")
    operator: str = Field(..., description="Evaluation operator: >=, <=, ==, in, not_in, contains")
    expected_value: Any = Field(..., description="Expected rule threshold or allowed set")
    description: str = Field(..., min_length=5, description="Plain English explainable description")
    source_id: Optional[int] = None
    rule_version: str = Field(default="1.0")
    is_mandatory: bool = Field(default=True, description="Whether this criterion is mandatory for overall eligibility")
    is_active: bool = Field(default=True)

    model_config = ConfigDict(from_attributes=True)


class SchemeDocumentSchema(BaseModel):
    id: Optional[int] = None
    document_code: str = Field(..., description="Standard document identifier code")
    document_name: str = Field(..., min_length=2, description="Display name of required document")
    description: Optional[str] = Field(None, description="Guidance notes for the applicant")
    is_mandatory: bool = Field(default=True)
    source_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class SchemeDetailResponse(BaseModel):
    id: int
    scheme_code: str = Field(..., description="Unique scheme identifier code")
    scheme_name: str = Field(..., description="Official full scheme name")
    short_description: str
    nodal_ministry: str
    nodal_department: Optional[str] = None
    geography_level: str
    target_beneficiaries: List[str]
    purpose: str
    benefits_summary: Dict[str, Any]
    business_stages: List[str]
    sectors: List[str]
    data_status: str = Field(..., description="VERIFIED, ESTIMATED, or UNVERIFIED")
    is_active: bool
    created_at: datetime
    updated_at: datetime

    sources: List[SchemeSourceSchema] = Field(default_factory=list)
    eligibility_rules: List[SchemeEligibilityRuleSchema] = Field(default_factory=list)
    documents: List[SchemeDocumentSchema] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class SchemeListResponse(BaseModel):
    id: int
    scheme_code: str
    scheme_name: str
    short_description: str
    nodal_ministry: str
    geography_level: str
    target_beneficiaries: List[str]
    sectors: List[str]
    data_status: str
    is_active: bool
    last_verified_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class SchemeSeedPayload(BaseModel):
    """Schema used strictly for validating JSON seed data files before database insertion."""
    scheme_code: str
    scheme_name: str
    short_description: str
    nodal_ministry: str
    nodal_department: Optional[str] = None
    geography_level: str = "NATIONAL"
    target_beneficiaries: List[str]
    purpose: str
    benefits_summary: Dict[str, Any]
    business_stages: List[str]
    sectors: List[str]
    data_status: str = "VERIFIED"
    is_active: bool = True
    sources: List[SchemeSourceSchema]
    eligibility_rules: List[SchemeEligibilityRuleSchema]
    documents: List[SchemeDocumentSchema]
