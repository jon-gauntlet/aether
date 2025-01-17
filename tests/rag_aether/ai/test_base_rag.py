"""Tests for base RAG functionality."""

import pytest
import numpy as np
from unittest.mock import patch
from rag_aether.ai.rag import BaseRAG

@pytest.fixture
def sample_texts():
    """Sample texts for testing."""
    return [
        "Machine learning is a subset of artificial intelligence.",
        "Natural language processing deals with text and speech.",
        "Deep learning uses neural networks for pattern recognition.",
        "Computer vision focuses on image and video analysis.",
        "Reinforcement learning involves agents and environments."
    ]

@pytest.fixture
def sample_metadata():
    """Sample metadata for testing."""
    return [
        {"author": "alice", "type": "technical", "timestamp": 1001},
        {"author": "bob", "type": "tutorial", "timestamp": 1002},
        {"author": "alice", "type": "technical", "timestamp": 1003},
        {"author": "charlie", "type": "blog", "timestamp": 1004},
        {"author": "alice", "type": "technical", "timestamp": 1005}
    ]

@pytest.fixture
async def base_rag(mock_embedding_model):
    """Create a BaseRAG instance for testing."""
    with patch('rag_aether.ai.rag.SentenceTransformer', return_value=mock_embedding_model):
        rag = BaseRAG()
        yield rag

def assert_results_ordered(scores):
    """Helper to verify results are ordered by score."""
    assert all(scores[i] >= scores[i+1] for i in range(len(scores)-1))

@pytest.mark.asyncio
async def test_encode_texts_batch(base_rag, sample_texts):
    """Test batch encoding of texts."""
    # Test encoding
    embeddings = await base_rag._encode_texts_batch(sample_texts)
    
    # Verify shape
    assert embeddings.shape == (len(sample_texts), base_rag.embedding_model.dimension)
    
    # Verify normalization
    norms = np.linalg.norm(embeddings, axis=1)
    np.testing.assert_allclose(norms, 1.0, rtol=1e-5)
    
    # Verify caching
    cached_embeddings = await base_rag._encode_texts_batch(sample_texts)
    np.testing.assert_array_equal(embeddings, cached_embeddings)

@pytest.mark.asyncio
async def test_ingest_text(base_rag, sample_texts, sample_metadata):
    """Test text ingestion."""
    # Ingest texts with metadata
    for text, metadata in zip(sample_texts, sample_metadata):
        await base_rag.ingest_text(text, metadata)
        
    # Verify metadata storage
    assert len(base_rag.metadata) == len(sample_texts)
    for i, expected_metadata in enumerate(sample_metadata):
        assert base_rag.metadata[i] == expected_metadata
        
    # Verify index size
    assert base_rag.index.ntotal == len(sample_texts)

@pytest.mark.asyncio
async def test_retrieve_with_fusion(base_rag, sample_texts, sample_metadata):
    """Test retrieval with fusion."""
    # Ingest sample data
    for text, metadata in zip(sample_texts, sample_metadata):
        await base_rag.ingest_text(text, metadata)
        
    # Test basic retrieval
    query = "machine learning and AI"
    k = 2
    texts, metadata, metrics = await base_rag.retrieve_with_fusion(query, k)
    
    # Verify result counts
    assert len(texts) == k
    assert len(metadata) == k
    
    # Verify metrics
    assert "retrieval_time_ms" in metrics
    assert "num_results" in metrics
    assert "similarity_scores" in metrics
    assert metrics["num_results"] == k
    assert len(metrics["similarity_scores"]) == k
    
    # Verify ordering
    assert_results_ordered(metrics["similarity_scores"])

@pytest.mark.asyncio
async def test_retrieve_with_metadata_filters(base_rag, sample_texts, sample_metadata):
    """Test retrieval with metadata filtering."""
    # Ingest sample data
    for text, metadata in zip(sample_texts, sample_metadata):
        await base_rag.ingest_text(text, metadata)
        
    # Test filtering by author
    query = "machine learning"
    metadata_filters = {"author": "alice"}
    texts, metadata, metrics = await base_rag.retrieve_with_fusion(
        query, k=2, metadata_filters=metadata_filters
    )
    
    # Verify filtered results
    assert all(meta["author"] == "alice" for meta in metadata)
    
    # Test filtering by type
    metadata_filters = {"type": "technical"}
    texts, metadata, metrics = await base_rag.retrieve_with_fusion(
        query, k=3, metadata_filters=metadata_filters
    )
    
    # Verify filtered results
    assert all(meta["type"] == "technical" for meta in metadata)
    
    # Test filtering with timestamp range
    metadata_filters = {
        "timestamp": {"min": 1001, "max": 1002}
    }
    texts, metadata, metrics = await base_rag.retrieve_with_fusion(
        query, k=2, metadata_filters=metadata_filters
    )
    
    # Verify filtered results
    assert all(1001 <= meta["timestamp"] <= 1002 for meta in metadata) 