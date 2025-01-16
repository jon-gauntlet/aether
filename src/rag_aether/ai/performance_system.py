"""Performance monitoring system for RAG operations."""
from typing import Dict, Any, Optional, List, Callable
from dataclasses import dataclass
import time
import psutil
import logging
import asyncio
from functools import wraps

logger = logging.getLogger(__name__)

@dataclass
class PerformanceMetrics:
    """Performance metrics for an operation."""
    operation_name: str
    duration_ms: float
    memory_mb: Optional[float] = None
    success: bool = True
    metadata: Optional[Dict[str, Any]] = None

class PerformanceMonitor:
    """Monitors and tracks performance metrics for RAG operations."""
    
    def __init__(self, track_memory: bool = True):
        self.track_memory = track_memory
        self._metrics: List[PerformanceMetrics] = []
    
    def track_operation(self, operation_name: str, duration_ms: float, 
                       memory_mb: Optional[float] = None, success: bool = True,
                       metadata: Optional[Dict[str, Any]] = None):
        """Track a completed operation's metrics."""
        metrics = PerformanceMetrics(
            operation_name=operation_name,
            duration_ms=duration_ms,
            memory_mb=memory_mb,
            success=success,
            metadata=metadata
        )
        self._metrics.append(metrics)
        logger.info(f"Performance metrics: {metrics}")
    
    def get_metrics(self) -> List[PerformanceMetrics]:
        """Get all tracked metrics."""
        return self._metrics.copy()
    
    def clear_metrics(self):
        """Clear all tracked metrics."""
        self._metrics.clear()
    
    def get_memory_usage(self) -> float:
        """Get current memory usage in MB."""
        if not self.track_memory:
            return 0.0
        process = psutil.Process()
        return process.memory_info().rss / 1024 / 1024

monitor = PerformanceMonitor()

def with_performance_monitoring(func: Callable) -> Callable:
    """Decorator to monitor performance of a function."""
    @wraps(func)
    async def async_wrapper(*args, **kwargs):
        start_time = time.time()
        start_memory = monitor.get_memory_usage()
        success = True
        try:
            result = await func(*args, **kwargs)
            return result
        except Exception as e:
            success = False
            raise e
        finally:
            duration = (time.time() - start_time) * 1000
            memory_delta = monitor.get_memory_usage() - start_memory
            monitor.track_operation(
                operation_name=func.__name__,
                duration_ms=duration,
                memory_mb=memory_delta if monitor.track_memory else None,
                success=success
            )
    
    @wraps(func)
    def sync_wrapper(*args, **kwargs):
        start_time = time.time()
        start_memory = monitor.get_memory_usage()
        success = True
        try:
            result = func(*args, **kwargs)
            return result
        except Exception as e:
            success = False
            raise e
        finally:
            duration = (time.time() - start_time) * 1000
            memory_delta = monitor.get_memory_usage() - start_memory
            monitor.track_operation(
                operation_name=func.__name__,
                duration_ms=duration,
                memory_mb=memory_delta if monitor.track_memory else None,
                success=success
            )
    
    return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper

def performance_section(section_name: str):
    """Context manager to track performance of a code section."""
    class PerformanceContext:
        def __init__(self, name: str):
            self.name = name
            self.start_time = None
            self.start_memory = None
        
        def __enter__(self):
            self.start_time = time.time()
            self.start_memory = monitor.get_memory_usage()
            return self
        
        def __exit__(self, exc_type, exc_val, exc_tb):
            duration = (time.time() - self.start_time) * 1000
            memory_delta = monitor.get_memory_usage() - self.start_memory
            monitor.track_operation(
                operation_name=self.name,
                duration_ms=duration,
                memory_mb=memory_delta if monitor.track_memory else None,
                success=exc_type is None
            )
    
    return PerformanceContext(section_name) 

"""Performance optimization system for RAG operations."""

from typing import Dict, Any, Optional, List, Tuple
from dataclasses import dataclass
import time
import logging
import numpy as np
import psutil
from rag_aether.core.performance import with_performance_monitoring, performance_section

logger = logging.getLogger(__name__)

@dataclass
class ResourceUsage:
    """System resource usage metrics."""
    cpu_percent: float
    memory_percent: float
    memory_mb: float
    disk_io_read: int
    disk_io_write: int
    network_io_sent: int
    network_io_recv: int
    timestamp: float

    @classmethod
    def capture(cls) -> 'ResourceUsage':
        """Capture current system resource usage."""
        process = psutil.Process()
        
        # Get CPU and memory usage
        cpu_percent = process.cpu_percent()
        memory_info = process.memory_info()
        memory_percent = process.memory_percent()
        memory_mb = memory_info.rss / (1024 * 1024)
        
        # Get disk I/O
        disk_io = process.io_counters()
        disk_io_read = disk_io.read_bytes
        disk_io_write = disk_io.write_bytes
        
        # Get network I/O
        net_io = psutil.net_io_counters()
        network_io_sent = net_io.bytes_sent
        network_io_recv = net_io.bytes_recv
        
        return cls(
            cpu_percent=cpu_percent,
            memory_percent=memory_percent,
            memory_mb=memory_mb,
            disk_io_read=disk_io_read,
            disk_io_write=disk_io_write,
            network_io_sent=network_io_sent,
            network_io_recv=network_io_recv,
            timestamp=time.time()
        )

