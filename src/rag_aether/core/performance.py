"""Performance monitoring utilities."""
import time
import logging
import functools
from contextlib import contextmanager
from typing import Optional, Dict, Any, Callable

logger = logging.getLogger(__name__)

_performance_data: Dict[str, Dict[str, Any]] = {}

def with_performance_monitoring(func: Callable) -> Callable:
    """Decorator to monitor function performance."""
    @functools.wraps(func)
    def decorator(*args, **kwargs):
        start_time = time.perf_counter()
        try:
            result = func(*args, **kwargs)
            end_time = time.perf_counter()
            duration = end_time - start_time
            
            # Log performance data
            func_name = func.__name__
            if func_name not in _performance_data:
                _performance_data[func_name] = {
                    'calls': 0,
                    'total_time': 0,
                    'avg_time': 0,
                    'min_time': float('inf'),
                    'max_time': 0
                }
                
            data = _performance_data[func_name]
            data['calls'] += 1
            data['total_time'] += duration
            data['avg_time'] = data['total_time'] / data['calls']
            data['min_time'] = min(data['min_time'], duration)
            data['max_time'] = max(data['max_time'], duration)
            
            logger.debug(
                f"Performance: {func_name} took {duration:.4f}s "
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
        
        if name not in _performance_data:
            _performance_data[name] = {
                'calls': 0,
                'total_time': 0,
                'avg_time': 0,
                'min_time': float('inf'),
                'max_time': 0
            }
            
        data = _performance_data[name]
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