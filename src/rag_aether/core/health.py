"""Health check system for monitoring system components."""
import asyncio
from typing import Dict, Any, List, Optional, Callable, Awaitable, TypeVar, cast
from dataclasses import dataclass, field
from datetime import datetime, timedelta
import json
from pathlib import Path
import numpy as np
from rag_aether.core.logging import get_logger
from rag_aether.core.telemetry import collector
from rag_aether.core.errors import HealthCheckError
from functools import wraps
import time

logger = get_logger("health")

T = TypeVar('T')

@dataclass
class SystemHealth:
    """Tracks system health metrics and status."""
    
    is_healthy: bool = True
    error_count: int = 0
    last_check: float = 0.0
    status_message: str = "Healthy"
    
    def check(self) -> bool:
        """Perform a health check."""
        self.last_check = time.time()
        return self.is_healthy
    
    def record_error(self, message: str) -> None:
        """Record an error occurrence."""
        self.error_count += 1
        self.status_message = message
        if self.error_count > 3:
            self.is_healthy = False
    
    def reset(self) -> None:
        """Reset health status."""
        self.is_healthy = True
        self.error_count = 0
        self.status_message = "Healthy"

@dataclass
class HealthCheck:
    """Health check result."""
    component: str
    status: str  # One of: "healthy", "degraded", "unhealthy"
    message: str
    timestamp: datetime = field(default_factory=datetime.now)
    metrics: Dict[str, Any] = field(default_factory=dict)

class HealthMonitor:
    """Monitor for system health checks."""
    
    def __init__(self, check_interval: int = 60):
        self.check_interval = check_interval
        self.checks: Dict[str, Callable[[], Awaitable[HealthCheck]]] = {}
        self.results: Dict[str, HealthCheck] = {}
        self._task: Optional[asyncio.Task] = None
        self._running = False
    
    def add_check(
        self,
        name: str,
        check: Callable[[], Awaitable[HealthCheck]]
    ):
        """Add health check."""
        self.checks[name] = check
        logger.info(f"Added health check: {name}")
    
    def start(self):
        """Start health monitoring."""
        if not self._running:
            self._running = True
            self._task = asyncio.create_task(self._monitor_loop())
            logger.info("Health monitoring started")
    
    def stop(self):
        """Stop health monitoring."""
        if self._running:
            self._running = False
            if self._task:
                self._task.cancel()
            logger.info("Health monitoring stopped")
    
    async def _monitor_loop(self):
        """Background monitoring loop."""
        try:
            while self._running:
                await self.run_checks()
                await asyncio.sleep(self.check_interval)
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Health monitoring error: {str(e)}")
            raise
    
    async def run_checks(self):
        """Run all health checks."""
        for name, check in self.checks.items():
            try:
                result = await check()
                self.results[name] = result
                
                # Add telemetry point
                collector.add_point(
                    operation="health_check",
                    component=result.component,
                    metrics={
                        "status": result.status,
                        "is_healthy": result.status == "healthy",
                        "is_degraded": result.status == "degraded",
                        "is_unhealthy": result.status == "unhealthy",
                        **result.metrics
                    }
                )
                
                logger.info(
                    f"Health check {name}: {result.status}",
                    extra={
                        "component": result.component,
                        "status": result.status,
                        "message": result.message
                    }
                )
                
            except Exception as e:
                logger.error(f"Health check {name} failed: {str(e)}")
                self.results[name] = HealthCheck(
                    component=name,
                    status="unhealthy",
                    message=f"Check failed: {str(e)}"
                )
    
    def get_status(self) -> Dict[str, Any]:
        """Get overall system status."""
        if not self.results:
            return {
                "status": "unknown",
                "message": "No health checks run yet",
                "components": {}
            }
        
        # Count status types
        status_counts = {
            "healthy": 0,
            "degraded": 0,
            "unhealthy": 0
        }
        
        components = {}
        for name, result in self.results.items():
            status_counts[result.status] += 1
            components[name] = {
                "status": result.status,
                "message": result.message,
                "last_check": result.timestamp.isoformat(),
                "metrics": result.metrics
            }
        
        # Determine overall status
        if status_counts["unhealthy"] > 0:
            status = "unhealthy"
            message = f"{status_counts['unhealthy']} components unhealthy"
        elif status_counts["degraded"] > 0:
            status = "degraded"
            message = f"{status_counts['degraded']} components degraded"
        else:
            status = "healthy"
            message = "All components healthy"
        
        return {
            "status": status,
            "message": message,
            "components": components,
            "last_update": max(r.timestamp for r in self.results.values()).isoformat()
        }

