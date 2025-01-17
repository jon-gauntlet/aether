"""Caching system for RAG operations."""
from typing import Dict, Any, Optional, List, TypeVar, Generic
from dataclasses import dataclass
import time
from collections import OrderedDict
import logging
import asyncio
from .performance_system import with_performance_monitoring, performance_section
import numpy as np
from enum import Enum, auto
import os
import json
import pickle
import hashlib
import random

logger = logging.getLogger(__name__)

class EvictionPolicy(Enum):
    """Cache eviction policies."""
    LRU = auto()  # Least Recently Used
    LFU = auto()  # Least Frequently Used
    FIFO = auto()  # First In First Out
    RANDOM = auto()  # Random Eviction

T = TypeVar('T')

@dataclass
class CacheEntry(Generic[T]):
    """A cache entry with value and metadata."""
    value: T
    created_at: float
    last_accessed: float
    access_count: int = 0

class LRUCache(Generic[T]):
    """LRU cache implementation with TTL support."""
    
    def __init__(self, max_size: int = 1000, ttl_seconds: float = 3600,
                 cleanup_interval: float = 300):
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds
        self.cleanup_interval = cleanup_interval
        self._cache: OrderedDict[str, CacheEntry[T]] = OrderedDict()
        self._last_cleanup = time.time()
    
    @with_performance_monitoring
    def get(self, key: str) -> Optional[T]:
        """Get a value from the cache."""
        self._maybe_cleanup()
        
        entry = self._cache.get(key)
        if entry is None:
            return None
        
        # Check if expired
        if time.time() - entry.created_at > self.ttl_seconds:
            del self._cache[key]
            return None
        
        # Update access time and count
        entry.last_accessed = time.time()
        entry.access_count += 1
        
        # Move to end (most recently used)
        self._cache.move_to_end(key)
        
        return entry.value
    
    @with_performance_monitoring
    def set(self, key: str, value: T):
        """Set a value in the cache."""
        self._maybe_cleanup()
        
        # Create new entry
        entry = CacheEntry(
            value=value,
            created_at=time.time(),
            last_accessed=time.time()
        )
        
        # If key exists, update it
        if key in self._cache:
            del self._cache[key]
        
        # Add new entry
        self._cache[key] = entry
        self._cache.move_to_end(key)
        
        # Evict oldest if over size
        while len(self._cache) > self.max_size:
            self._cache.popitem(last=False)
    
    def _maybe_cleanup(self):
        """Run cleanup if needed."""
        current_time = time.time()
        if current_time - self._last_cleanup > self.cleanup_interval:
            with performance_section("cache_cleanup"):
                self._cleanup()
            self._last_cleanup = current_time
    
    def _cleanup(self):
        """Remove expired entries."""
        current_time = time.time()
        expired_keys = [
            key for key, entry in self._cache.items()
            if current_time - entry.created_at > self.ttl_seconds
        ]
        for key in expired_keys:
            del self._cache[key]
    
    def clear(self):
        """Clear all entries."""
        self._cache.clear()
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        return {
            "size": len(self._cache),
            "max_size": self.max_size,
            "ttl_seconds": self.ttl_seconds,
            "cleanup_interval": self.cleanup_interval
        } 

