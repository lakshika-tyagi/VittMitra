from fastapi import APIRouter
from app.schemas.health import HealthResponse
from app.core.config import settings

router = APIRouter()

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
