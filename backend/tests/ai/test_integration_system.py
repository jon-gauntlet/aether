"""Tests for RAG integration system."""
import pytest
import aiohttp
import asyncio
from unittest.mock import Mock, patch
from datetime import datetime, timedelta
from typing import Dict, List
import numpy as np

from rag_aether.ai.integration_system import (
    IntegrationSystem,
    ServiceConfig,
    ServiceConnector,
    APIConnector,
    WebhookConnector,
    StreamingConnector,
    IntegrationError,
    ServiceResponse
)
from rag_aether.ai.rag_system import RAGSystem
from rag_aether.core.metrics import MetricsTracker

@pytest.fixture
def mock_response():
    """Fixture for mock response."""
    return {
        "status": "success",
        "data": {"key": "value"}
    }

@pytest.fixture
def service_config():
    """Fixture for service configuration."""
    return ServiceConfig(
        name="test_service",
        endpoint="http://test.api",
        api_key="test_key",
        timeout=5.0
    )

@pytest.fixture
async def integration_system():
    """Fixture for integration system."""
    system = IntegrationSystem()
    yield system
    # Cleanup
    for name in list(system.services.keys()):
        await system.unregister_service(name)

@pytest.fixture
def rag_system():
    """Create a RAG system with production features"""
    return RAGSystem(use_production_features=True)

@pytest.fixture
def sample_messages():
    """Create sample messages for testing"""
    return [
        {
            "content": "Hello, this is a test message",
            "channel": "general",
            "user_id": "user1",
            "timestamp": datetime.now().timestamp(),
            "thread_id": "thread1"
        },
        {
            "content": "This is a response in the same thread",
            "channel": "general",
            "user_id": "user2",
            "timestamp": (datetime.now() + timedelta(minutes=5)).timestamp(),
            "thread_id": "thread1"
        },
        {
            "content": "This is in a different channel",
            "channel": "random",
            "user_id": "user1",
            "timestamp": (datetime.now() + timedelta(minutes=10)).timestamp(),
            "thread_id": None
        }
    ]

@pytest.mark.asyncio
async def test_service_registration(integration_system, service_config):
    """Test service registration and unregistration."""
    # Register service
    connector = await integration_system.register_service(service_config)
    assert connector.name == service_config.name
    assert service_config.name in integration_system.services
    
    # Try registering same service
    with pytest.raises(ValueError):
        await integration_system.register_service(service_config)
        
    # Unregister service
    await integration_system.unregister_service(service_config.name)
    assert service_config.name not in integration_system.services
    
    # Try unregistering non-existent service
    with pytest.raises(ValueError):
        await integration_system.unregister_service("nonexistent")

@pytest.mark.asyncio
async def test_service_connector(service_config, mock_response):
    """Test service connector functionality."""
    async with ServiceConnector(service_config) as connector:
        # Mock aiohttp response
        mock_resp = Mock()
        mock_resp.status = 200
        mock_resp.json = Mock(return_value=mock_response)
        mock_resp.headers = {"Content-Type": "application/json"}
        
        # Mock ClientSession
        with patch("aiohttp.ClientSession.request") as mock_request:
            mock_request.return_value.__aenter__.return_value = mock_resp
            
            # Test request
            response = await connector.request(
                "GET",
                "/test",
                params={"param": "value"}
            )
            
            assert response.status == 200
            assert response.data == mock_response
            assert response.service == service_config.name
            
            # Verify request was made correctly
            mock_request.assert_called_with(
                "GET",
                "http://test.api/test",
                json=None,
                params={"param": "value"}
            )

@pytest.mark.asyncio
async def test_api_connector(service_config, mock_response):
    """Test API connector methods."""
    async with APIConnector(service_config) as connector:
        # Mock responses
        mock_resp = Mock()
        mock_resp.status = 200
        mock_resp.json = Mock(return_value=mock_response)
        mock_resp.headers = {"Content-Type": "application/json"}
        
        with patch("aiohttp.ClientSession.request") as mock_request:
            mock_request.return_value.__aenter__.return_value = mock_resp
            
            # Test GET
            response = await connector.get("/test", {"param": "value"})
            assert response.status == 200
            assert response.data == mock_response
            
            # Test POST
            data = {"test": "data"}
            response = await connector.post("/test", data)
            assert response.status == 200
            assert response.data == mock_response
            
            # Test PUT
            response = await connector.put("/test", data)
            assert response.status == 200
            assert response.data == mock_response
            
            # Test DELETE
            response = await connector.delete("/test")
            assert response.status == 200
            assert response.data == mock_response

