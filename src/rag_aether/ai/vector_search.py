"""Vector search implementation with optimizations."""

from typing import List, Dict, Any, Optional
import numpy as np
import time
import logging
from .cache_manager import CacheManager
import faiss
import torch
from sentence_transformers import util

logger = logging.getLogger(__name__)

class SearchMetrics:
    def __init__(self):
        self.total_queries = 0
        self.cache_hits = 0
        self.avg_search_time = 0.0
        self.last_search_time = 0.0
        
    def update_search_time(self, duration: float):
        self.total_queries += 1
        self.last_search_time = duration
        self.avg_search_time = (
            (self.avg_search_time * (self.total_queries - 1) + duration) 
            / self.total_queries
        )
        
    def record_cache_hit(self):
        self.cache_hits += 1
        
    @property
    def cache_hit_ratio(self) -> float:
        return self.cache_hits / max(1, self.total_queries)
        
    def get_metrics(self) -> Dict[str, float]:
        return {
            "total_queries": self.total_queries,
            "cache_hits": self.cache_hits,
            "cache_hit_ratio": self.cache_hit_ratio,
            "avg_search_time": self.avg_search_time,
            "last_search_time": self.last_search_time
        }

class OptimizedVectorSearch:
    def __init__(self, dimension: int = 384, batch_size: int = 32):
        """Initialize optimized vector search.
        
        Args:
            dimension: Vector dimension
            batch_size: Batch size for processing
        """
        self.dimension = dimension
        self.batch_size = batch_size
        self.index = None
        self.documents = []
        self.document_vectors = None
        self.cache = CacheManager()
        self.metrics = SearchMetrics()
        
        # Initialize FAISS index
        self.index = faiss.IndexFlatIP(dimension)  # Inner product for cosine similarity
        self.index = faiss.IndexIDMap(self.index)  # Add ID mapping
        
        # Use GPU if available
        try:
            if faiss.get_num_gpus() > 0:
                logger.info("Using GPU for vector search")
                self.index = faiss.index_cpu_to_gpu(
                    faiss.StandardGpuResources(),
                    0,
                    self.index
                )
        except Exception as e:
            logger.warning(f"Failed to use GPU: {str(e)}")
            
    def _generate_cache_key(self, query_vector: np.ndarray) -> str:
        """Generate cache key for vector."""
        return f"vec:{hash(query_vector.tobytes())}"
        
    def add_documents(self, documents: List[str], vectors: Optional[np.ndarray] = None):
        """Add documents and vectors to index.
        
        Args:
            documents: List of documents
            vectors: Optional document vectors
        """
        start_time = time.time()
        
        if vectors is None:
            # In real implementation, encode documents here
            vectors = np.random.rand(len(documents), self.dimension)
            
        # Process in batches
        for i in range(0, len(documents), self.batch_size):
            batch_docs = documents[i:i + self.batch_size]
            batch_vecs = vectors[i:i + self.batch_size]
            
            # Normalize vectors
            norms = np.linalg.norm(batch_vecs, axis=1, keepdims=True)
            normalized_vecs = batch_vecs / norms
            
            # Add to index
            self.documents.extend(batch_docs)
            if self.document_vectors is None:
                self.document_vectors = normalized_vecs
            else:
                self.document_vectors = np.vstack([self.document_vectors, normalized_vecs])
                
            # Add to FAISS index
            ids = np.arange(i, min(i + self.batch_size, len(documents)))
            self.index.add_with_ids(normalized_vecs, ids)
            
        duration = time.time() - start_time
        logger.info(
            f"Added {len(documents)} documents in {duration:.3f}s. "
            f"Total documents: {len(self.documents)}"
        )
        
    def search(self, query_vector: np.ndarray, k: int = 5) -> List[Dict[str, Any]]:
        """Search for similar vectors.
        
        Args:
            query_vector: Query vector
            k: Number of results
            
        Returns:
            List of results with scores
        """
        if not isinstance(query_vector, np.ndarray):
            raise TypeError("Query vector must be a numpy array")
            
        # Check cache
        cache_key = self._generate_cache_key(query_vector)
        cached_result = self.cache.get(cache_key)
        
        if cached_result:
            self.metrics.record_cache_hit()
            logger.debug("Cache hit for query")
            return cached_result
            
        # Perform search
        start_time = time.time()
        
        try:
            # Normalize query vector
            query_norm = np.linalg.norm(query_vector)
            if query_norm > 0:
                query_vector = query_vector / query_norm
            
            # Search FAISS index
            D, I = self.index.search(query_vector.reshape(1, -1), k)
            
            # Format results
            results = []
            for score, idx in zip(D[0], I[0]):
                if idx < len(self.documents):  # Valid index
                    results.append({
                        "document": self.documents[idx],
                        "score": float(score),  # Already normalized by FAISS
                        "metadata": {
                            "index": int(idx),
                            "vector_norm": 1.0  # Vectors are normalized
                        }
                    })
                    
            duration = time.time() - start_time
            self.metrics.update_search_time(duration)
            
            # Cache results
            self.cache.set(cache_key, results)
            
            return results
            
        except Exception as e:
            logger.error(f"Search failed: {str(e)}")
            return []
            
    def batch_search(self, query_vectors: np.ndarray, k: int = 5) -> List[List[Dict[str, Any]]]:
        """Search for multiple query vectors in batch.
        
        Args:
            query_vectors: Query vectors
            k: Number of results per query
            
        Returns:
            List of results for each query
        """
        if len(query_vectors) == 0:
            return []
            
        start_time = time.time()
        
        try:
            # Normalize query vectors
            norms = np.linalg.norm(query_vectors, axis=1, keepdims=True)
            normalized_queries = np.where(norms > 0, query_vectors / norms, 0)
            
            # Search FAISS index
            D, I = self.index.search(normalized_queries, k)
            
            # Format results
            all_results = []
            for distances, indices in zip(D, I):
                results = []
                for score, idx in zip(distances, indices):
                    if idx < len(self.documents):
                        results.append({
                            "document": self.documents[idx],
                            "score": float(score),  # Already normalized by FAISS
                            "metadata": {
                                "index": int(idx),
                                "vector_norm": 1.0  # Vectors are normalized
                            }
                        })
                all_results.append(results)
                
            duration = time.time() - start_time
            logger.info(f"Batch search completed in {duration:.3f}s")
            
            return all_results
            
        except Exception as e:
            logger.error(f"Batch search failed: {str(e)}")
            return [[] for _ in range(len(query_vectors))]
            
    def get_metrics(self) -> Dict[str, Any]:
        """Get search performance metrics."""
        metrics = self.metrics.get_metrics()
        metrics.update({
            "index_size": len(self.documents),
            "vector_dimension": self.dimension,
            "cache_enabled": True,
            "batch_size": self.batch_size,
            "gpu_enabled": faiss.get_num_gpus() > 0
        })
        return metrics 