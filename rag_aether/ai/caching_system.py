"""Caching system for search results and embeddings."""

from typing import Dict, List, Optional, Any
import json
import time
from pathlib import Path
import logging
from dataclasses import dataclass, asdict

logger = logging.getLogger(__name__)

@dataclass
class CacheEntry:
    """Single cache entry with metadata."""
    value: Any
    timestamp: float
    ttl: Optional[float] = None
    metadata: Optional[Dict] = None
    
    def is_expired(self) -> bool:
        """Check if entry is expired."""
        if self.ttl is None:
            return False
        return time.time() > (self.timestamp + self.ttl)
        
    def to_dict(self) -> Dict:
        """Convert to dictionary."""
        return asdict(self)
        
    @classmethod
    def from_dict(cls, data: Dict) -> 'CacheEntry':
        """Create from dictionary."""
        return cls(**data)

class CacheManager:
    """Manages caching operations."""
    
    def __init__(self, cache_dir: Optional[str] = None):
        """Initialize cache manager.
        
        Args:
            cache_dir: Optional directory for cache files
        """
        self.cache_dir = Path(cache_dir) if cache_dir else Path('.cache')
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
        # In-memory cache
        self.memory_cache: Dict[str, CacheEntry] = {}
        
    def _get_cache_path(self, key: str) -> Path:
        """Get cache file path for a key."""
        # Use hash of key as filename
        filename = f"{hash(key)}.json"
        return self.cache_dir / filename
        
    def set(self,
            key: str,
            value: Any,
            ttl: Optional[float] = None,
            metadata: Optional[Dict] = None) -> None:
        """Set a cache entry.
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Optional time-to-live in seconds
            metadata: Optional metadata
        """
        entry = CacheEntry(
            value=value,
            timestamp=time.time(),
            ttl=ttl,
            metadata=metadata
        )
        
        # Store in memory
        self.memory_cache[key] = entry
        
        try:
            # Store on disk
            cache_path = self._get_cache_path(key)
            with open(cache_path, 'w') as f:
                json.dump(entry.to_dict(), f)
                
        except Exception as e:
            logger.warning(f"Failed to write cache to disk: {e}")
            
    def get(self, key: str) -> Optional[Any]:
        """Get a cache entry.
        
        Args:
            key: Cache key
            
        Returns:
            Cached value if found and not expired, else None
        """
        # Check memory first
        entry = self.memory_cache.get(key)
        if entry and not entry.is_expired():
            return entry.value
            
        try:
            # Check disk
            cache_path = self._get_cache_path(key)
            if not cache_path.exists():
                return None
                
            with open(cache_path, 'r') as f:
                data = json.load(f)
                entry = CacheEntry.from_dict(data)
                
            if entry.is_expired():
                self.delete(key)
                return None
                
            # Update memory cache
            self.memory_cache[key] = entry
            return entry.value
            
        except Exception as e:
            logger.warning(f"Failed to read cache from disk: {e}")
            return None
            
    def delete(self, key: str) -> None:
        """Delete a cache entry.
        
        Args:
            key: Cache key
        """
        # Remove from memory
        self.memory_cache.pop(key, None)
        
        try:
            # Remove from disk
            cache_path = self._get_cache_path(key)
            if cache_path.exists():
                cache_path.unlink()
                
        except Exception as e:
            logger.warning(f"Failed to delete cache file: {e}")
            
    def clear(self) -> None:
        """Clear all cached values."""
        # Clear memory
        self.memory_cache.clear()
        
        try:
            # Clear disk
            for cache_file in self.cache_dir.glob('*.json'):
                cache_file.unlink()
                
        except Exception as e:
            logger.warning(f"Failed to clear cache directory: {e}")
            
    def get_stats(self) -> Dict[str, int]:
        """Get cache statistics.
        
        Returns:
            Dictionary with cache stats
        """
        try:
            disk_entries = len(list(self.cache_dir.glob('*.json')))
        except Exception:
            disk_entries = 0
            
        return {
            'memory_entries': len(self.memory_cache),
            'disk_entries': disk_entries
        } 