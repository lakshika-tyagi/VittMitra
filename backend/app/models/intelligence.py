"""
Location & Business Intelligence Database Models

Defines the relational and spatial schema for district MSME ecosystems and industrial clusters.
Utilizes PostGIS spatial points for deterministic proximity and geographic suitability calculations.
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy import (
    Integer, String, Text, Boolean, Numeric, JSON, DateTime
)
from sqlalchemy.orm import Mapped, mapped_column
from geoalchemy2 import Geometry
from app.db.base import Base, TimestampMixin


class DistrictMSMEEcosystem(Base, TimestampMixin):
    """
    Authoritative district-level MSME profile containing official industrial indicators,
    prominent sectors, DIC office coordinates, and raw material access context.
    """
    __tablename__ = "district_msme_ecosystems"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    state: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    district: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    state_code: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    district_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    # Industrial & MSME Characteristics
    prominent_sectors: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False) # e.g. ["manufacturing", "food_processing"]
    industrial_areas_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    lead_bank_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    dic_office_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Ecosystem Ratings (HIGH, MODERATE, LIMITED, INSUFFICIENT_DATA)
    raw_material_availability: Mapped[str] = mapped_column(String(50), default="INSUFFICIENT_DATA", nullable=False)
    market_connectivity: Mapped[str] = mapped_column(String(50), default="INSUFFICIENT_DATA", nullable=False)
    power_infrastructure: Mapped[str] = mapped_column(String(50), default="INSUFFICIENT_DATA", nullable=False)
    labor_availability: Mapped[str] = mapped_column(String(50), default="INSUFFICIENT_DATA", nullable=False)
    
    # Geographic location of District Center / DIC Office (SRID 4326)
    latitude: Mapped[Optional[float]] = mapped_column(Numeric(9, 6), nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Numeric(9, 6), nullable=True)
    location: Mapped[Optional[Any]] = mapped_column(
        Geometry(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=True
    )
    
    # Data Provenance & Trust
    data_status: Mapped[str] = mapped_column(String(30), default="VERIFIED", nullable=False) # VERIFIED, ESTIMATED, UNVERIFIED, INSUFFICIENT_DATA
    source_name: Mapped[str] = mapped_column(String(255), default="Ministry of MSME - District Industrial Profile", nullable=False)
    source_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    last_verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class MSMECluster(Base, TimestampMixin):
    """
    Verified industrial or artisanal cluster (e.g. Pune Food Processing, Varanasi Handloom, Tirupur Textile)
    with spatial geometry for proximity queries.
    """
    __tablename__ = "msme_clusters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    cluster_code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    cluster_name: Mapped[str] = mapped_column(String(255), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    district: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    sector: Mapped[str] = mapped_column(String(100), nullable=False, index=True) # manufacturing, services, handicrafts, etc.
    sub_sector: Mapped[Optional[str]] = mapped_column(String(150), nullable=True) # food_processing, textiles, engineering
    
    # Description & Specialization
    specialization: Mapped[str] = mapped_column(Text, nullable=False)
    key_products: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    common_facility_centers: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    
    # Spatial Point Location (SRID 4326)
    latitude: Mapped[float] = mapped_column(Numeric(9, 6), nullable=False)
    longitude: Mapped[float] = mapped_column(Numeric(9, 6), nullable=False)
    location: Mapped[Optional[Any]] = mapped_column(
        Geometry(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=True
    )
    
    # Ecosystem Ratings
    raw_material_access: Mapped[str] = mapped_column(String(50), default="HIGH", nullable=False)
    market_linkage: Mapped[str] = mapped_column(String(50), default="HIGH", nullable=False)
    
    # Data Provenance
    data_status: Mapped[str] = mapped_column(String(30), default="VERIFIED", nullable=False) # VERIFIED, ESTIMATED, UNVERIFIED, INSUFFICIENT_DATA
    source_name: Mapped[str] = mapped_column(String(255), default="Ministry of MSME - Cluster Development Programme (MSE-CDP)", nullable=False)
    source_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    last_verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
