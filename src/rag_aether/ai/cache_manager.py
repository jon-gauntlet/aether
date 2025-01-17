import logging
import redis
from typing import Any, Dict, Optional
from datetime import datetime, timedelta
from collections import OrderedDict
import time

logger = logging.getLogger(__name__)

class Cache:
    def __init__(self, 
                 max_size_bytes: Optional[int] = None,
                 ttl: Optional[int] = None,
                 use_redis: bool = True):
        """Initialize cache with configurable options.
        
        Args:
            max_size_bytes: Maximum cache size in bytes
            ttl: Time-to-live in seconds
            use_redis: Whether to use Redis as backend
        """
        self.max_size_bytes = max_size_bytes
        self.ttl = ttl
        self.use_redis = use_redis
        self.memory_cache = OrderedDict()
        self.redis_client = None
        
        if use_redis:
            try:
                self.redis_client = redis.Redis(host='localhost', port=6379, db=0)
                self.redis_client.ping()
            except redis.ConnectionError as e:
                logger.warning(f"Failed to connect to Redis: {str(e)}. Using in-memory cache only.")
                self.redis_client = None
                
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache.
        
        Args:
            key: Cache key
            
        Returns:
            Cached value if exists, None otherwise
        """
        # Try Redis first if available
        if self.redis_client:
            value = self.redis_client.get(key)
            if value:
                return value
                
        # Fall back to memory cache
        return self.memory_cache.get(key)
        
    def set(self, key: str, value: Any):
        """Set value in cache.
        
        Args:
            key: Cache key
            value: Value to cache
        """
        # Set in Redis if available
        if self.redis_client:
            if self.ttl:
                self.redis_client.setex(key, self.ttl, value)
            else:
                self.redis_client.set(key, value)
                
        # Set in memory cache
        self.memory_cache[key] = value
        self._enforce_size_limit()
        
        if self.ttl:
            # Schedule cleanup after TTL
            self._schedule_cleanup(key)
            
    def _enforce_size_limit(self):
        """Enforce cache size limit by removing oldest entries."""
        if not self.max_size_bytes:
            return
            
        current_size = sum(len(str(v)) for v in self.memory_cache.values())
        
        while current_size > self.max_size_bytes and self.memory_cache:
            self.memory_cache.popitem(last=False)  # Remove oldest
            current_size = sum(len(str(v)) for v in self.memory_cache.values())
            
    def _schedule_cleanup(self, key: str):
        """Schedule key cleanup after TTL."""
        if not self.ttl:
            return
            
        def cleanup():
            time.sleep(self.ttl)
            self.memory_cache.pop(key, None)
            if self.redis_client:
                self.redis_client.delete(key)
                
        import threading
        threading.Thread(target=cleanup, daemon=True).start()
        
class CacheManager(Cache):
    """Extended cache manager with query-specific functionality."""
    
    def __init__(self, max_size_bytes: Optional[int] = None, ttl: Optional[int] = None):
        super().__init__(max_size_bytes=max_size_bytes, ttl=ttl)
        self.query_stats = {}
        
    def cache_query_result(self, query: str, result: Any):
        """Cache a query result with tracking.
        
        Args:
            query: The search query
            result: Search result to cache
        """
        self.set(f"query:{query}", result)
        self.query_stats[query] = self.query_stats.get(query, 0) + 1
        
    def get_frequent_queries(self, limit: int = 10) -> Dict[str, int]:
        """Get most frequently used queries.
        
        Args:
            limit: Maximum number of queries to return
            
        Returns:
            Dict of queries and their frequencies
        """
        sorted_queries = sorted(
            self.query_stats.items(),
            key=lambda x: x[1],
            reverse=True
        )
        return dict(sorted_queries[:limit]) 