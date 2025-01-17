"""Performance monitoring utilities."""

from typing import Dict, Any, List, Optional, Deque, Callable
from collections import deque
import time
import logging
import psutil
import pynvml
from dataclasses import dataclass
from datetime import datetime
import functools
import asyncio

logger = logging.getLogger(__name__)

@dataclass
class PerformanceMetrics:
    """Performance metrics data structure."""
    cpu_usage: float
    memory_usage: float
    latency: float
    throughput: float
    gpu_usage: Optional[float] = None
    gpu_memory: Optional[float] = None
    timestamp: datetime = datetime.now()

def track_operation(operation_name: str, duration: float, monitor: Optional['PerformanceMonitor'] = None) -> None:
    """Track performance metrics for an operation.
    
    Args:
        operation_name: Name of the operation
        duration: Duration of the operation in seconds
        monitor: Optional performance monitor instance
    """
    if monitor:
        monitor.track_operation(operation_name, duration)

def with_performance_monitoring(func: Callable) -> Callable:
    """Decorator to monitor performance of a function."""
    @functools.wraps(func)
    def decorator(*args, **kwargs):
        """Wrapper for synchronous functions."""
        self = args[0] if args else None
        monitor = getattr(self, 'performance_monitor', None) if self else None
        
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            duration = time.time() - start_time
            if monitor:
                track_operation(func.__name__, duration, monitor)
            return result
        except Exception as e:
            duration = time.time() - start_time
            if monitor:
                track_operation(func.__name__, duration, monitor, error=True)
            raise e

    @functools.wraps(func)
    async def async_decorator(*args, **kwargs):
        """Wrapper for asynchronous functions."""
        self = args[0] if args else None
        monitor = getattr(self, 'performance_monitor', None) if self else None
        
        start_time = time.time()
        try:
            result = await func(*args, **kwargs)
            duration = time.time() - start_time
            if monitor:
                track_operation(func.__name__, duration, monitor)
            return result
        except Exception as e:
            duration = time.time() - start_time
            if monitor:
                track_operation(func.__name__, duration, monitor, error=True)
            raise e

    if asyncio.iscoroutinefunction(func):
        return async_decorator
    return decorator

def performance_section(operation_name: str, monitor: 'PerformanceMonitor') -> None:
    """Context manager for monitoring performance of code sections.
    
    Args:
        operation_name: Name of the operation to monitor
        monitor: Performance monitor instance
    """
    class PerformanceContext:
        def __init__(self):
            self.start_time = None
            
        def __enter__(self):
            self.start_time = time.time()
            return self
            
        def __exit__(self, exc_type, exc_val, exc_tb):
            if exc_type is None:
                duration = time.time() - self.start_time
                monitor.track_operation(operation_name, duration)
                
    return PerformanceContext()

class PerformanceMonitor:
    """Monitor system and application performance."""
    
    def __init__(self, window_size: int = 100, enable_gpu: bool = False,
                 log_interval: int = 60):
        """Initialize performance monitor.
        
        Args:
            window_size: Number of data points to keep in sliding window
            enable_gpu: Whether to monitor GPU metrics
            log_interval: How often to log metrics in seconds
        """
        self.window_size = window_size
        self.enable_gpu = enable_gpu
        self.log_interval = log_interval
        
        # Initialize metric windows
        self.cpu_usage: Deque[float] = deque(maxlen=window_size)
        self.memory_usage: Deque[float] = deque(maxlen=window_size)
        self.latencies: Deque[float] = deque(maxlen=window_size)
        self.throughput: Deque[float] = deque(maxlen=window_size)
        
        # Initialize GPU monitoring if enabled
        if enable_gpu:
            try:
                pynvml.nvmlInit()
                self.gpu_handle = pynvml.nvmlDeviceGetHandleByIndex(0)
                self.gpu_usage: Deque[float] = deque(maxlen=window_size)
                self.gpu_memory: Deque[float] = deque(maxlen=window_size)
                logger.info("GPU monitoring enabled")
            except Exception as e:
                logger.warning(f"Failed to initialize GPU monitoring: {e}")
                self.enable_gpu = False
                
        self.start_time = time.time()
        self.last_log = time.time()
        self.operation_count = 0
        
    def track_operation(self, operation: str, duration: float) -> None:
        """Track performance metrics for an operation.
        
        Args:
            operation: Name of the operation
            duration: Duration of the operation in seconds
        """
        # Update metrics
        self.latencies.append(duration)
        self.operation_count += 1
        self.throughput.append(self.operation_count / (time.time() - self.start_time))
        
        # Get CPU and memory usage
        process = psutil.Process()
        self.cpu_usage.append(process.cpu_percent())
        self.memory_usage.append(process.memory_percent())
        
        # Get GPU metrics if enabled
        if self.enable_gpu:
            try:
                gpu_util = pynvml.nvmlDeviceGetUtilizationRates(self.gpu_handle)
                gpu_mem = pynvml.nvmlDeviceGetMemoryInfo(self.gpu_handle)
                self.gpu_usage.append(gpu_util.gpu)
                self.gpu_memory.append(gpu_mem.used / gpu_mem.total * 100)
            except Exception as e:
                logger.warning(f"Failed to get GPU metrics: {e}")
                
        # Log metrics periodically
        if time.time() - self.last_log > self.log_interval:
            metrics = self.get_summary_metrics()
            logger.info(f"Performance metrics for {operation}: {metrics}")
            self.last_log = time.time()
            
    def get_summary_metrics(self) -> PerformanceMetrics:
        """Get summary of current performance metrics.
        
        Returns:
            Summary metrics
        """
        metrics = PerformanceMetrics(
            cpu_usage=sum(self.cpu_usage) / len(self.cpu_usage) if self.cpu_usage else 0,
            memory_usage=sum(self.memory_usage) / len(self.memory_usage) if self.memory_usage else 0,
            latency=sum(self.latencies) / len(self.latencies) if self.latencies else 0,
            throughput=self.throughput[-1] if self.throughput else 0
        )
        
        if self.enable_gpu:
            metrics.gpu_usage = sum(self.gpu_usage) / len(self.gpu_usage) if self.gpu_usage else 0
            metrics.gpu_memory = sum(self.gpu_memory) / len(self.gpu_memory) if self.gpu_memory else 0
            
        return metrics
        
    def reset(self) -> None:
        """Reset all metrics."""
        self.cpu_usage.clear()
        self.memory_usage.clear()
        self.latencies.clear()
        self.throughput.clear()
        if self.enable_gpu:
            self.gpu_usage.clear()
            self.gpu_memory.clear()
        self.operation_count = 0
        self.start_time = time.time()
        self.last_log = time.time() 