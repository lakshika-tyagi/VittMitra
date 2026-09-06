from typing import AsyncGenerator, Dict, Any
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text
from app.core.config import settings

# Create async engine with pooling configured
async_engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    connect_args={"timeout": 5} if "asyncpg" in settings.DATABASE_URL else {}
)

# Async session factory
async_session_factory = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that yields an asynchronous database session.
    Automatically commits on success or rolls back on exception.
    """
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def check_db_connection() -> Dict[str, Any]:
    """
    Executes a lightweight query to verify active PostgreSQL connectivity.
    Returns operational metadata without exposing credentials.
    """
    async with async_engine.connect() as conn:
        result = await conn.execute(text("SELECT 1 AS alive, current_database() AS db_name, version() AS pg_version"))
        row = result.mappings().one()
        return {
            "status": "connected",
            "database_name": row["db_name"],
            "server_version": row["pg_version"].split(",")[0] if row["pg_version"] else "unknown"
        }

async def check_postgis_extension() -> Dict[str, Any]:
    """
    Verifies that the PostGIS spatial extension is enabled and returns version specs.
    """
    async with async_engine.connect() as conn:
        # First ensure extension check or query version
        result = await conn.execute(text("SELECT postgis_full_version() AS full_version"))
        row = result.mappings().one()
        return {
            "status": "enabled",
            "postgis_full_version": row["full_version"]
        }
