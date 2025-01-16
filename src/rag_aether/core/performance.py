"""Performance monitoring utilities."""
import time
import logging
import functools
from contextlib import contextmanager
from typing import Optional, Dict, Any, Callable, Union
import asyncio

logger = logging.getLogger(__name__)

_performance_data: Dict[str, Dict[str, Any]] = {}

def track_operation(operation_name: str, duration: float, metadata: Optional[Dict[str, Any]] = None) -> None:
    """Track performance data for an operation."""
    data = monitor(operation_name)
    data['calls'] += 1
    data['total_time'] += duration
    data['avg_time'] = data['total_time'] / data['calls']
    data['min_time'] = min(data['min_time'], duration)
    data['max_time'] = max(data['max_time'], duration)
    
    if metadata:
        if 'metadata' not in data:
            data['metadata'] = {}
        data['metadata'].update(metadata)
    
    logger.debug(
        f"Performance: {operation_name} took {duration:.4f}s "
        f"(avg: {data['avg_time']:.4f}s, "
        f"min: {data['min_time']:.4f}s, "
        f"max: {data['max_time']:.4f}s)"
    )

def monitor(operation_name: str) -> Dict[str, Any]:
    """Get performance monitoring data for an operation."""
    if operation_name not in _performance_data:
        _performance_data[operation_name] = {
            'calls': 0,
            'total_time': 0,
            'avg_time': 0,
            'min_time': float('inf'),
            'max_time': 0
        }
    return _performance_data[operation_name]

def with_performance_monitoring(
    operation: Optional[str] = None,
    component: Optional[str] = None
) -> Callable:
    """Decorator to monitor function performance.
    
    Can be used with or without arguments:
    @with_performance_monitoring
    def func(): ...
    
    @with_performance_monitoring(operation="op_name")
    def func(): ...
    
    @with_performance_monitoring(operation="op_name", component="comp_name")
    def func(): ...
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time.perf_counter()
            try:
                result = await func(*args, **kwargs)
                end_time = time.perf_counter()
                duration = end_time - start_time
                
                # Get operation name
                op_name = operation or func.__name__
                if component:
                    op_name = f"{component}.{op_name}"
                
                # Log performance data
                data = monitor(op_name)
                data['calls'] += 1
                data['total_time'] += duration
                data['avg_time'] = data['total_time'] / data['calls']
                data['min_time'] = min(data['min_time'], duration)
                data['max_time'] = max(data['max_time'], duration)
                
                logger.debug(
                    f"Performance: {op_name} took {duration:.4f}s "
                    f"(avg: {data['avg_time']:.4f}s, "
                    f"min: {data['min_time']:.4f}s, "
                    f"max: {data['max_time']:.4f}s)"
                )
                
                return result
                
            except Exception as e:
                end_time = time.perf_counter()
                duration = end_time - start_time
                logger.error(
                    f"Error in {func.__name__}: {str(e)} "
                    f"(duration: {duration:.4f}s)"
                )
                raise
                
        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = time.perf_counter()
            try:
                result = func(*args, **kwargs)
                end_time = time.perf_counter()
                duration = end_time - start_time
                
                # Get operation name
                op_name = operation or func.__name__
                if component:
                    op_name = f"{component}.{op_name}"
                
                # Log performance data
                data = monitor(op_name)
                data['calls'] += 1
                data['total_time'] += duration
                data['avg_time'] = data['total_time'] / data['calls']
                data['min_time'] = min(data['min_time'], duration)
                data['max_time'] = max(data['max_time'], duration)
                
                logger.debug(
                    f"Performance: {op_name} took {duration:.4f}s "
                    f"(avg: {data['avg_time']:.4f}s, "
                    f"min: {data['min_time']:.4f}s, "
                    f"max: {data['max_time']:.4f}s)"
                )
                
                return result
                
            except Exception as e:
                end_time = time.perf_counter()
                duration = end_time - start_time
                logger.error(
                    f"Error in {func.__name__}: {str(e)} "
                    f"(duration: {duration:.4f}s)"
                )
                raise
                
        # Choose wrapper based on whether function is async
        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper
        
    # Handle both @with_performance_monitoring and @with_performance_monitoring()
    if callable(operation):
        return decorator(operation)
    return decorator

@contextmanager
def performance_section(name: str):
    """Context manager for monitoring code section performance."""
    start_time = time.perf_counter()
    try:
        yield
    finally:
        end_time = time.perf_counter()
        duration = end_time - start_time
        
        data = monitor(name)
        data['calls'] += 1
        data['total_time'] += duration
        data['avg_time'] = data['total_time'] / data['calls']
        data['min_time'] = min(data['min_time'], duration)
        data['max_time'] = max(data['max_time'], duration)
        
        logger.debug(
            f"Section {name} took {duration:.4f}s "
            f"(avg: {data['avg_time']:.4f}s, "
            f"min: {data['min_time']:.4f}s, "
            f"max: {data['max_time']:.4f}s)"
        )

def get_performance_stats() -> Dict[str, Dict[str, Any]]:
    """Get collected performance statistics."""
    return _performance_data.copy()

def reset_performance_stats():
    """Reset performance statistics."""
    _performance_data.clear() 