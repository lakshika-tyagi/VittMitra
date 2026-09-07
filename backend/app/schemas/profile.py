"""
Pydantic Schemas for Entrepreneur Onboarding, Business Profiles, Financial Inputs, and Completeness Tracking
"""
from typing import List, Optional, Dict, Any
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, Field, EmailStr, ConfigDict, field_validator


# ==============================================================================
# Completeness Schema
# ==============================================================================

class ProfileCompleteness(BaseModel):
    is_complete: bool = Field(..., description="Whether all core required fields across sections are filled")
    completion_percentage: float = Field(..., description="Percentage of required profile fields completed (0.0 to 100.0)")
    missing_fields: List[str] = Field(default_factory=list, description="List of required fields missing values")
    completed_sections: List[str] = Field(default_factory=list, description="Sections with all required fields satisfied")
    section_breakdown: Dict[str, Dict[str, Any]] = Field(
        default_factory=dict,
        description="Detailed breakdown of completeness per section (personal, business, financial)"
    )

    model_config = ConfigDict(from_attributes=True)


# ==============================================================================
# Entrepreneur Schemas
# ==============================================================================

class EntrepreneurBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255, description="Full name of the entrepreneur")
    date_of_birth: Optional[date] = Field(None, description="Date of birth")
    age: Optional[int] = Field(None, ge=18, le=120, description="Applicant age in years")
    gender: Optional[str] = Field(None, description="male, female, other, prefer_not_to_say")
    category: Optional[str] = Field(None, description="Social category: General, SC, ST, OBC, Minorities")
    preferred_language: str = Field(default="en", description="Preferred UI/Notification language (e.g. en, hi)")
    phone_number: Optional[str] = Field(None, description="10-digit Indian mobile number")
    email: Optional[str] = Field(None, description="Contact email address")
    
    # Location
    state: Optional[str] = Field(None, description="State or Union Territory name")
    district: Optional[str] = Field(None, description="District name")
    city: Optional[str] = Field(None, description="City / Town / Village name")
    pincode: Optional[str] = Field(None, description="6-digit PIN code")
    area_type: Optional[str] = Field(None, description="urban, rural, peri_urban")
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0, description="Geographic latitude")
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0, description="Geographic longitude")

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            cleaned = "".join(filter(str.isdigit, v))
            if len(cleaned) < 10:
                raise ValueError("Phone number must contain at least 10 digits")
        return v

    @field_validator("pincode")
    @classmethod
    def validate_pincode(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            cleaned = "".join(filter(str.isdigit, v))
            if len(cleaned) != 6:
                raise ValueError("PIN code must be exactly 6 digits")
        return v


class EntrepreneurCreate(EntrepreneurBase):
    pass


class EntrepreneurUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    date_of_birth: Optional[date] = None
    age: Optional[int] = Field(None, ge=18, le=120)
    gender: Optional[str] = None
    category: Optional[str] = None
    preferred_language: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = None
    area_type: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    is_active: Optional[bool] = None


class EntrepreneurResponse(EntrepreneurBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==============================================================================
# Business Profile Schemas
# ==============================================================================

class BusinessProfileBase(BaseModel):
    business_name: Optional[str] = Field(None, max_length=255, description="Registered or trade name of enterprise")
    business_type: Optional[str] = Field(None, description="proprietorship, partnership, self_employed, pvt_ltd")
    sector: Optional[str] = Field(None, description="manufacturing, services, trading, handicrafts, agro_allied, street_vendor")
    sub_sector: Optional[str] = Field(None, description="Specific trade, e.g. food_processing, textiles, garment_shop")
    business_stage: Optional[str] = Field(None, description="idea, new_enterprise, existing_business, expansion")
    business_description: Optional[str] = Field(None, description="Summary of business activities")
    existing_business_vintage_years: Optional[int] = Field(None, ge=0, le=100, description="Years in operational business")
    
    # Specific scheme qualification flags
    is_greenfield: Optional[bool] = Field(None, description="Whether enterprise is a new greenfield project")
    has_vending_proof: Optional[bool] = Field(None, description="PM SVANidhi: Certificate of Vending / ID Card")
    is_notified_trade: Optional[bool] = Field(None, description="PM Vishwakarma: Belongs to one of 18 notified artisan trades")
    is_single_family_applicant: Optional[bool] = Field(None, description="Single applicant per family unit check")
    has_govt_employee_in_family: Optional[bool] = Field(None, description="Whether applicant family has government employee")
    availed_pmegp_mudra_last_5yr: Optional[bool] = Field(None, description="Whether credit availed under similar central schemes in last 5 years")
    is_non_farm_income_generating: Optional[bool] = Field(None, description="MUDRA: Non-farm income generating micro-enterprise")
    is_defaulter: Optional[bool] = Field(False, description="Whether flagged as defaulter with any financial institution")


class BusinessProfileCreate(BusinessProfileBase):
    pass


class BusinessProfileUpdate(BaseModel):
    business_name: Optional[str] = None
    business_type: Optional[str] = None
    sector: Optional[str] = None
    sub_sector: Optional[str] = None
    business_stage: Optional[str] = None
    business_description: Optional[str] = None
    existing_business_vintage_years: Optional[int] = Field(None, ge=0, le=100)
    is_greenfield: Optional[bool] = None
    has_vending_proof: Optional[bool] = None
    is_notified_trade: Optional[bool] = None
    is_single_family_applicant: Optional[bool] = None
    has_govt_employee_in_family: Optional[bool] = None
    availed_pmegp_mudra_last_5yr: Optional[bool] = None
    is_non_farm_income_generating: Optional[bool] = None
    is_defaulter: Optional[bool] = None


class BusinessProfileResponse(BusinessProfileBase):
    id: int
    entrepreneur_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==============================================================================
# Financial Profile Schemas
# ==============================================================================

class FinancialProfileBase(BaseModel):
    project_cost: Optional[Decimal] = Field(None, ge=0, description="Total estimated capital/project investment")
    own_contribution: Optional[Decimal] = Field(Decimal("0.00"), ge=0, description="Promoter equity / own fund contribution")
    loan_requirement: Optional[Decimal] = Field(None, ge=0, description="Desired loan assistance amount")
    annual_income: Optional[Decimal] = Field(None, ge=0, description="Total annual household or business income")
    monthly_income: Optional[Decimal] = Field(None, ge=0, description="Average net monthly income")
    existing_monthly_obligations: Optional[Decimal] = Field(Decimal("0.00"), ge=0, description="Current monthly loan/debt repayments")
    
    # Itemized cost breakdown
    machinery_equipment_cost: Optional[Decimal] = Field(None, ge=0, description="Cost of plant and machinery / equipment")
    infrastructure_cost: Optional[Decimal] = Field(None, ge=0, description="Shed, building, or renovation cost")
    working_capital_cost: Optional[Decimal] = Field(None, ge=0, description="Raw materials, inventory, and operational cash")
    other_expenses_cost: Optional[Decimal] = Field(None, ge=0, description="Contingencies, licenses, or pre-operative expenses")


class FinancialProfileCreate(FinancialProfileBase):
    business_profile_id: Optional[int] = Field(None, description="Optional associated business profile ID")


class FinancialProfileUpdate(BaseModel):
    business_profile_id: Optional[int] = None
    project_cost: Optional[Decimal] = Field(None, ge=0)
    own_contribution: Optional[Decimal] = Field(None, ge=0)
    loan_requirement: Optional[Decimal] = Field(None, ge=0)
    annual_income: Optional[Decimal] = Field(None, ge=0)
    monthly_income: Optional[Decimal] = Field(None, ge=0)
    existing_monthly_obligations: Optional[Decimal] = Field(None, ge=0)
    machinery_equipment_cost: Optional[Decimal] = Field(None, ge=0)
    infrastructure_cost: Optional[Decimal] = Field(None, ge=0)
    working_capital_cost: Optional[Decimal] = Field(None, ge=0)
    other_expenses_cost: Optional[Decimal] = Field(None, ge=0)


class FinancialProfileResponse(FinancialProfileBase):
    id: int
    entrepreneur_id: int
    business_profile_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==============================================================================
# Unified / Combined Schemas
# ==============================================================================

class UnifiedProfileCreate(BaseModel):
    """
    Convenience payload allowing atomic creation of entrepreneur personal info,
    business profile, and financial inputs in a single multi-step onboarding submission.
    """
    entrepreneur: EntrepreneurCreate
    business: Optional[BusinessProfileCreate] = None
    financial: Optional[FinancialProfileCreate] = None


class UnifiedProfileResponse(BaseModel):
    """
    Comprehensive aggregated profile view with nested business/financial profiles
    and computed completeness status.
    """
    entrepreneur: EntrepreneurResponse
    business_profiles: List[BusinessProfileResponse] = Field(default_factory=list)
    financial_profiles: List[FinancialProfileResponse] = Field(default_factory=list)
    completeness: ProfileCompleteness

    model_config = ConfigDict(from_attributes=True)
