"""Performance monitoring system for RAG components."""

import time
import logging
import psutil
from typing import Dict, Any, Optional, Callable
from collections import deque
from functools import wraps
from contextlib import contextmanager

logger = logging.getLogger(__name__)

try:
    import pynvml
    pynvml.nvmlInit()
    GPU_AVAILABLE = True
except (ImportError, Exception):
    GPU_AVAILABLE = False
    logger.warning("GPU monitoring not available - pynvml not installed or GPU not accessible")

class PerformanceMonitor:
    """Monitors performance metrics for RAG system."""
    
    _instance = None
    
    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    def __init__(self, window_size: int = 100):
        """Initialize performance monitor.
        
        Args:
            window_size: Size of metrics window
        """
        self.window_size = window_size
        self.metrics_window = deque(maxlen=window_size)
        self.operation_stats = {}
        self.gpu_enabled = GPU_AVAILABLE
        
    def record_operation(self, operation: str, duration: float, success: bool = True):
        """Record operation metrics.
        
        Args:
            operation: Operation name
            duration: Duration in seconds
            success: Whether operation succeeded
        """
        if operation not in self.operation_stats:
            self.operation_stats[operation] = {
                "count": 0,
                "total_time": 0.0,
                "min_time": float("inf"),
                "max_time": 0.0,
                "success_count": 0,
                "avg_time": 0.0
            }
            
        stats = self.operation_stats[operation]
        stats["count"] += 1
        stats["total_time"] += duration
        stats["min_time"] = min(stats["min_time"], duration)
        stats["max_time"] = max(stats["max_time"], duration)
        stats["avg_time"] = stats["total_time"] / stats["count"]
        if success:
            stats["success_count"] += 1
            
        # Record system metrics
        metrics = {
            "timestamp": time.time(),
            "operation": operation,
            "duration": duration,
            "success": success,
            **self._get_system_metrics()
        }
        
        if self.gpu_enabled:
            try:
                metrics.update(self._get_gpu_metrics())
            except Exception as e:
                logger.warning(f"Failed to get GPU metrics: {str(e)}")
                
        self.metrics_window.append(metrics)
        
    def _get_system_metrics(self) -> Dict[str, float]:
        """Get system metrics."""
        return {
            "cpu_percent": psutil.cpu_percent(),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_io_counters": psutil.disk_io_counters().read_bytes + psutil.disk_io_counters().write_bytes,
            "network_io_counters": psutil.net_io_counters().bytes_sent + psutil.net_io_counters().bytes_recv
        }
        
    def _get_gpu_metrics(self) -> Dict[str, float]:
        """Get GPU metrics if available."""
        if not self.gpu_enabled:
            return {}
            
        try:
            metrics = {}
            device_count = pynvml.nvmlDeviceGetCount()
            
            for i in range(device_count):
                handle = pynvml.nvmlDeviceGetHandleByIndex(i)
                info = pynvml.nvmlDeviceGetMemoryInfo(handle)
                utilization = pynvml.nvmlDeviceGetUtilizationRates(handle)
                
                metrics.update({
                    f"gpu_{i}_memory_used": info.used / info.total * 100,
                    f"gpu_{i}_utilization": utilization.gpu
                })
                
            return metrics
        except Exception as e:
            logger.warning(f"Failed to get GPU metrics: {str(e)}")
            return {}
            
    def get_metrics(self) -> Dict[str, Any]:
        """Get current performance metrics."""
        metrics = {
            "window_size": self.window_size,
            "operations": self.operation_stats,
            "system": self._get_system_metrics()
        }
        
        if self.gpu_enabled:
            try:
                metrics["gpu"] = self._get_gpu_metrics()
            except Exception as e:
                logger.warning(f"Failed to get GPU metrics: {str(e)}")
                
        return metrics
        
    def reset(self):
        """Reset metrics."""
        self.metrics_window.clear()
        self.operation_stats.clear()

def with_performance_monitoring(operation_name: Optional[str] = None):
    """Decorator to monitor performance of a function."""
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            monitor = PerformanceMonitor.get_instance()
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                duration = time.time() - start_time
                monitor.record_operation(operation_name or func.__name__, duration)
                return result
            except Exception as e:
                duration = time.time() - start_time
                monitor.record_operation(operation_name or func.__name__, duration, success=False)
                raise
        return wrapper
    return decorator

@contextmanager
def performance_section(name: str):
    """Context manager for monitoring performance of a code section."""
    monitor = PerformanceMonitor.get_instance()
    start_time = time.time()
    try:
        yield
    finally:
        duration = time.time() - start_time
        monitor.record_operation(name, duration) 