"""Performance monitoring for RAG system."""
import time
import tracemalloc
import functools
from typing import Dict, Any, Optional, Callable
from dataclasses import dataclass
import asyncio
from contextlib import asynccontextmanager
from rag_aether.core.logging import get_logger

logger = get_logger("performance")

@dataclass
class OperationMetrics:
    """Metrics for a single operation."""
    operation: str
    component: str
    duration_ms: Optional[float] = None
    memory_before: Optional[int] = None
    memory_after: Optional[int] = None
    memory_peak: Optional[int] = None
    metadata: Dict[str, Any] = None

class PerformanceMonitor:
    """Monitor for tracking performance metrics."""
    
    def __init__(self):
        self.operations = []
        self._memory_tracking = False
    
    def start_memory_tracking(self):
        """Start memory tracking."""
        if not self._memory_tracking:
            tracemalloc.start()
            self._memory_tracking = True
            logger.info("Memory tracking started")
    
    def stop_memory_tracking(self):
        """Stop memory tracking."""
        if self._memory_tracking:
            tracemalloc.stop()
            self._memory_tracking = False
            logger.info("Memory tracking stopped")
    
    def track_operation(
        self,
        operation: str,
        component: str,
        duration_ms: Optional[float] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Track operation metrics."""
        metrics = OperationMetrics(
            operation=operation,
            component=component,
            duration_ms=duration_ms,
            metadata=metadata or {}
        )
        
        if self._memory_tracking:
            current, peak = tracemalloc.get_traced_memory()
            metrics.memory_after = current
            metrics.memory_peak = peak
        
        self.operations.append(metrics)
        
        # Log operation metrics
        logger.info(
            f"Operation tracked: {operation}",
            extra={
                "component": component,
                "duration_ms": duration_ms,
                "metadata": metadata
            }
        )
    
    def get_component_stats(self, component: str) -> Dict[str, Any]:
        """Get performance stats for a component."""
        component_ops = [op for op in self.operations if op.component == component]
        if not component_ops:
            return {}
            
        durations = [op.duration_ms for op in component_ops if op.duration_ms is not None]
        memory_usage = [
            (op.memory_after - op.memory_before) 
            for op in component_ops 
            if op.memory_before is not None and op.memory_after is not None
        ]
        
        return {
            "avg_duration_ms": sum(durations) / len(durations) if durations else 0,
            "max_duration_ms": max(durations) if durations else 0,
            "min_duration_ms": min(durations) if durations else 0,
            "total_operations": len(component_ops),
            "avg_memory_kb": sum(memory_usage) / len(memory_usage) / 1024 if memory_usage else 0,
            "max_memory_kb": max(memory_usage) / 1024 if memory_usage else 0
        }
    
    def get_operation_stats(self, operation: str) -> Dict[str, Any]:
        """Get performance stats for an operation."""
        op_metrics = [op for op in self.operations if op.operation == operation]
        if not op_metrics:
            return {}
            
        durations = [op.duration_ms for op in op_metrics if op.duration_ms is not None]
        return {
            "avg_duration_ms": sum(durations) / len(durations) if durations else 0,
            "max_duration_ms": max(durations) if durations else 0,
            "min_duration_ms": min(durations) if durations else 0,
            "total_calls": len(op_metrics),
            "success_rate": sum(1 for op in op_metrics if op.duration_ms is not None) / len(op_metrics)
        }

# Global performance monitor instance
monitor = PerformanceMonitor()

@asynccontextmanager
async def performance_section(operation: str, component: str):
    """Context manager for tracking performance of a code section."""
    start_time = time.time()
    start_memory = None
    
    if monitor._memory_tracking:
        current, _ = tracemalloc.get_traced_memory()
        start_memory = current
    
    try:
        yield
    finally:
        duration = (time.time() - start_time) * 1000
        metadata = {}
        
        if monitor._memory_tracking:
            current, peak = tracemalloc.get_traced_memory()
            metadata.update({
                "memory_before": start_memory,
                "memory_after": current,
                "memory_peak": peak
            })
        
        monitor.track_operation(
            operation=operation,
            component=component,
            duration_ms=duration,
            metadata=metadata
        )

def track_operation(operation: str, component: str):
    """Decorator for tracking operation performance."""
    def decorator(func: Callable):
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time.time()
            start_memory = None
            
            if monitor._memory_tracking:
                current, _ = tracemalloc.get_traced_memory()
                start_memory = current
            
            try:
                result = await func(*args, **kwargs)
                duration_ms = (time.time() - start_time) * 1000
                
                if monitor._memory_tracking:
                    current, peak = tracemalloc.get_traced_memory()
                    metadata = {
                        "memory_before": start_memory,
                        "memory_after": current,
                        "memory_peak": peak,
                        "success": True
                    }
                else:
                    metadata = {"success": True}
                    
                monitor.track_operation(
                    operation=operation,
                    component=component,
                    duration_ms=duration_ms,
                    metadata=metadata
                )
                
                return result
                
            except Exception as e:
                duration_ms = (time.time() - start_time) * 1000
                
                if monitor._memory_tracking:
                    current, peak = tracemalloc.get_traced_memory()
                    metadata = {
                        "memory_before": start_memory,
                        "memory_after": current,
                        "memory_peak": peak,
                        "success": False,
                        "error": str(e)
                    }
                else:
                    metadata = {
                        "success": False,
                        "error": str(e)
                    }
                    
                monitor.track_operation(
                    operation=operation,
                    component=component,
                    duration_ms=duration_ms,
                    metadata=metadata
                )
                raise
        
        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = time.time()
            start_memory = None
            
            if monitor._memory_tracking:
                current, _ = tracemalloc.get_traced_memory()
                start_memory = current
            
            try:
                result = func(*args, **kwargs)
                duration_ms = (time.time() - start_time) * 1000
                
                if monitor._memory_tracking:
                    current, peak = tracemalloc.get_traced_memory()
                    metadata = {
                        "memory_before": start_memory,
                        "memory_after": current,
                        "memory_peak": peak,
                        "success": True
                    }
                else:
                    metadata = {"success": True}
                    
                monitor.track_operation(
                    operation=operation,
                    component=component,
                    duration_ms=duration_ms,
                    metadata=metadata
                )
                
                return result
                
            except Exception as e:
                duration_ms = (time.time() - start_time) * 1000
                
                if monitor._memory_tracking:
                    current, peak = tracemalloc.get_traced_memory()
                    metadata = {
                        "memory_before": start_memory,
                        "memory_after": current,
                        "memory_peak": peak,
                        "success": False,
                        "error": str(e)
                    }
                else:
                    metadata = {
                        "success": False,
                        "error": str(e)
                    }
                    
                monitor.track_operation(
                    operation=operation,
                    component=component,
                    duration_ms=duration_ms,
                    metadata=metadata
                )
                raise
                
        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper
    return decorator

def with_performance_monitoring(operation: str = "", component: str = ""):
    """Decorator for monitoring function performance."""
    def decorator(func: Callable):
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time.time()
            start_memory = None
            peak_memory = None
            
            if monitor._memory_tracking:
                current, _ = tracemalloc.get_traced_memory()
                start_memory = current
            
            try:
                result = await func(*args, **kwargs)
                duration_ms = (time.time() - start_time) * 1000
                
                if monitor._memory_tracking:
                    current, peak = tracemalloc.get_traced_memory()
                    peak_memory = peak
                    
                monitor.track_operation(
                    operation=operation or func.__name__,
                    component=component,
                    duration_ms=duration_ms,
                    metadata={
                        "memory_before": start_memory,
                        "memory_after": current,
                        "memory_peak": peak_memory,
                        "success": True
                    }
                )
                
                return result
                
            except Exception as e:
                duration_ms = (time.time() - start_time) * 1000
                
                if monitor._memory_tracking:
                    current, peak = tracemalloc.get_traced_memory()
                    peak_memory = peak
                    
                monitor.track_operation(
                    operation=operation or func.__name__,
                    component=component,
                    duration_ms=duration_ms,
                    metadata={
                        "memory_before": start_memory,
                        "memory_after": current,
                        "memory_peak": peak_memory,
                        "success": False,
                        "error": str(e)
                    }
                )
                raise
        
        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = time.time()
            start_memory = None
            peak_memory = None
            
            if monitor._memory_tracking:
                current, _ = tracemalloc.get_traced_memory()
                start_memory = current
            
            try:
                result = func(*args, **kwargs)
                duration_ms = (time.time() - start_time) * 1000
                
                if monitor._memory_tracking:
                    current, peak = tracemalloc.get_traced_memory()
                    peak_memory = peak
                    
                monitor.track_operation(
                    operation=operation or func.__name__,
                    component=component,
                    duration_ms=duration_ms,
                    metadata={
                        "memory_before": start_memory,
                        "memory_after": current,
                        "memory_peak": peak_memory,
                        "success": True
                    }
                )
                
                return result
                
            except Exception as e:
                duration_ms = (time.time() - start_time) * 1000
                
                if monitor._memory_tracking:
                    current, peak = tracemalloc.get_traced_memory()
                    peak_memory = peak
                    
                monitor.track_operation(
                    operation=operation or func.__name__,
                    component=component,
                    duration_ms=duration_ms,
                    metadata={
                        "memory_before": start_memory,
                        "memory_after": current,
                        "memory_peak": peak_memory,
                        "success": False,
                        "error": str(e)
                    }
                )
                raise
                
        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper
    return decorator 