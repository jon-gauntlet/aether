import functools
import logging
import asyncio
from typing import Dict, Any, Callable, TypeVar, Awaitable

logger = logging.getLogger(__name__)

T = TypeVar('T')

def with_retries(max_attempts: int = 3, delay: float = 1.0):
    """Decorator to retry async operations with delay."""
    def decorator(func: Callable[..., Awaitable[T]]) -> Callable[..., Awaitable[T]]:
        @functools.wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> T:
            last_error = None
            for attempt in range(max_attempts):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    last_error = e
                    if attempt < max_attempts - 1:
                        logger.warning(f"Attempt {attempt + 1} failed: {str(e)}, retrying in {delay} seconds...")
                        await asyncio.sleep(delay)
                    else:
                        logger.error(f"All {max_attempts} attempts failed")
                        raise last_error
            raise last_error  # Should never reach here
        return wrapper
    return decorator

def with_health_check(func: Callable[..., Awaitable[T]]) -> Callable[..., Awaitable[T]]:
    """Decorator to ensure the vector store is initialized before operations."""
    @functools.wraps(func)
    async def wrapper(self, *args: Any, **kwargs: Any) -> T:
        if not hasattr(self, 'vector_store') or not self.vector_store:
            raise RuntimeError("Vector store not initialized")
        return await func(self, *args, **kwargs)
    return wrapper

class SystemHealth:
    """Track system health and operations."""
    def __init__(self):
        self.operations: Dict[str, int] = {}
        self.energy_level: float = 1.0
        
    def record_operation(self, operation_type: str):
        """Record an operation of the given type."""
        self.operations[operation_type] = self.operations.get(operation_type, 0) + 1
        
    def get_operation_count(self, operation_type: str) -> int:
        """Get the count of operations of the given type."""
        return self.operations.get(operation_type, 0)
        
    def update_energy(self, delta: float):
        """Update system energy level."""
        self.energy_level = max(0.0, min(1.0, self.energy_level + delta))
        
    def get_energy(self) -> float:
        """Get current energy level."""
        return self.energy_level 