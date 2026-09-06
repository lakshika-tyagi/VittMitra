import logging
from fastapi import APIRouter, Response, status
from app.schemas.health import HealthResponse, DatabaseHealthResponse, PostGISHealthResponse
from app.core.config import settings
from app.db.session import check_db_connection, check_postgis_extension

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check for API v1",
    description="Returns service availability and operational metadata."
)
async def check_v1_health() -> HealthResponse:
    return HealthResponse(
        status="healthy",
        app_name=settings.APP_NAME,
        version="1.0.0",
        environment=settings.ENVIRONMENT
    )

@router.get(
    "/health/db",
    response_model=DatabaseHealthResponse,
    summary="PostgreSQL Database Connectivity Check",
    description="Validates active async connection to PostgreSQL database without exposing credentials.",
    responses={
        200: {"description": "Database is connected and operational"},
        503: {"description": "Database is unreachable or unavailable"}
    }
)
async def check_database_health(response: Response) -> DatabaseHealthResponse:
    try:
        db_info = await check_db_connection()
        return DatabaseHealthResponse(
            status="connected",
            database="PostgreSQL",
            database_name=db_info.get("database_name"),
            server_version=db_info.get("server_version"),
        )
    except Exception as e:
        logger.error(f"Database connectivity check failed: {type(e).__name__}")
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return DatabaseHealthResponse(
            status="disconnected",
            database="PostgreSQL",
            error="Database service unreachable or connection refused"
        )

@router.get(
    "/health/postgis",
    response_model=PostGISHealthResponse,
    summary="PostGIS Extension Verification",
    description="Validates that PostGIS geospatial extension is enabled and returns engine version details.",
    responses={
        200: {"description": "PostGIS extension is enabled and verified"},
        503: {"description": "Database unreachable or PostGIS extension disabled"}
    }
)
async def check_postgis_health(response: Response) -> PostGISHealthResponse:
    try:
        postgis_info = await check_postgis_extension()
        return PostGISHealthResponse(
            status="enabled",
            postgis_full_version=postgis_info.get("postgis_full_version")
        )
    except Exception as e:
        logger.error(f"PostGIS extension check failed: {type(e).__name__}")
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return PostGISHealthResponse(
            status="unreachable",
            error="PostGIS extension unavailable or database connection failed"
        )
