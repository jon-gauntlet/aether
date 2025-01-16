"""Integration system for RAG external service connections."""
from typing import List, Dict, Any, Optional, Tuple, Set, Union, AsyncGenerator, Callable, AsyncIterator
from dataclasses import dataclass
import asyncio
import aiohttp
import json
import logging
from datetime import datetime
from functools import wraps

@dataclass
class ServiceConfig:
    """Configuration for external service."""
    name: str
    endpoint: str
    api_key: Optional[str] = None
    timeout: float = 30.0
    retry_count: int = 3
    retry_delay: float = 1.0
    headers: Optional[Dict[str, str]] = None
    params: Optional[Dict[str, Any]] = None

@dataclass
class ServiceResponse:
    """Response from external service."""
    status: int
    data: Any
    headers: Dict[str, str]
    latency: float
    timestamp: str
    service: str

class IntegrationError(Exception):
    """Base error for integration issues."""
    def __init__(self, message: str, service: str, details: Optional[Dict[str, Any]] = None):
        self.service = service
        self.details = details or {}
        super().__init__(f"{service}: {message}")

def with_error_handling(func: Callable):
    """Decorator for handling integration errors."""
    @wraps(func)
    async def wrapper(self, *args, **kwargs):
        try:
            return await func(self, *args, **kwargs)
        except aiohttp.ClientError as e:
            raise IntegrationError(
                f"Connection error: {str(e)}",
                self.name,
                {"error_type": "connection"}
            )
        except asyncio.TimeoutError:
            raise IntegrationError(
                "Request timed out",
                self.name,
                {"error_type": "timeout"}
            )
        except Exception as e:
            raise IntegrationError(
                f"Unexpected error: {str(e)}",
                self.name,
                {"error_type": "unexpected"}
            )
    return wrapper

class ServiceConnector:
    """Base connector for external services."""
    
    def __init__(self, config: ServiceConfig):
        """Initialize service connector."""
        self.config = config
        self.name = config.name
        self._session: Optional[aiohttp.ClientSession] = None
        self.logger = logging.getLogger(f"integration.{self.name}")
        
    async def __aenter__(self):
        """Enter async context."""
        await self.connect()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Exit async context."""
        await self.disconnect()
        
    async def connect(self):
        """Establish connection to service."""
        if self._session is None:
            self._session = aiohttp.ClientSession(
                headers=self._get_headers(),
                timeout=aiohttp.ClientTimeout(total=self.config.timeout)
            )
            
    async def disconnect(self):
        """Close service connection."""
        if self._session is not None:
            await self._session.close()
            self._session = None
            
    def _get_headers(self) -> Dict[str, str]:
        """Get request headers."""
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        if self.config.api_key:
            headers["Authorization"] = f"Bearer {self.config.api_key}"
        if self.config.headers:
            headers.update(self.config.headers)
        return headers
        
    @with_error_handling
    async def request(
        self,
        method: str,
        path: str,
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None
    ) -> ServiceResponse:
        """Make request to service."""
        if self._session is None:
            await self.connect()
            
        start_time = datetime.now()
        
        # Merge request params
        request_params = self.config.params.copy() if self.config.params else {}
        if params:
            request_params.update(params)
            
        # Make request with retries
        for attempt in range(self.config.retry_count):
            try:
                async with self._session.request(
                    method,
                    f"{self.config.endpoint}/{path.lstrip('/')}",
                    json=data,
                    params=request_params
                ) as response:
                    response_data = await response.json()
                    end_time = datetime.now()
                    
                    return ServiceResponse(
                        status=response.status,
                        data=response_data,
                        headers=dict(response.headers),
                        latency=(end_time - start_time).total_seconds(),
                        timestamp=end_time.isoformat(),
                        service=self.name
                    )
            except Exception as e:
                if attempt == self.config.retry_count - 1:
                    raise
                await asyncio.sleep(self.config.retry_delay * (attempt + 1))

class IntegrationSystem:
    """System for integrating with external services."""

    def __init__(self):
        self.services: Dict[str, ServiceConnector] = {}
        self.health = SystemHealth()
        self.metrics = MetricsTracker()

    async def register_service(
        self,
        config: ServiceConfig
    ) -> ServiceConnector:
        """Register a new service.
        
        Args:
            config: Service configuration
            
        Returns:
            ServiceConnector for the registered service
        """
        service_id = config.service_id
        if service_id in self.services:
            raise IntegrationError(f"Service {service_id} already registered")
            
        connector = ServiceConnector(config)
        self.services[service_id] = connector
        
        # Test connection
        try:
            await connector.test_connection()
        except Exception as e:
            del self.services[service_id]
            raise IntegrationError(f"Failed to connect to {service_id}: {e}")
            
        return connector

    async def stream_response(
        self,
        service_id: str,
        endpoint: str,
        data: Dict[str, Any]
    ) -> AsyncIterator[Dict[str, Any]]:
        """Stream response from a service.
        
        Args:
            service_id: ID of the service to stream from
            endpoint: Service endpoint
            data: Request data
            
        Yields:
            Response chunks from the service
        """
        if service_id not in self.services:
            raise IntegrationError(f"Service {service_id} not registered")
            
        connector = self.services[service_id]
        async for chunk in connector.stream(endpoint, data):
            yield chunk

    @with_error_handling
    async def request(
        self,
        service_id: str,
        method: str,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Make a request to a service.
        
        Args:
            service_id: ID of the service
            method: HTTP method
            endpoint: Service endpoint
            data: Request data
            
        Returns:
            Response from the service
        """
        if service_id not in self.services:
            raise IntegrationError(f"Service {service_id} not registered")
            
        connector = self.services[service_id]
        return await connector.request(method, endpoint, data)