@dataclass
class PerformanceMetrics:
    """Performance metrics for RAG operations."""
    operation_name: str
    duration_ms: float
    memory_mb: float
    success: bool
    metadata: Optional[Dict[str, Any]] = None

class PerformanceOptimizer:
    """Optimizes performance of RAG operations."""

    def __init__(
        self,
        min_batch_size: int = 32,
        max_batch_size: int = 256,
        target_latency_ms: float = 100.0,
        min_success_rate: float = 0.95,
    ):
        """Initialize the performance optimizer.
        
        Args:
            min_batch_size: Minimum batch size for operations
            max_batch_size: Maximum batch size for operations
            target_latency_ms: Target latency in milliseconds
            min_success_rate: Minimum required success rate
        """
        self.min_batch_size = min_batch_size
        self.max_batch_size = max_batch_size
        self.target_latency_ms = target_latency_ms
        self.min_success_rate = min_success_rate
        
        self.metrics: List[PerformanceMetrics] = []
        self.current_batch_size = min_batch_size
        
        # Track resource usage
        self.resource_usage: List[ResourceUsage] = []
        self.last_resource_check = 0.0
        self.resource_check_interval = 1.0  # seconds
        
    @with_performance_monitoring
    def optimize_embeddings(self, embeddings: np.ndarray) -> np.ndarray:
        """Optimize embeddings for better performance.
        
        Args:
            embeddings: Input embeddings to optimize
            
        Returns:
            Optimized embeddings
        """
        with performance_section("embedding_optimization"):
            # Track resource usage
            self._update_resource_usage()
            
            # Normalize embeddings
            norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
            normalized = embeddings / norms
            
            # Quantize to float16 for efficiency
            optimized = normalized.astype(np.float16)
            
            return optimized
            
    @with_performance_monitoring
    def optimize_query(self, query: str) -> Tuple[str, Dict[str, Any]]:
        """Optimize query processing.
        
        Args:
            query: Input query to optimize
            
        Returns:
            Tuple of (optimized query, optimization metadata)
        """
        with performance_section("query_optimization"):
            # Track resource usage
            self._update_resource_usage()
            
            # Track query length
            query_len = len(query)
            
            # Simple query preprocessing
            query = query.strip().lower()
            
            metadata = {
                "original_length": query_len,
                "optimized_length": len(query)
            }
            
            return query, metadata
            
    @with_performance_monitoring
    def update_metrics(self, metrics: PerformanceMetrics) -> None:
        """Update performance metrics and adjust optimization parameters.
        
        Args:
            metrics: New metrics to incorporate
        """
        self.metrics.append(metrics)
        
        # Keep last 100 metrics
        if len(self.metrics) > 100:
            self.metrics.pop(0)
            
        # Calculate statistics
        recent_latencies = [m.duration_ms for m in self.metrics[-10:]]
        avg_latency = sum(recent_latencies) / len(recent_latencies)
        
        success_rate = sum(1 for m in self.metrics[-100:] if m.success) / len(self.metrics[-100:])
        
        # Track resource usage
        self._update_resource_usage()
        
        # Adjust batch size based on performance
        if avg_latency > self.target_latency_ms and success_rate >= self.min_success_rate:
            self.current_batch_size = max(
                self.min_batch_size,
                int(self.current_batch_size * 0.8)
            )
        elif avg_latency < self.target_latency_ms * 0.8 and success_rate >= self.min_success_rate:
            self.current_batch_size = min(
                self.max_batch_size,
                int(self.current_batch_size * 1.2)
            )
            
        logger.info(
            f"Performance metrics updated - "
            f"avg_latency: {avg_latency:.2f}ms, "
            f"success_rate: {success_rate:.2%}, "
            f"batch_size: {self.current_batch_size}"
        )
        
    def get_batch_size(self) -> int:
        """Get the current optimal batch size."""
        return self.current_batch_size
        
    def _update_resource_usage(self) -> None:
        """Update resource usage tracking if interval has elapsed."""
        current_time = time.time()
        if current_time - self.last_resource_check >= self.resource_check_interval:
            self.resource_usage.append(ResourceUsage.capture())
            self.last_resource_check = current_time
            
            # Keep last 100 resource usage samples
            if len(self.resource_usage) > 100:
                self.resource_usage.pop(0) 