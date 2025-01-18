"""RAG system implementation."""

from typing import List, Dict, Any, Optional
import numpy as np
from sentence_transformers import SentenceTransformer, util
from .cache_manager import CacheManager
from .vector_search import OptimizedVectorSearch
import torch
import logging
from dataclasses import dataclass
import numpy as np
import os
from anthropic import Anthropic
from datetime import datetime

from .query_expansion import QueryExpander
from ..core.caching import Cache
from ..core.errors import RAGError

logger = logging.getLogger(__name__)

@dataclass
class RAGResponse:
    """Response from RAG system."""
    answer: str
    context: List[Dict[str, Any]]
    expanded_query: Optional[str] = None

class BaseRAG:
    """Base class for RAG systems."""
    
    def __init__(self, model_name: str = "BAAI/bge-small-en", mock_model=None):
        """Initialize base RAG system.
        
        Args:
            model_name: Name of the embedding model to use
            mock_model: Mock model for testing
        """
        self.model_name = model_name
        try:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            if mock_model is not None:
                self.model = mock_model
            else:
                self.model = SentenceTransformer(model_name).to(self.device)
        except RuntimeError as e:
            if "out of memory" in str(e):
                logger.warning(f"CUDA out of memory, falling back to CPU for {model_name}")
                self.device = torch.device("cpu") 
                self.model = SentenceTransformer(model_name).to(self.device)
            else:
                raise RAGError(f"Failed to initialize RAG system: {str(e)}")
                
    def encode(self, texts: List[str]) -> torch.Tensor:
        """Encode texts to embeddings.
        
        Args:
            texts: List of texts to encode
            
        Returns:
            Tensor of embeddings
        """
        try:
            return self.model.encode(
                texts,
                convert_to_tensor=True,
                device=self.device
            )
        except Exception as e:
            raise RAGError(f"Failed to encode texts: {str(e)}")

class RAGSystem(BaseRAG):
    """RAG system implementation with Claude integration."""
    
    def __init__(self, model_name: str = "BAAI/bge-small-en", mock_model=None):
        """Initialize RAG system.
        
        Args:
            model_name: Name of the embedding model to use
            mock_model: Mock model for testing
        """
        super().__init__(model_name, mock_model)
        self.documents: List[Dict[str, Any]] = []
        self.document_embeddings: Optional[torch.Tensor] = None
        self.query_expander = QueryExpander()
        
        # Initialize Claude client
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            logger.warning("ANTHROPIC_API_KEY not set - Claude integration disabled")
            self.anthropic = None
        else:
            self.anthropic = Anthropic()  # API key is automatically picked up from env var
        
    async def add_documents(self, documents: List[Dict[str, Any]]) -> None:
        """Add documents to the RAG system.
        
        Args:
            documents: List of documents to add
        """
        try:
            self.documents.extend(documents)
            if not self.documents:
                return
                
            # Encode documents
            texts = [doc["text"] for doc in documents]
            embeddings = self.encode(texts)
            
            # Update document embeddings
            if self.document_embeddings is None:
                self.document_embeddings = embeddings
            else:
                self.document_embeddings = torch.cat([self.document_embeddings, embeddings])
                
        except Exception as e:
            raise RAGError(f"Failed to add documents: {str(e)}")
            
    async def ingest_message(self, message: Dict[str, Any]) -> None:
        """Ingest a message into the RAG system.
        
        Args:
            message: Message to ingest
        """
        try:
            await self.add_documents([{
                "text": message["content"],
                "metadata": {
                    "channel": message["channel"],
                    "user_id": message["user_id"],
                    "timestamp": message["timestamp"],
                    "thread_id": message["thread_id"]
                }
            }])
        except Exception as e:
            raise RAGError(f"Failed to ingest message: {str(e)}")
            
    async def query(self, query: str, k: int = 3) -> RAGResponse:
        """Query the RAG system.
        
        Args:
            query: Query text
            k: Number of documents to retrieve
            
        Returns:
            RAGResponse with answer and context
        """
        try:
            # Expand query if needed
            expanded_query = await self.query_expander.expand(query)
            logger.debug(f"Expanded query: {expanded_query}")
            
            # Get relevant documents
            results = await self.search(expanded_query, k)
            
            if not self.anthropic:
                return RAGResponse(
                    answer="Claude integration is disabled - no API key provided",
                    context=results,
                    expanded_query=expanded_query
                )
            
            # Format context
            context = "\n\n".join([doc["text"] for doc in results])
            
            # Generate response with Claude
            message = await self.anthropic.messages.create(
                model="claude-3-opus-20240229",
                max_tokens=1000,
                temperature=0,  # Set to 0 for deterministic output
                system="You are a helpful AI assistant. Use the provided context to answer questions accurately and concisely.",
                messages=[{
                    "role": "user", 
                    "content": f"Context:\n{context}\n\nQuestion: {query}"
                }]
            )
            
            return RAGResponse(
                answer=message.content,
                context=results,
                expanded_query=expanded_query
            )
            
        except Exception as e:
            raise RAGError(f"Failed to query RAG system: {str(e)}")
            
    async def generate_response(
        self,
        query: str,
        format: str = "text",
        **kwargs
    ) -> Any:
        """Generate a response in the specified format.
        
        Args:
            query: Query string
            format: Response format (text, json, markdown)
            **kwargs: Additional arguments for query
            
        Returns:
            Response in specified format
        """
        if format not in ["text", "json", "markdown"]:
            raise ValueError(f"Unsupported format: {format}")
            
        response = await self.query(query, **kwargs)
        
        if format == "text":
            return response.answer
            
        elif format == "json":
            return {
                "answer": response.answer,
                "context": response.context,
                "metadata": {
                    "timestamp": datetime.now().isoformat(),
                    "expanded_query": response.expanded_query
                }
            }
            
        else:  # markdown
            context_md = "\n".join(f"- {doc['text']}" for doc in response.context)
            return f"""# Response
{response.answer}

## Context
{context_md}

*Generated at {datetime.now().isoformat()}*
""" 