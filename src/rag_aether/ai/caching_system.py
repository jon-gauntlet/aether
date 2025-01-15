"""Caching system for optimizing RAG response times."""
from typing import Dict, Any, Optional, List, TypeVar, Generic, Union, Tuple
from dataclasses import dataclass
import time
import asyncio
import logging
from datetime import datetime, timedelta
import json
import hashlib
from collections import OrderedDict
import numpy as np
from pathlib import Path
import aiofiles
import aiofiles.os

T = TypeVar('T')

@dataclass
class CacheEntry(Generic[T]):
    """Cache entry with metadata."""
    key: str
    value: T
    timestamp: float
    ttl: float
    metadata: Dict[str, Any]
    access_count: int
    last_access: float
    size_bytes: int

class CacheStats:
    """Statistics for cache performance."""
    
    def __init__(self):
        """Initialize cache statistics."""
        self.hits = 0
        self.misses = 0
        self.evictions = 0
        self.insertions = 0
        self.size_bytes = 0
        self.last_reset = time.time()
        
    def reset(self):
        """Reset statistics."""
        self.hits = 0
        self.misses = 0
        self.evictions = 0
        self.insertions = 0
        self.size_bytes = 0
        self.last_reset = time.time()
        
    @property
    def hit_rate(self) -> float:
        """Calculate cache hit rate."""
        total = self.hits + self.misses
        return self.hits / total if total > 0 else 0.0
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert stats to dictionary."""
        return {
            "hits": self.hits,
            "misses": self.misses,
            "evictions": self.evictions,
            "insertions": self.insertions,
            "size_bytes": self.size_bytes,
            "hit_rate": self.hit_rate,
            "last_reset": datetime.fromtimestamp(self.last_reset).isoformat()
        }

class EvictionPolicy:
    """Base class for cache eviction policies."""
    
    async def select_entries_to_evict(
        self,
        entries: Dict[str, CacheEntry],
        required_space: int
    ) -> List[str]:
        """Select entries to evict.
        
        Args:
            entries: Current cache entries
            required_space: Space needed in bytes
            
        Returns:
            List of keys to evict
        """
        raise NotImplementedError

class LRUEvictionPolicy(EvictionPolicy):
    """Least Recently Used eviction policy."""
    
    async def select_entries_to_evict(
        self,
        entries: Dict[str, CacheEntry],
        required_space: int
    ) -> List[str]:
        """Select least recently used entries."""
        sorted_entries = sorted(
            entries.items(),
            key=lambda x: x[1].last_access
        )
        
        to_evict = []
        freed_space = 0
        
        for key, entry in sorted_entries:
            if freed_space >= required_space:
                break
            to_evict.append(key)
            freed_space += entry.size_bytes
            
        return to_evict

class LFUEvictionPolicy(EvictionPolicy):
    """Least Frequently Used eviction policy."""
    
    async def select_entries_to_evict(
        self,
        entries: Dict[str, CacheEntry],
        required_space: int
    ) -> List[str]:
        """Select least frequently used entries."""
        sorted_entries = sorted(
            entries.items(),
            key=lambda x: (x[1].access_count, x[1].last_access)
        )
        
        to_evict = []
        freed_space = 0
        
        for key, entry in sorted_entries:
            if freed_space >= required_space:
                break
            to_evict.append(key)
            freed_space += entry.size_bytes
            
        return to_evict

class TTLEvictionPolicy(EvictionPolicy):
    """Time-To-Live based eviction policy."""
    
    async def select_entries_to_evict(
        self,
        entries: Dict[str, CacheEntry],
        required_space: int
    ) -> List[str]:
        """Select expired entries first, then oldest."""
        current_time = time.time()
        expired = []
        valid = []
        
        for key, entry in entries.items():
            if current_time > entry.timestamp + entry.ttl:
                expired.append((key, entry))
            else:
                valid.append((key, entry))
                
        # Sort valid entries by age
        valid.sort(key=lambda x: x[1].timestamp)
        
        to_evict = []
        freed_space = 0
        
        # First evict expired entries
        for key, entry in expired:
            to_evict.append(key)
            freed_space += entry.size_bytes
            if freed_space >= required_space:
                break
                
        # If needed, evict oldest valid entries
        if freed_space < required_space:
            for key, entry in valid:
                to_evict.append(key)
                freed_space += entry.size_bytes
                if freed_space >= required_space:
                    break
                    
        return to_evict

class CacheBackend:
    """Base class for cache storage backends."""
    
    async def get(self, key: str) -> Optional[CacheEntry]:
        """Get entry from cache."""
        raise NotImplementedError
        
    async def put(self, key: str, entry: CacheEntry):
        """Put entry in cache."""
        raise NotImplementedError
        
    async def delete(self, key: str):
        """Delete entry from cache."""
        raise NotImplementedError
        
    async def clear(self):
        """Clear all entries."""
        raise NotImplementedError
        
    async def get_size(self) -> int:
        """Get total size in bytes."""
        raise NotImplementedError

class MemoryBackend(CacheBackend):
    """In-memory cache backend."""
    
    def __init__(self):
        """Initialize memory backend."""
        self.entries: Dict[str, CacheEntry] = {}
        
    async def get(self, key: str) -> Optional[CacheEntry]:
        """Get entry from memory."""
        return self.entries.get(key)
        
    async def put(self, key: str, entry: CacheEntry):
        """Put entry in memory."""
        self.entries[key] = entry
        
    async def delete(self, key: str):
        """Delete entry from memory."""
        self.entries.pop(key, None)
        
    async def clear(self):
        """Clear all entries."""
        self.entries.clear()
        
    async def get_size(self) -> int:
        """Get total size in bytes."""
        return sum(entry.size_bytes for entry in self.entries.values())

class DiskBackend(CacheBackend):
    """Disk-based cache backend."""
    
    def __init__(self, cache_dir: Union[str, Path]):
        """Initialize disk backend."""
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
    def _get_path(self, key: str) -> Path:
        """Get file path for key."""
        hashed = hashlib.sha256(key.encode()).hexdigest()
        return self.cache_dir / f"{hashed}.cache"
        
    async def get(self, key: str) -> Optional[CacheEntry]:
        """Get entry from disk."""
        path = self._get_path(key)
        try:
            async with aiofiles.open(path, 'r') as f:
                data = await f.read()
                entry_dict = json.loads(data)
                return CacheEntry(**entry_dict)
        except (FileNotFoundError, json.JSONDecodeError):
            return None
            
    async def put(self, key: str, entry: CacheEntry):
        """Put entry on disk."""
        path = self._get_path(key)
        async with aiofiles.open(path, 'w') as f:
            await f.write(json.dumps(entry.__dict__))
            
    async def delete(self, key: str):
        """Delete entry from disk."""
        path = self._get_path(key)
        try:
            await aiofiles.os.remove(path)
        except FileNotFoundError:
            pass
            
    async def clear(self):
        """Clear all entries."""
        for path in self.cache_dir.glob("*.cache"):
            try:
                await aiofiles.os.remove(path)
            except FileNotFoundError:
                pass
                
    async def get_size(self) -> int:
        """Get total size in bytes."""
        total = 0
        for path in self.cache_dir.glob("*.cache"):
            try:
                stat = await aiofiles.os.stat(path)
                total += stat.st_size
            except FileNotFoundError:
                continue
        return total

class Cache(Generic[T]):
    """Main cache implementation."""
    
    def __init__(
        self,
        max_size_bytes: int,
        ttl: float = 3600.0,
        eviction_policy: Optional[EvictionPolicy] = None,
        backend: Optional[CacheBackend] = None
    ):
        """Initialize cache.
        
        Args:
            max_size_bytes: Maximum cache size in bytes
            ttl: Default time-to-live in seconds
            eviction_policy: Policy for evicting entries
            backend: Storage backend
        """
        self.max_size_bytes = max_size_bytes
        self.default_ttl = ttl
        self.eviction_policy = eviction_policy or LRUEvictionPolicy()
        self.backend = backend or MemoryBackend()
        
        self.stats = CacheStats()
        self.logger = logging.getLogger("cache")
        
    async def get(
        self,
        key: str,
        default: Optional[T] = None
    ) -> Optional[T]:
        """Get value from cache.
        
        Args:
            key: Cache key
            default: Default value if not found
            
        Returns:
            Cached value or default
        """
        entry = await self.backend.get(key)
        
        if entry is None:
            self.stats.misses += 1
            return default
            
        # Check if expired
        if time.time() > entry.timestamp + entry.ttl:
            await self.backend.delete(key)
            self.stats.misses += 1
            return default
            
        # Update access stats
        entry.access_count += 1
        entry.last_access = time.time()
        await self.backend.put(key, entry)
        
        self.stats.hits += 1
        return entry.value
        
    async def put(
        self,
        key: str,
        value: T,
        ttl: Optional[float] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Put value in cache.
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Time-to-live in seconds
            metadata: Optional metadata
        """
        # Calculate size
        size_bytes = len(json.dumps(value).encode())
        
        # Check if fits in cache
        if size_bytes > self.max_size_bytes:
            self.logger.warning(
                f"Value too large for cache: {size_bytes} bytes"
            )
            return
            
        # Create entry
        entry = CacheEntry(
            key=key,
            value=value,
            timestamp=time.time(),
            ttl=ttl or self.default_ttl,
            metadata=metadata or {},
            access_count=0,
            last_access=time.time(),
            size_bytes=size_bytes
        )
        
        # Check if need to evict
        current_size = await self.backend.get_size()
        if current_size + size_bytes > self.max_size_bytes:
            # Select entries to evict
            to_evict = await self.eviction_policy.select_entries_to_evict(
                self.backend.entries,
                size_bytes
            )
            
            # Evict entries
            for evict_key in to_evict:
                await self.backend.delete(evict_key)
                self.stats.evictions += 1
                
        # Store entry
        await self.backend.put(key, entry)
        self.stats.insertions += 1
        self.stats.size_bytes = await self.backend.get_size()
        
    async def delete(self, key: str):
        """Delete entry from cache."""
        await self.backend.delete(key)
        
    async def clear(self):
        """Clear all entries."""
        await self.backend.clear()
        self.stats.reset()
        
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        return self.stats.to_dict()
        
    async def get_size(self) -> int:
        """Get current cache size in bytes."""
        return await self.backend.get_size()

