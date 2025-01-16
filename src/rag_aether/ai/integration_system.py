"""Integration system for RAG external service connections."""
from typing import List, Dict, Any, Optional, Tuple, Set, Union, AsyncGenerator, Callable
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
    """System for managing external service integrations."""
    
    def __init__(self):
        """Initialize integration system."""
        self.services: Dict[str, ServiceConnector] = {}
        self.logger = logging.getLogger("integration_system")
        
    async def register_service(
        self,
        config: ServiceConfig
    ) -> ServiceConnector:
        """Register new service."""
        if config.name in self.services:
            raise ValueError(f"Service {config.name} already registered")
            
        connector = ServiceConnector(config)
        await connector.connect()
        
        self.services[config.name] = connector
        self.logger.info(f"Registered service: {config.name}")
        
        return connector
        
    async def unregister_service(self, name: str):
        """Unregister service."""
        if name not in self.services:
            raise ValueError(f"Service {name} not registered")
            
        connector = self.services[name]
        await connector.disconnect()
        
        del self.services[name]
        self.logger.info(f"Unregistered service: {name}")
        
    def get_service(self, name: str) -> ServiceConnector:
        """Get service connector by name."""
        if name not in self.services:
            raise ValueError(f"Service {name} not registered")
        return self.services[name]
        
    async def health_check(self) -> Dict[str, bool]:
        """Check health of all registered services."""
        results = {}
        
        for name, connector in self.services.items():
            try:
                # Make simple request to check health
                await connector.request("GET", "/health")
                results[name] = True
            except Exception as e:
                self.logger.error(f"Health check failed for {name}: {str(e)}")
                results[name] = False
                
        return results
        
    async def __aenter__(self):
        """Enter async context."""
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Exit async context."""
        # Disconnect all services
        for name in list(self.services.keys()):
            await self.unregister_service(name)
            
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