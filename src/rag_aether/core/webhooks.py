"""Webhook implementation for RAG system."""
from typing import Dict, Any, List, Optional, Callable, Awaitable
import asyncio
import aiohttp
import json
from dataclasses import dataclass
from datetime import datetime
from rag_aether.core.logging import get_logger
from rag_aether.core.errors import WebhookError
from rag_aether.core.performance import with_performance_monitoring

logger = get_logger("webhooks")

# Event types
EVENT_QUERY = "query"
EVENT_RESPONSE = "response"
EVENT_INGEST = "ingest"
EVENT_INGESTION = "ingestion"  # Alias for EVENT_INGEST
EVENT_ERROR = "error"
EVENT_HEALTH = "health"
EVENT_METRICS = "metrics"
EVENT_ALERT = "alert"
EVENT_RATE_LIMIT = "rate_limit"
EVENT_QUALITY = "quality"

@dataclass
class WebhookConfig:
    """Webhook configuration."""
    url: str
    secret: Optional[str] = None
    timeout: float = 5.0
    max_retries: int = 3
    retry_delay: float = 1.0
    headers: Optional[Dict[str, str]] = None

@dataclass
class WebhookEvent:
    """Webhook event data."""
    event_type: str
    payload: Dict[str, Any]
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class WebhookMetrics:
    """Metrics for webhook operations."""
    total_events: int = 0
    successful_events: int = 0
    failed_events: int = 0
    total_retries: int = 0
    avg_latency: float = 0.0
    last_success: Optional[datetime] = None
    last_failure: Optional[datetime] = None

class WebhookEmitter:
    """Emit webhook events to configured endpoints."""
    
    def __init__(
        self,
        config: WebhookConfig,
        name: str = "default"
    ):
        """Initialize webhook emitter."""
        self.config = config
        self.name = name
        self.metrics = WebhookMetrics()
        self.session: Optional[aiohttp.ClientSession] = None
        logger.info(
            f"Initialized webhook emitter: {name}",
            extra={"url": config.url}
        )
        
    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create HTTP session."""
        if not self.session:
            self.session = aiohttp.ClientSession(
                headers=self.config.headers or {}
            )
        return self.session
        
    async def _send_event(self, event: WebhookEvent) -> None:
        """Send event to webhook endpoint."""
        session = await self._get_session()
        
        payload = {
            "event_type": event.event_type,
            "payload": event.payload,
            "timestamp": event.timestamp.isoformat(),
            "metadata": event.metadata or {}
        }
        
        for attempt in range(self.config.max_retries):
            try:
                start_time = datetime.now()
                async with session.post(
                    self.config.url,
                    json=payload,
                    timeout=self.config.timeout
                ) as response:
                    duration = (datetime.now() - start_time).total_seconds()
                    
                    if response.status < 400:
                        self.metrics.successful_events += 1
                        self.metrics.last_success = datetime.now()
                        self.metrics.avg_latency = (
                            (self.metrics.avg_latency * (self.metrics.successful_events - 1) + duration) /
                            self.metrics.successful_events
                        )
                        return
                        
                    error_data = await response.text()
                    logger.error(
                        f"Webhook request failed with status {response.status}",
                        extra={
                            "status": response.status,
                            "response": error_data,
                            "attempt": attempt + 1
                        }
                    )
                    
            except asyncio.TimeoutError:
                logger.warning(
                    "Webhook request timed out",
                    extra={
                        "timeout": self.config.timeout,
                        "attempt": attempt + 1
                    }
                )
                
            except Exception as e:
                logger.error(
                    f"Webhook request failed: {str(e)}",
                    extra={"attempt": attempt + 1}
                )
                
            if attempt < self.config.max_retries - 1:
                self.metrics.total_retries += 1
                await asyncio.sleep(
                    self.config.retry_delay * (attempt + 1)
                )
                
        self.metrics.failed_events += 1
        self.metrics.last_failure = datetime.now()
        raise WebhookError(
            f"Webhook request failed after {self.config.max_retries} attempts",
            operation="send_event",
            component="webhooks",
            event_type=event.event_type
        )
        
    @with_performance_monitoring(operation="emit", component="webhooks")
    async def emit_event(self, event: WebhookEvent) -> None:
        """Emit webhook event."""
        self.metrics.total_events += 1
        await self._send_event(event)
        
    async def close(self) -> None:
        """Close HTTP session."""
        if self.session:
            await self.session.close()
            self.session = None
            
    def get_metrics(self) -> Dict[str, Any]:
        """Get emitter metrics."""
        return {
            "name": self.name,
            "total_events": self.metrics.total_events,
            "successful_events": self.metrics.successful_events,
            "failed_events": self.metrics.failed_events,
            "total_retries": self.metrics.total_retries,
            "avg_latency": self.metrics.avg_latency,
            "last_success": (
                self.metrics.last_success.isoformat()
                if self.metrics.last_success else None
            ),
            "last_failure": (
                self.metrics.last_failure.isoformat()
                if self.metrics.last_failure else None
            )
        }

class WebhookManager:
    """Manage multiple webhook emitters."""
    
    def __init__(self):
        """Initialize webhook manager."""
        self.emitters: Dict[str, WebhookEmitter] = {}
        self.handlers: Dict[str, List[Callable[[WebhookEvent], Awaitable[None]]]] = {}
        logger.info("Initialized webhook manager")
        
    def register_emitter(
        self,
        name: str,
        config: WebhookConfig
    ) -> WebhookEmitter:
        """Register webhook emitter."""
        if name not in self.emitters:
            self.emitters[name] = WebhookEmitter(
                config=config,
                name=name
            )
        return self.emitters[name]
        
    def register_handler(
        self,
        event_type: str,
        handler: Callable[[WebhookEvent], Awaitable[None]]
    ) -> None:
        """Register event handler."""
        if event_type not in self.handlers:
            self.handlers[event_type] = []
        self.handlers[event_type].append(handler)
        
    async def emit_event(
        self,
        event: WebhookEvent,
        emitter_names: Optional[List[str]] = None
    ) -> None:
        """Emit event to specified emitters."""
        tasks = []
        
        # Emit to webhook endpoints
        target_emitters = (
            [self.emitters[name] for name in (emitter_names or [])]
            if emitter_names
            else self.emitters.values()
        )
        
        for emitter in target_emitters:
            tasks.append(emitter.emit_event(event))
            
        # Call registered handlers
        for handler in self.handlers.get(event.event_type, []):
            tasks.append(handler(event))
            
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
            
    async def close(self) -> None:
        """Close all emitters."""
        for emitter in self.emitters.values():
            await emitter.close()
            
    def get_all_metrics(self) -> Dict[str, Dict[str, Any]]:
        """Get metrics for all emitters."""
        return {
            name: emitter.get_metrics()
            for name, emitter in self.emitters.items()
        } 