"""Tests for RAG system verification module."""

import pytest
import numpy as np
from rag_aether.ai.verification import (
    verify_embeddings,
    verify_retrieval,
    verify_rag_pipeline,
    VerificationResult
)

@pytest.fixture
def sample_embeddings():
    """Generate sample embeddings for testing."""
    vectors = np.random.rand(100, 384)  # 100 vectors of dimension 384
    # Normalize vectors
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    return vectors / norms

@pytest.fixture
def sample_query_results():
    """Generate sample query results for testing."""
    return [
        {
            "document": {"id": f"doc_{i}", "content": f"Content {i}"},
            "score": 0.8 - (i * 0.1),  # Decreasing scores
            "metadata": {"index": i}
        }
        for i in range(5)
    ]

@pytest.mark.unit
def test_verify_embeddings_success(sample_embeddings):
    """Test embedding verification with valid embeddings."""
    result = verify_embeddings(sample_embeddings)
    assert isinstance(result, VerificationResult)
    assert result.success
    assert 0.8 <= result.score <= 1.0
    assert "dimension" in result.details
    assert result.details["dimension"] == 384
    assert result.error is None
    # Check that vectors are normalized
    assert 0.99 <= result.details["avg_norm"] <= 1.01

@pytest.mark.unit
def test_verify_embeddings_invalid_shape():
    """Test embedding verification with invalid shape."""
    invalid_embeddings = np.random.rand(100)  # 1D array
    result = verify_embeddings(invalid_embeddings)
    assert not result.success
    assert result.score == 0.0
    assert result.error == "Invalid embedding shape"

@pytest.mark.unit
def test_verify_embeddings_null_vectors():
    """Test embedding verification with null vectors."""
    embeddings = np.zeros((10, 384))  # All zero vectors
    result = verify_embeddings(embeddings)
    assert not result.success
    assert result.score < 0.5
    assert result.details["null_vectors"] == 10

@pytest.mark.unit
def test_verify_retrieval_success(sample_query_results):
    """Test retrieval verification with valid results."""
    result = verify_retrieval(
        sample_query_results,
        query="test query",
        expected_results=["doc_0", "doc_1"]
    )
    assert result.success
    assert 0.0 <= result.score <= 1.0
    assert "precision" in result.details
    assert "recall" in result.details
    assert result.error is None

@pytest.mark.unit
def test_verify_retrieval_empty_results():
    """Test retrieval verification with empty results."""
    result = verify_retrieval([], query="test query")
    assert not result.success
    assert result.score == 0.0
    assert result.error == "No results returned"

@pytest.mark.unit
def test_verify_retrieval_invalid_scores(sample_query_results):
    """Test retrieval verification with invalid scores."""
    # Modify scores to be outside [-1, 1] range
    for r in sample_query_results:
        r["score"] = 2.0
    
    result = verify_retrieval(sample_query_results, query="test query")
    assert not result.success
    assert result.score == 0.0
    assert result.error == "Scores not normalized"

@pytest.mark.unit
def test_verify_rag_pipeline_success():
    """Test RAG pipeline verification with valid inputs."""
    query = "What is the capital of France?"
    response = "According to the provided context, Paris is the capital of France."
    context_docs = [
        {
            "content": "Paris is the capital and largest city of France.",
            "id": "doc1"
        }
    ]
    expected_answer = "The capital of France is Paris."
    
    result = verify_rag_pipeline(query, response, context_docs, expected_answer)
    assert result.success
    assert 0.5 <= result.score <= 1.0
    assert "response_length" in result.details
    assert "answer_similarity" in result.details
    assert result.error is None

@pytest.mark.unit
def test_verify_rag_pipeline_no_context_usage():
    """Test RAG pipeline verification when response doesn't use context."""
    query = "What is the capital of France?"
    response = "The capital of France is Berlin."  # Incorrect and not from context
    context_docs = [
        {
            "content": "Paris is the capital and largest city of France.",
            "id": "doc1"
        }
    ]
    
    result = verify_rag_pipeline(query, response, context_docs)
    assert not result.success
    assert result.score == 0.3
    assert result.error == "Response does not use provided context"

@pytest.mark.unit
def test_verify_rag_pipeline_without_expected_answer():
    """Test RAG pipeline verification without expected answer."""
    query = "What is the capital of France?"
    response = "Based on the context, Paris is the capital of France."
    context_docs = [
        {
            "content": "Paris is the capital and largest city of France.",
            "id": "doc1"
        }
    ]
    
    result = verify_rag_pipeline(query, response, context_docs)
    assert result.success
    assert result.score == 0.7  # Context is used
    assert "response_length" in result.details
    assert result.error is None 