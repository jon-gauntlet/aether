import pytest
from rag_aether.ai.cache_manager import CacheManager
import time

@pytest.fixture
def cache_manager():
    return CacheManager(use_redis=False)  # Use in-memory cache for testing

def test_lru_cache_hit(cache_manager):
    # Test local LRU cache
    query_hash = "test_query_1"
    cache_manager.set(query_hash, "test_result")
    
    # First call should hit memory cache
    first_call = cache_manager.get_frequent_queries(query_hash)
    
    # Second call should hit LRU cache
    second_call = cache_manager.get_frequent_queries(query_hash)
    
    # Both should return same result
    assert first_call == second_call
    assert first_call == "test_result"

def test_memory_cache_fallback(cache_manager):
    key = "test_key"
    value = "test_value"
    
    # Set value in cache
    cache_manager.set(key, value)
    
    # Get value from cache
    result = cache_manager.get_frequent_queries(key)
    assert result == value

def test_cache_settings_optimization(cache_manager):
    # Should not raise error even without Redis
    cache_manager.optimize_cache_settings() 