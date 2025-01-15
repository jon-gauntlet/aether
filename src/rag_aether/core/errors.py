"""Error handling for RAG system."""
from typing import Optional, Dict, Any
import logging
import traceback
from dataclasses import dataclass
from datetime import datetime

logger = logging.getLogger(__name__)

@dataclass
class ErrorContext:
    """Context information for errors."""
    timestamp: datetime
    operation: str
    component: str
    details: Dict[str, Any]
    trace: str

class RAGError(Exception):
    """Base exception for RAG system."""
    def __init__(self, message: str, operation: str = "", component: str = "", details: Dict[str, Any] = None):
        super().__init__(message)
        self.context = ErrorContext(
            timestamp=datetime.now(),
            operation=operation,
            component=component,
            details=details or {},
            trace=traceback.format_exc()
        )
        # Log error with context
        logger.error(
            f"{self.__class__.__name__}: {message}\n"
            f"Operation: {operation}\n"
            f"Component: {component}\n"
            f"Details: {details}\n"
            f"Trace:\n{self.context.trace}"
        )

class EmbeddingError(RAGError):
    """Raised when there's an error generating embeddings."""
    pass

class IndexError(RAGError):
    """Raised when there's an error with the vector index."""
    pass

class RetrievalError(RAGError):
    """Raised when there's an error during retrieval."""
    pass

class MetadataError(RAGError):
    """Raised when there's an error handling metadata."""
    pass

class StorageError(RAGError):
    """Raised when there's an error with storage operations."""
    pass

class HealthCheckError(RAGError):
    """Raised when system health check fails."""
    pass

def handle_rag_error(error: Exception, operation: str = "", component: str = "") -> Optional[Dict[str, Any]]:
    """Handle RAG system errors with appropriate logging and recovery actions."""
    if isinstance(error, RAGError):
        # Already logged in constructor
        return {
            "error_type": error.__class__.__name__,
            "message": str(error),
            "operation": error.context.operation or operation,
            "component": error.context.component or component,
            "timestamp": error.context.timestamp.isoformat(),
            "details": error.context.details
        }
    
    # Handle unexpected errors
    error_context = ErrorContext(
        timestamp=datetime.now(),
        operation=operation,
        component=component,
        details={},
        trace=traceback.format_exc()
    )
    
    logger.error(
        f"Unexpected error: {str(error)}\n"
        f"Operation: {operation}\n"
        f"Component: {component}\n"
        f"Trace:\n{error_context.trace}"
    )
    
    return {
        "error_type": error.__class__.__name__,
        "message": str(error),
        "operation": operation,
        "component": component,
        "timestamp": error_context.timestamp.isoformat()
    }

def with_error_handling(operation: str = "", component: str = ""):
    """Decorator for handling RAG errors with context."""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                error_info = handle_rag_error(e, operation, component)
                if isinstance(e, RAGError):
                    raise e
                raise RAGError(
                    str(e),
                    operation=operation,
                    component=component,
                    details=error_info
                ) from e
        return wrapper
    return decorator 