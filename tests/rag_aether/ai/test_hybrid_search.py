"""Tests for hybrid search system with caching."""
import pytest
import numpy as np
from unittest.mock import Mock, patch
import tempfile
import shutil
import asyncio

from rag_aether.ai.hybrid_search import HybridSearcher, SearchResult

@pytest.fixture
def sample_documents():
    """Sample documents for testing."""
    return [
        "The quick brown fox jumps over the lazy dog",
        "A fast brown fox leaps across a sleeping hound",
        "The lazy dog sleeps while the quick fox runs",
        "A document about something completely different",
        "Another unrelated document for testing"
    ]

@pytest.fixture
def sample_metadata():
    """Sample metadata for testing."""
    return [
        {"type": "animal", "theme": "fox"},
        {"type": "animal", "theme": "fox"},
        {"type": "animal", "theme": "dog"},
        {"type": "other", "theme": "test"},
        {"type": "other", "theme": "test"}
    ]

@pytest.fixture
def temp_cache_dir():
    """Temporary directory for cache files."""
    temp_dir = tempfile.mkdtemp()
    yield temp_dir
    shutil.rmtree(temp_dir)

@pytest.fixture
async def searcher(temp_cache_dir):
    """Initialize searcher with caching enabled."""
    with patch("rag_aether.ai.caching_system.DiskBackend") as mock_backend:
        mock_backend.return_value.cache_dir = temp_cache_dir
        searcher = HybridSearcher(
            cache_embeddings=True,
            cache_results=True
        )
        yield searcher

@pytest.mark.asyncio
async def test_basic_search(searcher, sample_documents, sample_metadata):
    """Test basic search functionality."""
    await searcher.index_documents(sample_documents, sample_metadata)
    
    results = await searcher.search("quick fox", top_k=2)
    
    assert len(results) == 2
    assert "fox" in results[0].content.lower()
    assert "quick" in results[0].content.lower()
    assert results[0].combined_score > 0
    assert results[0].bm25_score > 0
    assert results[0].semantic_score > 0

@pytest.mark.asyncio
async def test_filtered_search(searcher, sample_documents, sample_metadata):
    """Test search with metadata filters."""
    await searcher.index_documents(sample_documents, sample_metadata)
    
    results = await searcher.search(
        "fox",
        filters={"type": "animal"},
        top_k=3
    )
    
    assert len(results) == 3
    assert all(r.metadata["type"] == "animal" for r in results)

@pytest.mark.asyncio
async def test_embedding_cache(searcher, sample_documents):
    """Test embedding cache functionality."""
    # First search to populate cache
    await searcher.index_documents(sample_documents)
    results1 = await searcher.search("quick fox")
    
    # Second search should use cached embeddings
    with patch.object(searcher.model, 'encode') as mock_encode:
        results2 = await searcher.search("quick fox")
        # Model should not be called for cached embeddings
        assert mock_encode.call_count == 1  # Only for query
        
    assert len(results1) == len(results2)
    assert results1[0].combined_score == results2[0].combined_score

@pytest.mark.asyncio
async def test_query_cache(searcher, sample_documents):
    """Test query result cache functionality."""
    await searcher.index_documents(sample_documents)
    
    # First search to populate cache
    query = "quick fox"
    results1 = await searcher.search(query)
    
    # Second search should use cached results
    with patch.object(searcher.model, 'encode') as mock_encode:
        results2 = await searcher.search(query)
        # Model should not be called for cached results
        assert mock_encode.call_count == 0
        
    assert len(results1) == len(results2)
    assert results1[0].combined_score == results2[0].combined_score

@pytest.mark.asyncio
async def test_cache_with_filters(searcher, sample_documents, sample_metadata):
    """Test caching with different filter combinations."""
    await searcher.index_documents(sample_documents, sample_metadata)
    
    # Search with filters
    filters1 = {"type": "animal"}
    results1 = await searcher.search("fox", filters=filters1)
    
    # Same search should use cache
    with patch.object(searcher.model, 'encode') as mock_encode:
        results2 = await searcher.search("fox", filters=filters1)
        assert mock_encode.call_count == 0
        
    # Different filters should not use cache
    filters2 = {"type": "other"}
    with patch.object(searcher.model, 'encode') as mock_encode:
        results3 = await searcher.search("fox", filters=filters2)
        assert mock_encode.call_count == 0  # Query embedding should be cached
        
    assert len(results1) != len(results3)

@pytest.mark.asyncio
async def test_cache_invalidation(searcher, sample_documents):
    """Test cache behavior with document updates."""
    await searcher.index_documents(sample_documents)
    
    # First search
    results1 = await searcher.search("fox")
    
    # Update documents
    new_documents = sample_documents + ["A new document about a red fox"]
    await searcher.index_documents(new_documents)
    
    # Search should not use cache
    with patch.object(searcher.model, 'encode') as mock_encode:
        results2 = await searcher.search("fox")
        assert mock_encode.call_count == 1  # Should encode query
        
    assert len(results2) > len(results1)

@pytest.mark.asyncio
async def test_concurrent_search(searcher, sample_documents):
    """Test concurrent search operations."""
    await searcher.index_documents(sample_documents)
    
    async def search_worker(query):
        return await searcher.search(query)
    
    # Run multiple searches concurrently
    queries = ["fox", "dog", "quick", "lazy"]
    tasks = [search_worker(q) for q in queries]
    results = await asyncio.gather(*tasks)
    
    assert len(results) == len(queries)
    assert all(len(r) > 0 for r in results)

@pytest.mark.asyncio
async def test_score_normalization(searcher, sample_documents):
    """Test score normalization and combination."""
    await searcher.index_documents(sample_documents)
    
    results = await searcher.search("fox")
    
    # Check score ranges
    assert all(0 <= r.bm25_score <= 1 for r in results)
    assert all(0 <= r.semantic_score <= 1 for r in results)
    assert all(0 <= r.combined_score <= 1 for r in results)
    
    # Check score combination
    for r in results:
        expected_score = (
            searcher.bm25_weight * r.bm25_score +
            searcher.semantic_weight * r.semantic_score
        )
        assert abs(r.combined_score - expected_score) < 1e-6

@pytest.mark.asyncio
async def test_error_handling(searcher):
    """Test error handling in search operations."""
    # Search without indexed documents
    with pytest.raises(Exception):
        await searcher.search("query")
        
    # Invalid filters
    await searcher.index_documents(["test document"])
    results = await searcher.search(
        "test",
        filters={"nonexistent": "value"}
    )
    assert len(results) == 0 