@pytest.mark.asyncio
async def test_webhook_connector(service_config):
    """Test webhook connector functionality."""
    async with WebhookConnector(service_config) as connector:
        # Test event sending
        event_data = {
            "type": "test_event",
            "data": {"key": "value"}
        }
        
        mock_resp = Mock()
        mock_resp.status = 200
        mock_resp.json = Mock(return_value={"received": True})
        mock_resp.headers = {"Content-Type": "application/json"}
        
        with patch("aiohttp.ClientSession.request") as mock_request:
            mock_request.return_value.__aenter__.return_value = mock_resp
            
            response = await connector.send_event(
                "test_event",
                event_data
            )
            
            assert response.status == 200
            assert response.data["received"] is True
            
        # Test signature verification
        payload = b'{"test": "data"}'
        signature = "valid_signature"
        
        # Test valid signature
        with patch("hmac.compare_digest", return_value=True):
            assert await connector.verify_signature(signature, payload)
            
        # Test invalid signature
        with patch("hmac.compare_digest", return_value=False):
            assert not await connector.verify_signature(signature, payload)

@pytest.mark.asyncio
async def test_streaming_connector(service_config):
    """Test streaming connector functionality."""
    async with StreamingConnector(service_config) as connector:
        # Mock streaming response
        mock_resp = Mock()
        mock_resp.content = [
            b'{"chunk": 1}\n',
            b'{"chunk": 2}\n',
            b'{"chunk": 3}\n'
        ]
        
        with patch("aiohttp.ClientSession.get") as mock_get:
            mock_get.return_value.__aenter__.return_value = mock_resp
            
            chunks = []
            async for chunk in connector.stream("/stream"):
                chunks.append(chunk)
                
            assert len(chunks) == 3
            assert chunks[0]["chunk"] == 1
            assert chunks[2]["chunk"] == 3

@pytest.mark.asyncio
async def test_error_handling(service_config):
    """Test error handling in connectors."""
    async with ServiceConnector(service_config) as connector:
        # Test connection error
        with patch("aiohttp.ClientSession.request") as mock_request:
            mock_request.side_effect = aiohttp.ClientError()
            
            with pytest.raises(IntegrationError) as exc_info:
                await connector.request("GET", "/test")
            assert exc_info.value.details["error_type"] == "connection"
            
        # Test timeout error
        with patch("aiohttp.ClientSession.request") as mock_request:
            mock_request.side_effect = asyncio.TimeoutError()
            
            with pytest.raises(IntegrationError) as exc_info:
                await connector.request("GET", "/test")
            assert exc_info.value.details["error_type"] == "timeout"

@pytest.mark.asyncio
async def test_health_check(integration_system, service_config):
    """Test health check functionality."""
    # Register services
    service1 = await integration_system.register_service(service_config)
    service2 = await integration_system.register_service(
        ServiceConfig(
            name="test_service_2",
            endpoint="http://test2.api"
        )
    )
    
    # Mock healthy service
    mock_resp1 = Mock()
    mock_resp1.status = 200
    mock_resp1.json = Mock(return_value={"status": "healthy"})
    mock_resp1.headers = {"Content-Type": "application/json"}
    
    # Mock unhealthy service
    mock_resp2 = Mock()
    mock_resp2.status = 500
    mock_resp2.json = Mock(side_effect=Exception("Service unhealthy"))
    
    with patch("aiohttp.ClientSession.request") as mock_request:
        mock_request.return_value.__aenter__.side_effect = [
            mock_resp1,  # First service healthy
            Exception("Connection failed")  # Second service unhealthy
        ]
        
        health_status = await integration_system.health_check()
        
        assert health_status["test_service"] is True
        assert health_status["test_service_2"] is False

