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

class CacheError(RAGError):
    """Raised when cache operations fail."""
    pass

class VectorStoreError(RAGError):
    """Raised when vector store operations fail."""
    pass

class MLClientError(RAGError):
    """Raised when ML client operations fail."""
    pass 