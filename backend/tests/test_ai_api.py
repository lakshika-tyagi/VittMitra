"""
Grounded AI REST API Integration & Endpoint Tests
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_ai_health_endpoint():
    """Verify GET /api/v1/ai/health returns status and model metadata."""
    response = client.get("/api/v1/ai/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] in ["ready", "live", "healthy"]
    assert "model" in data
    assert data["deterministic_authority_verified"] is True
    assert "rag_retriever" in data


def test_ai_chat_endpoint_general():
    """Verify POST /api/v1/ai/chat returns grounded response."""
    payload = {
        "message": "What is the PMEGP subsidy percentage for rural women entrepreneurs?",
        "scheme_code": "PMEGP",
        "language": "en",
    }
    response = client.post("/api/v1/ai/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert len(data["answer"]) > 0
    assert "confidence" in data
    assert "suggested_actions" in data


def test_ai_explain_scheme_endpoint():
    """Verify POST /api/v1/ai/explain/scheme returns scheme explainer."""
    payload = {
        "scheme_code": "PMEGP",
    }
    response = client.post("/api/v1/ai/explain/scheme", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "confidence" in data
    assert "sources" in data


def test_ai_explain_finance_endpoint():
    """Verify POST /api/v1/ai/explain/finance calculates and explains loan breakdown."""
    payload = {
        "scheme_code": "PMEGP",
        "project_cost": 2000000.0,
        "loan_amount": 1500000.0,
        "location": "Rural",
        "social_category": "Women",
    }
    response = client.post("/api/v1/ai/explain/finance", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert data["confidence"] in ["HIGH", "MEDIUM", "LOW", "INSUFFICIENT_DATA"]


def test_ai_explain_feasibility_endpoint():
    """Verify POST /api/v1/ai/explain/feasibility returns location signals."""
    payload = {
        "scheme_code": "PMEGP",
        "district": "Pune",
        "state": "Maharashtra",
        "project_cost": 2500000.0,
    }
    response = client.post("/api/v1/ai/explain/feasibility", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "suggested_actions" in data
