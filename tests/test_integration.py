"""Integration tests for the RAG system."""

import pytest
from fastapi.testclient import TestClient
from rag_aether.api.endpoints import app

client = TestClient(app)

def test_query_endpoint():
    """Test the query endpoint."""
    response = client.post(
        "/query",
        json={"query": "test query"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "query" in data
    assert "results" in data
    assert "metadata" in data

def test_index_endpoint():
    """Test the document indexing endpoint."""
    response = client.post(
        "/index",
        json={"documents": ["test document 1", "test document 2"]}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "indexed_count" in data

def test_health_endpoint():
    """Test the health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "system_metrics" in data 