"""Advanced RAG implementation."""
from typing import Dict, Any, List, Optional
import logging
from datetime import datetime
import json

from ..core.error_handling import with_error_handling, RAGError
from ..core.performance import with_performance_monitoring
from ..core.conversation import ConversationManager
from ..data.document import Document, Chunk
from ..data.supabase_adapter import SupabaseAdapter

logger = logging.getLogger(__name__)

class BaseRAG:
    """Advanced RAG implementation with hybrid search and context management."""
    
    async def __init__(
        self,
        config: Optional[Dict[str, Any]] = None,
        use_mock: bool = False
    ):
        """Initialize RAG system.
        
        Args:
            config: Optional configuration dictionary
            use_mock: Whether to use mock data/components for testing
        """
        self.config = config or {}
        self.use_mock = use_mock
        self.documents: List[Document] = []
        self.conversation_manager = ConversationManager()
        
        # Initialize Supabase adapter
        if not use_mock:
            try:
                self.db = SupabaseAdapter()
                # Load existing documents
                self.documents = await self.db.get_documents()
                logger.info(f"Loaded {len(self.documents)} documents from database")
            except Exception as e:
                logger.error(f"Failed to initialize database: {str(e)}")
                logger.warning("Falling back to in-memory storage")
                self.db = None
        else:
            self.db = None
        
        # Configure chunking
        self.chunk_size = self.config.get('chunk_size', 1000)
        self.chunk_overlap = self.config.get('chunk_overlap', 100)
        
        logger.info(f"Initialized RAG system (mock={use_mock})")
    
    @classmethod
    async def create(
        cls,
        config: Optional[Dict[str, Any]] = None,
        use_mock: bool = False
    ) -> 'BaseRAG':
        """Create a new BaseRAG instance.
        
        This is needed because __init__ is async.
        """
        instance = cls.__new__(cls)
        await instance.__init__(config=config, use_mock=use_mock)
        return instance
    
    def _search_documents(self, query: str, limit: int = 5) -> List[Chunk]:
        """Search for relevant document chunks.
        
        This is a simple keyword-based search for now.
        In production, this would use embeddings and vector search.
        """
        query_terms = set(query.lower().split())
        scored_chunks = []
        
        for doc in self.documents:
            for chunk in doc.chunks:
                chunk_terms = set(chunk.content.lower().split())
                score = len(query_terms & chunk_terms) / len(query_terms)
                if score > 0:
                    scored_chunks.append((score, chunk))
        
        # Sort by score and return top chunks
        scored_chunks.sort(reverse=True)
        return [chunk for _, chunk in scored_chunks[:limit]]
    
    def _format_context(self, chunks: List[Chunk]) -> str:
        """Format chunks into a context string."""
        return "\n\n".join(
            f"[Document: {chunk.metadata['parent_doc']}]\n{chunk.content}"
            for chunk in chunks
        )
    
    @with_error_handling(operation="process_query")
    @with_performance_monitoring(operation="process_query")
    async def process_query(
        self,
        query: str,
        conversation_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Process a query through the RAG pipeline."""
        try:
            # Get conversation context
            if not conversation_id:
                conversation_id = self.conversation_manager.create_conversation()
            
            context_window = self.conversation_manager.get_context_window(conversation_id)
            
            # Search for relevant chunks
            relevant_chunks = self._search_documents(query)
            context = self._format_context(relevant_chunks)
            
            # For now, return a simple response
            # In production, this would use an LLM
            response = {
                'query': query,
                'answer': f"Based on the context, I understand your query: {query}",
                'context': [
                    {
                        'content': chunk.content,
                        'metadata': chunk.metadata
                    }
                    for chunk in relevant_chunks
                ],
                'metadata': {
                    'timestamp': datetime.now().isoformat(),
                    'conversation_id': conversation_id,
                    'use_mock': self.use_mock
                }
            }
            
            # Record interaction
            message = self.conversation_manager.add_message(
                conversation_id=conversation_id,
                content=query,
                role='user'
            )
            if self.db:
                await self.db.save_message(conversation_id, message)
                
            message = self.conversation_manager.add_message(
                conversation_id=conversation_id,
                content=response['answer'],
                role='assistant',
                metadata={'context_chunks': len(relevant_chunks)}
            )
            if self.db:
                await self.db.save_message(conversation_id, message)
            
            return response
            
        except Exception as e:
            logger.error(f"Failed to process query: {str(e)}")
            raise RAGError(f"Failed to process query: {str(e)}")
    
    @with_error_handling(operation="add_document")
    async def add_document(self, document: Document) -> None:
        """Add a document to the system."""
        try:
            self.documents.append(document)
            if self.db:
                await self.db.save_document(document)
                
            logger.info(
                f"Added document: {document.metadata.get('filename', 'unknown')} "
                f"with {document.metadata['chunk_count']} chunks"
            )
        except Exception as e:
            logger.error(f"Failed to add document: {str(e)}")
            raise RAGError(f"Failed to add document: {str(e)}")
    
    @with_error_handling(operation="get_chat_history")
    async def get_chat_history(
        self,
        conversation_id: str,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Get chat history for a conversation."""
        try:
            if self.db:
                messages = await self.db.get_conversation_messages(conversation_id)
                if limit:
                    messages = messages[-limit:]
                return [
                    {
                        'content': msg.content,
                        'role': msg.role,
                        'timestamp': msg.timestamp.isoformat(),
                        'metadata': msg.metadata
                    }
                    for msg in messages
                ]
            return self.conversation_manager.get_history(conversation_id, limit=limit)
        except Exception as e:
            logger.error(f"Failed to get chat history: {str(e)}")
            raise RAGError(f"Failed to get chat history: {str(e)}")
            
    def __str__(self) -> str:
        """String representation of RAG system state."""
        return json.dumps({
            'documents': len(self.documents),
            'total_chunks': sum(doc.metadata['chunk_count'] for doc in self.documents),
            'conversations': len(self.conversation_manager.conversations),
            'use_mock': self.use_mock,
            'has_db': self.db is not None
        }, indent=2) 