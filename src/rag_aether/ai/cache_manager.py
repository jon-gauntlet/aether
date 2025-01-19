"""Cache management for RAG system."""
from typing import Any, Dict, Optional, List
import logging
from functools import lru_cache
from redis import Redis
from ..core.monitoring import monitor
from ..core.performance import with_performance_monitoring, performance_section
import os

logger = logging.getLogger(__name__)

class LRUCache:
    """Simple LRU cache implementation."""
    
    def __init__(self, maxsize: int = 1000):
        """Initialize LRU cache with specified max size."""
        self.maxsize = maxsize
        self.cache: Dict[str, Any] = {}
        self._access_order: List[str] = []
        
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        if key not in self.cache:
            return None
            
        # Update access order
        self._access_order.remove(key)
        self._access_order.append(key)
        
        return self.cache[key]
        
    def set(self, key: str, value: Any) -> None:
        """Set value in cache."""
        if key in self.cache:
            self._access_order.remove(key)
        elif len(self.cache) >= self.maxsize:
            # Remove least recently used item
            lru_key = self._access_order.pop(0)
            del self.cache[lru_key]
            
        self.cache[key] = value
        self._access_order.append(key)
        
    def clear(self) -> None:
        """Clear the cache."""
        self.cache.clear()
        self._access_order.clear()
        
    def __len__(self) -> int:
        """Get number of items in cache."""
        return len(self.cache)

class CacheManager:
    """Cache manager with Redis support and local LRU cache."""
    
    def __init__(self, use_redis: bool = True, redis_ttl: int = 3600):
        """Initialize cache manager.
        
        Args:
            use_redis: Whether to use Redis as primary cache
            redis_ttl: Time-to-live for Redis cache entries in seconds
        """
        self.use_redis = use_redis
        self.redis_ttl = redis_ttl
        self.lru_cache = LRUCache()
        
        if use_redis:
            try:
                redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
                self.redis = Redis.from_url(redis_url, decode_responses=True)
                self.redis.ping()  # Test connection
                logger.info("Redis cache initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize Redis: {e}")
                self.use_redis = False
                
    @with_performance_monitoring
    def get_frequent_queries(self, query_hash: str) -> Optional[Any]:
        """Get cached result for a query hash.
        
        Args:
            query_hash: Hash of the query to look up
            
        Returns:
            Cached result if found, None otherwise
        """
        with performance_section("cache_lookup"):
            # Try Redis first if enabled
            if self.use_redis:
                try:
                    result = self.redis.get(query_hash)
                    if result is not None:
                        monitor.record_cache_hit("redis")
                        return result
                except Exception as e:
                    logger.warning(f"Redis get failed: {e}")
            
            # Fall back to LRU cache
            result = self.lru_cache.get(query_hash)
            if result is not None:
                monitor.record_cache_hit("lru")
                return result
                
            monitor.record_cache_miss()
            return None
            
    @with_performance_monitoring
    def set(self, key: str, value: Any) -> None:
        """Set a value in both Redis and LRU cache.
        
        Args:
            key: Cache key
            value: Value to cache
        """
        with performance_section("cache_set"):
            # Set in Redis if enabled
            if self.use_redis:
                try:
                    self.redis.setex(key, self.redis_ttl, value)
                except Exception as e:
                    logger.warning(f"Redis set failed: {e}")
            
            # Always set in LRU cache
            self.lru_cache.set(key, value)
            
    def optimize_cache_settings(self) -> None:
        """Optimize cache settings based on usage patterns."""
        # This is a placeholder for future optimization logic
        pass 