"""
Database ORM Models package for VittMitra.
"""
from app.db.base import Base
from app.models.infrastructure import InfrastructureHeartbeat

__all__ = ["Base", "InfrastructureHeartbeat"]