class QueryCache(Cache[List[Dict[str, Any]]]):
    """Specialized cache for query results."""
    
    def __init__(
        self,
        max_size_bytes: int = 1024 * 1024 * 100,  # 100MB
        ttl: float = 3600.0  # 1 hour
    ):
        """Initialize query cache."""
        super().__init__(
            max_size_bytes=max_size_bytes,
            ttl=ttl,
            eviction_policy=LFUEvictionPolicy(),
            backend=MemoryBackend()
        )
        
    def _generate_key(
        self,
        query: str,
        filters: Optional[Dict[str, Any]] = None,
        limit: Optional[int] = None
    ) -> str:
        """Generate cache key from query parameters."""
        key_parts = [query]
        if filters:
            key_parts.append(json.dumps(filters, sort_keys=True))
        if limit is not None:
            key_parts.append(str(limit))
        return hashlib.sha256(
            "|".join(key_parts).encode()
        ).hexdigest()
        
    async def get_results(
        self,
        query: str,
        filters: Optional[Dict[str, Any]] = None,
        limit: Optional[int] = None
    ) -> Optional[List[Dict[str, Any]]]:
        """Get cached query results."""
        key = self._generate_key(query, filters, limit)
        return await self.get(key)
        
    async def cache_results(
        self,
        query: str,
        results: List[Dict[str, Any]],
        filters: Optional[Dict[str, Any]] = None,
        limit: Optional[int] = None,
        ttl: Optional[float] = None
    ):
        """Cache query results."""
        key = self._generate_key(query, filters, limit)
        metadata = {
            "query": query,
            "filters": filters,
            "limit": limit,
            "result_count": len(results)
        }
        await self.put(key, results, ttl=ttl, metadata=metadata)

