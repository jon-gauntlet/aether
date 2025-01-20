import os
import pytest
import pytest_asyncio
from httpx import AsyncClient
from unittest.mock import patch, Mock, AsyncMock
from fastapi import FastAPI
from fastapi.testclient import TestClient
from rag_aether.ai.rag_system import RAGSystem
from rag_aether.api.main import app
import rag_aether.ai.rag_system as rag_module
from rag_aether.api.endpoints import get_rag_system
from rag_aether.core.monitoring import monitor, SystemMonitor
from rag_aether.config import Credentials
import numpy as np

@pytest.fixture(autouse=True)
def reset_monitor():
    monitor.__init__()
    yield

@pytest.fixture
def client():
    """Create test client."""
    app.router.route_class = None  # Reset router to avoid conflicts
    return TestClient(app)

@pytest_asyncio.fixture
async def mock_rag_system():
    """Create mock RAG system."""
    mock_creds = Credentials(
        openai_api_key="test_key",
        supabase_url="http://test",
        supabase_key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0In0.1234567890"
    )

    # Create mock OpenAI client
    mock_openai = AsyncMock()
    mock_openai.embeddings.create.return_value.data = [Mock(embedding=[0.1] * 1536)]
    mock_openai.chat.completions.create.return_value.choices = [
        Mock(message=Mock(content="Test response"))
    ]

    # Create mock MLClient
    mock_ml_client = AsyncMock()
    mock_ml_client.create_embedding.return_value = [0.1] * 1536
    mock_ml_client.create_embeddings_batch.return_value = [[0.1] * 1536]
    mock_ml_client.generate_response.return_value = "Test response"
    mock_ml_client.client = mock_openai

    # Create mock vector store
    mock_vector_store = AsyncMock()
    mock_vector_store.add_documents.return_value = True
    mock_vector_store.search.return_value = [{
        "text": "Test document",
        "metadata": {"source": "test"},
        "score": 0.95,
        "document_id": "test-doc-1"
    }]

    # Create RAG system with mocks
    rag = RAGSystem()
    rag.client = mock_openai
    rag.vector_store = mock_vector_store
    rag.redis = None  # Disable caching for tests
    
    # Mock _get_embeddings to return correct shape
    async def mock_get_embeddings(texts, retries=3):
        return np.array([[0.1] * 1536 for _ in range(len(texts))])
    rag._get_embeddings = mock_get_embeddings
    
    return rag

@pytest.fixture
def override_get_rag_system(mock_rag_system):
    """Override get_rag_system dependency."""
    app.dependency_overrides[get_rag_system] = lambda: mock_rag_system
    yield
    app.dependency_overrides = {}

def test_health_check_no_api_key(client):
    """Test health check without API key."""
    with patch.dict(os.environ, {"OPENAI_API_KEY": ""}):
        response = client.get("/api/v1/health")
        assert response.status_code == 503
        assert "Missing OpenAI API key" in response.json()["detail"]

def test_query_no_api_key(client):
    """Test query without API key."""
    with patch.dict(os.environ, {"OPENAI_API_KEY": ""}):
        response = client.post("/api/v1/query", json={"question": "test"})
        assert response.status_code == 503
        assert "Missing OpenAI API key" in response.json()["detail"]

def test_add_document_empty_content(client, mock_rag_system, override_get_rag_system):
    """Test adding document with empty content."""
    response = client.post("/api/v1/documents/test", json={"content": ""})
    assert response.status_code == 422  # Pydantic validation error
    assert "content must not be empty" in response.json()["detail"][0]["msg"].lower()

def test_query_empty_question(client, mock_rag_system, override_get_rag_system):
    """Test query with empty question."""
    response = client.post("/api/v1/query", json={"question": ""})
    assert response.status_code == 422  # Pydantic validation error
    assert "question must not be empty" in response.json()["detail"][0]["msg"].lower()

def test_query_no_documents(client, mock_rag_system, override_get_rag_system):
    """Test query with no documents."""
    # Mock empty response from vector store
    mock_rag_system.vector_store.search.return_value = []
    
    response = client.post("/api/v1/query", json={"question": "test"})
    assert response.status_code == 200
    data = response.json()
    assert len(data["results"]) == 0
    assert "metrics" in data

def test_successful_document_add_and_query(client, mock_rag_system, override_get_rag_system):
    """Test successful document addition and query."""
    # Add document
    response = client.post("/api/v1/documents/test", json={
        "content": "Test document",
        "metadata": {"source": "test"}
    })
    assert response.status_code == 200
    assert response.json()["success"] is True
    
    # Query document
    response = client.post("/api/v1/query", json={"question": "test"})
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert len(data["results"]) > 0
    assert "metrics" in data

def test_monitoring_metrics(client, mock_rag_system, override_get_rag_system):
    """Test monitoring metrics collection."""
    # Make a successful query
    response = client.post("/api/v1/query", json={"question": "test"})
    assert response.status_code == 200
    
    # Make a failed query (validation error)
    response = client.post("/api/v1/query", json={"question": ""})
    assert response.status_code == 422  # Pydantic validation error
    monitor.record_query_failure()  # Record validation error as failed query
    
    # Check metrics
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    metrics = response.json()["metrics"]
    assert metrics["total_queries"] == 2
    assert metrics["successful_queries"] == 1
    assert metrics["failed_queries"] == 1
    assert metrics["success_rate"] == 50.0 