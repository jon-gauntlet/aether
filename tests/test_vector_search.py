import pytest
import numpy as np
from rag_aether.ai.vector_search import OptimizedVectorSearch

@pytest.fixture
def vector_search():
    search = OptimizedVectorSearch()
    return search  # LRUCache is already in-memory only

@pytest.fixture
def sample_vector():
    return np.random.rand(768)  # Standard BERT embedding size

@pytest.fixture
def sample_documents():
    return [
        "Document 1 about machine learning",
        "Document 2 about natural language processing",
        "Document 3 about computer vision"
    ]

def test_cache_key_generation(vector_search, sample_vector):
    key = vector_search._generate_cache_key(sample_vector)
    assert isinstance(key, str)
    assert key.startswith("vec:")

def test_vector_normalization(vector_search, sample_vector):
    results = vector_search._perform_optimized_search(sample_vector, k=5)
    assert isinstance(results, list)

def test_invalid_input(vector_search):
    with pytest.raises(TypeError):
        vector_search.search([1, 2, 3])  # Not a numpy array

def test_search_with_cache(vector_search, sample_vector, sample_documents):
    # Add documents first
    vector_search.add_documents(sample_documents)
    
    # First search should cache
    first_results = vector_search.search(sample_vector)
    assert isinstance(first_results, list)
    
    # Second search should hit cache
    second_results = vector_search.search(sample_vector)
    assert first_results == second_results
    
    # Verify cache hit was recorded
    metrics = vector_search.get_metrics()
    assert metrics["cache_hits"] == 1
    assert metrics["total_queries"] == 2
    assert metrics["cache_hit_ratio"] == 0.5

def test_add_documents(vector_search, sample_documents):
    # Add documents without vectors
    vector_search.add_documents(sample_documents)
    assert len(vector_search.documents) == len(sample_documents)
    assert vector_search.document_vectors.shape[0] == len(sample_documents)
    
    # Add documents with vectors
    vectors = np.random.rand(2, 768)
    vector_search.add_documents(["Doc 4", "Doc 5"], vectors)
    assert len(vector_search.documents) == len(sample_documents) + 2
    assert vector_search.document_vectors.shape[0] == len(sample_documents) + 2
    
    # Verify metrics
    metrics = vector_search.get_metrics()
    assert metrics["index_size"] == len(sample_documents) + 2
    assert metrics["vector_dimension"] == 768

def test_search_results_format(vector_search, sample_documents, sample_vector):
    # Add documents and perform search
    vector_search.add_documents(sample_documents)
    results = vector_search.search(sample_vector, k=2)
    
    assert len(results) == 2
    for result in results:
        assert "document" in result
        assert "score" in result
        assert "metadata" in result
        assert isinstance(result["score"], float)
        assert 0 <= result["score"] <= 1  # Cosine similarity range
    
    # Verify search metrics
    metrics = vector_search.get_metrics()
    assert metrics["total_queries"] == 1
    assert metrics["last_search_time"] > 0
    assert metrics["avg_search_time"] > 0

def test_empty_index_search(vector_search, sample_vector):
    results = vector_search.search(sample_vector)
    assert len(results) == 0
    
    # Verify metrics for empty search
    metrics = vector_search.get_metrics()
    assert metrics["total_queries"] == 1
    assert metrics["index_size"] == 0

def test_search_with_k(vector_search, sample_documents, sample_vector):
    vector_search.add_documents(sample_documents)
    
    # Test different k values
    k_values = [1, 2, len(sample_documents)]
    for k in k_values:
        results = vector_search.search(sample_vector, k=k)
        assert len(results) == k
        
    # Test k larger than number of documents
    results = vector_search.search(sample_vector, k=len(sample_documents) + 1)
    assert len(results) == len(sample_documents)
    
    # Verify metrics after multiple searches
    metrics = vector_search.get_metrics()
    assert metrics["total_queries"] == len(k_values) + 1
    assert metrics["avg_search_time"] > 0

def test_search_metrics(vector_search, sample_documents, sample_vector):
    # Initial metrics
    metrics = vector_search.get_metrics()
    assert metrics["total_queries"] == 0
    assert metrics["cache_hits"] == 0
    assert metrics["cache_hit_ratio"] == 0
    
    # Add documents and perform searches
    vector_search.add_documents(sample_documents)
    
    # First search
    vector_search.search(sample_vector)
    metrics = vector_search.get_metrics()
    assert metrics["total_queries"] == 1
    assert metrics["cache_hits"] == 0
    assert metrics["last_search_time"] > 0
    
    # Cached search
    vector_search.search(sample_vector)
    metrics = vector_search.get_metrics()
    assert metrics["total_queries"] == 2
    assert metrics["cache_hits"] == 1
    assert metrics["cache_hit_ratio"] == 0.5
    
    # Verify index metrics
    assert metrics["index_size"] == len(sample_documents)
    assert metrics["vector_dimension"] == 768
    assert metrics["cache_enabled"] is True
    assert isinstance(metrics["index_config"], dict) 