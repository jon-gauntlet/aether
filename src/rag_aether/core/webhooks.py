"""Webhook support for RAG system."""
from typing import Dict, Any, Optional, List, Callable, Awaitable
import asyncio
import aiohttp
import json
from dataclasses import dataclass, asdict
from datetime import datetime
from rag_aether.core.logging import get_logger
from rag_aether.core.performance import with_performance_monitoring, performance_section
from rag_aether.core.errors import RAGError

logger = get_logger("webhooks")

@dataclass
class WebhookEvent:
    """Webhook event data."""
    event_type: str
    timestamp: float
    data: Dict[str, Any]
    metadata: Optional[Dict[str, Any]] = None

class WebhookClient:
    """Client for sending webhook events."""
    
    def __init__(
        self,
        url: str,
        secret: Optional[str] = None,
        timeout: float = 5.0,
        max_retries: int = 3,
        retry_delay: float = 1.0
    ):
        """Initialize webhook client."""
        self.url = url
        self.secret = secret
        self.timeout = timeout
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        logger.info(
            "Initialized webhook client",
            extra={
                "url": url,
                "timeout": timeout,
                "max_retries": max_retries
            }
        )
    
    @with_performance_monitoring(operation="send", component="webhook")
    async def send_event(self, event: WebhookEvent) -> bool:
        """Send webhook event with retries."""
        try:
            headers = {
                "Content-Type": "application/json"
            }
            
            if self.secret:
                headers["X-Webhook-Secret"] = self.secret
            
            payload = {
                "event_type": event.event_type,
                "timestamp": event.timestamp,
                "data": event.data
            }
            
            if event.metadata:
                payload["metadata"] = event.metadata
            
            retry_count = 0
            while retry_count <= self.max_retries:
                try:
                    async with aiohttp.ClientSession() as session:
                        async with session.post(
                            self.url,
                            json=payload,
                            headers=headers,
                            timeout=self.timeout
                        ) as response:
                            if response.status in (200, 201, 202):
                                logger.info(
                                    "Webhook event sent successfully",
                                    extra={
                                        "event_type": event.event_type,
                                        "status_code": response.status
                                    }
                                )
                                return True
                            else:
                                error_text = await response.text()
                                logger.warning(
                                    "Webhook request failed",
                                    extra={
                                        "status_code": response.status,
                                        "error": error_text,
                                        "retry": retry_count + 1
                                    }
                                )
                    
                except asyncio.TimeoutError:
                    logger.warning(
                        "Webhook request timed out",
                        extra={"retry": retry_count + 1}
                    )
                
                retry_count += 1
                if retry_count <= self.max_retries:
                    await asyncio.sleep(self.retry_delay * retry_count)
            
            logger.error(
                "Webhook delivery failed after retries",
                extra={
                    "event_type": event.event_type,
                    "retries": self.max_retries
                }
            )
            return False
            
        except Exception as e:
            logger.error(f"Failed to send webhook event: {str(e)}")
            raise RAGError(
                f"Webhook delivery failed: {str(e)}",
                operation="send_event",
                component="webhook"
            )

class WebhookManager:
    """Manage webhook subscriptions and delivery."""
    
    def __init__(self):
        """Initialize webhook manager."""
        self.subscribers: Dict[str, List[WebhookClient]] = {}
        self.event_handlers: Dict[str, List[Callable[[WebhookEvent], Awaitable[None]]]] = {}
        logger.info("Initialized webhook manager")
    
    def subscribe(
        self,
        event_type: str,
        client: WebhookClient
    ) -> None:
        """Subscribe to webhook events."""
        if event_type not in self.subscribers:
            self.subscribers[event_type] = []
        self.subscribers[event_type].append(client)
        logger.info(
            "Added webhook subscription",
            extra={
                "event_type": event_type,
                "url": client.url
            }
        )
    
    def add_handler(
        self,
        event_type: str,
        handler: Callable[[WebhookEvent], Awaitable[None]]
    ) -> None:
        """Add event handler."""
        if event_type not in self.event_handlers:
            self.event_handlers[event_type] = []
        self.event_handlers[event_type].append(handler)
        logger.info(
            "Added event handler",
            extra={"event_type": event_type}
        )
    
    @with_performance_monitoring(operation="publish", component="webhook")
    async def publish_event(
        self,
        event: WebhookEvent,
        wait_for_delivery: bool = False
    ) -> None:
        """Publish webhook event to all subscribers."""
        try:
            # Get subscribers for this event type
            subscribers = self.subscribers.get(event.event_type, [])
            handlers = self.event_handlers.get(event.event_type, [])
            
            if not subscribers and not handlers:
                logger.info(
                    "No subscribers or handlers for event",
                    extra={"event_type": event.event_type}
                )
                return
            
            # Create tasks for webhook delivery
            webhook_tasks = [
                client.send_event(event)
                for client in subscribers
            ]
            
            # Create tasks for event handlers
            handler_tasks = [
                handler(event)
                for handler in handlers
            ]
            
            # Combine all tasks
            all_tasks = webhook_tasks + handler_tasks
            
            if wait_for_delivery:
                # Wait for all tasks to complete
                results = await asyncio.gather(*all_tasks, return_exceptions=True)
                
                # Check for failures
                failures = [
                    str(result)
                    for result in results
                    if isinstance(result, Exception)
                ]
                
                if failures:
                    logger.warning(
                        "Some webhook deliveries failed",
                        extra={
                            "failures": failures,
                            "total": len(all_tasks),
                            "failed": len(failures)
                        }
                    )
            else:
                # Fire and forget
                for task in all_tasks:
                    asyncio.create_task(task)
            
        except Exception as e:
            logger.error(f"Failed to publish webhook event: {str(e)}")
            raise RAGError(
                f"Event publishing failed: {str(e)}",
                operation="publish_event",
                component="webhook"
            )

# Standard event types
EVENT_QUERY = "query"
EVENT_INGESTION = "ingestion"
EVENT_ERROR = "error"
EVENT_RATE_LIMIT = "rate_limit"
EVENT_QUALITY = "quality" 