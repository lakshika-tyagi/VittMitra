"""
Government Scheme Knowledge Database Models

Defines the master schema for government schemes, traceability sources,
deterministic eligibility criteria rules, and required document checklists.
"""
from typing import List, Optional, Any, Dict
from datetime import datetime, timezone
from sqlalchemy import (
    Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin

class Scheme(Base, TimestampMixin):
    """
    Master repository entity representing an authoritative central or state government scheme.
    """
    __tablename__ = "schemes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    scheme_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    scheme_name: Mapped[str] = mapped_column(String(255), nullable=False)
    short_description: Mapped[str] = mapped_column(Text, nullable=False)
    nodal_ministry: Mapped[str] = mapped_column(String(255), nullable=False)
    nodal_department: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    geography_level: Mapped[str] = mapped_column(String(50), default="NATIONAL", nullable=False)
    
    # Target beneficiaries e.g. ["SC", "ST", "Women", "OBC", "General", "Artisans"]
    target_beneficiaries: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    purpose: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Structured benefits metadata (subsidies, loan caps, interest subvention)
    benefits_summary: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    
    # Applicable business stages e.g. ["idea", "new_enterprise", "expansion"]
    business_stages: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    
    # Applicable sectors e.g. ["manufacturing", "services", "trading", "handicrafts"]
    sectors: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    
    # Data verification status: VERIFIED, ESTIMATED, UNVERIFIED
    data_status: Mapped[str] = mapped_column(String(20), default="VERIFIED", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    sources: Mapped[List["SchemeSource"]] = relationship(
        "SchemeSource",
        back_populates="scheme",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    eligibility_rules: Mapped[List["SchemeEligibilityRule"]] = relationship(
        "SchemeEligibilityRule",
        back_populates="scheme",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    documents: Mapped[List["SchemeDocument"]] = relationship(
        "SchemeDocument",
        back_populates="scheme",
        cascade="all, delete-orphan",
        lazy="selectin"
    )


class SchemeSource(Base, TimestampMixin):
    """
    Authoritative source traceability model linking every government fact to official records.
    """
    __tablename__ = "scheme_sources"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    scheme_id: Mapped[int] = mapped_column(Integer, ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False, index=True)
    source_name: Mapped[str] = mapped_column(String(255), nullable=False)
    source_type: Mapped[str] = mapped_column(String(50), nullable=False) # e.g. OFFICIAL_WEBSITE, OFFICIAL_GUIDELINE, OFFICIAL_PORTAL
    official_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    document_reference: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    publication_date: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    last_verified_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    version: Mapped[str] = mapped_column(String(50), default="1.0", nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    scheme: Mapped["Scheme"] = relationship("Scheme", back_populates="sources")


class SchemeEligibilityRule(Base, TimestampMixin):
    """
    Structured deterministic eligibility rule specification.
    """
    __tablename__ = "scheme_eligibility_rules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    scheme_id: Mapped[int] = mapped_column(Integer, ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False, index=True)
    rule_code: Mapped[str] = mapped_column(String(100), nullable=False)
    field_name: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. age, social_category, gender, sector, area_type
    operator: Mapped[str] = mapped_column(String(20), nullable=False) # e.g. >=, <=, ==, in, contains
    expected_value: Mapped[Any] = mapped_column(JSON, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    source_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("scheme_sources.id", ondelete="SET NULL"), nullable=True)
    rule_version: Mapped[str] = mapped_column(String(50), default="1.0", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    scheme: Mapped["Scheme"] = relationship("Scheme", back_populates="eligibility_rules")


class SchemeDocument(Base, TimestampMixin):
    """
    Required document checklist model tied to scheme guidelines.
    """
    __tablename__ = "scheme_documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    scheme_id: Mapped[int] = mapped_column(Integer, ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False, index=True)
    document_code: Mapped[str] = mapped_column(String(100), nullable=False)
    document_name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_mandatory: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    source_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("scheme_sources.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    scheme: Mapped["Scheme"] = relationship("Scheme", back_populates="documents")
