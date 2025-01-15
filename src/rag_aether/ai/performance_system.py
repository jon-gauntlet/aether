"""Performance optimization system for RAG operations."""
from typing import Dict, Any, Optional, List, Callable, TypeVar, Union
from dataclasses import dataclass
import time
import asyncio
import logging
import numpy as np
from datetime import datetime, timedelta
from collections import deque
import psutil
import torch

T = TypeVar('T')

@dataclass
class PerformanceMetrics:
    """Performance metrics for RAG operations."""
    latency: float
    throughput: float
    memory_usage: float
    cpu_usage: float
    gpu_usage: Optional[float]
    batch_size: int
    timestamp: str
    operation: str
    metadata: Dict[str, Any]

@dataclass
class ResourceUsage:
    """System resource usage metrics."""
    cpu_percent: float
    memory_percent: float
    gpu_percent: Optional[float]
    disk_io: Dict[str, float]
    network_io: Dict[str, float]

class PerformanceMonitor:
    """Monitor performance metrics for RAG operations."""
    
    def __init__(
        self,
        window_size: int = 100,
        log_interval: float = 60.0,
        enable_gpu: bool = torch.cuda.is_available()
    ):
        """Initialize performance monitor.
        
        Args:
            window_size: Size of sliding window for metrics
            log_interval: Interval for logging metrics in seconds
            enable_gpu: Whether to monitor GPU metrics
        """
        self.window_size = window_size
        self.log_interval = log_interval
        self.enable_gpu = enable_gpu
        
        # Initialize metric storage
        self.metrics: Dict[str, deque[PerformanceMetrics]] = {}
        self.last_log_time = time.time()
        self.logger = logging.getLogger("performance_monitor")
        
        # Initialize resource monitoring
        self.process = psutil.Process()
        if enable_gpu:
            try:
                import pynvml
                pynvml.nvmlInit()
                self.gpu_handle = pynvml.nvmlDeviceGetHandleByIndex(0)
            except Exception as e:
                self.logger.warning(f"Failed to initialize GPU monitoring: {e}")
                self.enable_gpu = False
                
    def measure(self, operation: str = "default") -> "PerformanceContext":
        """Create context manager for measuring operation performance."""
        return PerformanceContext(self, operation)
        
    def record_metrics(
        self,
        metrics: PerformanceMetrics,
        operation: str = "default"
    ):
        """Record performance metrics."""
        if operation not in self.metrics:
            self.metrics[operation] = deque(maxlen=self.window_size)
            
        self.metrics[operation].append(metrics)
        
        # Log metrics if interval elapsed
        current_time = time.time()
        if current_time - self.last_log_time >= self.log_interval:
            self._log_metrics()
            self.last_log_time = current_time
            
    def get_metrics(
        self,
        operation: str = "default",
        window: Optional[int] = None
    ) -> List[PerformanceMetrics]:
        """Get recent performance metrics."""
        if operation not in self.metrics:
            return []
            
        metrics = list(self.metrics[operation])
        if window is not None:
            metrics = metrics[-window:]
            
        return metrics
        
    def get_statistics(
        self,
        operation: str = "default",
        window: Optional[int] = None
    ) -> Dict[str, Dict[str, float]]:
        """Get statistical summary of metrics."""
        metrics = self.get_metrics(operation, window)
        if not metrics:
            return {}
            
        stats = {}
        for field in ["latency", "throughput", "memory_usage", "cpu_usage"]:
            values = [getattr(m, field) for m in metrics]
            stats[field] = {
                "mean": np.mean(values),
                "std": np.std(values),
                "min": np.min(values),
                "max": np.max(values),
                "p50": np.percentile(values, 50),
                "p95": np.percentile(values, 95),
                "p99": np.percentile(values, 99)
            }
            
        return stats
        
    def get_resource_usage(self) -> ResourceUsage:
        """Get current system resource usage."""
        cpu_percent = psutil.cpu_percent(interval=0.1)
        memory_percent = psutil.virtual_memory().percent
        
        disk_io = psutil.disk_io_counters()._asdict()
        network_io = psutil.net_io_counters()._asdict()
        
        gpu_percent = None
        if self.enable_gpu:
            try:
                import pynvml
                info = pynvml.nvmlDeviceGetUtilizationRates(self.gpu_handle)
                gpu_percent = info.gpu
            except Exception as e:
                self.logger.warning(f"Failed to get GPU usage: {e}")
                
        return ResourceUsage(
            cpu_percent=cpu_percent,
            memory_percent=memory_percent,
            gpu_percent=gpu_percent,
            disk_io=disk_io,
            network_io=network_io
        )
        
    def _log_metrics(self):
        """Log performance metrics summary."""
        for operation, metrics in self.metrics.items():
            if not metrics:
                continue
                
            stats = self.get_statistics(operation)
            self.logger.info(
                f"Performance metrics for {operation}:",
                extra={
                    "operation": operation,
                    "metrics": stats
                }
            )

