"""Optimized vector search implementation."""
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
import logging
from dataclasses import dataclass, asdict
from ..core.monitoring import monitor
from ..core.performance import with_performance_monitoring, performance_section
from ..ai.cache_manager import LRUCache
from .vector_store import VectorStore
import hashlib
import asyncio
import faiss
from openai import AsyncOpenAI
from .errors import DocumentProcessingError

logger = logging.getLogger(__name__)

@dataclass
class SearchResult:
    """Search result with metadata."""
    document_id: str
    score: float
    metadata: Dict[str, Any]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary format."""
        return {
            "document_id": self.document_id,
            "score": self.score,
            "metadata": self.metadata
        }

def normalize_vector(vector: np.ndarray) -> np.ndarray:
    """Normalize a vector to unit length."""
    norm = np.linalg.norm(vector)
    if norm == 0:
        return vector
    return vector / norm

class OptimizedVectorSearch:
    """Optimized vector search using Supabase."""
    
    def __init__(self, dimension: int = 1536):
        """Initialize vector search with specified dimension."""
        self.dimension = dimension
        self.store = VectorStore(dimension=dimension)
        self.cache = LRUCache()
        
        # Initialize metrics
        self._total_queries = 0
        self._cache_hits = 0
        
    async def add_documents(
        self,
        texts: List[str],
        embeddings: np.ndarray,
        metadata: Optional[List[Dict[str, Any]]] = None
    ) -> bool:
        """Add documents with pre-computed embeddings.
        
        Args:
            texts: List of document texts
            embeddings: Document embeddings
            metadata: Optional metadata for the documents
            
        Returns:
            bool: True if successful
        """
        try:
            return await self.store.add_documents(texts, embeddings, metadata)
        except Exception as e:
            logger.error(f"Error adding documents: {e}")
            return False
            
    @with_performance_monitoring
    async def search(
        self,
        query_embedding: np.ndarray,
        k: int = 5,
        min_score: float = 0.0
    ) -> List[SearchResult]:
        """Search for similar documents.
        
        Args:
            query_embedding: Query vector
            k: Number of results to return
            min_score: Minimum similarity score threshold
            
        Returns:
            List of search results
        """
        with performance_section("vector_search"):
            # Validate input
            if not isinstance(query_embedding, np.ndarray):
                raise TypeError("Query embedding must be a numpy array")
            if query_embedding.shape != (self.dimension,):
                raise TypeError(f"Query embedding must have shape ({self.dimension},)")
            
            self._total_queries += 1
            
            # Check cache
            cache_key = self._get_cache_key(query_embedding, k, min_score)
            cached_results = self.cache.get(cache_key)
            if cached_results is not None:
                self._cache_hits += 1
                return cached_results
                
            # Normalize query vector
            query_embedding = normalize_vector(query_embedding)
            
            # Search vector store
            results = await self.store.search(query_embedding, k, min_score)
            
            # Convert to SearchResult objects
            search_results = [
                SearchResult(
                    document_id=doc["document_id"],
                    score=doc["score"],
                    metadata=doc["metadata"]
                )
                for doc in results
            ]
            
            # Cache results
            self.cache.set(cache_key, search_results)
            
            return search_results
            
    def _get_cache_key(self, query_embedding: np.ndarray, k: int, min_score: float) -> str:
        """Generate cache key for search parameters."""
        query_hash = hashlib.md5(query_embedding.tobytes()).hexdigest()
        return f"search:{query_hash}:k={k}:min_score={min_score}"
        
    def get_metrics(self) -> Dict[str, Any]:
        """Get search metrics."""
        return {
            "total_queries": self._total_queries,
            "cache_hits": self._cache_hits,
            "cache_hit_rate": self._cache_hits / max(1, self._total_queries)
        }

class VectorStore:
    """Vector store for document search."""
    
    def __init__(self, use_mock: bool = False):
        """Initialize vector store.
        
        Args:
            use_mock: Whether to use mock responses
        """
        self.use_mock = use_mock
        self.client = AsyncOpenAI()
        self.documents = []
        self.index = None
        
    async def add_document(self, text: str, metadata: Optional[Dict] = None) -> None:
        """Add document to vector store.
        
        Args:
            text: Document text
            metadata: Optional document metadata
        """
        try:
            if self.use_mock:
                return
                
            # Get embeddings
            embedding = await self._get_embeddings([text])
            
            # Add to documents
            self.documents.append({
                "text": text,
                "metadata": metadata or {}
            })
            
            # Update index
            if self.index is None:
                self.index = faiss.IndexFlatL2(embedding.shape[1])
            self.index.add(embedding)
            
        except Exception as e:
            raise DocumentProcessingError(f"Failed to add document: {str(e)}")
            
    async def search(self, query: str, max_results: int = 3, min_score: float = 0.7) -> List[Dict]:
        """Search for relevant documents.
        
        Args:
            query: Search query
            max_results: Maximum number of results
            min_score: Minimum similarity score
            
        Returns:
            List of relevant documents with scores
        """
        if self.use_mock:
            return [{
                "text": "This is a mock document for testing",
                "metadata": {"source": "mock"},
                "score": 0.95
            }]
            
        try:
            # Get query embedding
            embedding = await self._get_embeddings([query])
            
            # Search index
            if self.index is None or len(self.documents) == 0:
                return []
                
            D, I = self.index.search(embedding, max_results)
            
            # Format results
            results = []
            for score, idx in zip(D[0], I[0]):
                if score >= min_score and idx < len(self.documents):
                    doc = self.documents[idx]
                    results.append({
                        "text": doc["text"],
                        "metadata": doc["metadata"],
                        "score": float(score)
                    })
                    
            return results
            
        except Exception as e:
            raise DocumentProcessingError(f"Failed to search documents: {str(e)}")
            
    async def _get_embeddings(self, texts: List[str]) -> np.ndarray:
        """Get embeddings for texts.
        
        Args:
            texts: List of texts to embed
            
        Returns:
            Array of embeddings
        """
        try:
            response = await self.client.embeddings.create(
                model="text-embedding-ada-002",
                input=texts
            )
            return np.array([e.embedding for e in response.data])
        except Exception as e:
            raise DocumentProcessingError(f"Failed to get embeddings: {str(e)}") 