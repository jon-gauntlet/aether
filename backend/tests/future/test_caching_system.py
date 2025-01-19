"""Tests for RAG caching system."""
import pytest
import asyncio
import time
import numpy as np
from pathlib import Path
import tempfile
import shutil

from rag_aether.ai.caching_system import (
    Cache,
    QueryCache,
    EmbeddingCache,
    CacheEntry,
    CacheStats,
    EvictionPolicy,
    LRUEvictionPolicy,
    LFUEvictionPolicy,
    TTLEvictionPolicy,
    CacheBackend,
    MemoryBackend,
    DiskBackend
)

@pytest.fixture
def memory_cache():
    """Fixture for memory-based cache."""
    return Cache(
        max_size_bytes=1024 * 1024,  # 1MB
        ttl=1.0,  # 1 second
        eviction_policy=LRUEvictionPolicy(),
        backend=MemoryBackend()
    )

@pytest.fixture
def temp_cache_dir():
    """Fixture for temporary cache directory."""
    temp_dir = tempfile.mkdtemp()
    yield temp_dir
    shutil.rmtree(temp_dir)

@pytest.fixture
def disk_cache(temp_cache_dir):
    """Fixture for disk-based cache."""
    return Cache(
        max_size_bytes=1024 * 1024,  # 1MB
        ttl=1.0,  # 1 second
        eviction_policy=LRUEvictionPolicy(),
        backend=DiskBackend(temp_cache_dir)
    )

@pytest.mark.asyncio
async def test_cache_basic_operations(memory_cache):
    """Test basic cache operations."""
    # Test put and get
    await memory_cache.put("key1", "value1")
    value = await memory_cache.get("key1")
    assert value == "value1"
    
    # Test default value
    value = await memory_cache.get("nonexistent", default="default")
    assert value == "default"
    
    # Test delete
    await memory_cache.delete("key1")
    value = await memory_cache.get("key1")
    assert value is None
    
    # Test clear
    await memory_cache.put("key2", "value2")
    await memory_cache.clear()
    value = await memory_cache.get("key2")
    assert value is None

@pytest.mark.asyncio
async def test_cache_ttl(memory_cache):
    """Test cache TTL expiration."""
    await memory_cache.put("key1", "value1", ttl=0.1)
    
    # Value should exist initially
    value = await memory_cache.get("key1")
    assert value == "value1"
    
    # Wait for expiration
    await asyncio.sleep(0.2)
    
    # Value should be expired
    value = await memory_cache.get("key1")
    assert value is None

@pytest.mark.asyncio
async def test_cache_size_limit(memory_cache):
    """Test cache size limit enforcement."""
    # Add large value
    large_value = "x" * (1024 * 1024 * 2)  # 2MB
    await memory_cache.put("large", large_value)
    
    # Should not be stored (exceeds max size)
    value = await memory_cache.get("large")
    assert value is None
    
    # Add multiple small values
    for i in range(100):
        await memory_cache.put(f"key{i}", "x" * 1000)
        
    # Check eviction occurred
    stats = memory_cache.get_stats()
    assert stats["evictions"] > 0

@pytest.mark.asyncio
async def test_cache_stats(memory_cache):
    """Test cache statistics tracking."""
    # Add some entries
    await memory_cache.put("key1", "value1")
    await memory_cache.put("key2", "value2")
    
    # Test hits
    await memory_cache.get("key1")
    await memory_cache.get("key2")
    
    # Test misses
    await memory_cache.get("nonexistent")
    
    # Check stats
    stats = memory_cache.get_stats()
    assert stats["hits"] == 2
    assert stats["misses"] == 1
    assert stats["insertions"] == 2
    assert stats["hit_rate"] == 2/3

