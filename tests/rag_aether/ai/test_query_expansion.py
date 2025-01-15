"""Tests for query expansion system with caching."""
import pytest
import torch
from unittest.mock import Mock, patch
import numpy as np
import tempfile
import shutil
import asyncio

from rag_aether.ai.query_expansion import QueryExpander, ExpandedQuery

@pytest.fixture
def temp_cache_dir():
    """Temporary directory for cache files."""
    temp_dir = tempfile.mkdtemp()
    yield temp_dir
    shutil.rmtree(temp_dir)

@pytest.fixture
async def expander(temp_cache_dir):
    """Initialize query expander with caching enabled."""
    with patch("rag_aether.ai.caching_system.DiskBackend") as mock_backend:
        mock_backend.return_value.cache_dir = temp_cache_dir
        expander = QueryExpander(
            model_name="t5-base",
            cache_variations=True,
            cache_embeddings=True,
            device="cpu"  # Use CPU for testing
        )
        yield expander

@pytest.mark.asyncio
async def test_basic_expansion(expander):
    """Test basic query expansion."""
    query = "What is machine learning?"
    result = await expander.expand_query(query)
    
    assert isinstance(result, ExpandedQuery)
    assert result.original == query
    assert len(result.variations) > 0
    assert len(result.scores) == len(result.variations)
    assert all(0 <= score <= 1 for score in result.scores)

@pytest.mark.asyncio
async def test_expansion_with_context(expander):
    """Test query expansion with context."""
    query = "What are the key concepts?"
    context = "In the field of artificial intelligence and neural networks..."
    
    result = await expander.expand_query(query, context=context)
    
    assert result.metadata["context"] == context
    assert len(result.variations) > 0
    assert all("concept" in var.lower() or "ai" in var.lower() 
              for var in result.variations)

@pytest.mark.asyncio
async def test_variation_cache(expander):
    """Test variation caching functionality."""
    query = "How does deep learning work?"
    
    # First expansion to populate cache
    result1 = await expander.expand_query(query)
    
    # Second expansion should use cache
    with patch.object(expander.model, 'generate') as mock_generate:
        result2 = await expander.expand_query(query)
        assert not mock_generate.called
        
    assert result1.variations == result2.variations
    assert result1.scores == result2.scores

@pytest.mark.asyncio
async def test_embedding_cache(expander):
    """Test embedding caching functionality."""
    query = "Explain neural networks"
    
    # First expansion to populate cache
    result1 = await expander.expand_query(query)
    
    # Second expansion should use cached embeddings
    with patch.object(expander.similarity_model, 'encode') as mock_encode:
        result2 = await expander.expand_query(query)
        # Should only encode new variations, not query
        assert mock_encode.call_count <= len(result2.variations)
        
    assert result1.variations == result2.variations
    assert result1.scores == result2.scores

@pytest.mark.asyncio
async def test_cache_with_context(expander):
    """Test caching with different contexts."""
    query = "What is the main idea?"
    context1 = "Discussion about renewable energy..."
    context2 = "Analysis of economic theories..."
    
    # Expansion with first context
    result1 = await expander.expand_query(query, context=context1)
    
    # Same query with different context should not use cache
    with patch.object(expander.model, 'generate') as mock_generate:
        result2 = await expander.expand_query(query, context=context2)
        assert mock_generate.called
        
    assert result1.variations != result2.variations

@pytest.mark.asyncio
async def test_batch_expansion(expander):
    """Test batch query expansion."""
    queries = [
        "What is deep learning?",
        "How do neural networks work?",
        "Explain backpropagation"
    ]
    
    results = await expander.expand_queries(queries)
    
    assert len(results) == len(queries)
    assert all(isinstance(r, ExpandedQuery) for r in results)
    assert all(len(r.variations) > 0 for r in results)

@pytest.mark.asyncio
async def test_similarity_filtering(expander):
    """Test similarity-based filtering of variations."""
    query = "What is artificial intelligence?"
    result = await expander.expand_query(query)
    
    # Check that variations meet similarity threshold
    assert all(score >= expander.min_similarity for score in result.scores)
    
    # Check that variations are ordered by similarity
    assert list(result.scores) == sorted(result.scores, reverse=True)

@pytest.mark.asyncio
async def test_concurrent_expansion(expander):
    """Test concurrent query expansion."""
    async def expand_worker(query):
        return await expander.expand_query(query)
    
    # Run multiple expansions concurrently
    queries = [
        "What is machine learning?",
        "How do neural networks work?",
        "Explain deep learning",
        "What is backpropagation?"
    ]
    
    tasks = [expand_worker(q) for q in queries]
    results = await asyncio.gather(*tasks)
    
    assert len(results) == len(queries)
    assert all(isinstance(r, ExpandedQuery) for r in results)
    assert all(len(r.variations) > 0 for r in results)

@pytest.mark.asyncio
async def test_metadata_handling(expander):
    """Test metadata handling in expansions."""
    query = "What is reinforcement learning?"
    metadata = {
        "domain": "AI",
        "difficulty": "intermediate",
        "timestamp": "2024-01-15T10:00:00"
    }
    
    result = await expander.expand_query(query, metadata=metadata)
    
    assert all(k in result.metadata for k in metadata)
    assert all(result.metadata[k] == v for k, v in metadata.items())

@pytest.mark.asyncio
async def test_error_handling(expander):
    """Test error handling in query expansion."""
    # Empty query
    with pytest.raises(Exception):
        await expander.expand_query("")
        
    # None query
    with pytest.raises(Exception):
        await expander.expand_query(None)
        
    # Very long query
    long_query = "what is " * 100
    result = await expander.expand_query(long_query)
    assert len(result.variations) > 0  # Should still work with truncation

@pytest.mark.asyncio
async def test_cache_invalidation(expander):
    """Test cache invalidation scenarios."""
    query = "What is transfer learning?"
    
    # First expansion
    result1 = await expander.expand_query(query)
    
    # Clear caches
    if expander.variation_cache:
        await expander.variation_cache.clear()
    if expander.embedding_cache:
        await expander.embedding_cache.clear()
        
    # Should generate new variations
    with patch.object(expander.model, 'generate') as mock_generate:
        result2 = await expander.expand_query(query)
        assert mock_generate.called 