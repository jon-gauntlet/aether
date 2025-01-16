"""Query caching system for RAG."""

from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional, Set
from datetime import datetime
import json
import asyncio
from ..core.performance import track_operation

@dataclass
class CacheEntry:
    """Cache entry for a query result."""
    query: str
    result: Dict[str, Any]
    metadata: Dict[str, Any]
    created_at: datetime = field(default_factory=datetime.now)
    accessed_at: datetime = field(default_factory=datetime.now)
    access_count: int = 0

class QueryCache:
    """Cache for RAG queries and results."""
    
    def __init__(self, max_size: int = 1000, ttl_seconds: int = 3600):
        """Initialize query cache."""
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds
        self.cache: Dict[str, CacheEntry] = {}
        self._lock = asyncio.Lock()
        
    async def get(self, query: str) -> Optional[Dict[str, Any]]:
        """Get cached result for a query."""
        start_time = time.perf_counter()
        try:
            async with self._lock:
                if query not in self.cache:
                    return None
                    
                entry = self.cache[query]
                
                # Check TTL
                if (datetime.now() - entry.created_at).total_seconds() > self.ttl_seconds:
                    del self.cache[query]
                    return None
                    
                # Update access info
                entry.accessed_at = datetime.now()
                entry.access_count += 1
                
                return entry.result
                
        finally:
            duration = time.perf_counter() - start_time
            track_operation("query_cache_get", duration, {"query": query})
            
    async def set(self, query: str, result: Dict[str, Any], metadata: Optional[Dict[str, Any]] = None) -> None:
        """Cache a query result."""
        start_time = time.perf_counter()
        try:
            async with self._lock:
                # Prune cache if needed
                if len(self.cache) >= self.max_size:
                    self._prune_cache()
                    
                self.cache[query] = CacheEntry(
                    query=query,
                    result=result,
                    metadata=metadata or {}
                )
                
        finally:
            duration = time.perf_counter() - start_time
            track_operation("query_cache_set", duration, {"query": query})
            
    def _prune_cache(self) -> None:
        """Remove old or less used entries."""
        # Sort by access count and last access time
        entries = sorted(
            self.cache.items(),
            key=lambda x: (x[1].access_count, x[1].accessed_at)
        )
        
        # Remove oldest 10% of entries
        num_to_remove = max(1, len(self.cache) // 10)
        for query, _ in entries[:num_to_remove]:
            del self.cache[query]
            
    def clear(self) -> None:
        """Clear the cache."""
        self.cache.clear()
        
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        return {
            'size': len(self.cache),
            'max_size': self.max_size,
            'ttl_seconds': self.ttl_seconds,
            'total_hits': sum(entry.access_count for entry in self.cache.values()),
            'entries': [
                {
                    'query': entry.query,
                    'access_count': entry.access_count,
                    'age_seconds': (datetime.now() - entry.created_at).total_seconds(),
                    'last_access_seconds': (datetime.now() - entry.accessed_at).total_seconds()
                }
                for entry in self.cache.values()
            ]
        } 