class Cache(Generic[T]):
    """Base cache implementation."""
    
    def __init__(
        self,
        max_size: int = 1000,
        max_size_bytes: Optional[int] = None,
        ttl: Optional[float] = None,
        eviction_policy: EvictionPolicy = EvictionPolicy.LRU
    ):
        """Initialize cache.
        
        Args:
            max_size: Maximum number of items in cache
            max_size_bytes: Maximum size in bytes (if None, no byte limit)
            ttl: Time to live in seconds (if None, no expiration)
            eviction_policy: Policy for evicting items when cache is full
        """
        self.max_size = max_size
        self.max_size_bytes = max_size_bytes
        self.ttl = ttl
        self.eviction_policy = eviction_policy
        self._cache: Dict[str, CacheEntry[T]] = {}
        self._size_bytes = 0
        self._stats = CacheStats(size=0)

    def _get_item_size(self, value: T) -> int:
        """Get size of item in bytes."""
        if isinstance(value, (str, bytes)):
            return len(value)
        elif isinstance(value, np.ndarray):
            return value.nbytes
        else:
            return len(pickle.dumps(value))

    async def _check_size_limits(self, new_item_size: int = 0):
        """Check and enforce size limits."""
        while (len(self._cache) >= self.max_size or 
               (self.max_size_bytes and self._size_bytes + new_item_size > self.max_size_bytes)):
            if not self._cache:
                raise ValueError("Cannot add item: cache size limits too small")
            # Get eviction candidate based on policy
            if self.eviction_policy == EvictionPolicy.LRU:
                key = min(self._cache.items(), key=lambda x: x[1].last_accessed)[0]
            elif self.eviction_policy == EvictionPolicy.LFU:
                key = min(self._cache.items(), key=lambda x: x[1].access_count)[0]
            elif self.eviction_policy == EvictionPolicy.FIFO:
                key = min(self._cache.items(), key=lambda x: x[1].created_at)[0]
            else:  # RANDOM
                key = random.choice(list(self._cache.keys()))
            await self.delete(key)
            self._stats.evictions += 1

    @with_performance_monitoring
    async def get(self, key: str) -> Optional[T]:
        """Get a value from the cache."""
        async with self._lock:
            if key not in self._cache:
                return None
            
            entry = self._cache[key]
            current_time = time.time()
            
            if self.ttl and (current_time - entry.created_at) > self.ttl:
                del self._cache[key]
                return None
            
            entry.last_accessed = current_time
            entry.access_count += 1
            self._cache.move_to_end(key)
            
            return entry.value

    @with_performance_monitoring
    async def set(self, key: str, value: T) -> None:
        """Set a value in the cache."""
        async with self._lock:
            current_time = time.time()
            entry = CacheEntry(
                value=value,
                created_at=current_time,
                last_accessed=current_time
            )
            
            if key in self._cache:
                del self._cache[key]
            
            self._cache[key] = entry
            self._cache.move_to_end(key)
            
            if len(self._cache) > self.max_size:
                self._cache.popitem(last=False)

    @with_performance_monitoring
    async def delete(self, key: str) -> None:
        """Delete a value from the cache."""
        async with self._lock:
            if key in self._cache:
                del self._cache[key]

    @with_performance_monitoring
    async def clear(self) -> None:
        """Clear all entries from the cache."""
        async with self._lock:
            self._cache.clear()

    @property
    def size(self) -> int:
        """Get the current size of the cache."""
        return len(self._cache) 

class QueryCache(Cache[str]):
    """Cache specifically for query results."""
    def __init__(self, max_size: int = 1000, ttl: Optional[float] = 3600):
        super().__init__(max_size=max_size, ttl=ttl)

class EmbeddingCache(Cache[np.ndarray]):
    """Cache specifically for embeddings."""
    def __init__(self, max_size: int = 10000, ttl: Optional[float] = None):
        super().__init__(max_size=max_size, ttl=ttl)

    @with_performance_monitoring
    async def get_batch(self, keys: List[str]) -> Dict[str, np.ndarray]:
        """Get multiple embeddings at once."""
        result = {}
        for key in keys:
            value = await self.get(key)
            if value is not None:
                result[key] = value
        return result

    @with_performance_monitoring
    async def set_batch(self, items: Dict[str, np.ndarray]) -> None:
        """Set multiple embeddings at once."""
        for key, value in items.items():
            await self.set(key, value)

class CacheManager:
    """Manages multiple caches for different purposes."""
    def __init__(self):
        self.query_cache = QueryCache()
        self.embedding_cache = Cache[np.ndarray]()
        self.document_cache = Cache[str]()
        self._cleanup_task: Optional[asyncio.Task] = None
        self.cleanup_interval = 300  # 5 minutes

    async def start_cleanup(self) -> None:
        """Start the cleanup task."""
        if self._cleanup_task is None:
            self._cleanup_task = asyncio.create_task(self._cleanup_loop())

    async def stop_cleanup(self) -> None:
        """Stop the cleanup task."""
        if self._cleanup_task is not None:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
            self._cleanup_task = None

    async def _cleanup_loop(self) -> None:
        """Periodically clean up expired cache entries."""
        while True:
            try:
                await asyncio.sleep(self.cleanup_interval)
                await self._cleanup_caches()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in cache cleanup: {e}")

    @with_performance_monitoring
    async def _cleanup_caches(self) -> None:
        """Clean up all caches."""
        with performance_section("cache_cleanup"):
            await self.query_cache.clear()
            await self.embedding_cache.clear()
            await self.document_cache.clear()

    @property
    def config(self) -> Dict[str, Any]:
        """Get cache configuration."""
        return {
            "query_cache_size": self.query_cache.size,
            "embedding_cache_size": self.embedding_cache.size,
            "document_cache_size": self.document_cache.size,
            "cleanup_interval": self.cleanup_interval
        } 

