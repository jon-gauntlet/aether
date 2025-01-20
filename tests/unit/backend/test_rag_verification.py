import pytest
from rag_aether.ai.verification import VerificationResult, verify_embeddings, verify_retrieval, verify_rag_pipeline
import logging

@pytest.fixture
def setup_logging():
    logging.basicConfig(level=logging.INFO)
    yield
    logging.getLogger().setLevel(logging.WARNING)

def test_verification_result():
    result = VerificationResult(passed=True, metrics={"test": 1.0})
    assert result.passed
    assert result.metrics["test"] == 1.0
    assert result.errors is None

def test_verify_embeddings():
    result = verify_embeddings()
    assert isinstance(result, VerificationResult)
    assert "dimension_consistency" in result.metrics
    assert "norm_distribution" in result.metrics
    assert "null_vectors" in result.metrics

def test_verify_retrieval():
    result = verify_retrieval()
    assert isinstance(result, VerificationResult)
    assert "precision_at_k" in result.metrics
    assert "recall_at_k" in result.metrics
    assert "mean_reciprocal_rank" in result.metrics

def test_verify_rag_pipeline(setup_logging):
    result = verify_rag_pipeline()
    assert isinstance(result, bool) 