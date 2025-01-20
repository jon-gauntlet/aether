"""Error classes for RAG system."""

class RAGError(Exception):
    """Base class for RAG system errors."""
    pass

class QueryExpansionError(RAGError):
    """Error raised when query expansion fails."""
    pass

class DocumentProcessingError(RAGError):
    """Error raised when document processing fails."""
    pass

class QueryProcessingError(RAGError):
    """Error raised when query processing fails."""
    pass 