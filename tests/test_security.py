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
import json
from websocket.security import Validator, Sanitizer, AuditLogger

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

@pytest.fixture
def validator(security_config):
    return Validator(security_config)

@pytest.fixture
def sanitizer(security_config):
    return Sanitizer(security_config)

@pytest.fixture
def audit_logger(security_config):
    logger = AuditLogger(security_config)
    yield logger
    # Cleanup audit log file after tests
    if os.path.exists(security_config.audit_log_path):
        os.remove(security_config.audit_log_path)

def test_message_size_validation(validator):
    # Test message within size limit
    small_message = {
        "type": "message",
        "content": "Hello",
        "channel": "test"
    }
    success, error = validator.validate_message(small_message)
    assert success
    assert error is None

    # Test message exceeding size limit
    large_message = {
        "type": "message",
        "content": "x" * 1024,
        "channel": "test"
    }
    success, error = validator.validate_message(large_message)
    assert not success
    assert "exceeds maximum size" in error

def test_message_type_validation(validator):
    # Test allowed message type
    valid_message = {
        "type": "message",
        "content": "Hello",
        "channel": "test"
    }
    success, error = validator.validate_message(valid_message)
    assert success
    assert error is None

    # Test disallowed message type
    invalid_message = {
        "type": "unknown",
        "content": "Hello",
        "channel": "test"
    }
    success, error = validator.validate_message(invalid_message)
    assert not success
    assert "Invalid message type" in error

def test_field_validation(validator):
    # Test required field missing
    missing_field = {
        "type": "message",
        "channel": "test"
    }
    success, error = validator.validate_message(missing_field)
    assert not success
    assert "Missing required field" in error

    # Test field pattern validation
    invalid_channel = {
        "type": "message",
        "content": "Hello",
        "channel": "test@invalid"
    }
    success, error = validator.validate_message(invalid_channel)
    assert not success
    assert "Invalid format" in error

def test_sanitize_message(sanitizer):
    # Test basic string sanitization
    message = {
        "content": "<script>alert('xss')</script><b>Hello</b>",
        "metadata": {
            "note": "<i>Important</i><img src=x onerror=alert('xss')>"
        }
    }
    sanitized = sanitizer.sanitize_message(message)
    
    assert "<script>" not in sanitized["content"]
    assert "<b>Hello</b>" in sanitized["content"]
    assert "<i>Important</i>" in sanitized["metadata"]["note"]
    assert "<img" not in sanitized["metadata"]["note"]

def test_sanitize_nested_structures(sanitizer):
    # Test sanitization of nested structures
    message = {
        "content": "<p>Test</p>",
        "parts": [
            {"text": "<b>Part 1</b>"},
            {"text": "<script>alert('xss')</script>"},
            {"text": "<i>Part 3</i>"}
        ]
    }
    sanitized = sanitizer.sanitize_message(message)
    
    assert "<p>" not in sanitized["content"]
    assert "<b>Part 1</b>" in sanitized["parts"][0]["text"]
    assert "<script>" not in sanitized["parts"][1]["text"]
    assert "<i>Part 3</i>" in sanitized["parts"][2]["text"]

def test_audit_logging(audit_logger):
    # Test authentication attempt logging
    audit_logger.log_auth_attempt(
        user_id="test_user",
        success=True,
        details="Successful login"
    )

    # Test message validation logging
    audit_logger.log_message_validation(
        message_type="message",
        success=True,
        details="Message validated successfully"
    )

    # Test permission check logging
    audit_logger.log_permission_check(
        user_id="test_user",
        permission="send_message",
        granted=True
    )

    # Test rate limit logging
    audit_logger.log_rate_limit(
        user_id="test_user",
        limit_type="message",
        current=5,
        max_allowed=10
    )

    # Verify log file exists and contains entries
    assert os.path.exists(audit_logger.config.audit_log_path)
    with open(audit_logger.config.audit_log_path, 'r') as f:
        log_content = f.read()
        assert "auth_attempt" in log_content
        assert "message_validation" in log_content
        assert "permission_check" in log_content
        assert "rate_limit" in log_content

def test_audit_log_format(audit_logger):
    # Test log entry format
    test_event = {
        "event": "test_event",
        "user_id": "test_user",
        "action": "test_action",
        "status": "success"
    }
    audit_logger.log_security_event("test_event", test_event)

    with open(audit_logger.config.audit_log_path, 'r') as f:
        last_line = f.readlines()[-1]
        log_entry = json.loads(last_line.split(" - ")[-1])
        
        assert log_entry["event"] == "test_event"
        assert log_entry["user_id"] == "test_user"
        assert log_entry["action"] == "test_action"
        assert log_entry["status"] == "success"
        assert "timestamp" in log_entry

def test_validator_error_handling(validator):
    # Test handling of invalid data types
    invalid_type = {
        "type": "message",
        "content": 123,  # Should be string
        "channel": "test"
    }
    success, error = validator.validate_message(invalid_type)
    assert not success
    assert "Invalid type" in error

    # Test handling of invalid JSON
    class UnserializableObject:
        pass
    invalid_json = {
        "type": "message",
        "content": UnserializableObject(),
        "channel": "test"
    }
    success, error = validator.validate_message(invalid_json)
    assert not success

def test_sanitizer_error_handling(sanitizer):
    # Test handling of invalid input types
    invalid_input = {
        "content": object(),  # Unsupported type
        "text": "valid text"
    }
    sanitized = sanitizer.sanitize_message(invalid_input)
    assert "text" in sanitized  # Valid field should still be processed
    assert "content" in sanitized  # Invalid field should be included but not modified 