"""Tests for hybrid search functionality."""

import pytest
import numpy as np
from typing import List, Dict, Any
from rag_aether.ai.hybrid_search import HybridRetriever

@pytest.fixture
def sample_docs() -> List[Dict[str, Any]]:
    """Sample documents for testing."""
    return [
        {"text": "The quick brown fox jumps over the lazy dog", "id": 1},
        {"text": "A quick brown dog jumps over the lazy fox", "id": 2},
        {"text": "The lazy fox sleeps while the quick brown dog watches", "id": 3}
    ]

@pytest.fixture
def hybrid_retriever() -> HybridRetriever:
    """Create a hybrid retriever instance."""
    return HybridRetriever(
        encoder_model="sentence-transformers/all-MiniLM-L6-v2",
        sparse_weight=0.3,
        k_dense=3,
        k_sparse=3,
        nlist=4,
        nprobe=2
    )

def test_index_documents(hybrid_retriever: HybridRetriever, sample_docs: List[Dict[str, Any]]):
    """Test indexing documents."""
    hybrid_retriever.index_documents(sample_docs)
    assert len(hybrid_retriever.documents) == len(sample_docs)
    assert hybrid_retriever.index is not None

def test_search_empty_index(hybrid_retriever: HybridRetriever):
    """Test searching with no indexed documents."""
    results = hybrid_retriever.search("test query")
    assert len(results) == 0

def test_search_with_documents(hybrid_retriever: HybridRetriever, sample_docs: List[Dict[str, Any]]):
    """Test searching with indexed documents."""
    hybrid_retriever.index_documents(sample_docs)
    query = "quick brown fox"
    results = hybrid_retriever.search(query)
    
    assert len(results) > 0
    assert all(0 <= result.score <= 1.0 for result in results)
    assert results[0].score >= results[-1].score  # Check sorting

def test_dense_search(hybrid_retriever: HybridRetriever, sample_docs: List[Dict[str, Any]]):
    """Test dense search component."""
    hybrid_retriever.index_documents(sample_docs)
    query = "quick brown fox"
    results = hybrid_retriever._dense_search(query)
    
    assert len(results) > 0
    assert all(0 <= score <= 1.0 for _, score in results)

def test_sparse_search(hybrid_retriever: HybridRetriever, sample_docs: List[Dict[str, Any]]):
    """Test sparse search component."""
    hybrid_retriever.index_documents(sample_docs)
    query = "quick brown fox"
    results = hybrid_retriever._sparse_search(query)
    
    assert len(results) > 0
    assert all(0 <= score <= 1.0 for _, score in results)

def test_invalid_sparse_weight():
    """Test initialization with invalid sparse weight."""
    with pytest.raises(ValueError):
        HybridRetriever(
            encoder_model="sentence-transformers/all-MiniLM-L6-v2",
            sparse_weight=1.5  # Invalid weight > 1
        )

def test_invalid_k_values():
    """Test initialization with invalid k values."""
    with pytest.raises(ValueError):
        HybridRetriever(
            encoder_model="sentence-transformers/all-MiniLM-L6-v2",
            k_dense=0  # Invalid k_dense
        )
    
    with pytest.raises(ValueError):
        HybridRetriever(
            encoder_model="sentence-transformers/all-MiniLM-L6-v2",
            k_sparse=0  # Invalid k_sparse
        ) 