"""Health check implementation for RAG system."""
from typing import Dict, Any, List, Optional, Callable, Awaitable
import asyncio
import time
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
import numpy as np
from rag_aether.core.logging import get_logger
from rag_aether.core.errors import HealthCheckError
from rag_aether.core.performance import with_performance_monitoring

logger = get_logger("health")

class HealthStatus(Enum):
    """Health check status."""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"

@dataclass
class HealthConfig:
    """Health check configuration."""
    check_interval: float = 60.0
    timeout: float = 5.0
    failure_threshold: int = 3
    success_threshold: int = 2
    initial_delay: float = 0.0

@dataclass
class HealthMetrics:
    """Metrics for health checks."""
    total_checks: int = 0
    successful_checks: int = 0
    failed_checks: int = 0
    consecutive_failures: int = 0
    consecutive_successes: int = 0
    last_check: Optional[datetime] = None
    last_success: Optional[datetime] = None
    last_failure: Optional[datetime] = None
    avg_latency: float = 0.0

class HealthCheck:
    """Individual health check implementation."""
    
    def __init__(
        self,
        name: str,
        check_fn: Callable[[], Awaitable[bool]],
        config: Optional[HealthConfig] = None,
        dependencies: Optional[List[str]] = None
    ):
        self.name = name
        self.check_fn = check_fn
        self.config = config or HealthConfig()
        self.dependencies = dependencies or []
        self.metrics = HealthMetrics()
        self._running = False
        self._task = None

    async def start(self):
        """Start the health check."""
        if self._running:
            return
        self._running = True
        await asyncio.sleep(self.config.initial_delay)
        self._task = asyncio.create_task(self._run())

    async def stop(self):
        """Stop the health check."""
        self._running = False
        if self._task:
            await self._task

    @with_performance_monitoring
    async def _run(self):
        """Run the health check periodically."""
        while self._running:
            try:
                start_time = time.time()
                result = await asyncio.wait_for(
                    self.check_fn(), 
                    timeout=self.config.timeout
                )
                duration = time.time() - start_time
                
                self.metrics.total_checks += 1
                self.metrics.last_check = datetime.now()
                self.metrics.avg_latency = (
                    (self.metrics.avg_latency * (self.metrics.total_checks - 1) + duration)
                    / self.metrics.total_checks
                )
                
                if result:
                    self._handle_success()
                else:
                    self._handle_failure()
                    
            except Exception as e:
                logger.error(f"Health check {self.name} failed: {str(e)}")
                self._handle_failure()
                
            await asyncio.sleep(self.config.check_interval)

    def _handle_success(self):
        """Handle successful health check."""
        self.metrics.successful_checks += 1
        self.metrics.consecutive_successes += 1
        self.metrics.consecutive_failures = 0
        self.metrics.last_success = datetime.now()

    def _handle_failure(self):
        """Handle failed health check."""
        self.metrics.failed_checks += 1
        self.metrics.consecutive_failures += 1
        self.metrics.consecutive_successes = 0
        self.metrics.last_failure = datetime.now()

class SystemHealth:
    """System health manager."""
    
    def __init__(self):
        self.checks: Dict[str, HealthCheck] = {}
        self._running = False

    def add_check(
        self,
        name: str,
        check_fn: Callable[[], Awaitable[bool]],
        config: Optional[HealthConfig] = None,
        dependencies: Optional[List[str]] = None
    ):
        """Add a health check."""
        if name in self.checks:
            raise ValueError(f"Health check {name} already exists")
        
        check = HealthCheck(name, check_fn, config, dependencies)
        self.checks[name] = check
        
        if self._running:
            asyncio.create_task(check.start())

    async def start(self):
        """Start all health checks."""
        self._running = True
        for check in self.checks.values():
            await check.start()

    async def stop(self):
        """Stop all health checks."""
        self._running = False
        for check in self.checks.values():
            await check.stop()

    def get_status(self) -> Dict[str, Any]:
        """Get the current health status."""
        status = HealthStatus.HEALTHY
        details = {}
        
        for name, check in self.checks.items():
            check_status = HealthStatus.HEALTHY
            
            if check.metrics.consecutive_failures >= check.config.failure_threshold:
                check_status = HealthStatus.UNHEALTHY
                status = HealthStatus.UNHEALTHY
            elif check.metrics.consecutive_failures > 0:
                check_status = HealthStatus.DEGRADED
                if status == HealthStatus.HEALTHY:
                    status = HealthStatus.DEGRADED
                    
            details[name] = {
                "status": check_status.value,
                "metrics": check.metrics.__dict__,
                "config": check.config.__dict__,
                "dependencies": check.dependencies
            }
            
        return {
            "status": status.value,
            "timestamp": datetime.now().isoformat(),
            "details": details
        }

async def check_embedding_model(rag_system) -> bool:
    """Check if embedding model is healthy."""
    try:
        if rag_system.model is None:
            return False
        # Try encoding a test string
        test_text = "Health check test string"
        embeddings = await rag_system._encode_texts_batch([test_text])
        return embeddings is not None and embeddings.shape[1] == rag_system.embedding_dim
    except Exception as e:
        logger.error(f"Embedding model health check failed: {str(e)}")
        return False

async def check_faiss_index(rag_system) -> bool:
    """Check if FAISS index is healthy."""
    try:
        if rag_system.index is None:
            return False
        # Try a test search if index is not empty
        if rag_system.index.ntotal > 0:
            test_query = np.random.rand(1, rag_system.embedding_dim).astype('float32')
            distances, indices = rag_system.index.search(test_query, 1)
            return indices is not None and distances is not None
        return True
    except Exception as e:
        logger.error(f"FAISS index health check failed: {str(e)}")
        return False

async def check_system_resources() -> bool:
    """Check system resource usage."""
    try:
        import psutil
        # Check CPU usage
        cpu_percent = psutil.cpu_percent()
        # Check memory usage
        memory = psutil.virtual_memory()
        # Consider system healthy if CPU < 90% and memory < 90%
        return cpu_percent < 90 and memory.percent < 90
    except Exception as e:
        logger.error(f"System resources health check failed: {str(e)}")
        return False

# Create a global monitor instance
monitor = SystemHealth() 