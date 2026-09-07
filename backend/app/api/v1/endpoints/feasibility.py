"""
Business & Location Feasibility REST API Endpoints

Exposes decision-support feasibility evaluation, location intelligence queries,
and PostGIS MSME cluster proximity lookups.
"""
from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_

from app.db.session import get_db
from app.models.profile import Entrepreneur, BusinessProfile, FinancialProfile
from app.models.intelligence import DistrictMSMEEcosystem, MSMECluster
from app.schemas.feasibility import (
    FeasibilityAnalysisRequest,
    FeasibilityAnalysisResponse,
    FeasibilityInputContext,
    DistrictEcosystemResponse,
    NearbyClusterResponse,
)
from app.services.feasibility.engine import FeasibilityEngine
from app.services.feasibility.signals import haversine_distance_km
from app.services.profile.service import (
    get_entrepreneur,
    get_business_profiles_by_entrepreneur,
    get_financial_profiles_by_entrepreneur,
)

router = APIRouter()


async def resolve_district_and_clusters(
    db: AsyncSession,
    state: Optional[str],
    district: Optional[str],
    lat: Optional[float],
    lng: Optional[float],
    sector: Optional[str] = None,
) -> tuple[Optional[DistrictMSMEEcosystem], List[NearbyClusterResponse]]:
    """Helper to fetch district ecosystem profile and nearby MSME clusters."""
    district_ecosystem: Optional[DistrictMSMEEcosystem] = None
    nearby_clusters: List[NearbyClusterResponse] = []

    # 1. Fetch District Ecosystem
    if state and district:
        query = select(DistrictMSMEEcosystem).where(
            and_(
                DistrictMSMEEcosystem.state.ilike(state.strip()),
                DistrictMSMEEcosystem.district.ilike(district.strip()),
                DistrictMSMEEcosystem.is_active == True,
            )
        )
        res = await db.execute(query)
        district_ecosystem = res.scalars().first()

    # 2. Fetch MSME Clusters & Compute Distances
    cluster_query = select(MSMECluster).where(MSMECluster.is_active == True)
    if state:
        cluster_query = cluster_query.where(MSMECluster.state.ilike(state.strip()))
    
    res = await db.execute(cluster_query)
    clusters = list(res.scalars().all())

    for c in clusters:
        c_lat = float(c.latitude)
        c_lng = float(c.longitude)
        dist_km: Optional[float] = None

        if lat is not None and lng is not None:
            dist_km = haversine_distance_km(float(lat), float(lng), c_lat, c_lng)
        elif district and c.district.lower() == district.strip().lower():
            dist_km = 0.0

        item = NearbyClusterResponse(
            cluster_code=c.cluster_code,
            cluster_name=c.cluster_name,
            state=c.state,
            district=c.district,
            sector=c.sector,
            sub_sector=c.sub_sector,
            specialization=c.specialization,
            key_products=c.key_products or [],
            common_facility_centers=c.common_facility_centers or [],
            latitude=c_lat,
            longitude=c_lng,
            distance_km=dist_km,
            raw_material_access=c.raw_material_access,
            market_linkage=c.market_linkage,
            data_status=c.data_status,
            source_name=c.source_name,
            source_url=c.source_url,
        )
        nearby_clusters.append(item)

    # Sort clusters by distance if available
    if any(c.distance_km is not None for c in nearby_clusters):
        nearby_clusters.sort(key=lambda x: x.distance_km if x.distance_km is not None else 9999.0)

    return district_ecosystem, nearby_clusters


@router.post(
    "/feasibility/analyze",
    response_model=FeasibilityAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze Business & Location Feasibility",
    description="Deterministic evaluation of business viability, location suitability, equity ratio, and debt burden.",
)
async def analyze_feasibility_endpoint(
    payload: FeasibilityAnalysisRequest,
    db: AsyncSession = Depends(get_db),
) -> FeasibilityAnalysisResponse:
    """Executes multi-dimensional feasibility evaluation from payload or stored profile."""
    context: FeasibilityInputContext

    if payload.profile_id:
        entrepreneur = await get_entrepreneur(db, payload.profile_id)
        if not entrepreneur:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Entrepreneur profile with ID {payload.profile_id} not found",
            )
        businesses = await get_business_profiles_by_entrepreneur(db, entrepreneur.id)
        financials = await get_financial_profiles_by_entrepreneur(db, entrepreneur.id)
        b = businesses[0] if businesses else None
        f = financials[0] if financials else None

        context = FeasibilityInputContext(
            entrepreneur_id=entrepreneur.id,
            full_name=entrepreneur.full_name,
            business_name=b.business_name if b else None,
            sector=b.sector if b else None,
            sub_sector=b.sub_sector if b else None,
            business_stage=b.business_stage if b else None,
            is_greenfield=b.is_greenfield if b else None,
            existing_business_vintage_years=b.existing_business_vintage_years if b else None,
            state=entrepreneur.state,
            district=entrepreneur.district,
            city=entrepreneur.city,
            pincode=entrepreneur.pincode,
            area_type=entrepreneur.area_type,
            latitude=float(entrepreneur.latitude) if entrepreneur.latitude else None,
            longitude=float(entrepreneur.longitude) if entrepreneur.longitude else None,
            project_cost=f.project_cost if f else None,
            own_contribution=f.own_contribution if f else None,
            loan_requirement=f.loan_requirement if f else None,
            monthly_income=f.monthly_income if f else None,
            existing_monthly_obligations=f.existing_monthly_obligations if f else None,
            is_defaulter=b.is_defaulter if b else False,
        )
    elif payload.context:
        context = payload.context
    else:
        context = FeasibilityInputContext()

    district_eco, nearby_cls = await resolve_district_and_clusters(
        db=db,
        state=context.state,
        district=context.district,
        lat=context.latitude,
        lng=context.longitude,
        sector=context.sector,
    )

    result = FeasibilityEngine.evaluate_feasibility(
        context=context,
        district_ecosystem=district_eco,
        nearby_clusters=nearby_cls,
    )
    return result


