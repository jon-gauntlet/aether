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
    
    def __init__(self, model_name: str = "BAAI/bge-small-en"):
        """Initialize base RAG system.
        
        Args:
            model_name: Name of the embedding model to use
        """
        self.model_name = model_name
        try:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
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
    
    def __init__(self, model_name: str = "BAAI/bge-small-en"):
        """Initialize RAG system.
        
        Args:
            model_name: Name of the embedding model to use
        """
        super().__init__(model_name)
        self.documents: List[Dict[str, Any]] = []
        self.document_embeddings: Optional[torch.Tensor] = None
        self.query_expander = QueryExpander()
        
        # Initialize Claude client
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            logger.warning("ANTHROPIC_API_KEY not set - Claude integration disabled")
            self.anthropic = None
        else:
            self.anthropic = Anthropic(api_key=api_key)
        
    def add_documents(self, documents: List[Dict[str, Any]]) -> None:
        """Add documents to the RAG system.
        
        Args:
            documents: List of documents to add
        """
        self.model_name = model_name
        self.use_production = use_production_features
        self.use_mock = use_mock
        
        try:
            self.documents.extend(documents)
            texts = [doc["text"] for doc in documents]
            embeddings = self.encode(texts)
            
            if self.document_embeddings is None:
                self.document_embeddings = embeddings
            else:
                self.document_embeddings = torch.cat([
                    self.document_embeddings, 
                    embeddings
                ])
                
        except Exception as e:
            raise RAGError(f"Failed to add documents: {str(e)}")
            
    async def search(self, query: str, k: int = 3) -> List[Dict[str, Any]]:
        """Search for relevant documents.
        
        Args:
            query: Query to search for
            k: Number of results to return
            
        Returns:
            List of relevant documents with scores
        """
        try:
            if not self.documents:
                return []
                
            # Expand query
            expanded = await self.query_expander.expand_query(query)
            query_text = expanded["expanded_query"]
            
            # Get embeddings
            query_embedding = self.encode([query_text])
            
            # Calculate similarities
            similarities = util.pytorch_cos_sim(
                query_embedding, 
                self.document_embeddings
            )[0]
            
            # Get top k
            top_k = torch.topk(similarities, min(k, len(self.documents)))
            
            results = []
            for score, idx in zip(top_k.values, top_k.indices):
                doc = self.documents[idx]
                results.append({
                    "document": doc,
                    "score": float(score),
                    "expanded_query": query_text
                })
                
            return results
            
        except Exception as e:
            raise RAGError(f"Failed to search: {str(e)}")
            
    async def query(self, question: str, k: int = 3) -> RAGResponse:
        """Query the RAG system using Claude.
        
        Args:
            question: Question to answer
            k: Number of documents to retrieve
            
        Returns:
            RAGResponse with answer and context
        """
        try:
            # Get relevant documents
            results = await self.search(question, k=k)
            
            if not results:
                return RAGResponse(
                    answer="No relevant documents found to answer the question.",
                    context=[],
                    expanded_query=question
                )
                
            if not self.anthropic:
                return RAGResponse(
                    answer="Claude integration is not available - ANTHROPIC_API_KEY not set.",
                    context=results,
                    expanded_query=results[0]["expanded_query"]
                )
                
            # Prepare context from retrieved documents
            context = "\n\n".join([
                f"Document {i+1}:\n{doc['document']['text']}"
                for i, doc in enumerate(results)
            ])
            
            # Create system prompt
            system_prompt = f"""You are a helpful AI assistant. Use the following context to answer the question.
            If you cannot answer based on the context, say so.
            
            Context:
            {context}
            """
            
            # Query Claude
            message = await self.anthropic.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=1000,
                system=system_prompt,
                messages=[{"role": "user", "content": question}]
            )
            
            return RAGResponse(
                answer=message.content[0].text,
                context=results,
                expanded_query=results[0]["expanded_query"]
            )
            
        except Exception as e:
            raise RAGError(f"Failed to query RAG system: {str(e)}") 