class APIConnector(ServiceConnector):
    """Connector for REST APIs."""
    
    async def get(
        self,
        path: str,
        params: Optional[Dict[str, Any]] = None
    ) -> ServiceResponse:
        """Make GET request."""
        return await self.request("GET", path, params=params)
        
    async def post(
        self,
        path: str,
        data: Dict[str, Any],
        params: Optional[Dict[str, Any]] = None
    ) -> ServiceResponse:
        """Make POST request."""
        return await self.request("POST", path, data=data, params=params)
        
    async def put(
        self,
        path: str,
        data: Dict[str, Any],
        params: Optional[Dict[str, Any]] = None
    ) -> ServiceResponse:
        """Make PUT request."""
        return await self.request("PUT", path, data=data, params=params)
        
    async def delete(
        self,
        path: str,
        params: Optional[Dict[str, Any]] = None
    ) -> ServiceResponse:
        """Make DELETE request."""
        return await self.request("DELETE", path, params=params)

class WebhookConnector(ServiceConnector):
    """Connector for webhook integrations."""
    
    async def send_event(
        self,
        event_type: str,
        payload: Dict[str, Any]
    ) -> ServiceResponse:
        """Send webhook event."""
        data = {
            "event": event_type,
            "timestamp": datetime.now().isoformat(),
            "payload": payload
        }
        return await self.request("POST", "", data=data)
        
    async def verify_signature(self, signature: str, payload: bytes) -> bool:
        """Verify webhook signature."""
        if not self.config.api_key:
            return False
            
        import hmac
        import hashlib
        
        expected = hmac.new(
            self.config.api_key.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(signature, expected)

class StreamingConnector(ServiceConnector):
    """Connector for streaming APIs."""
    
    async def stream(
        self,
        path: str,
        params: Optional[Dict[str, Any]] = None
    ) -> AsyncGenerator[Any, None]:
        """Stream data from endpoint."""
        if self._session is None:
            await self.connect()
            
        async with self._session.get(
            f"{self.config.endpoint}/{path.lstrip('/')}",
            params=params
        ) as response:
            async for line in response.content:
                if line:
                    yield json.loads(line) 