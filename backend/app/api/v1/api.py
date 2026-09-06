from fastapi import APIRouter
from app.api.v1.endpoints import health, schemes

api_router = APIRouter()

# Include health router under /api/v1
api_router.include_router(health.router, tags=["Health"])

# Include scheme knowledge router under /api/v1
api_router.include_router(schemes.router, tags=["Schemes"])
