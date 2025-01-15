import logging
import functools
from typing import Dict, Any, Callable
from collections import defaultdict

logger = logging.getLogger(__name__)

def with_retries(max_attempts: int = 3):
    """Decorator to retry a function on failure."""
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            last_error = None
            for attempt in range(max_attempts):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    last_error = e
                    logger.warning(f"Attempt {attempt + 1} failed: {str(e)}")
            raise last_error
        return wrapper
    return decorator

def with_health_check(func):
    """Decorator to perform health check before operation."""
    @functools.wraps(func)
    async def wrapper(self, *args, **kwargs):
        # Check vector store health
        if not self.vector_store:
            raise RuntimeError("Vector store not initialized")
        logger.info("Vector store health check passed")
        return await func(self, *args, **kwargs)
    return wrapper

class SystemHealth:
    def __init__(self):
        self.operations = defaultdict(int)
        self.status = "healthy"
        
    def record_operation(self, operation_type: str):
        """Record an operation."""
        self.operations[operation_type] += 1
        
    def get_operation_count(self, operation_type: str) -> int:
        """Get the count of a specific operation type."""
        return self.operations[operation_type]
        
    async def full_check(self) -> Dict[str, Any]:
        """Perform a full system health check."""
        try:
            return {
                "status": self.status,
                "operations": dict(self.operations),
                "details": {
                    "last_operation_time": None,  # TODO: Add timing
                    "memory_usage": None,  # TODO: Add memory tracking
                    "error_rate": None,  # TODO: Add error tracking
                }
            }
        except Exception as e:
            logger.error(f"Health check failed: {str(e)}")
            return {
                "status": "unhealthy",
                "error": str(e)
            } 