@dataclass
class CacheStats:
    """Statistics for a cache."""
    size: int
    hits: int = 0
    misses: int = 0
    evictions: int = 0
    total_access_time: float = 0.0
    last_cleanup_time: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None

    @property
    def hit_rate(self) -> float:
        """Calculate cache hit rate."""
        total = self.hits + self.misses
        return self.hits / total if total > 0 else 0.0

    @property
    def avg_access_time(self) -> float:
        """Calculate average access time."""
        total = self.hits + self.misses
        return self.total_access_time / total if total > 0 else 0.0 

class LRUEvictionPolicy:
    """LRU (Least Recently Used) eviction policy implementation."""
    
    def __init__(self, max_size: int = 1000):
        self.max_size = max_size
        self._cache: OrderedDict[str, float] = OrderedDict()
    
    def record_access(self, key: str) -> None:
        """Record access of a key."""
        if key in self._cache:
            self._cache.move_to_end(key)
        self._cache[key] = time.time()
        
        if len(self._cache) > self.max_size:
            self._cache.popitem(last=False)
    
    def get_eviction_candidates(self, count: int = 1) -> List[str]:
        """Get keys to evict."""
        return [k for k, _ in list(self._cache.items())[:count]]
    
    def remove_key(self, key: str) -> None:
        """Remove a key from tracking."""
        if key in self._cache:
            del self._cache[key]
    
    def clear(self) -> None:
        """Clear all tracked keys."""
        self._cache.clear() 

class LFUEvictionPolicy:
    """LFU (Least Frequently Used) eviction policy implementation."""
    
    def __init__(self, max_size: int = 1000):
        self.max_size = max_size
        self._access_counts: Dict[str, int] = {}
        self._last_access: Dict[str, float] = {}
    
    def record_access(self, key: str) -> None:
        """Record access of a key."""
        current_time = time.time()
        self._access_counts[key] = self._access_counts.get(key, 0) + 1
        self._last_access[key] = current_time
        
        if len(self._access_counts) > self.max_size:
            # Get least frequently used items
            min_count = min(self._access_counts.values())
            lfu_keys = [k for k, v in self._access_counts.items() if v == min_count]
            
            # If multiple items have same frequency, remove oldest
            oldest_key = min(lfu_keys, key=lambda k: self._last_access[k])
            self.remove_key(oldest_key)
    
    def get_eviction_candidates(self, count: int = 1) -> List[str]:
        """Get keys to evict."""
        if not self._access_counts:
            return []
            
        # Sort by access count and last access time
        candidates = sorted(
            self._access_counts.keys(),
            key=lambda k: (self._access_counts[k], self._last_access[k])
        )
        return candidates[:count]
    
    def remove_key(self, key: str) -> None:
        """Remove a key from tracking."""
        self._access_counts.pop(key, None)
        self._last_access.pop(key, None)
    
    def clear(self) -> None:
        """Clear all tracked keys."""
        self._access_counts.clear()
        self._last_access.clear() 

class TTLEvictionPolicy:
    """TTL (Time To Live) eviction policy implementation."""
    
    def __init__(self, ttl: float = 3600):
        self.ttl = ttl
        self._access_times: Dict[str, float] = {}
    
    def record_access(self, key: str) -> None:
        """Record access of a key."""
        self._access_times[key] = time.time()
    
    def get_eviction_candidates(self, count: int = 1) -> List[str]:
        """Get keys to evict."""
        current_time = time.time()
        expired = [
            k for k, t in self._access_times.items()
            if current_time - t > self.ttl
        ]
        return expired[:count]
    
    def remove_key(self, key: str) -> None:
        """Remove a key from tracking."""
        self._access_times.pop(key, None)
    
    def clear(self) -> None:
        """Clear all tracked keys."""
        self._access_times.clear() 

