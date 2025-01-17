"""Caching system for RAG components."""

from typing import Any, Dict, Optional, Union
from collections import OrderedDict
import time
import os
import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class CacheBackend:
    """Base class for cache storage backends."""
    
    def __init__(self, max_size: Optional[int] = None, ttl: Optional[int] = None):
        self.max_size = max_size
        self.ttl = ttl
        self.stats = {"hits": 0, "misses": 0}
    
    def get(self, key: str) -> Optional[Any]:
        """Get value for key."""
        raise NotImplementedError
        
    def put(self, key: str, value: Any) -> None:
        """Store value for key."""
        raise NotImplementedError
        
    def remove(self, key: str) -> None:
        """Remove key from cache."""
        raise NotImplementedError
        
    def clear(self) -> None:
        """Clear all entries."""
        raise NotImplementedError

class MemoryBackend(CacheBackend):
    """In-memory cache backend using OrderedDict."""
    
    def __init__(self, max_size: Optional[int] = None, ttl: Optional[int] = None):
        super().__init__(max_size, ttl)
        self._cache: OrderedDict = OrderedDict()
        self._timestamps: Dict[str, float] = {}
        
    def get(self, key: str) -> Optional[Any]:
        if key not in self._cache:
            self.stats["misses"] += 1
            return None
            
        if self.ttl and time.time() - self._timestamps[key] > self.ttl:
            self.remove(key)
            self.stats["misses"] += 1
            return None
            
        self.stats["hits"] += 1
        value = self._cache[key]
        # Move to end for LRU
        self._cache.move_to_end(key)
        return value
        
    def put(self, key: str, value: Any) -> None:
        if self.max_size and len(self._cache) >= self.max_size:
            # Remove oldest
            self._cache.popitem(last=False)
            
        self._cache[key] = value
        self._timestamps[key] = time.time()
        # Move to end for LRU
        self._cache.move_to_end(key)
        
    def remove(self, key: str) -> None:
        if key in self._cache:
            del self._cache[key]
            del self._timestamps[key]
            
    def clear(self) -> None:
        self._cache.clear()
        self._timestamps.clear()

class DiskBackend(CacheBackend):
    """Disk-based cache backend."""
    
    def __init__(self, cache_dir: Union[str, Path], max_size: Optional[int] = None, ttl: Optional[int] = None):
        super().__init__(max_size, ttl)
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
    def _get_path(self, key: str) -> Path:
        return self.cache_dir / f"{key}.json"
        
    def get(self, key: str) -> Optional[Any]:
        path = self._get_path(key)
        if not path.exists():
            self.stats["misses"] += 1
            return None
            
        try:
            data = json.loads(path.read_text())
            if self.ttl and time.time() - data["timestamp"] > self.ttl:
                self.remove(key)
                self.stats["misses"] += 1
                return None
                
            self.stats["hits"] += 1
            return data["value"]
        except Exception as e:
            logger.error(f"Error reading cache file {path}: {e}")
            return None
            
    def put(self, key: str, value: Any) -> None:
        if self.max_size:
            files = list(self.cache_dir.glob("*.json"))
            while len(files) >= self.max_size:
                # Remove oldest file
                oldest = min(files, key=lambda p: p.stat().st_mtime)
                oldest.unlink()
                files.remove(oldest)
                
        data = {
            "value": value,
            "timestamp": time.time()
        }
        path = self._get_path(key)
        path.write_text(json.dumps(data))
        
    def remove(self, key: str) -> None:
        path = self._get_path(key)
        if path.exists():
            path.unlink()
            
    def clear(self) -> None:
        for path in self.cache_dir.glob("*.json"):
            path.unlink()

class Cache:
    """Generic cache with pluggable backend."""
    
    def __init__(self, max_size: Optional[int] = None, ttl: Optional[int] = None, 
                 backend: Optional[CacheBackend] = None):
        self.backend = backend or MemoryBackend(max_size, ttl)
        
    def get(self, key: str) -> Optional[Any]:
        """Get value for key."""
        return self.backend.get(key)
        
    def put(self, key: str, value: Any) -> None:
        """Store value for key."""
        self.backend.put(key, value)
        
    def remove(self, key: str) -> None:
        """Remove key from cache."""
        self.backend.remove(key)
        
    def clear(self) -> None:
        """Clear all entries."""
        self.backend.clear()
        
    @property
    def stats(self) -> Dict[str, int]:
        """Get cache statistics."""
        return self.backend.stats

class QueryCache(Cache):
    """Cache for query results."""
    
    def __init__(self, max_size_bytes: Optional[int] = None, ttl: Optional[int] = None):
        super().__init__(max_size=max_size_bytes, ttl=ttl)

class EmbeddingCache(Cache):
    """Cache for computed embeddings."""
    
    def __init__(self, max_size_bytes: Optional[int] = None, ttl: Optional[int] = None):
        super().__init__(max_size=max_size_bytes, ttl=ttl) 