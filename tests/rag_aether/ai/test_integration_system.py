"""Tests for RAG integration system."""
import pytest
import aiohttp
import asyncio
from unittest.mock import Mock, patch
from datetime import datetime

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