class CacheBackend(Generic[T]):
    """Abstract base class for cache backends."""
    
    def __init__(self, max_size: int = 1000, ttl: Optional[float] = None):
        self.max_size = max_size
        self.ttl = ttl
        self.stats = CacheStats(size=0)
    
    @with_performance_monitoring
    async def get(self, key: str) -> Optional[T]:
        """Get a value from the cache."""
        raise NotImplementedError
    
    @with_performance_monitoring
    async def set(self, key: str, value: T) -> None:
        """Set a value in the cache."""
        raise NotImplementedError
    
    @with_performance_monitoring
    async def delete(self, key: str) -> None:
        """Delete a value from the cache."""
        raise NotImplementedError
    
    @with_performance_monitoring
    async def clear(self) -> None:
        """Clear all entries from the cache."""
        raise NotImplementedError
    
    @property
    def size(self) -> int:
        """Get current cache size."""
        return self.stats.size
    
    def update_stats(self, hit: bool = True, access_time: float = 0.0) -> None:
        """Update cache statistics."""
        if hit:
            self.stats.hits += 1
        else:
            self.stats.misses += 1
        self.stats.total_access_time += access_time 

class MemoryBackend(CacheBackend[T]):
    """In-memory cache backend implementation."""
    
    def __init__(self, max_size: int = 1000, ttl: Optional[float] = None,
                 eviction_policy: EvictionPolicy = EvictionPolicy.LRU):
        super().__init__(max_size=max_size, ttl=ttl)
        self._cache: Dict[str, CacheEntry[T]] = {}
        
        # Initialize eviction policy
        if eviction_policy == EvictionPolicy.LRU:
            self._eviction_policy = LRUEvictionPolicy(max_size)
        elif eviction_policy == EvictionPolicy.LFU:
            self._eviction_policy = LFUEvictionPolicy(max_size)
        elif eviction_policy == EvictionPolicy.FIFO:
            self._eviction_policy = TTLEvictionPolicy(ttl or float('inf'))
        else:
            raise ValueError(f"Unsupported eviction policy: {eviction_policy}")
    
    @with_performance_monitoring
    async def get(self, key: str) -> Optional[T]:
        """Get a value from the cache."""
        start_time = time.time()
        
        entry = self._cache.get(key)
        if entry is None:
            self.update_stats(hit=False, access_time=time.time() - start_time)
            return None
        
        # Check TTL
        if self.ttl and (time.time() - entry.created_at) > self.ttl:
            await self.delete(key)
            self.update_stats(hit=False, access_time=time.time() - start_time)
            return None
        
        # Update eviction policy
        self._eviction_policy.record_access(key)
        
        # Update stats
        self.update_stats(hit=True, access_time=time.time() - start_time)
        
        return entry.value
    
    @with_performance_monitoring
    async def set(self, key: str, value: T) -> None:
        """Set a value in the cache."""
        # Create entry
        entry = CacheEntry(
            value=value,
            created_at=time.time(),
            last_accessed=time.time()
        )
        
        # Check size and evict if needed
        if len(self._cache) >= self.max_size:
            evict_keys = self._eviction_policy.get_eviction_candidates()
            for evict_key in evict_keys:
                await self.delete(evict_key)
                self.stats.evictions += 1
        
        # Store value and update policy
        self._cache[key] = entry
        self._eviction_policy.record_access(key)
        self.stats.size = len(self._cache)
    
    @with_performance_monitoring
    async def delete(self, key: str) -> None:
        """Delete a value from the cache."""
        if key in self._cache:
            del self._cache[key]
            self._eviction_policy.remove_key(key)
            self.stats.size = len(self._cache)
    
    @with_performance_monitoring
    async def clear(self) -> None:
        """Clear all entries from the cache."""
        self._cache.clear()
        self._eviction_policy.clear()
        self.stats.size = 0
        self.stats.last_cleanup_time = time.time() 

