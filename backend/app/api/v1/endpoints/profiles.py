"""
Entrepreneur Onboarding & Profile Foundation API Endpoints

Provides RESTful endpoints for managing entrepreneur profiles, business profiles,
financial parameters, and executing integrated eligibility, finance, and scheme matching.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.scheme import Scheme
from app.schemas.profile import (
    EntrepreneurCreate,
    EntrepreneurUpdate,
    EntrepreneurResponse,
    BusinessProfileCreate,
    BusinessProfileUpdate,
    BusinessProfileResponse,
    FinancialProfileCreate,
    FinancialProfileUpdate,
    FinancialProfileResponse,
    UnifiedProfileCreate,
    UnifiedProfileResponse,
)
from app.schemas.eligibility import EligibilityCheckResponse
from app.schemas.finance import FinancialCalculationResponse
from app.schemas.matching import SchemeMatchingResponse
from app.schemas.feasibility import FeasibilityAnalysisResponse
from app.services.profile import (
    create_entrepreneur,
    get_entrepreneur,
    list_entrepreneurs,
    update_entrepreneur,
    delete_entrepreneur,
    create_business_profile,
    get_business_profile,
    get_business_profiles_by_entrepreneur,
    update_business_profile,
    delete_business_profile,
    create_financial_profile,
    get_financial_profile,
    get_financial_profiles_by_entrepreneur,
    update_financial_profile,
    delete_financial_profile,
    create_unified_profile,
    get_unified_profile,
    to_eligibility_input,
    to_financial_request,
    to_matching_request,
    to_feasibility_context,
)
from app.services.eligibility.engine import EligibilityEngine
from app.services.finance.engine import FinancialEngine
from app.services.matching.engine import MatchingEngine
from app.services.feasibility.engine import FeasibilityEngine
from app.api.v1.endpoints.feasibility import resolve_district_and_clusters

router = APIRouter()


# ==============================================================================
# Unified & Entrepreneur Profile Routes
# ==============================================================================

@router.post(
    "/profiles",
    response_model=UnifiedProfileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Onboarding Profile",
    description="Creates an entrepreneur record along with optional initial business and financial inputs in a single step.",
)
async def create_profile_endpoint(
    payload: UnifiedProfileCreate,
    db: AsyncSession = Depends(get_db),
) -> UnifiedProfileResponse:
    unified = await create_unified_profile(db, payload)
    return unified


@router.get(
    "/profiles",
    response_model=List[EntrepreneurResponse],
    status_code=status.HTTP_200_OK,
    summary="List Entrepreneur Profiles",
    description="Returns a paginated list of registered entrepreneurs.",
)
async def list_profiles_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> List[EntrepreneurResponse]:
    entrepreneurs = await list_entrepreneurs(db, skip=skip, limit=limit)
    return [EntrepreneurResponse.model_validate(e) for e in entrepreneurs]


@router.get(
    "/profiles/{profile_id}",
    response_model=UnifiedProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Full Profile with Completeness",
    description="Retrieves the full profile hierarchy (personal, business, financial) with dynamic completeness metrics.",
)
async def get_profile_endpoint(
    profile_id: int,
    db: AsyncSession = Depends(get_db),
) -> UnifiedProfileResponse:
    profile = await get_unified_profile(db, profile_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Entrepreneur profile with ID {profile_id} not found",
        )
    return profile


@router.put(
    "/profiles/{profile_id}",
    response_model=EntrepreneurResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Entrepreneur Personal Profile",
    description="Updates core personal or geographic details of an entrepreneur.",
)
async def update_profile_endpoint(
    profile_id: int,
    payload: EntrepreneurUpdate,
    db: AsyncSession = Depends(get_db),
) -> EntrepreneurResponse:
    updated = await update_entrepreneur(db, profile_id, payload)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Entrepreneur profile with ID {profile_id} not found",
        )
    return EntrepreneurResponse.model_validate(updated)


@router.delete(
    "/profiles/{profile_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Entrepreneur Profile",
    description="Permanently deletes an entrepreneur profile and cascades deletion to associated business and financial records.",
)
async def delete_profile_endpoint(
    profile_id: int,
    db: AsyncSession = Depends(get_db),
) -> dict:
    deleted = await delete_entrepreneur(db, profile_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Entrepreneur profile with ID {profile_id} not found",
        )
    return {"message": "Profile deleted successfully"}


# ==============================================================================
# Business Profile Routes
# ==============================================================================

@router.post(
    "/profiles/{profile_id}/business",
    response_model=BusinessProfileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add Business Profile",
    description="Adds an enterprise profile for the specified entrepreneur.",
)
async def add_business_profile_endpoint(
    profile_id: int,
    payload: BusinessProfileCreate,
    db: AsyncSession = Depends(get_db),
) -> BusinessProfileResponse:
    entrepreneur = await get_entrepreneur(db, profile_id)
    if not entrepreneur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Entrepreneur profile with ID {profile_id} not found",
        )
    business = await create_business_profile(db, profile_id, payload)
    return BusinessProfileResponse.model_validate(business)


@router.get(
    "/profiles/{profile_id}/business",
    response_model=List[BusinessProfileResponse],
    status_code=status.HTTP_200_OK,
    summary="List Business Profiles for Entrepreneur",
)
async def list_business_profiles_endpoint(
    profile_id: int,
    db: AsyncSession = Depends(get_db),
) -> List[BusinessProfileResponse]:
    entrepreneur = await get_entrepreneur(db, profile_id)
    if not entrepreneur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Entrepreneur profile with ID {profile_id} not found",
        )
    businesses = await get_business_profiles_by_entrepreneur(db, profile_id)
    return [BusinessProfileResponse.model_validate(b) for b in businesses]


@router.put(
    "/profiles/{profile_id}/business/{business_id}",
    response_model=BusinessProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Business Profile",
)
async def update_business_profile_endpoint(
    profile_id: int,
    business_id: int,
    payload: BusinessProfileUpdate,
    db: AsyncSession = Depends(get_db),
) -> BusinessProfileResponse:
    business = await get_business_profile(db, business_id)
    if not business or business.entrepreneur_id != profile_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Business profile with ID {business_id} not found for entrepreneur {profile_id}",
        )
    updated = await update_business_profile(db, business_id, payload)
    return BusinessProfileResponse.model_validate(updated)


@router.delete(
    "/profiles/{profile_id}/business/{business_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Business Profile",
)
async def delete_business_profile_endpoint(
    profile_id: int,
    business_id: int,
    db: AsyncSession = Depends(get_db),
) -> dict:
    business = await get_business_profile(db, business_id)
    if not business or business.entrepreneur_id != profile_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Business profile with ID {business_id} not found for entrepreneur {profile_id}",
        )
    await delete_business_profile(db, business_id)
    return {"message": "Business profile deleted successfully"}


# ==============================================================================
# Financial Profile Routes
# ==============================================================================

@router.post(
    "/profiles/{profile_id}/financial",
    response_model=FinancialProfileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add Financial Inputs Profile",
    description="Adds financial parameters (project cost, equity contribution, income) for the specified entrepreneur.",
)
async def add_financial_profile_endpoint(
    profile_id: int,
    payload: FinancialProfileCreate,
    db: AsyncSession = Depends(get_db),
) -> FinancialProfileResponse:
    entrepreneur = await get_entrepreneur(db, profile_id)
    if not entrepreneur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Entrepreneur profile with ID {profile_id} not found",
        )
    financial = await create_financial_profile(db, profile_id, payload)
    return FinancialProfileResponse.model_validate(financial)


@router.get(
    "/profiles/{profile_id}/financial",
    response_model=List[FinancialProfileResponse],
    status_code=status.HTTP_200_OK,
    summary="List Financial Profiles for Entrepreneur",
)
async def list_financial_profiles_endpoint(
    profile_id: int,
    db: AsyncSession = Depends(get_db),
) -> List[FinancialProfileResponse]:
    entrepreneur = await get_entrepreneur(db, profile_id)
    if not entrepreneur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Entrepreneur profile with ID {profile_id} not found",
        )
    financials = await get_financial_profiles_by_entrepreneur(db, profile_id)
    return [FinancialProfileResponse.model_validate(f) for f in financials]


@router.put(
    "/profiles/{profile_id}/financial/{financial_id}",
    response_model=FinancialProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Financial Profile",
)
async def update_financial_profile_endpoint(
    profile_id: int,
    financial_id: int,
    payload: FinancialProfileUpdate,
    db: AsyncSession = Depends(get_db),
) -> FinancialProfileResponse:
    financial = await get_financial_profile(db, financial_id)
    if not financial or financial.entrepreneur_id != profile_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Financial profile with ID {financial_id} not found for entrepreneur {profile_id}",
        )
    updated = await update_financial_profile(db, financial_id, payload)
    return FinancialProfileResponse.model_validate(updated)


@router.delete(
    "/profiles/{profile_id}/financial/{financial_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Financial Profile",
)
async def delete_financial_profile_endpoint(
    profile_id: int,
    financial_id: int,
    db: AsyncSession = Depends(get_db),
) -> dict:
    financial = await get_financial_profile(db, financial_id)
    if not financial or financial.entrepreneur_id != profile_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Financial profile with ID {financial_id} not found for entrepreneur {profile_id}",
        )
    await delete_financial_profile(db, financial_id)
    return {"message": "Financial profile deleted successfully"}


# ==============================================================================
# Integrated Engine Execution Endpoints
# ==============================================================================

@router.get(
    "/profiles/{profile_id}/eligibility/{scheme_id}",
    response_model=EligibilityCheckResponse,
    status_code=status.HTTP_200_OK,
    summary="Evaluate Scheme Eligibility for Stored Profile",
    description="Invokes Step 4 Deterministic Eligibility Engine using the stored entrepreneur, business, and financial records.",
)
async def check_profile_eligibility_endpoint(
    profile_id: int,
    scheme_id: str,
    db: AsyncSession = Depends(get_db),
) -> EligibilityCheckResponse:
    entrepreneur = await get_entrepreneur(db, profile_id)
    if not entrepreneur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Entrepreneur profile with ID {profile_id} not found",
        )
    
    # Resolve scheme by code or integer ID with eager-loaded rules & sources
    if scheme_id.isdigit():
        scheme_query = (
            select(Scheme)
            .where(Scheme.id == int(scheme_id))
            .options(selectinload(Scheme.eligibility_rules), selectinload(Scheme.sources))
        )
    else:
        scheme_query = (
            select(Scheme)
            .where(Scheme.scheme_code == scheme_id.upper().strip())
            .options(selectinload(Scheme.eligibility_rules), selectinload(Scheme.sources))
        )
    scheme_res = await db.execute(scheme_query)
    scheme = scheme_res.scalar_one_or_none()
    if not scheme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scheme '{scheme_id}' not found",
        )

    business_profiles = await get_business_profiles_by_entrepreneur(db, entrepreneur.id)
    financial_profiles = await get_financial_profiles_by_entrepreneur(db, entrepreneur.id)
    business = business_profiles[0] if business_profiles else None
    financial = financial_profiles[0] if financial_profiles else None
    
    profile_input = to_eligibility_input(entrepreneur, business, financial)
    result = EligibilityEngine.evaluate_scheme(scheme=scheme, profile=profile_input)
    return result


@router.get(
    "/profiles/{profile_id}/finance/summary",
    response_model=FinancialCalculationResponse,
    status_code=status.HTTP_200_OK,
    summary="Compute Financial Summary for Stored Profile",
    description="Invokes Step 5 Deterministic Financial Engine using the stored project cost and income records.",
)
async def get_profile_finance_summary_endpoint(
    profile_id: int,
    scheme_code: Optional[str] = Query(None, description="Optional scheme code for specific subsidy rules (e.g. 'PMEGP')"),
    interest_rate: Optional[float] = Query(None, description="Annual interest rate percentage override"),
    tenure_months: Optional[int] = Query(None, description="Loan tenure in months override"),
    db: AsyncSession = Depends(get_db),
) -> FinancialCalculationResponse:
    entrepreneur = await get_entrepreneur(db, profile_id)
    if not entrepreneur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Entrepreneur profile with ID {profile_id} not found",
        )

    business_profiles = await get_business_profiles_by_entrepreneur(db, entrepreneur.id)
    financial_profiles = await get_financial_profiles_by_entrepreneur(db, entrepreneur.id)
    business = business_profiles[0] if business_profiles else None
    financial = financial_profiles[0] if financial_profiles else None
    
    fin_request = to_financial_request(
        entrepreneur=entrepreneur,
        business=business,
        financial=financial,
        scheme_code=scheme_code,
        interest_rate_override=interest_rate,
        tenure_months_override=tenure_months,
    )
    result = FinancialEngine.calculate_financial_structure(fin_request)
    return result


@router.get(
    "/profiles/{profile_id}/matching",
    response_model=SchemeMatchingResponse,
    status_code=status.HTTP_200_OK,
    summary="Match & Rank Schemes for Stored Profile",
    description="Invokes Step 6 Explainable Scheme Matching & Ranking Engine using the stored profile data.",
)
async def get_profile_scheme_matching_endpoint(
    profile_id: int,
    limit: int = Query(10, ge=1, le=50),
    include_ineligible: bool = Query(True),
    db: AsyncSession = Depends(get_db),
) -> SchemeMatchingResponse:
    entrepreneur = await get_entrepreneur(db, profile_id)
    if not entrepreneur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Entrepreneur profile with ID {profile_id} not found",
        )

    business_profiles = await get_business_profiles_by_entrepreneur(db, entrepreneur.id)
    financial_profiles = await get_financial_profiles_by_entrepreneur(db, entrepreneur.id)
    business = business_profiles[0] if business_profiles else None
    financial = financial_profiles[0] if financial_profiles else None
    
    matching_request = to_matching_request(
        entrepreneur=entrepreneur,
        business=business,
        financial=financial,
        limit=limit,
        include_ineligible=include_ineligible,
    )

    query = (
        select(Scheme)
        .where(Scheme.is_active == True)
        .order_by(Scheme.scheme_name)
        .options(selectinload(Scheme.eligibility_rules), selectinload(Scheme.sources))
    )
    result = await db.execute(query)
    schemes = list(result.scalars().all())

    response = MatchingEngine.match_and_rank_schemes(
        schemes=schemes,
        profile=matching_request.profile,
        financial=matching_request.financial,
        limit=matching_request.limit or 10,
        include_ineligible=matching_request.include_ineligible,
    )
    return response


@router.get(
    "/profiles/{profile_id}/feasibility",
    response_model=FeasibilityAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Evaluate Business & Location Feasibility for Stored Profile",
    description="Invokes Step 9 Deterministic Feasibility Engine using the stored profile, location, and financial parameters.",
)
async def get_profile_feasibility_endpoint(
    profile_id: int,
    db: AsyncSession = Depends(get_db),
) -> FeasibilityAnalysisResponse:
    entrepreneur = await get_entrepreneur(db, profile_id)
    if not entrepreneur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Entrepreneur profile with ID {profile_id} not found",
        )

    business_profiles = await get_business_profiles_by_entrepreneur(db, entrepreneur.id)
    financial_profiles = await get_financial_profiles_by_entrepreneur(db, entrepreneur.id)
    business = business_profiles[0] if business_profiles else None
    financial = financial_profiles[0] if financial_profiles else None

    context = to_feasibility_context(
        entrepreneur=entrepreneur,
        business=business,
        financial=financial,
    )

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