class PerformanceContext:
    """Context manager for measuring operation performance."""
    
    def __init__(self, monitor: PerformanceMonitor, operation: str):
        """Initialize performance context."""
        self.monitor = monitor
        self.operation = operation
        self.start_time = None
        self.start_resources = None
        self.batch_size = 1
        self.metadata = {}
        
    def __enter__(self):
        """Enter performance measurement context."""
        self.start_time = time.time()
        self.start_resources = self.monitor.get_resource_usage()
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Exit performance measurement context."""
        if exc_type is not None:
            return
            
        end_time = time.time()
        end_resources = self.monitor.get_resource_usage()
        
        duration = end_time - self.start_time
        
        # Calculate metrics
        metrics = PerformanceMetrics(
            latency=duration,
            throughput=self.batch_size / duration,
            memory_usage=end_resources.memory_percent,
            cpu_usage=end_resources.cpu_percent,
            gpu_usage=end_resources.gpu_percent,
            batch_size=self.batch_size,
            timestamp=datetime.now().isoformat(),
            operation=self.operation,
            metadata=self.metadata
        )
        
        self.monitor.record_metrics(metrics, self.operation)
        
    def set_batch_size(self, size: int):
        """Set batch size for operation."""
        self.batch_size = size
        
    def add_metadata(self, **kwargs):
        """Add metadata for operation."""
        self.metadata.update(kwargs)

class PerformanceOptimizer:
    """Optimize performance of RAG operations."""
    
    def __init__(
        self,
        monitor: PerformanceMonitor,
        target_latency: float = 1.0,
        target_memory: float = 80.0,
        optimization_interval: float = 300.0
    ):
        """Initialize performance optimizer.
        
        Args:
            monitor: Performance monitor instance
            target_latency: Target latency in seconds
            target_memory: Target memory usage percentage
            optimization_interval: Interval for optimization in seconds
        """
        self.monitor = monitor
        self.target_latency = target_latency
        self.target_memory = target_memory
        self.optimization_interval = optimization_interval
        
        self.logger = logging.getLogger("performance_optimizer")
        self.last_optimization = time.time()
        
        # Optimization parameters
        self.batch_sizes: Dict[str, int] = {}
        self.cache_sizes: Dict[str, int] = {}
        
    async def optimize(self, operation: str = "default"):
        """Optimize performance for operation."""
        current_time = time.time()
        if current_time - self.last_optimization < self.optimization_interval:
            return
            
        stats = self.monitor.get_statistics(operation)
        if not stats:
            return
            
        # Check if optimization needed
        latency_p95 = stats["latency"]["p95"]
        memory_usage = stats["memory_usage"]["mean"]
        
        if latency_p95 > self.target_latency or memory_usage > self.target_memory:
            await self._optimize_resources(operation, stats)
            
        self.last_optimization = current_time
        
    async def _optimize_resources(
        self,
        operation: str,
        stats: Dict[str, Dict[str, float]]
    ):
        """Optimize resource usage for operation."""
        # Adjust batch size based on latency
        current_batch_size = self.batch_sizes.get(operation, 1)
        latency_p95 = stats["latency"]["p95"]
        
        if latency_p95 > self.target_latency:
            # Reduce batch size
            new_batch_size = max(1, current_batch_size - 1)
        else:
            # Try increasing batch size
            new_batch_size = current_batch_size + 1
            
        self.batch_sizes[operation] = new_batch_size
        
        # Adjust cache size based on memory usage
        memory_usage = stats["memory_usage"]["mean"]
        current_cache_size = self.cache_sizes.get(operation, 1000)
        
        if memory_usage > self.target_memory:
            # Reduce cache size
            new_cache_size = int(current_cache_size * 0.8)
        else:
            # Try increasing cache size
            new_cache_size = int(current_cache_size * 1.2)
            
        self.cache_sizes[operation] = new_cache_size
        
        self.logger.info(
            f"Optimized {operation} parameters:",
            extra={
                "operation": operation,
                "batch_size": new_batch_size,
                "cache_size": new_cache_size
            }
        )
        
    def get_batch_size(self, operation: str = "default") -> int:
        """Get optimal batch size for operation."""
        return self.batch_sizes.get(operation, 1)
        
    def get_cache_size(self, operation: str = "default") -> int:
        """Get optimal cache size for operation."""
        return self.cache_sizes.get(operation, 1000)

def with_performance_monitoring(operation: str = "default"):
    """Decorator for monitoring function performance."""
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        async def wrapper(self, *args, **kwargs) -> T:
            monitor = getattr(self, "performance_monitor", None)
            if monitor is None:
                return await func(self, *args, **kwargs)
                
            with monitor.measure(operation) as perf:
                perf.add_metadata(
                    function=func.__name__,
                    args_length=len(args),
                    kwargs_keys=list(kwargs.keys())
                )
                result = await func(self, *args, **kwargs)
                return result
                
        return wrapper
    return decorator 