class DiskBackend(CacheBackend):
    """A disk-based cache backend that persists data to the filesystem."""

    def __init__(self, max_size: int, ttl: Optional[int] = None, 
                 eviction_policy: Optional[EvictionPolicy] = None,
                 cache_dir: str = ".cache"):
        """Initialize the disk cache backend.
        
        Args:
            max_size: Maximum number of items to store in cache
            ttl: Optional time-to-live in seconds for cache entries
            eviction_policy: Optional policy for evicting entries when cache is full
            cache_dir: Directory to store cache files
        """
        super().__init__(max_size, ttl, eviction_policy)
        self.cache_dir = cache_dir
        os.makedirs(cache_dir, exist_ok=True)
        self.cache_index = {}  # Maps keys to filenames
        self._load_cache_index()

    def _get_cache_path(self, key: str) -> str:
        """Get the filesystem path for a cache key."""
        # Use hash of key as filename to avoid filesystem issues
        filename = hashlib.sha256(str(key).encode()).hexdigest()
        return os.path.join(self.cache_dir, filename)

    def _load_cache_index(self):
        """Load the cache index from disk."""
        index_path = os.path.join(self.cache_dir, "index.json")
        if os.path.exists(index_path):
            with open(index_path, "r") as f:
                self.cache_index = json.load(f)

    def _save_cache_index(self):
        """Save the cache index to disk."""
        index_path = os.path.join(self.cache_dir, "index.json") 
        with open(index_path, "w") as f:
            json.dump(self.cache_index, f)

    @with_performance_monitoring
    def get(self, key: str) -> Optional[Any]:
        """Get a value from the cache.
        
        Args:
            key: Cache key to retrieve
            
        Returns:
            Cached value if found and not expired, None otherwise
        """
        if key not in self.cache_index:
            self.stats.record_miss()
            return None

        cache_path = self._get_cache_path(key)
        if not os.path.exists(cache_path):
            del self.cache_index[key]
            self._save_cache_index()
            self.stats.record_miss()
            return None

        try:
            with open(cache_path, "rb") as f:
                entry = pickle.load(f)
        except (pickle.UnpicklingError, EOFError):
            del self.cache_index[key]
            self._save_cache_index()
            self.stats.record_miss()
            return None

        if self.ttl and time.time() - entry["timestamp"] > self.ttl:
            self.delete(key)
            self.stats.record_miss()
            return None

        if self.eviction_policy:
            self.eviction_policy.record_access(key)

        self.stats.record_hit()
        return entry["value"]

    @with_performance_monitoring
    def set(self, key: str, value: Any):
        """Set a value in the cache.
        
        Args:
            key: Cache key
            value: Value to cache
        """
        if len(self.cache_index) >= self.max_size and key not in self.cache_index:
            if self.eviction_policy:
                evicted = self.eviction_policy.get_eviction_candidates(1)
                if evicted:
                    self.delete(evicted[0])
            else:
                # Default to random eviction
                evict_key = random.choice(list(self.cache_index.keys()))
                self.delete(evict_key)

        entry = {
            "value": value,
            "timestamp": time.time()
        }

        cache_path = self._get_cache_path(key)
        with open(cache_path, "wb") as f:
            pickle.dump(entry, f)

        self.cache_index[key] = cache_path
        self._save_cache_index()

        if self.eviction_policy:
            self.eviction_policy.record_access(key)

    @with_performance_monitoring
    def delete(self, key: str):
        """Delete a value from the cache.
        
        Args:
            key: Cache key to delete
        """
        if key not in self.cache_index:
            return

        cache_path = self._get_cache_path(key)
        try:
            os.remove(cache_path)
        except OSError:
            pass

        del self.cache_index[key]
        self._save_cache_index()

        if self.eviction_policy:
            self.eviction_policy.remove_key(key)

    @with_performance_monitoring
    def clear(self):
        """Clear all entries from the cache."""
        for key in list(self.cache_index.keys()):
            self.delete(key)

        if self.eviction_policy:
            self.eviction_policy.clear()

    @property
    def size(self) -> int:
        """Get current number of items in cache."""
        return len(self.cache_index) 