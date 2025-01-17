from typing import Dict, Any, Optional, List, Tuple
from dataclasses import dataclass
import time
import logging
import numpy as np
import psutil
from .performance_system import with_performance_monitoring, performance_section

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