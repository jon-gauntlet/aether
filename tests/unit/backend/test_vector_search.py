"""Tests for vector search functionality."""
import pytest
import numpy as np
from src.rag_aether.ai.vector_search import OptimizedVectorSearch, normalize_vector

@pytest.fixture
def vector_search():
    """Create vector search instance."""
    return OptimizedVectorSearch(dimension=768)

@pytest.fixture
def sample_vector():
    """Create sample vector."""
    return np.random.rand(768).astype(np.float32)

@pytest.fixture
def sample_documents():
    """Create sample documents."""
    return [
        'Document 1 about machine learning',
        'Document 2 about natural language processing',
        'Document 3 about computer vision'
    ]

@pytest.fixture
def sample_embeddings(sample_documents):
    """Create sample embeddings."""
    return np.random.rand(len(sample_documents), 768).astype(np.float32)

@pytest.mark.asyncio
async def test_cache_key_generation(vector_search, sample_vector):
    """Test cache key generation."""
    key1 = vector_search._get_cache_key(sample_vector, k=5, min_score=0.0)
    key2 = vector_search._get_cache_key(sample_vector, k=5, min_score=0.0)
    assert key1 == key2
    assert isinstance(key1, str)

@pytest.mark.asyncio
async def test_vector_normalization(vector_search, sample_vector):
    """Test vector normalization."""
    normalized = normalize_vector(sample_vector)
    assert np.allclose(np.linalg.norm(normalized), 1.0)

@pytest.mark.asyncio
async def test_invalid_input(vector_search):
    """Test handling of invalid input."""
    with pytest.raises(TypeError):
        invalid_vector = np.array([1, 2, 3])  # Wrong dimension
        await vector_search.search(invalid_vector)

@pytest.mark.asyncio
async def test_search_with_cache(vector_search, sample_vector, sample_documents, sample_embeddings):
    """Test search with cache."""
    # Add documents first
    await vector_search.add_documents(sample_documents, sample_embeddings)
    
    # First search
    results1 = await vector_search.search(sample_vector)
    assert len(results1) > 0
    
    # Second search should hit cache
    results2 = await vector_search.search(sample_vector)
    assert len(results2) > 0
    
    metrics = vector_search.get_metrics()
    assert metrics["cache_hits"] == 1

@pytest.mark.asyncio
async def test_add_documents(vector_search, sample_documents, sample_embeddings):
    """Test adding documents."""
    success = await vector_search.add_documents(sample_documents, sample_embeddings)
    assert success
    
    # Search should return results
    results = await vector_search.search(sample_embeddings[0])
    assert len(results) > 0

@pytest.mark.asyncio
async def test_search_results_format(vector_search, sample_documents, sample_embeddings, sample_vector):
    """Test search results format."""
    # Add documents and perform search
    await vector_search.add_documents(sample_documents, sample_embeddings)
    results = await vector_search.search(sample_vector)
    
    assert len(results) > 0
    for result in results:
        assert "document_id" in result.to_dict()
        assert "score" in result.to_dict()
        assert "metadata" in result.to_dict()
        assert isinstance(result.score, float)
        assert 0 <= result.score <= 1

@pytest.mark.asyncio
async def test_empty_index_search(vector_search, sample_vector):
    """Test search with empty index."""
    results = await vector_search.search(sample_vector)
    assert len(results) == 0

@pytest.mark.asyncio
async def test_search_with_k(vector_search, sample_documents, sample_embeddings, sample_vector):
    """Test search with different k values."""
    await vector_search.add_documents(sample_documents, sample_embeddings)
    
    # Test k=2
    results = await vector_search.search(sample_vector, k=2)
    assert len(results) == 2
    
    # Test k=1
    results = await vector_search.search(sample_vector, k=1)
    assert len(results) == 1

@pytest.mark.asyncio
async def test_search_metrics(vector_search, sample_documents, sample_embeddings, sample_vector):
    """Test search metrics."""
    # Initial metrics
    metrics = vector_search.get_metrics()
    assert metrics["total_queries"] == 0
    assert metrics["cache_hits"] == 0
    assert metrics["cache_hit_rate"] == 0
    
    # Add documents and perform searches
    await vector_search.add_documents(sample_documents, sample_embeddings)
    
    # First search
    await vector_search.search(sample_vector)
    metrics = vector_search.get_metrics()
    assert metrics["total_queries"] == 1
    assert metrics["cache_hits"] == 0
    
    # Second search (should hit cache)
    await vector_search.search(sample_vector)
    metrics = vector_search.get_metrics()
    assert metrics["total_queries"] == 2
    assert metrics["cache_hits"] == 1 