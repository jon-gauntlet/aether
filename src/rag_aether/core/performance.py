"""Performance monitoring utilities."""
from typing import Any, Dict, Optional, Callable
import time
import functools
import threading
from contextlib import contextmanager
import logging

logger = logging.getLogger(__name__)

# Thread-local storage for performance stats
_stats_storage = threading.local()

def _get_stats() -> Dict[str, Dict[str, float]]:
    """Get performance stats from thread-local storage."""
    if not hasattr(_stats_storage, 'stats'):
        _stats_storage.stats = {}
    return _stats_storage.stats

def reset_performance_stats() -> None:
    """Reset all performance stats."""
    if hasattr(_stats_storage, 'stats'):
        _stats_storage.stats = {}

def get_performance_stats() -> Dict[str, Dict[str, float]]:
    """Get current performance stats."""
    return _get_stats()

def with_performance_monitoring(func: Callable) -> Callable:
    """Decorator for monitoring function performance.
    
    Args:
        func: Function to monitor
        
    Returns:
        Wrapped function with performance monitoring
    """
    @functools.wraps(func)
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        stats = _get_stats()
        section = func.__name__
        
        if section not in stats:
            stats[section] = {
                'calls': 0,
                'total_time': 0.0,
                'min_time': float('inf'),
                'max_time': 0.0
            }
            
        start_time = time.perf_counter()
        try:
            result = func(*args, **kwargs)
            return result
        finally:
            duration = time.perf_counter() - start_time
            stats[section]['calls'] += 1
            stats[section]['total_time'] += duration
            stats[section]['min_time'] = min(stats[section]['min_time'], duration)
            stats[section]['max_time'] = max(stats[section]['max_time'], duration)
            
    return wrapper

@contextmanager
def performance_section(name: str) -> None:
    """Context manager for monitoring code section performance.
    
    Args:
        name: Name of the section to monitor
    """
    stats = _get_stats()
    
    if name not in stats:
        stats[name] = {
            'calls': 0,
            'total_time': 0.0,
            'min_time': float('inf'),
            'max_time': 0.0
        }
        
    start_time = time.perf_counter()
    try:
        yield
    finally:
        duration = time.perf_counter() - start_time
        stats[name]['calls'] += 1
        stats[name]['total_time'] += duration
        stats[name]['min_time'] = min(stats[name]['min_time'], duration)
        stats[name]['max_time'] = max(stats[name]['max_time'], duration) 