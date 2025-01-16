"""Error handling utilities for the RAG system."""

import functools
import logging
import traceback
from typing import Callable, Any, Optional, Dict
import asyncio
from datetime import datetime

logger = logging.getLogger(__name__)

class RAGError(Exception):
    """Base exception class for RAG system errors."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.details = details or {}
        self.timestamp = datetime.now()

class QueryError(RAGError):
    """Error during query processing."""
    pass

class IndexError(RAGError):
    """Error during indexing operations."""
    pass

class SearchError(RAGError):
    """Error during search operations."""
    pass

class ValidationError(RAGError):
    """Error during data validation."""
    pass

def with_error_handling(operation: Optional[str] = None, component: Optional[str] = None) -> Callable:
    """Decorator for handling errors in RAG system operations.
    
    Args:
        operation: Name of the operation being performed
        component: Name of the component performing the operation
        
    Returns:
        Decorated function with error handling
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            op_name = operation or func.__name__
            comp_name = component or func.__module__.split('.')[-1]
            
            try:
                return await func(*args, **kwargs)
                
            except RAGError as e:
                # Log known RAG system errors
                logger.error(
                    f"RAG error in {comp_name}.{op_name}: {str(e)}",
                    extra={
                        'component': comp_name,
                        'operation': op_name,
                        'error_type': e.__class__.__name__,
                        'details': e.details,
                        'timestamp': e.timestamp.isoformat()
                    }
                )
                raise
                
            except Exception as e:
                # Log unexpected errors
                logger.error(
                    f"Unexpected error in {comp_name}.{op_name}: {str(e)}\n"
                    f"Traceback:\n{traceback.format_exc()}",
                    extra={
                        'component': comp_name,
                        'operation': op_name,
                        'error_type': e.__class__.__name__,
                        'timestamp': datetime.now().isoformat()
                    }
                )
                # Wrap unknown errors in RAGError
                raise RAGError(
                    f"Unexpected error in {comp_name}.{op_name}: {str(e)}",
                    details={
                        'error_type': e.__class__.__name__,
                        'traceback': traceback.format_exc()
                    }
                ) from e
                
        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            op_name = operation or func.__name__
            comp_name = component or func.__module__.split('.')[-1]
            
            try:
                return func(*args, **kwargs)
                
            except RAGError as e:
                # Log known RAG system errors
                logger.error(
                    f"RAG error in {comp_name}.{op_name}: {str(e)}",
                    extra={
                        'component': comp_name,
                        'operation': op_name,
                        'error_type': e.__class__.__name__,
                        'details': e.details,
                        'timestamp': e.timestamp.isoformat()
                    }
                )
                raise
                
            except Exception as e:
                # Log unexpected errors
                logger.error(
                    f"Unexpected error in {comp_name}.{op_name}: {str(e)}\n"
                    f"Traceback:\n{traceback.format_exc()}",
                    extra={
                        'component': comp_name,
                        'operation': op_name,
                        'error_type': e.__class__.__name__,
                        'timestamp': datetime.now().isoformat()
                    }
                )
                # Wrap unknown errors in RAGError
                raise RAGError(
                    f"Unexpected error in {comp_name}.{op_name}: {str(e)}",
                    details={
                        'error_type': e.__class__.__name__,
                        'traceback': traceback.format_exc()
                    }
                ) from e
                
        # Choose wrapper based on whether function is async
        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper
        
    return decorator 