"""Security module for RAG system.

Christ is King! ☦
"""
import os
import ssl
import time
import logging
import secrets
from typing import Dict, Optional, Callable
from dataclasses import dataclass
from functools import wraps
from datetime import datetime, timedelta
from fastapi import HTTPException, Security, Depends
from fastapi.security import APIKeyHeader
from starlette.requests import Request
from starlette.responses import Response

# Configure logging
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

@dataclass
class SecurityConfig:
    """Security configuration."""
    ssl_cert_path: str = os.getenv("SSL_CERT_PATH", "config/ssl/cert.pem")
    ssl_key_path: str = os.getenv("SSL_KEY_PATH", "config/ssl/key.pem")
    api_key_header: str = "X-API-Key"
    rate_limit_requests: int = 1000
    rate_limit_window: int = 60  # seconds
    max_request_size: int = 10 * 1024 * 1024  # 10MB
    allowed_origins: list = None
    allowed_methods: list = None

class SSLContextManager:
    """Manages SSL context for secure connections."""
    
    def __init__(self, config: SecurityConfig):
        """Initialize SSL context manager.
        
        Args:
            config: Security configuration
        """
        self.config = config
        self._context = None
    
    def get_context(self) -> ssl.SSLContext:
        """Get SSL context.
        
        Returns:
            SSL context for secure connections
        """
        if self._context is None:
            self._context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
            self._context.load_cert_chain(
                certfile=self.config.ssl_cert_path,
                keyfile=self.config.ssl_key_path
            )
            # Set secure protocols and ciphers
            self._context.options |= (
                ssl.OP_NO_SSLv2 | 
                ssl.OP_NO_SSLv3 | 
                ssl.OP_NO_TLSv1 | 
                ssl.OP_NO_TLSv1_1
            )
            self._context.set_ciphers('ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384')
        return self._context

class RateLimiter:
    """Rate limiter for API endpoints."""
    
    def __init__(self, config: SecurityConfig):
        """Initialize rate limiter.
        
        Args:
            config: Security configuration
        """
        self.config = config
        self._requests: Dict[str, list] = {}
    
    def _clean_old_requests(self, client_id: str):
        """Clean old requests for a client.
        
        Args:
            client_id: Client identifier
        """
        if client_id in self._requests:
            cutoff = datetime.now() - timedelta(seconds=self.config.rate_limit_window)
            self._requests[client_id] = [
                ts for ts in self._requests[client_id]
                if ts > cutoff
            ]
    
    def is_rate_limited(self, client_id: str) -> bool:
        """Check if a client is rate limited.
        
        Args:
            client_id: Client identifier
        
        Returns:
            True if rate limited, False otherwise
        """
        self._clean_old_requests(client_id)
        
        if client_id not in self._requests:
            self._requests[client_id] = []
        
        request_count = len(self._requests[client_id])
        if request_count >= self.config.rate_limit_requests:
            return True
        
        self._requests[client_id].append(datetime.now())
        return False

class APIKeyAuth:
    """API key authentication."""
    
    def __init__(self, config: SecurityConfig):
        """Initialize API key authentication.
        
        Args:
            config: Security configuration
        """
        self.config = config
        self.api_key_header = APIKeyHeader(name=config.api_key_header)
        self._api_keys = set()
    
    def add_api_key(self, api_key: str):
        """Add an API key.
        
        Args:
            api_key: API key to add
        """
        self._api_keys.add(api_key)
    
    def remove_api_key(self, api_key: str):
        """Remove an API key.
        
        Args:
            api_key: API key to remove
        """
        self._api_keys.discard(api_key)
    
    def generate_api_key(self) -> str:
        """Generate a new API key.
        
        Returns:
            New API key
        """
        api_key = secrets.token_urlsafe(32)
        self.add_api_key(api_key)
        return api_key
    
    async def verify_api_key(
        self,
        api_key: str = Security(APIKeyHeader(name="X-API-Key"))
    ) -> str:
        """Verify an API key.
        
        Args:
            api_key: API key to verify
        
        Returns:
            API key if valid
        
        Raises:
            HTTPException: If API key is invalid
        """
        if api_key not in self._api_keys:
            raise HTTPException(
                status_code=403,
                detail="Invalid API key"
            )
        return api_key

class SecurityManager:
    """Security manager for the RAG system."""
    
    def __init__(self, config: Optional[SecurityConfig] = None):
        """Initialize security manager.
        
        Args:
            config: Security configuration
        """
        self.config = config or SecurityConfig()
        self.ssl_manager = SSLContextManager(self.config)
        self.rate_limiter = RateLimiter(self.config)
        self.api_auth = APIKeyAuth(self.config)
    
    def get_ssl_context(self) -> ssl.SSLContext:
        """Get SSL context.
        
        Returns:
            SSL context for secure connections
        """
        return self.ssl_manager.get_context()
    
    def rate_limit(self) -> Callable:
        """Rate limiting middleware.
        
        Returns:
            Middleware function
        """
        async def middleware(request: Request, call_next):
            client_id = request.client.host
            
            if self.rate_limiter.is_rate_limited(client_id):
                raise HTTPException(
                    status_code=429,
                    detail="Rate limit exceeded"
                )
            
            response = await call_next(request)
            return response
        
        return middleware
    
    def verify_api_key(self) -> Callable:
        """API key verification dependency.
        
        Returns:
            Dependency function
        """
        return self.api_auth.verify_api_key
    
    def generate_api_key(self) -> str:
        """Generate a new API key.
        
        Returns:
            New API key
        """
        return self.api_auth.generate_api_key()
    
    def configure_cors(self, app):
        """Configure CORS for the application.
        
        Args:
            app: FastAPI application
        """
        from fastapi.middleware.cors import CORSMiddleware
        
        app.add_middleware(
            CORSMiddleware,
            allow_origins=self.config.allowed_origins or ["*"],
            allow_methods=self.config.allowed_methods or ["*"],
            allow_headers=["*"],
            allow_credentials=True,
        )
    
    def configure_security(self, app):
        """Configure security for the application.
        
        Args:
            app: FastAPI application
        """
        # Add rate limiting middleware
        app.middleware("http")(self.rate_limit())
        
        # Configure CORS
        self.configure_cors(app)
        
        # Add request size limit middleware
        @app.middleware("http")
        async def check_request_size(request: Request, call_next):
            if request.headers.get("content-length"):
                content_length = int(request.headers["content-length"])
                if content_length > self.config.max_request_size:
                    raise HTTPException(
                        status_code=413,
                        detail="Request too large"
                    )
            return await call_next(request)

# Global security manager instance
security_manager = SecurityManager() 