"""
Channel Partner Discovery API Endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.access import ChannelPartner
from app.schemas.partner import ChannelPartnerResponse, SchemePartnerResponse
from app.services.partner.service import PartnerService

router = APIRouter()


@router.get(
    "/partners",
    response_model=List[ChannelPartnerResponse],
    summary="List and filter verified channel partners",
    description="Retrieves active channel partners filtered by state, district, or partner type."
)
async def list_partners(
    state: Optional[str] = Query(None, description="State filter"),
    district: Optional[str] = Query(None, description="District filter"),
    partner_type: Optional[str] = Query(None, description="Partner classification type"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(ChannelPartner).where(ChannelPartner.is_active == True)
    if state:
        stmt = stmt.where(ChannelPartner.state.ilike(f"%{state}%"))
    if district:
        stmt = stmt.where(ChannelPartner.district.ilike(f"%{district}%"))
    if partner_type:
        stmt = stmt.where(ChannelPartner.partner_type == partner_type)

    stmt = stmt.offset(skip).limit(limit)
    res = await db.execute(stmt)
    partners = res.scalars().all()

    results = []
    for p in partners:
        detail = await PartnerService.get_partner_detail(db, p.id)
        if detail:
            results.append(detail)
    return results


@router.get(
    "/partners/nearby",
    response_model=List[SchemePartnerResponse],
    summary="Spatial PostGIS proximity discovery for channel partners",
    description="Returns verified channel partners within specified radius (in km) sorted by distance."
)
async def get_nearby_partners(
    lat: float = Query(..., ge=-90.0, le=90.0, description="Latitude"),
    lon: float = Query(..., ge=-180.0, le=180.0, description="Longitude"),
    radius_km: float = Query(50.0, ge=1.0, le=500.0, description="Search radius in km"),
    scheme_id: Optional[int] = Query(None, description="Optional target scheme ID"),
    partner_type: Optional[str] = Query(None, description="Optional partner type filter"),
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    return await PartnerService.get_nearby_partners(
        db=db,
        lat=lat,
        lon=lon,
        radius_km=radius_km,
        scheme_id=scheme_id,
        partner_type=partner_type,
        limit=limit
    )


@router.get(
    "/schemes/{scheme_id}/partners",
    response_model=List[SchemePartnerResponse],
    summary="List verified channel partners for a specific scheme",
    description="Returns authorized implementing agencies and lending banks for a target scheme."
)
async def get_scheme_partners(
    scheme_id: int,
    district: Optional[str] = Query(None, description="Optional entrepreneur district to prioritize"),
    state: Optional[str] = Query(None, description="Optional entrepreneur state to prioritize"),
    partner_type: Optional[str] = Query(None, description="Optional partner type filter"),
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    return await PartnerService.get_partners_for_scheme(
        db=db,
        scheme_id=scheme_id,
        district=district,
        state=state,
        partner_type=partner_type,
        limit=limit
    )


@router.get(
    "/partners/{partner_id}",
    response_model=ChannelPartnerResponse,
    summary="Get channel partner details",
    description="Retrieves complete information and supported schemes for a specific channel partner."
)
async def get_partner(
    partner_id: int,
    db: AsyncSession = Depends(get_db)
):
    partner = await PartnerService.get_partner_detail(db, partner_id)
    if not partner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Channel partner ID {partner_id} not found"
        )
    return partner
