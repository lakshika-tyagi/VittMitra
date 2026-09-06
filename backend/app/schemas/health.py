from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    status: str = Field(default="healthy", description="Operational status of service")
    app_name: str = Field(default="VittMitra API", description="Application name")
    version: str = Field(default="1.0.0", description="API version")
    environment: str = Field(default="development", description="Current environment mode")

class DatabaseHealthResponse(BaseModel):
    status: str = Field(..., description="Connectivity status ('connected' or 'disconnected')")
    database: str = Field(..., description="Engine identifier")
    database_name: Optional[str] = Field(None, description="Active database catalog name")
    server_version: Optional[str] = Field(None, description="PostgreSQL server version string")
    error: Optional[str] = Field(None, description="Sanitized connection error description if unreachable")

class PostGISHealthResponse(BaseModel):
    status: str = Field(..., description="PostGIS extension status ('enabled' or 'disabled/unreachable')")
    postgis_full_version: Optional[str] = Field(None, description="PostGIS spatial engine version string")
    error: Optional[str] = Field(None, description="Sanitized error description if unreachable")
