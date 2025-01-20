"""Custom exceptions for RAG system."""

class RAGError(Exception):
    """Base class for RAG system exceptions."""
    pass

class QueryProcessingError(RAGError):
    """Raised when query processing fails."""
    pass

class QueryExpansionError(RAGError):
    """Raised when query expansion fails."""
    pass

class DocumentProcessingError(RAGError):
    """Raised when document processing fails."""
    pass

class VectorStoreError(RAGError):
    """Raised when vector store operations fail."""
    pass

class CacheError(RAGError):
    """Raised when cache operations fail."""
    pass

class MonitoringError(RAGError):
    """Raised when monitoring system operations fail."""
    pass

class MLClientError(RAGError):
    """Raised when ML client operations fail."""
    pass 