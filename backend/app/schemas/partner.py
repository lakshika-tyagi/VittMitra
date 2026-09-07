"""
Pydantic Schemas for Channel Partner Access and Discovery
"""
from typing import List, Optional, Any, Dict
from datetime import datetime
from decimal import Decimal
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict


class PartnerType(str, Enum):
    """Institutional channel partner classifications."""
    NODAL_AGENCY = "NODAL_AGENCY"
    IMPLEMENTING_AGENCY = "IMPLEMENTING_AGENCY"
    DISTRICT_INDUSTRIES_CENTRE = "DISTRICT_INDUSTRIES_CENTRE"
    PUBLIC_SECTOR_BANK = "PUBLIC_SECTOR_BANK"
    RRB = "RRB"
    COOPERATIVE_BANK = "COOPERATIVE_BANK"
    FACILITATION_CENTRE = "FACILITATION_CENTRE"


class VerificationStatus(str, Enum):
    """Partner provenance status."""
    VERIFIED = "VERIFIED"
    UNVERIFIED = "UNVERIFIED"
    INACTIVE = "INACTIVE"


class PartnerRoleType(str, Enum):
    """Role of partner with respect to a specific scheme."""
    NODAL_AGENCY = "NODAL_AGENCY"
    IMPLEMENTING_AGENCY = "IMPLEMENTING_AGENCY"
    FINANCING_BANK = "FINANCING_BANK"
    LOCAL_FACILITATION = "LOCAL_FACILITATION"


class ChannelPartnerBase(BaseModel):
    partner_code: str
    organization_name: str
    partner_type: str
    state: str
    district: str
    city: Optional[str] = None
    pincode: Optional[str] = None
    address: str
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    services_offered: List[str] = Field(default_factory=list)
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    official_url: Optional[str] = None
    verification_status: str = "VERIFIED"
    source_agency: str
    source_url: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool = True

    model_config = ConfigDict(from_attributes=True)


class ChannelPartnerCreate(ChannelPartnerBase):
    pass


class SchemePartnerResponse(BaseModel):
    """Channel partner tailored with scheme-specific role and distance."""
    id: int
    partner_code: str
    organization_name: str
    partner_type: str
    state: str
    district: str
    city: Optional[str] = None
    pincode: Optional[str] = None
    address: str
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    distance_km: Optional[float] = None
    services_offered: List[str] = Field(default_factory=list)
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    official_url: Optional[str] = None
    verification_status: str = "VERIFIED"
    source_agency: str
    source_url: Optional[str] = None
    role_type: str = "LENDING_INSTITUTION"
    service_scope: Optional[str] = None
    is_primary_partner: bool = False
    why_this_partner: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ChannelPartnerResponse(ChannelPartnerBase):
    id: int
    last_verified_at: datetime
    created_at: datetime
    updated_at: datetime
    supported_schemes: List[Dict[str, Any]] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class NearbyPartnerQuery(BaseModel):
    latitude: float
    longitude: float
    radius_km: float = 50.0
    scheme_id: Optional[int] = None
    partner_type: Optional[str] = None
