"""
Integrated Entrepreneur Dashboard API Endpoints

Provides consolidated, state-aware dashboard aggregation orchestrating profile completion,
financial breakdown, feasibility status, recommended schemes, active applications,
journey progression, and next best actions.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.dashboard import DashboardResponse
from app.services.dashboard import DashboardService

router = APIRouter()


@router.get(
    "/dashboard",
    response_model=DashboardResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Integrated Entrepreneur Dashboard",
    description=(
        "Retrieves a state-aware aggregated dashboard payload for the active profile, "
        "or guides first-time onboarding if no entrepreneur is registered."
    ),
)
async def get_dashboard_endpoint(
    profile_id: Optional[int] = Query(None, description="Optional entrepreneur profile ID to view"),
    db: AsyncSession = Depends(get_db),
) -> DashboardResponse:
    """Consolidated endpoint delivering end-to-end dashboard analytics."""
    return await DashboardService.get_dashboard(db=db, profile_id=profile_id)


@router.get(
    "/profiles/{profile_id}/dashboard",
    response_model=DashboardResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Specific Entrepreneur Dashboard",
    description="Retrieves the consolidated dashboard aggregation scoped to a specific entrepreneur ID.",
)
async def get_profile_dashboard_endpoint(
    profile_id: int,
    db: AsyncSession = Depends(get_db),
) -> DashboardResponse:
    """Scoped profile dashboard endpoint."""
    return await DashboardService.get_dashboard(db=db, profile_id=profile_id)
