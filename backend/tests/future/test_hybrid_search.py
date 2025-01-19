"""Tests for hybrid search functionality."""

import pytest
import numpy as np
from typing import List, Dict, Any
from rag_aether.ai.hybrid_search import HybridRetriever
from rag_aether.data.document import Document

@pytest.fixture
def sample_docs() -> List[Document]:
    """Sample documents for testing."""
    return [
        Document(
            content="The quick brown fox jumps over the lazy dog",
            metadata={"id": 1}
        ),
        Document(
            content="A quick brown dog jumps over the lazy fox",
            metadata={"id": 2}
        ),
        Document(
            content="The lazy fox sleeps while the quick brown dog watches",
            metadata={"id": 3}
        )
    ]

@pytest.fixture
def hybrid_retriever() -> HybridRetriever:
    """Create a hybrid retriever instance."""
    return HybridRetriever(
        model_name="sentence-transformers/all-MiniLM-L6-v2",
        dense_weight=0.7,
        use_gpu=False
    )

@pytest.mark.unit
def test_index_documents(hybrid_retriever: HybridRetriever, sample_docs: List[Document]):
    """Test indexing documents."""
    hybrid_retriever.index_documents(sample_docs)
    assert len(hybrid_retriever.documents) == len(sample_docs)
    assert hybrid_retriever.index is not None

@pytest.mark.unit
def test_search_empty_index(hybrid_retriever: HybridRetriever):
    """Test searching with no indexed documents."""
    results = hybrid_retriever.search("test query")
    assert len(results) == 0

@pytest.mark.unit
def test_search_with_documents(hybrid_retriever: HybridRetriever, sample_docs: List[Document]):
    """Test searching with indexed documents."""
    hybrid_retriever.index_documents(sample_docs)
    query = "quick brown fox"
    results = hybrid_retriever.search(query)
    
    assert len(results) > 0
    assert all(0 <= result.score <= 1.0 for result in results)
    assert results[0].score >= results[-1].score  # Check sorting

@pytest.mark.unit
def test_dense_search(hybrid_retriever: HybridRetriever, sample_docs: List[Document]):
    """Test dense search component."""
    hybrid_retriever.index_documents(sample_docs)
    query = "quick brown fox"
    results = hybrid_retriever._dense_search(query)
    
    assert len(results) > 0
    assert all(0 <= score <= 1.0 for _, score in results)

@pytest.mark.unit
def test_sparse_search(hybrid_retriever: HybridRetriever, sample_docs: List[Document]):
    """Test sparse search component."""
    hybrid_retriever.index_documents(sample_docs)
    query = "quick brown fox"
    results = hybrid_retriever._sparse_search(query)
    
    assert len(results) > 0
    assert all(0 <= score <= 1.0 for _, score in results)

@pytest.mark.unit
def test_invalid_sparse_weight():
    """Test invalid sparse weight."""
    with pytest.raises(ValueError):
        HybridRetriever(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            dense_weight=1.5
        )

@pytest.mark.unit
def test_invalid_k_values():
    """Test invalid k values."""
    retriever = HybridRetriever(
        model_name="sentence-transformers/all-MiniLM-L6-v2",
        dense_weight=0.7
    )
    with pytest.raises(ValueError):
        retriever.search("test", k=0) 