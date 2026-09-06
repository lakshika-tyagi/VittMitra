"""
Read-Only Scheme Knowledge API Endpoints

Provides authoritative government scheme discovery and retrieval APIs.
NOTE: In accordance with Step 3, these endpoints are strictly read-only and
do NOT perform eligibility evaluations, matching calculations, or AI calls.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.scheme import Scheme
from app.schemas.scheme import SchemeDetailResponse, SchemeListResponse

router = APIRouter()

@router.get(
    "/schemes",
    response_model=List[SchemeListResponse],
    summary="List Government Schemes",
    description="Retrieve all verified government schemes with high-level summaries and verification status."
)
async def list_schemes(
    sector: Optional[str] = Query(None, description="Filter schemes by applicable sector (e.g. manufacturing, services, trading, handicrafts)"),
    beneficiary: Optional[str] = Query(None, description="Filter schemes by target beneficiary (e.g. SC, ST, Women, OBC)"),
    db: AsyncSession = Depends(get_db)
) -> List[SchemeListResponse]:
    query = select(Scheme).where(Scheme.is_active == True).order_by(Scheme.scheme_name)
    result = await db.execute(query)
    schemes = result.scalars().all()

    filtered_schemes = []
    for s in schemes:
        if sector and sector.lower() not in [sec.lower() for sec in s.sectors]:
            continue
        if beneficiary and beneficiary.lower() not in [ben.lower() for ben in s.target_beneficiaries]:
            continue
        
        last_verified = None
        if s.sources:
            last_verified = max([src.last_verified_at for src in s.sources if src.last_verified_at], default=None)

        filtered_schemes.append(
            SchemeListResponse(
                id=s.id,
                scheme_code=s.scheme_code,
                scheme_name=s.scheme_name,
                short_description=s.short_description,
                nodal_ministry=s.nodal_ministry,
                geography_level=s.geography_level,
                target_beneficiaries=s.target_beneficiaries,
                sectors=s.sectors,
                data_status=s.data_status,
                is_active=s.is_active,
                last_verified_at=last_verified
            )
        )

    return filtered_schemes

@router.get(
    "/schemes/{scheme_identifier}",
    response_model=SchemeDetailResponse,
    summary="Get Scheme Details by ID or Code",
    description="Retrieve comprehensive scheme specifications including official sources, deterministic rule criteria, and document checklists."
)
async def get_scheme_by_identifier(
    scheme_identifier: str,
    db: AsyncSession = Depends(get_db)
) -> SchemeDetailResponse:
    # Support lookup either by integer database ID or by unique scheme_code string (e.g. 'PMEGP', 'MUDRA_PMMY')
    if scheme_identifier.isdigit():
        query = select(Scheme).where(Scheme.id == int(scheme_identifier), Scheme.is_active == True)
    else:
        query = select(Scheme).where(Scheme.scheme_code.ilike(scheme_identifier), Scheme.is_active == True)

    result = await db.execute(query)
    scheme = result.scalar_one_or_none()

    if not scheme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scheme with identifier '{scheme_identifier}' not found or inactive."
        )

    return scheme
