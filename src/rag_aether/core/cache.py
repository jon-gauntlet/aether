"""Caching implementation for RAG system."""
from typing import Dict, Any, Optional, TypeVar, Generic
from collections import OrderedDict
import time
import numpy as np
from dataclasses import dataclass
from rag_aether.core.logging import get_logger
from rag_aether.core.performance import with_performance_monitoring, performance_section

logger = get_logger("cache")

T = TypeVar('T')

@dataclass
class CacheEntry(Generic[T]):
    """Cache entry with value and metadata."""
    value: T
    timestamp: float
    ttl: float
    access_count: int = 0

class LRUCache(Generic[T]):
    """LRU cache implementation with TTL and metrics."""
    
    def __init__(
        self,
        max_size: int = 1000,
        default_ttl: float = 3600,  # 1 hour
        cleanup_interval: float = 300  # 5 minutes
    ):
        """Initialize LRU cache."""
        self.max_size = max_size
        self.default_ttl = default_ttl
        self.cleanup_interval = cleanup_interval
        self.last_cleanup = time.time()
        self._cache: OrderedDict[str, CacheEntry[T]] = OrderedDict()
        self.hits = 0
        self.misses = 0
        logger.info(
            "Initialized LRU cache",
            extra={
                "max_size": max_size,
                "default_ttl": default_ttl
            }
        )
    
    @with_performance_monitoring(operation="get", component="cache")
    def get(self, key: str) -> Optional[T]:
        """Get value from cache."""
        self._cleanup_if_needed()
        
        entry = self._cache.get(key)
        if entry is None:
            self.misses += 1
            return None
            
        # Check if expired
        if time.time() > entry.timestamp + entry.ttl:
            self._cache.pop(key)
            self.misses += 1
            return None
            
        # Update access count and move to end
        entry.access_count += 1
        self._cache.move_to_end(key)
        self.hits += 1
        
        return entry.value
    
    @with_performance_monitoring(operation="set", component="cache")
    def set(self, key: str, value: T, ttl: Optional[float] = None) -> None:
        """Set value in cache."""
        self._cleanup_if_needed()
        
        # Remove oldest if at max size
        if len(self._cache) >= self.max_size:
            self._cache.popitem(last=False)
        
        # Add new entry
        self._cache[key] = CacheEntry(
            value=value,
            timestamp=time.time(),
            ttl=ttl or self.default_ttl
        )
        self._cache.move_to_end(key)
    
    def _cleanup_if_needed(self) -> None:
        """Clean up expired entries if needed."""
        current_time = time.time()
        if current_time - self.last_cleanup > self.cleanup_interval:
            with performance_section("cleanup", "cache"):
                expired = []
                for key, entry in self._cache.items():
                    if current_time > entry.timestamp + entry.ttl:
                        expired.append(key)
                
                for key in expired:
                    self._cache.pop(key)
                
                self.last_cleanup = current_time
                
                if expired:
                    logger.info(
                        "Cleaned up expired entries",
                        extra={"num_expired": len(expired)}
                    )
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get cache metrics."""
        total_requests = self.hits + self.misses
        hit_rate = self.hits / total_requests if total_requests > 0 else 0
        
        return {
            "size": len(self._cache),
            "max_size": self.max_size,
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate": hit_rate,
            "most_accessed": sorted(
                [
                    (key, entry.access_count)
                    for key, entry in self._cache.items()
                ],
                key=lambda x: x[1],
                reverse=True
            )[:5]
        }

class QueryCache(LRUCache[Dict[str, Any]]):
    """Cache for query results."""
    
    def __init__(
        self,
        max_size: int = 1000,
        default_ttl: float = 3600
    ):
        """Initialize query cache."""
        super().__init__(max_size, default_ttl)
        logger.info("Initialized query cache")
    
    def get_key(
        self,
        query: str,
        k: int,
        metadata_filter: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generate cache key for query."""
        key_parts = [query, str(k)]
        if metadata_filter:
            key_parts.append(str(sorted(metadata_filter.items())))
        return "_".join(key_parts)

class EmbeddingCache(LRUCache[np.ndarray]):
    """Cache for text embeddings."""
    
    def __init__(
        self,
        max_size: int = 10000,
        default_ttl: float = 86400  # 24 hours
    ):
        """Initialize embedding cache."""
        super().__init__(max_size, default_ttl)
        logger.info("Initialized embedding cache")
    
    def get_key(self, text: str) -> str:
        """Generate cache key for text."""
        return str(hash(text)) 