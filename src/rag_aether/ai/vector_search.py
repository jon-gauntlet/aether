"""Optimized vector search implementation."""
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
import faiss
import logging
import hashlib
from dataclasses import dataclass, asdict
from ..core.monitoring import monitor
from ..core.performance import with_performance_monitoring, performance_section
from ..ai.cache_manager import LRUCache

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
            "document": self.document_id,
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
    """Optimized vector search using FAISS."""
    
    def __init__(self, dimension: int = 768, index_type: str = "flat"):
        """Initialize vector search with specified dimension and index type."""
        self.dimension = dimension
        self.index_type = index_type
        self.index = None
        self.documents: List[str] = []
        self.document_vectors: Optional[np.ndarray] = None
        self.metadata: Dict[int, Dict[str, Any]] = {}
        
        # Initialize metrics
        self._total_queries = 0
        self._cache_hits = 0
        self._last_search_time = 0.0
        self._total_search_time = 0.0
        
        # Initialize cache
        self.cache = LRUCache(maxsize=1000)
        
    def _create_index(self) -> faiss.Index:
        """Create FAISS index based on type."""
        with performance_section("create_index"):
            if self.index_type == "flat":
                return faiss.IndexFlatL2(self.dimension)
            elif self.index_type == "ivf":
                quantizer = faiss.IndexFlatL2(self.dimension)
                return faiss.IndexIVFFlat(quantizer, self.dimension, 100)
            else:
                raise ValueError(f"Unsupported index type: {self.index_type}")
    
    def _generate_cache_key(self, vector: np.ndarray) -> str:
        """Generate cache key for vector."""
        if not isinstance(vector, np.ndarray):
            raise TypeError("Vector must be a numpy array")
        vector_bytes = vector.tobytes()
        return f"vec:{hashlib.md5(vector_bytes).hexdigest()}"
        
    def get_metrics(self) -> Dict[str, Any]:
        """Get search metrics."""
        return {
            "total_queries": self._total_queries,
            "cache_hits": self._cache_hits,
            "cache_hit_ratio": self._cache_hits / max(1, self._total_queries),
            "avg_search_time": self._total_search_time / max(1, self._total_queries),
            "last_search_time": self._last_search_time,
            "index_size": len(self.documents),
            "vector_dimension": self.dimension,
            "cache_enabled": True,
            "index_config": {
                "type": self.index_type,
                "dimension": self.dimension
            }
        }
        
    @with_performance_monitoring
    def add_documents(
        self,
        documents: List[str],
        vectors: Optional[np.ndarray] = None,
        metadata: Optional[List[Dict[str, Any]]] = None
    ) -> None:
        """Add documents with optional pre-computed vectors."""
        if metadata is None:
            metadata = [{} for _ in documents]
            
        if len(metadata) != len(documents):
            raise ValueError("Number of metadata entries must match number of documents")
            
        # Generate or validate vectors
        if vectors is None:
            vectors = np.random.rand(len(documents), self.dimension).astype(np.float32)
            for i in range(len(vectors)):
                vectors[i] = normalize_vector(vectors[i])
        else:
            if vectors.shape != (len(documents), self.dimension):
                raise ValueError(f"Vectors must have shape ({len(documents)}, {self.dimension})")
                
        # Initialize index if needed
        if self.index is None:
            self.index = self._create_index()
            
        # Store documents and vectors
        start_idx = len(self.documents)
        self.documents.extend(documents)
        
        if self.document_vectors is None:
            self.document_vectors = vectors
        else:
            self.document_vectors = np.vstack([self.document_vectors, vectors])
            
        # Add to index
        with performance_section("faiss_add"):
            self.index.add(vectors)
            
            # Update metadata
            for i, meta in enumerate(metadata):
                self.metadata[start_idx + i] = meta
                
    def _perform_optimized_search(
        self,
        query_vector: np.ndarray,
        k: int = 5,
        min_score: float = 0.0
    ) -> List[Dict[str, Any]]:
        """Perform search with performance monitoring."""
        if not isinstance(query_vector, np.ndarray):
            raise TypeError("Query vector must be a numpy array")
            
        if self.index is None or len(self.documents) == 0:
            return []
            
        # Convert query vector to float32 and normalize
        query_vector = query_vector.astype(np.float32)
        query_vector = normalize_vector(query_vector)
        
        # Search with extra results to account for min_score filtering
        actual_k = min(k, len(self.documents))
        extra_k = min(actual_k * 2, len(self.documents))
        
        # Perform search
        D, I = self.index.search(query_vector.reshape(1, -1), extra_k)
        
        # Filter and format results
        results = []
        for distance, idx in zip(D[0], I[0]):
            if idx == -1:  # Skip invalid indices
                continue
                
            score = 1.0 - distance  # Convert distance to similarity score
            if score < min_score:
                continue
                
            result = SearchResult(
                document_id=self.documents[idx],
                score=float(score),
                metadata=self.metadata.get(idx, {})
            ).to_dict()
            
            results.append(result)
            
            if len(results) >= actual_k:
                break
                
        # Pad with empty results if needed
        while len(results) < k and len(results) < len(self.documents):
            results.append(SearchResult(
                document_id="",
                score=0.0,
                metadata={}
            ).to_dict())
            
        return results
                
    @with_performance_monitoring
    def search(
        self,
        query_vector: np.ndarray,
        k: int = 5,
        min_score: float = 0.0
    ) -> List[Dict[str, Any]]:
        """Search for similar vectors and return top k results."""
        self._total_queries += 1
        
        if not isinstance(query_vector, np.ndarray):
            raise TypeError("Query vector must be a numpy array")
            
        if self.index is None or len(self.documents) == 0:
            return []
            
        # Check cache
        cache_key = self._generate_cache_key(query_vector)
        cached_results = self.cache.get(cache_key)
        if cached_results is not None:
            self._cache_hits += 1
            monitor.record_cache_hit()
            # Pad cached results if needed
            while len(cached_results) < k and len(cached_results) < len(self.documents):
                cached_results.append(SearchResult(
                    document_id="",
                    score=0.0,
                    metadata={}
                ).to_dict())
            return cached_results[:k]
            
        # Perform search
        start_time = monitor.get_system_metrics().timestamp
        results = self._perform_optimized_search(query_vector, k, min_score)
        end_time = monitor.get_system_metrics().timestamp
        
        # Update timing metrics
        search_time = end_time - start_time
        self._last_search_time = search_time
        self._total_search_time += search_time
                
        # Cache results
        self.cache.set(cache_key, results)
        
        return results 