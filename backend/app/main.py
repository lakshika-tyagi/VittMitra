from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router
from app.schemas.health import HealthResponse

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
        allow_origins=settings.ALLOWED_ORIGINS,
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

    # Register API v1 routes
    application.include_router(api_router, prefix=settings.API_V1_STR)

    return application

app = create_application()