# Standard health checks
async def check_embedding_model(rag) -> HealthCheck:
    """Check embedding model health."""
    try:
        # Test encoding
        test_text = "Health check test text"
        embedding = await rag._encode_texts_batch([test_text])
        
        if embedding is None or embedding.shape[1] != rag.embedding_dim:
            return HealthCheck(
                component="embedding",
                status="unhealthy",
                message="Invalid embedding dimension",
                metrics={"embedding_dim": embedding.shape[1] if embedding is not None else 0}
            )
        
        # Check recent performance
        stats = collector.get_component_metrics("embedding", window_minutes=5)
        avg_duration = stats.get("duration_ms", {}).get("avg", 0)
        p95_duration = stats.get("duration_ms", {}).get("p95", 0)
        
        if p95_duration > 2000:  # 2 seconds
            status = "degraded"
            message = "High latency"
        else:
            status = "healthy"
            message = "Model functioning normally"
        
        return HealthCheck(
            component="embedding",
            status=status,
            message=message,
            metrics={
                "avg_duration_ms": avg_duration,
                "p95_duration_ms": p95_duration
            }
        )
        
    except Exception as e:
        raise HealthCheckError(f"Embedding model check failed: {str(e)}")

async def check_faiss_index(rag) -> HealthCheck:
    """Check FAISS index health."""
    try:
        if rag.index is None:
            return HealthCheck(
                component="faiss_index",
                status="unhealthy",
                message="Index not initialized"
            )
        
        # Test search
        test_query = np.random.rand(1, rag.embedding_dim).astype('float32')
        D, I = rag.index.search(test_query, 1)
        
        if D is None or I is None:
            return HealthCheck(
                component="faiss_index",
                status="unhealthy",
                message="Search failed"
            )
        
        # Get index stats
        ntotal = rag.index.ntotal
        
        # Check recent performance
        stats = collector.get_component_metrics("faiss_index", window_minutes=5)
        avg_duration = stats.get("duration_ms", {}).get("avg", 0)
        p95_duration = stats.get("duration_ms", {}).get("p95", 0)
        
        if p95_duration > 100:  # 100ms
            status = "degraded"
            message = "High latency"
        else:
            status = "healthy"
            message = "Index functioning normally"
        
        return HealthCheck(
            component="faiss_index",
            status=status,
            message=message,
            metrics={
                "ntotal": ntotal,
                "avg_duration_ms": avg_duration,
                "p95_duration_ms": p95_duration
            }
        )
        
    except Exception as e:
        raise HealthCheckError(f"FAISS index check failed: {str(e)}")

async def check_system_resources() -> HealthCheck:
    """Check system resource health."""
    try:
        # Get recent metrics
        stats = collector.get_component_metrics("system", window_minutes=5)
        
        metrics = {
            "cpu_percent": stats.get("cpu_percent", {}).get("avg", 0),
            "memory_percent": stats.get("memory_percent", {}).get("avg", 0),
            "disk_usage_percent": stats.get("disk_usage.used_percent", {}).get("avg", 0)
        }
        
        # Determine status
        if (metrics["cpu_percent"] > 90 or 
            metrics["memory_percent"] > 90 or 
            metrics["disk_usage_percent"] > 90):
            status = "unhealthy"
            message = "Critical resource usage"
        elif (metrics["cpu_percent"] > 75 or 
              metrics["memory_percent"] > 75 or 
              metrics["disk_usage_percent"] > 75):
            status = "degraded"
            message = "High resource usage"
        else:
            status = "healthy"
            message = "Resources within normal limits"
        
        return HealthCheck(
            component="system",
            status=status,
            message=message,
            metrics=metrics
        )
        
    except Exception as e:
        raise HealthCheckError(f"System resource check failed: {str(e)}")

# Global health monitor instance
monitor = HealthMonitor() 

def with_retries(max_attempts: int = 3, delay: float = 1.0) -> Callable[[Callable[..., T]], Callable[..., T]]:
    """Decorator to retry operations with exponential backoff."""
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> T:
            last_error = None
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_error = e
                    if attempt < max_attempts - 1:
                        time.sleep(delay * (2 ** attempt))
            raise last_error  # type: ignore
        return wrapper
    return decorator

def with_health_check(health: SystemHealth) -> Callable[[Callable[..., T]], Callable[..., T]]:
    """Decorator to track operation health."""
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> T:
            try:
                result = func(*args, **kwargs)
                health.check()
                return result
            except Exception as e:
                health.record_error(str(e))
                raise
        return wrapper
    return decorator 