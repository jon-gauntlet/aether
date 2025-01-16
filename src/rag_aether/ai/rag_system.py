"""RAG system implementation."""

from typing import List, Dict, Any, Optional, Union
import logging
from datetime import datetime

from ..core.error_handling import with_error_handling, RAGError
from ..core.performance import with_performance_monitoring
from ..data.event_types import (
    EVENT_INGESTION,
    EVENT_QUERY,
    EVENT_RETRIEVAL,
    EVENT_RERANKING
)
from .types import ChatMessage, QueryContext
from .hybrid_search import HybridSearcher
from .query_expansion import QueryExpander

logger = logging.getLogger(__name__)

class RAGSystem:
    """Retrieval-Augmented Generation system."""
    
    def __init__(
        self,
        config: Optional[Dict[str, Any]] = None,
        use_mock: bool = False,
        model_name: str = "sentence-transformers/all-mpnet-base-v2"
    ):
        """Initialize RAG system.
        
        Args:
            config: Optional configuration dictionary
            use_mock: Whether to use mock data/components for testing
            model_name: Name of the model to use for embeddings
        """
        self.config = config or {}
        self.use_mock = use_mock
        self.model_name = model_name
        
        # Initialize components
        self.searcher = HybridSearcher(
            model_name=model_name if not use_mock else "mock"
        )
        self.query_expander = QueryExpander(
            model_name=model_name if not use_mock else "mock"
        )
        self.chat_history: List[ChatMessage] = []
        
    @with_error_handling(operation="process_query")
    @with_performance_monitoring(operation="process_query")
    async def process_query(self, query: Union[str, QueryContext]) -> Dict[str, Any]:
        """Process a query through the RAG pipeline."""
        # Convert string query to QueryContext if needed
        if isinstance(query, str):
            query = QueryContext(query=query)
            
        # Expand query
        expanded = await self.query_expander.expand_query(query.query)
        
        # Perform search
        results = await self.searcher.search(expanded)
        
        # Format response
        response = {
            'query': query.query,
            'expanded_query': expanded,
            'results': results,
            'metadata': {
                'timestamp': datetime.now().isoformat(),
                'use_mock': self.use_mock
            }
        }
        
        return response
        
    @with_error_handling(operation="index_documents")
    @with_performance_monitoring(operation="index_documents")
    async def index_documents(self, documents: List[str]) -> None:
        """Index documents for retrieval."""
        await self.searcher.index_documents(documents)
        
    @with_error_handling(operation="clear_chat_history")
    def clear_chat_history(self) -> None:
        """Clear chat history."""
        self.chat_history.clear()
        
    @with_error_handling(operation="add_message")
    def add_message(self, message: ChatMessage) -> None:
        """Add a message to chat history."""
        self.chat_history.append(message) 