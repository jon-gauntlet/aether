import os
import pytest
from httpx import AsyncClient
from unittest.mock import patch, Mock, AsyncMock
from fastapi import FastAPI
from rag_system.app.main import app
from rag_system.app.core.rag import RAGSystem, RAGResponse
import rag_system.app.core.rag as rag_module
from rag_system.app.api.endpoints import get_rag_system
from rag_system.app.core.monitoring import monitor, PerformanceMonitor

@pytest.fixture(autouse=True)
def reset_monitor():
    monitor.__init__()
    yield

@pytest.fixture
async def mock_rag_system():
    with patch.dict(os.environ, {"ANTHROPIC_API_KEY": "test_key"}):
        rag = RAGSystem()
        # Mock Anthropic client
        rag.anthropic = Mock()
        rag.anthropic.messages = AsyncMock()
        with patch.object(rag_module, "rag_system", rag):
            yield rag

@pytest.fixture
def override_get_rag_system(mock_rag_system):
    # Ensure RAG system is initialized
    app.dependency_overrides = {}
    app.dependency_overrides[get_rag_system] = lambda: mock_rag_system
    yield mock_rag_system
    app.dependency_overrides = {}

@pytest.mark.asyncio
async def test_health_check_no_api_key():
    with patch.dict(os.environ, {"ANTHROPIC_API_KEY": ""}):
        with patch.object(rag_module, "rag_system", None):
            async with AsyncClient(app=app, base_url="http://test") as client:
                response = await client.get("/api/v1/health")
                assert response.status_code == 200
                data = response.json()
                assert data["status"] == "healthy"
                assert data["rag_system_ready"] is False
                assert "not initialized" in data["message"]
                # Verify empty metrics
                assert data["metrics"]["document_count"] == 0
                assert data["metrics"]["total_queries"] == 0
                assert data["metrics"]["successful_queries"] == 0
                assert data["metrics"]["failed_queries"] == 0

@pytest.mark.asyncio
async def test_query_no_api_key():
    with patch.dict(os.environ, {"ANTHROPIC_API_KEY": ""}):
        with patch.object(rag_module, "rag_system", None):
            async with AsyncClient(app=app, base_url="http://test") as client:
                response = await client.post(
                    "/api/v1/query",
                    json={"question": "test question"}
                )
                assert response.status_code == 503
                assert "not initialized" in response.json()["detail"]

@pytest.mark.asyncio
async def test_add_document_empty_content(mock_rag_system, override_get_rag_system):
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/documents/test-doc",
            json={"content": "", "metadata": {"type": "test"}}
        )
        assert response.status_code == 400
        assert "empty" in response.json()["detail"].lower()

@pytest.mark.asyncio
async def test_query_empty_question(mock_rag_system, override_get_rag_system):
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/query",
            json={"question": ""}
        )
        assert response.status_code == 400
        assert "empty" in response.json()["detail"].lower()

@pytest.mark.asyncio
async def test_query_no_documents(mock_rag_system, override_get_rag_system):
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/query",
            json={"question": "What is the capital of France?"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "no documents" in data["answer"].lower()
        assert len(data["context"]) == 0

@pytest.mark.asyncio
async def test_successful_document_add_and_query(mock_rag_system, override_get_rag_system):
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Add a document
        doc_content = "The capital of France is Paris."
        response = await client.post(
            "/api/v1/documents/test-doc",
            json={"content": doc_content, "metadata": {"type": "test"}}
        )
        assert response.status_code == 200
        
        # Mock Anthropic response
        mock_response = Mock()
        mock_response.content = [Mock(text="Based on the context, Paris is the capital of France.")]
        mock_rag_system.anthropic.messages.create.return_value = mock_response
        
        # Query the document
        response = await client.post(
            "/api/v1/query",
            json={"question": "What is the capital of France?"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "paris" in data["answer"].lower()
        assert len(data["context"]) == 1
        assert doc_content in data["context"][0]

@pytest.mark.asyncio
async def test_monitoring_metrics(mock_rag_system, override_get_rag_system):
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Add a document first to ensure RAG system is initialized
        doc_content = "Test document content."
        response = await client.post(
            "/api/v1/documents/test-doc",
            json={"content": doc_content, "metadata": {"type": "test"}}
        )
        assert response.status_code == 200
        
        # Check initial metrics
        response = await client.get("/api/v1/health")
        assert response.status_code == 200
        initial_metrics = response.json()["metrics"]
        assert initial_metrics is not None
        assert initial_metrics["document_count"] == 1
        assert initial_metrics["total_queries"] == 0
        
        # Mock Anthropic response
        mock_response = Mock()
        mock_response.content = [Mock(text="Test response")]
        mock_rag_system.anthropic.messages.create.return_value = mock_response
        
        # Make a successful query
        response = await client.post(
            "/api/v1/query",
            json={"question": "Test question?"}
        )
        assert response.status_code == 200
        
        # Make a failed query
        response = await client.post(
            "/api/v1/query",
            json={"question": ""}
        )
        assert response.status_code == 400
        
        # Check final metrics
        response = await client.get("/api/v1/health")
        assert response.status_code == 200
        metrics = response.json()["metrics"]
        assert metrics["document_count"] == 1
        assert metrics["total_queries"] == 2
        assert metrics["successful_queries"] == 1
        assert metrics["failed_queries"] == 1
        assert metrics["success_rate"] == 50.0 