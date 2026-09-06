"""
Core configuration and settings module
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    APP_NAME: str = "VittMitra API"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "default-insecure-secret-key-change-me"
    
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000"
    ]
    
    DATABASE_URL: str = "postgresql+asyncpg://vittmitra_user:vittmitra_password@localhost:5432/vittmitra_db"
    GEMINI_API_KEY: str = ""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
