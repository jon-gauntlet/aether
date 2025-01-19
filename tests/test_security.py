"""Tests for security module.

Christ is King! ☦
"""
import os
import ssl
import pytest
import tempfile
from pathlib import Path
from datetime import datetime, timedelta
from fastapi import FastAPI, Depends
from fastapi.testclient import TestClient
from rag_aether.core.security import (
    SecurityConfig,
    SecurityManager,
    SSLContextManager,
    RateLimiter,
    APIKeyAuth
)

@pytest.fixture
def ssl_certs():
    """Create temporary SSL certificates."""
    with tempfile.TemporaryDirectory() as temp_dir:
        # Generate certificates using our script
        from scripts.generate_ssl_cert import generate_ssl_cert
        generate_ssl_cert(temp_dir)
        
        cert_path = Path(temp_dir) / "cert.pem"
        key_path = Path(temp_dir) / "key.pem"
        
        yield {
            "cert_path": str(cert_path),
            "key_path": str(key_path)
        }

@pytest.fixture
def security_config(ssl_certs):
    """Create security configuration."""
    return SecurityConfig(
        ssl_cert_path=ssl_certs["cert_path"],
        ssl_key_path=ssl_certs["key_path"],
        rate_limit_requests=5,
        rate_limit_window=1
    )

@pytest.fixture
def security_manager(security_config):
    """Create security manager."""
    return SecurityManager(security_config)

@pytest.fixture
def test_app(security_manager):
    """Create test FastAPI application."""
    app = FastAPI()
    
    # Configure security
    security_manager.configure_security(app)
    
    # Add test endpoints
    @app.get("/test")
    async def test_endpoint():
        return {"message": "success"}
    
    @app.get("/protected")
    async def protected_endpoint(
        api_key: str = Depends(security_manager.verify_api_key())
    ):
        return {"message": "authenticated"}
    
    return app

@pytest.fixture
def test_client(test_app):
    """Create test client."""
    return TestClient(test_app)

def test_ssl_context(security_manager):
    """Test SSL context creation."""
    context = security_manager.get_ssl_context()
    assert isinstance(context, ssl.SSLContext)
    assert context.verify_mode == ssl.CERT_REQUIRED
    assert context.minimum_version == ssl.TLSVersion.TLSv1_2

def test_rate_limiter(test_client):
    """Test rate limiting."""
    # Make requests up to limit
    for _ in range(5):
        response = test_client.get("/test")
        assert response.status_code == 200
    
    # Next request should be rate limited
    response = test_client.get("/test")
    assert response.status_code == 429
    assert response.json()["detail"] == "Rate limit exceeded"
    
    # Wait for rate limit window to expire
    import time
    time.sleep(1)
    
    # Should be able to make requests again
    response = test_client.get("/test")
    assert response.status_code == 200

def test_api_key_auth(security_manager, test_client):
    """Test API key authentication."""
    # Generate API key
    api_key = security_manager.generate_api_key()
    
    # Test without API key
    response = test_client.get("/protected")
    assert response.status_code == 403
    
    # Test with invalid API key
    response = test_client.get(
        "/protected",
        headers={"X-API-Key": "invalid"}
    )
    assert response.status_code == 403
    
    # Test with valid API key
    response = test_client.get(
        "/protected",
        headers={"X-API-Key": api_key}
    )
    assert response.status_code == 200
    assert response.json()["message"] == "authenticated"

def test_request_size_limit(test_client):
    """Test request size limiting."""
    # Create large data (11MB)
    large_data = "x" * (11 * 1024 * 1024)
    
    # Test with large request
    response = test_client.post(
        "/test",
        json={"data": large_data}
    )
    assert response.status_code == 413
    assert response.json()["detail"] == "Request too large"
    
    # Test with small request (1MB)
    small_data = "x" * (1 * 1024 * 1024)
    response = test_client.post(
        "/test",
        json={"data": small_data}
    )
    assert response.status_code == 200

def test_cors_config(test_client):
    """Test CORS configuration."""
    # Test preflight request
    response = test_client.options(
        "/test",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "X-API-Key"
        }
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "*"
    assert "GET" in response.headers["access-control-allow-methods"]
    assert "X-API-Key" in response.headers["access-control-allow-headers"]
    
    # Test actual request
    response = test_client.get(
        "/test",
        headers={"Origin": "http://localhost:3000"}
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "*" 