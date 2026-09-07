from fastapi import APIRouter
from app.api.v1.endpoints import health, schemes, eligibility, finance

api_router = APIRouter()

# Include health router under /api/v1
api_router.include_router(health.router, tags=["Health"])

# Include scheme knowledge router under /api/v1
api_router.include_router(schemes.router, tags=["Schemes"])

# Include eligibility engine router under /api/v1
api_router.include_router(eligibility.router, tags=["Eligibility"])

# Include financial engine router under /api/v1
api_router.include_router(finance.router, tags=["Finance"])

