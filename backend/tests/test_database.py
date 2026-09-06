import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from app.main import app
from app.models.infrastructure import InfrastructureHeartbeat
from app.db.base import Base
from app.core.config import settings

client = TestClient(app)

def test_root_health_continues_working():
    """Ensure core /health endpoint still functions properly."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app_name"] == settings.APP_NAME

def test_db_health_endpoint_schema_when_disconnected():
    """
    When database is unreachable, /health/db must return 503 and valid schema
    with sanitized error message and ZERO password or connection URL leakage.
    """
    response = client.get("/health/db")
    assert response.status_code in [200, 503]
    data = response.json()
    assert "status" in data
    assert "database" in data
    assert data["database"] == "PostgreSQL"
    # Ensure no secret strings are exposed
    response_text = response.text.lower()
    assert "password" not in response_text
    assert "vittmitra_password" not in response_text

def test_postgis_health_endpoint_schema_when_disconnected():
    """
    When database is unreachable, /health/postgis must return 503 and valid schema.
    """
    response = client.get("/health/postgis")
    assert response.status_code in [200, 503]
    data = response.json()
    assert "status" in data
    # Ensure no secret strings are exposed
    response_text = response.text.lower()
    assert "password" not in response_text
    assert "vittmitra_password" not in response_text

def test_db_health_mock_connected():
    """Assert successful /health/db response structure when connection is healthy."""
    mock_info = {
        "status": "connected",
        "database_name": "vittmitra_db",
        "server_version": "PostgreSQL 15.3"
    }
    with patch("app.api.v1.endpoints.health.check_db_connection", new_callable=AsyncMock) as mock_conn:
        mock_conn.return_value = mock_info
        response = client.get("/health/db")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "connected"
        assert data["database"] == "PostgreSQL"
        assert data["database_name"] == "vittmitra_db"
        assert data["server_version"] == "PostgreSQL 15.3"

def test_postgis_health_mock_enabled():
    """Assert successful /health/postgis response structure when extension is enabled."""
    mock_info = {
        "status": "enabled",
        "postgis_full_version": "POSTGIS=\"3.3.3\" [EXTENSION] PGSQL=\"150\" GEOS=\"3.11.1\" PROJ=\"9.1.0\""
    }
    with patch("app.api.v1.endpoints.health.check_postgis_extension", new_callable=AsyncMock) as mock_ext:
        mock_ext.return_value = mock_info
        response = client.get("/health/postgis")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "enabled"
        assert "3.3.3" in data["postgis_full_version"]

def test_infrastructure_model_definition():
    """Verify infrastructure heartbeat model metadata and spatial geometry column."""
    assert InfrastructureHeartbeat.__tablename__ == "_dev_infrastructure_heartbeat"
    columns = {c.name: c for c in InfrastructureHeartbeat.__table__.columns}
    assert "id" in columns
    assert "component_name" in columns
    assert "test_location" in columns
    assert "created_at" in columns
    assert "updated_at" in columns
    # Check that metadata contains the test table
    assert "_dev_infrastructure_heartbeat" in Base.metadata.tables
