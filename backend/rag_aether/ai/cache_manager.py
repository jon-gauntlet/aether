"""Cache management for RAG system."""
from typing import Any, Dict, Optional, List
import logging
from functools import lru_cache
from redis import Redis
from redis.retry import Retry
from redis.backoff import ExponentialBackoff
from redis.exceptions import ConnectionError, TimeoutError
from ..core.monitoring import monitor
from ..core.performance import with_performance_monitoring, performance_section
import os
import ssl

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
                # Get Redis configuration from environment
                redis_url = os.getenv("REDIS_URL")
                redis_host = os.getenv("REDIS_HOST", "localhost")
                redis_port = int(os.getenv("REDIS_PORT", "6379"))
                redis_db = int(os.getenv("REDIS_DB", "0"))
                
                # Configure retry strategy
                retry = Retry(
                    ExponentialBackoff(),
                    retries=3,
                    supported_errors=(ConnectionError, TimeoutError)
                )
                
                # Configure SSL for production
                ssl_enabled = os.getenv("REDIS_SSL", "false").lower() == "true"
                ssl_cert_reqs = None if os.getenv("REDIS_SELF_SIGNED", "false").lower() == "true" else ssl.CERT_REQUIRED
                
                if redis_url:
                    # Use connection URL if provided
                    self.redis = Redis.from_url(
                        redis_url,
                        retry=retry,
                        decode_responses=True,
                        ssl=ssl_enabled,
                        ssl_cert_reqs=ssl_cert_reqs
                    )
                else:
                    # Use individual connection parameters
                    self.redis = Redis(
                        host=redis_host,
                        port=redis_port,
                        db=redis_db,
                        retry=retry,
                        decode_responses=True,
                        ssl=ssl_enabled,
                        ssl_cert_reqs=ssl_cert_reqs
                    )
                
                # Test connection
                self.redis.ping()
                logger.info("Redis cache initialized - %s", "SSL enabled" if ssl_enabled else "SSL disabled")
                
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
                    # Fall back to LRU cache on Redis failure
                    self.use_redis = False
            
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
                    # Fall back to LRU cache on Redis failure
                    self.use_redis = False
            
            # Always set in LRU cache
            self.lru_cache.set(key, value)
            
    def optimize_cache_settings(self) -> None:
        """Optimize cache settings based on usage patterns."""
        # This is a placeholder for future optimization logic
        pass 