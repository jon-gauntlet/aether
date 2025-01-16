"""Integration tests for the RAG system."""

import pytest
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
from rag_aether.api.endpoints import app
from rag_aether.ai.rag_system import RAGSystem
from rag_aether.ai.query_expansion import QueryExpander

# Mock the model initialization
@pytest.fixture(autouse=True)
def mock_models():
    with patch("transformers.T5Tokenizer.from_pretrained") as mock_tokenizer, \
         patch("transformers.T5ForConditionalGeneration.from_pretrained") as mock_model:
        # Set up mock tokenizer
        mock_tokenizer.return_value = Mock()
        mock_tokenizer.return_value.encode = lambda x, **kwargs: [1, 2, 3]
        mock_tokenizer.return_value.decode = lambda x, **kwargs: "decoded text"
        
        # Set up mock model
        mock_model.return_value = Mock()
        mock_model.return_value.to = lambda device: mock_model.return_value
        mock_model.return_value.generate = lambda **kwargs: [[1, 2, 3]]
        
        yield

@pytest.fixture
def test_client():
    """Create a test client."""
    return TestClient(app)

@pytest.mark.asyncio
async def test_query_endpoint(test_client):
    """Test the query endpoint."""
    response = test_client.post(
        "/query",
        json={"query": "test query", "context": {"test": "context"}}
    )
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert "metadata" in data

@pytest.mark.asyncio
async def test_expand_endpoint(test_client):
    """Test the query expansion endpoint."""
    response = test_client.post(
        "/expand",
        json={"query": "test query"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "expanded_queries" in data
    assert "metadata" in data

@pytest.mark.asyncio
async def test_health_endpoint(test_client):
    """Test the health check endpoint."""
    response = test_client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

@pytest.mark.asyncio
async def test_metrics_endpoint(test_client):
    """Test the metrics endpoint."""
    response = test_client.get("/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "query_count" in data
    assert "average_latency" in data

@pytest.mark.asyncio
async def test_batch_query_endpoint(test_client):
    """Test the batch query endpoint."""
    response = test_client.post(
        "/batch",
        json={
            "queries": ["query1", "query2"],
            "context": {"test": "context"}
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert len(data["results"]) == 2

@pytest.mark.asyncio
async def test_error_handling(test_client):
    """Test error handling."""
    # Test empty query
    response = test_client.post(
        "/query",
        json={"query": "", "context": {}}
    )
    assert response.status_code == 400
    
    # Test invalid JSON
    response = test_client.post(
        "/query",
        data="invalid json"
    )
    assert response.status_code == 422

@pytest.mark.asyncio
async def test_rag_system_initialization():
    """Test RAG system initialization."""
    rag = RAGSystem(use_mock=True)
    assert rag.query_expander is not None
    assert rag.retriever is not None
    assert rag.reranker is not None

@pytest.mark.asyncio
async def test_query_expansion():
    """Test query expansion."""
    expander = QueryExpander()
    result = await expander.expand_query("test query")
    assert "original_query" in result
    assert "expanded_queries" in result
    assert len(result["expanded_queries"]) > 0 