"""Tests for optimized vector search."""

import pytest
import numpy as np
from rag_aether.ai.vector_search import OptimizedVectorSearch

@pytest.fixture
def vector_search():
    """Create vector search instance for testing."""
    return OptimizedVectorSearch(dimension=384, batch_size=32)

@pytest.fixture
def sample_vectors():
    """Generate sample vectors for testing."""
    return np.random.rand(100, 384)

@pytest.fixture
def sample_documents():
    """Generate sample documents for testing."""
    return [f"Document {i}" for i in range(100)]

@pytest.mark.unit
def test_initialization(vector_search):
    """Test vector search initialization."""
    assert vector_search.dimension == 384
    assert vector_search.batch_size == 32
    assert vector_search.documents == []
    assert vector_search.document_vectors is None
    assert vector_search.index is not None

@pytest.mark.unit
def test_add_documents(vector_search, sample_documents, sample_vectors):
    """Test adding documents to the index."""
    vector_search.add_documents(sample_documents, sample_vectors)
    assert len(vector_search.documents) == 100
    assert vector_search.document_vectors.shape == (100, 384)

@pytest.mark.unit
def test_add_documents_without_vectors(vector_search, sample_documents):
    """Test adding documents without providing vectors."""
    vector_search.add_documents(sample_documents)
    assert len(vector_search.documents) == 100
    assert vector_search.document_vectors.shape == (100, 384)

@pytest.mark.unit
def test_search(vector_search, sample_documents, sample_vectors):
    """Test search functionality."""
    vector_search.add_documents(sample_documents, sample_vectors)
    query = np.random.rand(384)
    results = vector_search.search(query, k=5)
    
    assert len(results) == 5
    for result in results:
        assert "document" in result
        assert "score" in result
        assert "metadata" in result
        assert isinstance(result["score"], float)
        assert -1.0 <= result["score"] <= 1.0

@pytest.mark.unit
def test_batch_search(vector_search, sample_documents, sample_vectors):
    """Test batch search functionality."""
    vector_search.add_documents(sample_documents, sample_vectors)
    queries = np.random.rand(10, 384)
    results = vector_search.batch_search(queries, k=5)
    
    assert len(results) == 10
    for batch_result in results:
        assert len(batch_result) == 5
        for result in batch_result:
            assert "document" in result
            assert "score" in result
            assert "metadata" in result

@pytest.mark.unit
def test_cache_hit(vector_search, sample_documents, sample_vectors):
    """Test cache functionality."""
    vector_search.add_documents(sample_documents, sample_vectors)
    query = np.random.rand(384)
    
    results1 = vector_search.search(query)
    metrics1 = vector_search.get_metrics()
    
    results2 = vector_search.search(query)
    metrics2 = vector_search.get_metrics()
    
    assert results1 == results2
    assert metrics2["cache_hits"] > metrics1["cache_hits"]

@pytest.mark.unit
def test_empty_search(vector_search):
    """Test search with empty index."""
    query = np.random.rand(384)
    results = vector_search.search(query)
    assert len(results) == 0

@pytest.mark.unit
def test_invalid_query(vector_search, sample_documents, sample_vectors):
    """Test search with invalid query."""
    vector_search.add_documents(sample_documents, sample_vectors)
    with pytest.raises(TypeError):
        vector_search.search([1, 2, 3])

@pytest.mark.unit
def test_metrics(vector_search, sample_documents, sample_vectors):
    """Test metrics tracking."""
    vector_search.add_documents(sample_documents, sample_vectors)
    query = np.random.rand(384)
    vector_search.search(query)
    metrics = vector_search.get_metrics()
    
    assert "total_queries" in metrics
    assert "cache_hits" in metrics
    assert "cache_hit_ratio" in metrics
    assert "avg_search_time" in metrics
    assert "last_search_time" in metrics
    assert "index_size" in metrics
    assert "vector_dimension" in metrics
    assert "batch_size" in metrics
    assert "gpu_enabled" in metrics

@pytest.mark.performance
def test_large_batch_search(vector_search):
    """Test search with large batch of documents."""
    num_docs = 1000
    docs = [f"Document {i}" for i in range(num_docs)]
    vecs = np.random.rand(num_docs, 384)
    
    vector_search.add_documents(docs, vecs)
    assert len(vector_search.documents) == num_docs
    assert vector_search.document_vectors.shape == (num_docs, 384)
    
    queries = np.random.rand(50, 384)
    results = vector_search.batch_search(queries, k=10)
    
    assert len(results) == 50
    for batch_result in results:
        assert len(batch_result) == 10

@pytest.mark.gpu
def test_gpu_search_performance(vector_search):
    """Test search performance with GPU if available."""
    if not vector_search.get_metrics()["gpu_enabled"]:
        pytest.skip("GPU not available")
        
    # Generate large test dataset
    num_docs = 10000
    docs = [f"Document {i}" for i in range(num_docs)]
    vecs = np.random.rand(num_docs, 384)
    
    # Add documents
    vector_search.add_documents(docs, vecs)
    
    # Run batch search
    queries = np.random.rand(100, 384)
    results = vector_search.batch_search(queries, k=10)
    
    # Check performance metrics
    metrics = vector_search.get_metrics()
    assert metrics["avg_search_time"] < 0.1  # Expected GPU performance
    assert len(results) == 100 