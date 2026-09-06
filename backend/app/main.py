from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router
from app.schemas.health import HealthResponse, DatabaseHealthResponse, PostGISHealthResponse
from app.api.v1.endpoints.health import check_database_health, check_postgis_health

def create_application() -> FastAPI:
    application = FastAPI(
        title="VittMitra Backend API",
        description="AI-Driven Scheme Matching & Financial Planning for Marginalized Entrepreneurs",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json"
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
        description="Validate PostgreSQL database connectivity.",
        responses={
            200: {"description": "Database is connected"},
            503: {"description": "Database is disconnected"}
        }
    )
    async def root_db_health(response: Response) -> DatabaseHealthResponse:
        return await check_database_health(response)

    # Root PostGIS Health Check
    @application.get(
        "/health/postgis",
        response_model=PostGISHealthResponse,
        tags=["System"],
        summary="Root PostGIS Extension Check",
        description="Validate PostGIS extension availability.",
        responses={
            200: {"description": "PostGIS is enabled"},
            503: {"description": "PostGIS is unreachable"}
        }
    )
    async def root_postgis_health(response: Response) -> PostGISHealthResponse:
        return await check_postgis_health(response)

    # Register API v1 routes
    application.include_router(api_router, prefix=settings.API_V1_STR)

    return application

app = create_application()