@router.get(
    "/locations/intelligence",
    response_model=List[DistrictEcosystemResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Location & District MSME Ecosystem Intelligence",
    description="Retrieve verified district-level industrial profiles and MSME infrastructure indicators.",
)
async def get_location_intelligence_endpoint(
    state: Optional[str] = Query(None, description="State name filter (e.g. 'Maharashtra')"),
    district: Optional[str] = Query(None, description="District name filter (e.g. 'Pune')"),
    db: AsyncSession = Depends(get_db),
) -> List[DistrictEcosystemResponse]:
    query = select(DistrictMSMEEcosystem).where(DistrictMSMEEcosystem.is_active == True)
    if state:
        query = query.where(DistrictMSMEEcosystem.state.ilike(f"%{state.strip()}%"))
    if district:
        query = query.where(DistrictMSMEEcosystem.district.ilike(f"%{district.strip()}%"))
    
    query = query.order_by(DistrictMSMEEcosystem.state, DistrictMSMEEcosystem.district)
    res = await db.execute(query)
    ecosystems = list(res.scalars().all())

    return [
        DistrictEcosystemResponse(
            id=e.id,
            state=e.state,
            district=e.district,
            state_code=e.state_code,
            district_code=e.district_code,
            prominent_sectors=e.prominent_sectors or [],
            industrial_areas_count=e.industrial_areas_count,
            lead_bank_name=e.lead_bank_name,
            dic_office_address=e.dic_office_address,
            raw_material_availability=e.raw_material_availability,
            market_connectivity=e.market_connectivity,
            power_infrastructure=e.power_infrastructure,
            labor_availability=e.labor_availability,
            latitude=float(e.latitude) if e.latitude else None,
            longitude=float(e.longitude) if e.longitude else None,
            data_status=e.data_status,
            source_name=e.source_name,
            source_url=e.source_url,
        )
        for e in ecosystems
    ]


@router.get(
    "/locations/nearby-clusters",
    response_model=List[NearbyClusterResponse],
    status_code=status.HTTP_200_OK,
    summary="Find Nearby Verified MSME Clusters",
    description="Search for active industrial clusters within radius using PostGIS geographic distance.",
)
async def get_nearby_clusters_endpoint(
    latitude: float = Query(..., ge=-90.0, le=90.0, description="Latitude (WGS84)"),
    longitude: float = Query(..., ge=-180.0, le=180.0, description="Longitude (WGS84)"),
    radius_km: float = Query(50.0, ge=1.0, le=500.0, description="Search radius in kilometers"),
    sector: Optional[str] = Query(None, description="Optional sector filter (e.g. 'manufacturing')"),
    db: AsyncSession = Depends(get_db),
) -> List[NearbyClusterResponse]:
    query = select(MSMECluster).where(MSMECluster.is_active == True)
    if sector:
        query = query.where(MSMECluster.sector.ilike(sector.strip()))

    res = await db.execute(query)
    clusters = list(res.scalars().all())

    results: List[NearbyClusterResponse] = []
    for c in clusters:
        c_lat = float(c.latitude)
        c_lng = float(c.longitude)
        dist = haversine_distance_km(latitude, longitude, c_lat, c_lng)
        if dist <= radius_km:
            results.append(
                NearbyClusterResponse(
                    cluster_code=c.cluster_code,
                    cluster_name=c.cluster_name,
                    state=c.state,
                    district=c.district,
                    sector=c.sector,
                    sub_sector=c.sub_sector,
                    specialization=c.specialization,
                    key_products=c.key_products or [],
                    common_facility_centers=c.common_facility_centers or [],
                    latitude=c_lat,
                    longitude=c_lng,
                    distance_km=dist,
                    raw_material_access=c.raw_material_access,
                    market_linkage=c.market_linkage,
                    data_status=c.data_status,
                    source_name=c.source_name,
                    source_url=c.source_url,
                )
            )

    results.sort(key=lambda x: x.distance_km if x.distance_km is not None else 9999.0)
    return results