@pytest.mark.asyncio
async def test_retry_mechanism(service_config):
    """Test request retry mechanism."""
    async with ServiceConnector(service_config) as connector:
        mock_resp = Mock()
        mock_resp.status = 200
        mock_resp.json = Mock(return_value={"success": True})
        mock_resp.headers = {"Content-Type": "application/json"}
        
        with patch("aiohttp.ClientSession.request") as mock_request:
            # First two attempts fail, third succeeds
            mock_request.return_value.__aenter__.side_effect = [
                Exception("First attempt"),
                Exception("Second attempt"),
                mock_resp
            ]
            
            response = await connector.request("GET", "/test")
            
            assert response.status == 200
            assert response.data["success"] is True
            assert mock_request.call_count == 3  # Verify retry count 

def test_production_features_integration(rag_system, sample_messages):
    """Test integration of production features"""
    # 1. Message ingestion with production features
    for msg in sample_messages:
        rag_system.ingest_message(msg)
    
    assert len(rag_system.messages) == len(sample_messages)
    assert rag_system.base_rag is not None
    
    # 2. Search with query expansion
    results = rag_system.search_context(
        "test message",
        k=2,
        channel="general"
    )
    
    assert len(results) <= 2
    assert all(r["channel"] == "general" for r in results)
    
    # 3. Enhanced context with production features
    context = rag_system.get_enhanced_context(
        "test message",
        include_channels=True,
        include_threads=True
    )
    
    assert "semantic_matches" in context
    assert len(context["semantic_matches"]) > 0
    
    # 4. Response generation with production features
    response = rag_system.generate_response(
        "What was the test message?",
        max_context_messages=2,
        format="json"
    )
    
    assert "answer" in response
    assert "metadata" in response
    assert "context" in response

def test_caching_integration(rag_system, sample_messages):
    """Test caching integration"""
    # 1. Ingest messages
    for msg in sample_messages:
        rag_system.ingest_message(msg)
    
    # 2. First search to populate cache
    query = "test message"
    first_results = rag_system.search_context(query, k=2)
    
    # 3. Second search should use cache
    with rag_system.metrics.track_operation("cached_search") as metrics:
        second_results = rag_system.search_context(query, k=2)
        
    assert metrics.duration < 0.1  # Cache lookup should be fast
    assert len(first_results) == len(second_results)

def test_quality_scoring_integration(rag_system, sample_messages):
    """Test quality scoring integration"""
    # 1. Ingest messages
    for msg in sample_messages:
        rag_system.ingest_message(msg)
    
    # 2. Search with quality scoring
    results = rag_system.search_context("test message", k=2)
    
    # Check relevance scores
    assert all(0 <= r["relevance_score"] <= 1.0 for r in results)
    
    # 3. Generate response with quality checks
    response = rag_system.generate_response(
        "What was discussed?",
        max_context_messages=2
    )
    
    assert response["metadata"]["num_context_messages"] > 0

def test_metrics_integration(rag_system, sample_messages):
    """Test metrics integration"""
    metrics = MetricsTracker()
    
    # 1. Track message ingestion
    with metrics.track_operation("batch_ingest"):
        for msg in sample_messages:
            rag_system.ingest_message(msg)
    
    assert metrics.get_operation_count("batch_ingest") == 1
    
    # 2. Track search operations
    with metrics.track_operation("search"):
        results = rag_system.search_context("test", k=2)
    
    assert metrics.get_operation_count("search") == 1
    assert metrics.get_average_duration("search") > 0

def test_error_handling_integration(rag_system):
    """Test error handling integration"""
    # 1. Invalid message format
    with pytest.raises(Exception):
        rag_system.ingest_message({"invalid": "message"})
    
    # 2. Empty query
    with pytest.raises(Exception):
        rag_system.search_context("")
    
    # 3. Invalid time window
    with pytest.raises(Exception):
        rag_system.search_context("test", time_window_hours=-1)

def test_concurrent_operations_integration(rag_system, sample_messages):
    """Test concurrent operations integration"""
    import concurrent.futures
    
    # 1. Concurrent message ingestion
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        futures = [
            executor.submit(rag_system.ingest_message, msg)
            for msg in sample_messages
        ]
        concurrent.futures.wait(futures)
    
    assert len(rag_system.messages) == len(sample_messages)
    
    # 2. Concurrent searches
    queries = ["test", "message", "channel"]
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        futures = [
            executor.submit(rag_system.search_context, q)
            for q in queries
        ]
        results = concurrent.futures.wait(futures)
    
    assert len(results.done) == len(queries)

# Run tests
if __name__ == "__main__":
    pytest.main([__file__]) 