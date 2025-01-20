"""Performance monitoring utilities."""
import time
import functools
import logging
import contextlib
import threading
from typing import Optional, Callable, Any, Dict

from .monitoring import monitor

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
    """Decorator to monitor function performance.
    
    Args:
        func: Function to monitor
        
    Returns:
        Wrapped function
    """
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        stats = _get_stats()
        section = func.__name__
        
        if section not in stats:
            stats[section] = {
                'calls': 0,
                'total_time': 0.0,
                'min_time': float('inf'),
                'max_time': 0.0,
                'errors': 0
            }
            
        start_time = time.perf_counter()
        try:
            result = await func(*args, **kwargs)
            duration = time.perf_counter() - start_time
            
            # Update stats
            stats[section]['calls'] += 1
            stats[section]['total_time'] += duration
            stats[section]['min_time'] = min(stats[section]['min_time'], duration)
            stats[section]['max_time'] = max(stats[section]['max_time'], duration)
            
            # Log performance
            logger.debug(f"{func.__name__} took {duration:.3f}s")
            
            return result
            
        except Exception as e:
            duration = time.perf_counter() - start_time
            stats[section]['errors'] += 1
            logger.error(f"{func.__name__} failed after {duration:.3f}s: {e}")
            raise
            
    return wrapper

@contextlib.contextmanager
def performance_section(name: str):
    """Context manager to monitor code section performance.
    
    Args:
        name: Name of the section
    """
    stats = _get_stats()
    
    if name not in stats:
        stats[name] = {
            'calls': 0,
            'total_time': 0.0,
            'min_time': float('inf'),
            'max_time': 0.0,
            'errors': 0
        }
        
    start_time = time.perf_counter()
    try:
        yield
    except Exception as e:
        duration = time.perf_counter() - start_time
        stats[name]['errors'] += 1
        logger.error(f"Section {name} failed after {duration:.3f}s: {e}")
        raise
    finally:
        duration = time.perf_counter() - start_time
        stats[name]['calls'] += 1
        stats[name]['total_time'] += duration
        stats[name]['min_time'] = min(stats[name]['min_time'], duration)
        stats[name]['max_time'] = max(stats[name]['max_time'], duration)
        logger.debug(f"Section {name} took {duration:.3f}s") 