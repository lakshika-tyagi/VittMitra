from fastapi import FastAPI, Response, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.core.config import settings
from app.db.session import get_db
from app.api.v1.api import api_router
from app.schemas.health import HealthResponse, DatabaseHealthResponse, PostGISHealthResponse
from app.schemas.scheme import SchemeDetailResponse, SchemeListResponse
from app.schemas.eligibility import EligibilityCheckRequest, EligibilityCheckResponse
from app.schemas.finance import (
    FinancialCalculationRequest,
    FinancialCalculationResponse,
    ScenarioComparisonRequest,
    ScenarioComparisonResponse,
)
from app.schemas.matching import (
    SchemeMatchingRequest,
    SchemeMatchingResponse,
)
from app.schemas.feasibility import (
    FeasibilityAnalysisRequest,
    FeasibilityAnalysisResponse,
)
from app.api.v1.endpoints.health import check_database_health, check_postgis_health
from app.api.v1.endpoints.schemes import list_schemes, get_scheme_by_identifier
from app.api.v1.endpoints.eligibility import check_scheme_eligibility
from app.api.v1.endpoints.finance import calculate_finance, compare_finance_scenarios
from contextlib import asynccontextmanager
from app.api.v1.endpoints.feasibility import analyze_feasibility_endpoint
from app.db.session import init_db_schema

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-initialize database schema and seeds on startup if SQLite or local dev
    try:
        await init_db_schema()
    except Exception as e:
        print(f"[STARTUP] Database schema init notice: {e}")
    yield

def create_application() -> FastAPI:
    application = FastAPI(
        title="VittMitra Backend API",
        description="AI-Driven Scheme Matching & Financial Planning for Marginalized Entrepreneurs",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan
    )

    # Configure CORS Middleware
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS if isinstance(settings.ALLOWED_ORIGINS, list) else [settings.ALLOWED_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Root Health Check Endpoint
    @application.get(
        "/health",
        response_model=HealthResponse,
        tags=["System"],
        summary="Root Health Check",
        description="Check if the backend application is online and operational."
    )
    async def root_health_check() -> HealthResponse:
        return HealthResponse(
            status="healthy",
            app_name=settings.APP_NAME,
            version="1.0.0",
            environment=settings.ENVIRONMENT
        )

    # Root Database Health Check
    @application.get(
        "/health/db",
        response_model=DatabaseHealthResponse,
        tags=["System"],
        summary="Root Database Health Check",
        description="Validate PostgreSQL database connectivity."
    )
    async def root_db_health(response: Response) -> DatabaseHealthResponse:
        return await check_database_health(response)

    # Root PostGIS Health Check
    @application.get(
        "/health/postgis",
        response_model=PostGISHealthResponse,
        tags=["System"],
        summary="Root PostGIS Extension Check",
        description="Validate PostGIS extension availability."
    )
    async def root_postgis_health(response: Response) -> PostGISHealthResponse:
        return await check_postgis_health(response)

    # Root Scheme Endpoints (Shortcuts)
    @application.get(
        "/schemes",
        response_model=List[SchemeListResponse],
        tags=["Schemes"],
        summary="Root List Schemes",
        description="Shortcut for /api/v1/schemes"
    )
    async def root_list_schemes(
        sector: Optional[str] = None,
        beneficiary: Optional[str] = None,
        db: AsyncSession = Depends(get_db)
    ) -> List[SchemeListResponse]:
        return await list_schemes(sector=sector, beneficiary=beneficiary, db=db)

    @application.get(
        "/schemes/{scheme_identifier}",
        response_model=SchemeDetailResponse,
        tags=["Schemes"],
        summary="Root Get Scheme Details",
        description="Shortcut for /api/v1/schemes/{scheme_identifier}"
    )
    async def root_get_scheme(
        scheme_identifier: str,
        db: AsyncSession = Depends(get_db)
    ) -> SchemeDetailResponse:
        return await get_scheme_by_identifier(scheme_identifier=scheme_identifier, db=db)

    # Root Eligibility Check Shortcut
    @application.post(
        "/eligibility/check",
        response_model=EligibilityCheckResponse,
        tags=["Eligibility"],
        summary="Root Deterministic Eligibility Check",
        description="Shortcut for /api/v1/eligibility/check"
    )
    async def root_check_eligibility(
        payload: EligibilityCheckRequest,
        db: AsyncSession = Depends(get_db)
    ) -> EligibilityCheckResponse:
        return await check_scheme_eligibility(payload=payload, db=db)

    # Root Financial Calculation Shortcut
    @application.post(
        "/finance/calculate",
        response_model=FinancialCalculationResponse,
        tags=["Finance"],
        summary="Root Financial Calculation",
        description="Shortcut for /api/v1/finance/calculate"
    )
    async def root_calculate_finance(
        payload: FinancialCalculationRequest,
        db: AsyncSession = Depends(get_db)
    ) -> FinancialCalculationResponse:
        return await calculate_finance(payload=payload, db=db)

    # Root Financial Scenarios Shortcut
    @application.post(
        "/finance/scenarios",
        response_model=ScenarioComparisonResponse,
        tags=["Finance"],
        summary="Root Financial Scenarios Comparison",
        description="Shortcut for /api/v1/finance/scenarios"
    )
    async def root_compare_scenarios(
        payload: ScenarioComparisonRequest
    ) -> ScenarioComparisonResponse:
        return await compare_finance_scenarios(payload=payload)

    # Root Scheme Matching Shortcut
    @application.post(
        "/matching/schemes",
        response_model=SchemeMatchingResponse,
        tags=["Matching"],
        summary="Root Explainable Scheme Matching & Ranking",
        description="Shortcut for /api/v1/matching/schemes"
    )
    async def root_match_schemes(
        payload: SchemeMatchingRequest,
        db: AsyncSession = Depends(get_db)
    ) -> SchemeMatchingResponse:
        return await match_schemes(payload=payload, db=db)

    # Root Business & Location Feasibility Shortcut
    @application.post(
        "/feasibility/analyze",
        response_model=FeasibilityAnalysisResponse,
        tags=["Feasibility"],
        summary="Root Business & Location Feasibility Evaluation",
        description="Shortcut for /api/v1/feasibility/analyze"
    )
    async def root_analyze_feasibility(
        payload: FeasibilityAnalysisRequest,
        db: AsyncSession = Depends(get_db)
    ) -> FeasibilityAnalysisResponse:
        return await analyze_feasibility_endpoint(payload=payload, db=db)

    # Register API v1 routes
    application.include_router(api_router, prefix=settings.API_V1_STR)

    return application

app = create_application()