@pytest.mark.asyncio
async def test_eviction_policies():
    """Test different eviction policies."""
    policies = [
        LRUEvictionPolicy(),
        LFUEvictionPolicy(),
        TTLEvictionPolicy()
    ]
    
    for policy in policies:
        cache = Cache(
            max_size_bytes=1000,
            eviction_policy=policy
        )
        
        # Add entries
        await cache.put("key1", "value1")
        await cache.get("key1")  # Access key1
        await asyncio.sleep(0.1)
        await cache.put("key2", "value2")
        
        # Force eviction
        large_value = "x" * 900
        await cache.put("large", large_value)
        
        # Check eviction behavior
        if isinstance(policy, LRUEvictionPolicy):
            # Should evict least recently used
            assert await cache.get("key2") is None
            assert await cache.get("key1") is not None
        elif isinstance(policy, LFUEvictionPolicy):
            # Should evict least frequently used
            assert await cache.get("key2") is None
            assert await cache.get("key1") is not None
        elif isinstance(policy, TTLEvictionPolicy):
            # Should evict oldest
            assert await cache.get("key1") is None
            assert await cache.get("key2") is not None

@pytest.mark.asyncio
async def test_disk_backend(disk_cache):
    """Test disk-based cache backend."""
    # Test persistence
    await disk_cache.put("key1", "value1")
    value = await disk_cache.get("key1")
    assert value == "value1"
    
    # Create new cache instance with same directory
    new_cache = Cache(
        max_size_bytes=1024 * 1024,
        backend=disk_cache.backend
    )
    
    # Value should still be accessible
    value = await new_cache.get("key1")
    assert value == "value1"

@pytest.mark.asyncio
async def test_query_cache():
    """Test specialized query cache."""
    cache = QueryCache(max_size_bytes=1024 * 1024)
    
    # Test with various query parameters
    query = "test query"
    filters = {"type": "document"}
    limit = 10
    results = [{"id": i, "text": f"result {i}"} for i in range(5)]
    
    await cache.cache_results(
        query=query,
        results=results,
        filters=filters,
        limit=limit
    )
    
    # Test retrieval
    cached = await cache.get_results(
        query=query,
        filters=filters,
        limit=limit
    )
    assert cached == results
    
    # Test with different parameters
    cached = await cache.get_results(
        query=query,
        filters={"type": "other"},
        limit=limit
    )
    assert cached is None

@pytest.mark.asyncio
async def test_embedding_cache(temp_cache_dir):
    """Test specialized embedding cache."""
    cache = EmbeddingCache(
        max_size_bytes=1024 * 1024,
        ttl=1.0
    )
    
    # Test with numpy array
    text = "test text"
    model = "test_model"
    embedding = np.random.rand(768)
    
    await cache.cache_embedding(
        text=text,
        embedding=embedding,
        model_name=model
    )
    
    # Test retrieval
    cached = await cache.get_embedding(
        text=text,
        model_name=model
    )
    assert np.array_equal(cached, embedding)
    
    # Test with different text
    cached = await cache.get_embedding(
        text="other text",
        model_name=model
    )
    assert cached is None

@pytest.mark.asyncio
async def test_concurrent_access(memory_cache):
    """Test concurrent cache access."""
    async def worker(i):
        await memory_cache.put(f"key{i}", f"value{i}")
        await memory_cache.get(f"key{i}")
        await memory_cache.delete(f"key{i}")
    
    # Run multiple workers concurrently
    workers = [worker(i) for i in range(10)]
    await asyncio.gather(*workers)
    
    # Check final state
    stats = memory_cache.get_stats()
    assert stats["insertions"] == 10
    assert stats["hits"] == 10

@pytest.mark.asyncio
async def test_metadata_handling(memory_cache):
    """Test cache entry metadata handling."""
    metadata = {
        "source": "test",
        "timestamp": "2024-01-15T10:00:00"
    }
    
    await memory_cache.put(
        "key1",
        "value1",
        metadata=metadata
    )
    
    entry = await memory_cache.backend.get("key1")
    assert entry.metadata == metadata

@pytest.mark.asyncio
async def test_error_handling(memory_cache):
    """Test cache error handling."""
    # Test with non-serializable value
    class NonSerializable:
        pass
    
    # Should not raise error, but value won't be stored
    await memory_cache.put("key1", NonSerializable())
    value = await memory_cache.get("key1")
    assert value is None
    
    # Test with invalid TTL
    await memory_cache.put("key2", "value2", ttl=-1)
    value = await memory_cache.get("key2")
    assert value is None 