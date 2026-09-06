from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    status: str = Field(default="healthy", description="Operational status of service")
    app_name: str = Field(default="VittMitra API", description="Application name")
    version: str = Field(default="1.0.0", description="API version")
    environment: str = Field(default="development", description="Current environment mode")
