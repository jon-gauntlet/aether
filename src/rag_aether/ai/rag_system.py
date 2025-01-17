"""RAG system implementation."""

from typing import List, Dict, Any, Optional
import numpy as np
from sentence_transformers import SentenceTransformer, util
from .cache_manager import CacheManager
from .vector_search import OptimizedVectorSearch
import torch
import logging
from .query_expansion import QueryExpander
from ..core.errors import RAGError

logger = logging.getLogger(__name__)

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
    """RAG system implementation."""
    
    def __init__(self, model_name: str = "BAAI/bge-small-en"):
        """Initialize RAG system.
        
        Args:
            model_name: Name of the embedding model to use
        """
        super().__init__(model_name)
        self.documents: List[Dict[str, Any]] = []
        self.document_embeddings: Optional[torch.Tensor] = None
        self.query_expander = QueryExpander()
        
    def add_documents(self, documents: List[Dict[str, Any]]) -> None:
        """Add documents to the RAG system.
        
        Args:
            documents: List of documents to add
        """
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