class EmbeddingCache(Cache[np.ndarray]):
    """Specialized cache for embeddings."""
    
    def __init__(
        self,
        max_size_bytes: int = 1024 * 1024 * 500,  # 500MB
        ttl: float = 86400.0  # 24 hours
    ):
        """Initialize embedding cache."""
        super().__init__(
            max_size_bytes=max_size_bytes,
            ttl=ttl,
            eviction_policy=LRUEvictionPolicy(),
            backend=DiskBackend("embeddings_cache")
        )
        
    def _generate_key(self, text: str, model_name: str) -> str:
        """Generate cache key from text and model."""
        return hashlib.sha256(
            f"{model_name}|{text}".encode()
        ).hexdigest()
        
    async def get_embedding(
        self,
        text: str,
        model_name: str
    ) -> Optional[np.ndarray]:
        """Get cached embedding."""
        key = self._generate_key(text, model_name)
        return await self.get(key)
        
    async def cache_embedding(
        self,
        text: str,
        embedding: np.ndarray,
        model_name: str,
        ttl: Optional[float] = None
    ):
        """Cache embedding."""
        key = self._generate_key(text, model_name)
        metadata = {
            "text": text,
            "model": model_name,
            "shape": embedding.shape
        }
        await self.put(key, embedding, ttl=ttl, metadata=metadata) 