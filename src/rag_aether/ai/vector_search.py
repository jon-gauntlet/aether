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