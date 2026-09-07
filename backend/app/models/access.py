"""
Channel Partner and Application Tracking Database Models

Defines the relational schema for verified last-mile channel partners (implementing agencies,
nodal offices, lending banks), scheme-partner associations, and user-recorded application
tracking timelines.
"""
from typing import List, Optional, Any, Dict
from datetime import datetime, date, timezone
from decimal import Decimal
from sqlalchemy import (
    Integer, String, Text, Boolean, Date, DateTime, Numeric, ForeignKey, JSON
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geometry
from app.db.base import Base, TimestampMixin


class ChannelPartner(Base, TimestampMixin):
    """
    Verified institutional or government channel partner facilitating scheme access.
    """
    __tablename__ = "channel_partners"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    partner_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    organization_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    partner_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    # e.g. IMPLEMENTING_AGENCY, PUBLIC_SECTOR_BANK, RRB, COOPERATIVE_BANK, DISTRICT_INDUSTRIES_CENTRE, FACILITATION_CENTRE, NODAL_AGENCY

    # Geographic Location
    state: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    district: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    pincode: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    address: Mapped[str] = mapped_column(Text, nullable=False)

    # PostGIS Spatial Coordinates
    latitude: Mapped[Optional[Decimal]] = mapped_column(Numeric(9, 6), nullable=True)
    longitude: Mapped[Optional[Decimal]] = mapped_column(Numeric(9, 6), nullable=True)
    location: Mapped[Optional[Any]] = mapped_column(
        Geometry(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=True
    )

    # Services Offered (e.g. ["APPLICATION_INTAKE", "DOCUMENT_VERIFICATION", "LOAN_APPRAISAL", "SUBSIDY_DISBURSEMENT", "PHYSICAL_HANDHOLDING"])
    services_offered: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)

    # Contact Details
    contact_person: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    contact_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    contact_email: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    official_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Provenance & Verification
    verification_status: Mapped[str] = mapped_column(String(50), default="VERIFIED", nullable=False)
    # VERIFIED, UNVERIFIED, INACTIVE
    source_agency: Mapped[str] = mapped_column(String(255), nullable=False)
    source_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    last_verified_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    scheme_associations: Mapped[List["SchemeChannelPartner"]] = relationship(
        "SchemeChannelPartner",
        back_populates="channel_partner",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    applications: Mapped[List["Application"]] = relationship(
        "Application",
        back_populates="channel_partner",
        lazy="selectin"
    )


class SchemeChannelPartner(Base, TimestampMixin):
    """
    Many-to-many relationship linking schemes to authorized channel partners.
    """
    __tablename__ = "scheme_channel_partners"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    scheme_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("schemes.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    channel_partner_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("channel_partners.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    role_type: Mapped[str] = mapped_column(String(100), default="LENDING_INSTITUTION", nullable=False)
    # NODAL_AGENCY, IMPLEMENTING_AGENCY, LENDING_INSTITUTION, LOCAL_FACILITATION
    service_scope: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_primary_partner: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    verification_status: Mapped[str] = mapped_column(String(50), default="VERIFIED", nullable=False)
    source_reference: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Relationships
    scheme: Mapped["Scheme"] = relationship("Scheme", lazy="selectin")
    channel_partner: Mapped["ChannelPartner"] = relationship("ChannelPartner", back_populates="scheme_associations", lazy="selectin")


class Application(Base, TimestampMixin):
    """
    User-recorded application tracking record.
    """
    __tablename__ = "applications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    entrepreneur_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("entrepreneurs.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    scheme_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("schemes.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )
    channel_partner_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("channel_partners.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    # Tracking Details
    application_reference_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    application_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    current_status: Mapped[str] = mapped_column(String(50), default="APPLICATION_STARTED", nullable=False, index=True)
    # DRAFT, APPLICATION_STARTED, SUBMITTED, UNDER_REVIEW, ADDITIONAL_INFORMATION_REQUIRED, APPROVED, REJECTED, COMPLETED, UNKNOWN
    status_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Financial target snapshot
    target_loan_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2), nullable=True)
    target_subsidy_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2), nullable=True)

    # Metadata & Provenance
    official_portal_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    source_type: Mapped[str] = mapped_column(String(50), default="USER_RECORDED", nullable=False)
    # USER_RECORDED, OFFICIAL_INTEGRATION
    last_updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    entrepreneur: Mapped["Entrepreneur"] = relationship("Entrepreneur", lazy="selectin")
    scheme: Mapped["Scheme"] = relationship("Scheme", lazy="selectin")
    channel_partner: Mapped[Optional["ChannelPartner"]] = relationship("ChannelPartner", back_populates="applications", lazy="selectin")
    status_history: Mapped[List["ApplicationStatusHistory"]] = relationship(
        "ApplicationStatusHistory",
        back_populates="application",
        cascade="all, delete-orphan",
        order_by="ApplicationStatusHistory.recorded_at.desc()",
        lazy="selectin"
    )


class ApplicationStatusHistory(Base, TimestampMixin):
    """
    Timeline of status change events for an application.
    """
    __tablename__ = "application_status_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    application_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("applications.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    status_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    source_type: Mapped[str] = mapped_column(String(50), default="USER_RECORDED", nullable=False)

    # Relationships
    application: Mapped["Application"] = relationship("Application", back_populates="status_history")
