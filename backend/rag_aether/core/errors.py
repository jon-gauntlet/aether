"""Custom exceptions for RAG system."""

class RAGError(Exception):
    """Base exception for RAG system errors."""
    pass

class DocumentProcessingError(RAGError):
    """Error during document processing."""
    pass

class SearchError(RAGError):
    """Error during search operation."""
    pass

class ConfigurationError(RAGError):
    """Error in system configuration."""
    pass 