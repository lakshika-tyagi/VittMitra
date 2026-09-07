"""
Entrepreneur Onboarding & Profile Database Models

Defines the relational schema for persistent entrepreneur profiles, business profiles,
and financial inputs. Serves as the structured source of truth for eligibility,
financial calculations, and scheme matching.
"""
from typing import List, Optional
from datetime import date
from decimal import Decimal
from sqlalchemy import (
    Integer, String, Text, Boolean, Date, Numeric, ForeignKey
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin


class Entrepreneur(Base, TimestampMixin):
    """
    Core applicant entity representing an entrepreneur or self-employed individual.
    """
    __tablename__ = "entrepreneurs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    date_of_birth: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    gender: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(50), nullable=True) # e.g. General, SC, ST, OBC, Minorities
    preferred_language: Mapped[str] = mapped_column(String(20), default="en", nullable=False)
    phone_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Structured geographic location attributes
    state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    district: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    pincode: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    area_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True) # urban, rural, peri_urban
    latitude: Mapped[Optional[float]] = mapped_column(Numeric(9, 6), nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Numeric(9, 6), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    business_profiles: Mapped[List["BusinessProfile"]] = relationship(
        "BusinessProfile",
        back_populates="entrepreneur",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    financial_profiles: Mapped[List["FinancialProfile"]] = relationship(
        "FinancialProfile",
        back_populates="entrepreneur",
        cascade="all, delete-orphan",
        lazy="selectin"
    )


class BusinessProfile(Base, TimestampMixin):
    """
    Enterprise profile representing an existing or proposed micro/small business initiative.
    """
    __tablename__ = "business_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    entrepreneur_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("entrepreneurs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    business_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    business_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True) # proprietorship, partnership, self_employed
    sector: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True) # manufacturing, services, trading, handicrafts, agro_allied
    sub_sector: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    business_stage: Mapped[Optional[str]] = mapped_column(String(50), nullable=True) # idea, new_enterprise, expansion
    business_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    existing_business_vintage_years: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Specific scheme qualification flags
    is_greenfield: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    has_vending_proof: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    is_notified_trade: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    is_single_family_applicant: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    has_govt_employee_in_family: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    availed_pmegp_mudra_last_5yr: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    is_non_farm_income_generating: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    is_defaulter: Mapped[Optional[bool]] = mapped_column(Boolean, default=False, nullable=True)

    # Relationships
    entrepreneur: Mapped["Entrepreneur"] = relationship("Entrepreneur", back_populates="business_profiles")
    financial_profiles: Mapped[List["FinancialProfile"]] = relationship(
        "FinancialProfile",
        back_populates="business_profile",
        lazy="selectin"
    )


class FinancialProfile(Base, TimestampMixin):
    """
    Financial input profile storing user-provided project cost, equity contribution, and income parameters.
    NOTE: Stores raw user inputs ONLY; calculated outputs (financing gap, EMI, total interest) are computed dynamically.
    """
    __tablename__ = "financial_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    entrepreneur_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("entrepreneurs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    business_profile_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("business_profiles.id", ondelete="SET NULL"), nullable=True, index=True
    )
    
    # Raw financial inputs
    project_cost: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2), nullable=True)
    own_contribution: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2), default=Decimal("0.00"), nullable=True)
    loan_requirement: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2), nullable=True)
    annual_income: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2), nullable=True)
    monthly_income: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2), nullable=True)
    existing_monthly_obligations: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2), default=Decimal("0.00"), nullable=True)
    
    # Itemized cost breakdown inputs
    machinery_equipment_cost: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2), nullable=True)
    infrastructure_cost: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2), nullable=True)
    working_capital_cost: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2), nullable=True)
    other_expenses_cost: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2), nullable=True)

    # Relationships
    entrepreneur: Mapped["Entrepreneur"] = relationship("Entrepreneur", back_populates="financial_profiles")
    business_profile: Mapped[Optional["BusinessProfile"]] = relationship("BusinessProfile", back_populates="financial_profiles")
