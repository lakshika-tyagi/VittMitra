"""
Application Assistance and User-Recorded Tracking API Endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.access import Application
from app.schemas.application import (
    ApplicationCreate,
    ApplicationUpdate,
    ApplicationStatusUpdate,
    ApplicationResponse,
    ApplicationDetailResponse,
    ApplicationAssistanceResponse,
)
from app.services.application.service import ApplicationService

router = APIRouter()


@router.get(
    "/applications/assistance",
    response_model=ApplicationAssistanceResponse,
    summary="Get pre-application assistance and guidance package",
    description="Synthesizes eligibility, financial structure, mandatory documents, and verified channel partners."
)
async def get_application_assistance(
    entrepreneur_id: int = Query(..., description="Entrepreneur profile ID"),
    scheme_id: int = Query(..., description="Target scheme ID"),
    db: AsyncSession = Depends(get_db)
):
    return await ApplicationService.get_application_assistance(
        db=db,
        entrepreneur_id=entrepreneur_id,
        scheme_id=scheme_id
    )


@router.post(
    "/applications",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record a new user application",
    description="Creates an application tracking record and logs the initial status event."
)
async def create_application(
    payload: ApplicationCreate,
    db: AsyncSession = Depends(get_db)
):
    return await ApplicationService.create_application(db=db, payload=payload)


@router.get(
    "/applications",
    response_model=List[ApplicationResponse],
    summary="List applications for an entrepreneur",
    description="Retrieves all active applications tracked by the specified entrepreneur."
)
async def list_applications(
    entrepreneur_id: int = Query(..., description="Entrepreneur ID"),
    db: AsyncSession = Depends(get_db)
):
    return await ApplicationService.get_entrepreneur_applications(
        db=db,
        entrepreneur_id=entrepreneur_id
    )


@router.get(
    "/applications/{application_id}",
    response_model=ApplicationDetailResponse,
    summary="Get application details and status timeline",
    description="Retrieves comprehensive application tracking information with full status history."
)
async def get_application(
    application_id: int,
    db: AsyncSession = Depends(get_db)
):
    app_detail = await ApplicationService.get_application_detail(
        db=db,
        application_id=application_id
    )
    if not app_detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application ID {application_id} not found"
        )
    return app_detail


@router.post(
    "/applications/{application_id}/status",
    response_model=ApplicationResponse,
    summary="Update application status and append timeline event",
    description="Records a new user-reported status change event in the application's timeline."
)
async def update_application_status(
    application_id: int,
    payload: ApplicationStatusUpdate,
    db: AsyncSession = Depends(get_db)
):
    return await ApplicationService.update_application_status(
        db=db,
        application_id=application_id,
        payload=payload
    )
