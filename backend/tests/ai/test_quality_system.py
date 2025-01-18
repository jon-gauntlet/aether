"""Tests for RAG quality system."""
from typing import List, Dict, Any
import pytest
from hypothesis import given, settings, strategies as st
import numpy as np
import torch

from rag_aether.ai.quality_system import QualitySystem, QualityMetrics, QualityFeedback
from tests.rag_aether.test_utils import (
    text_content_strategy,
    assert_results_ordered,
    measure_performance
)

@pytest.fixture
def quality_system():
    """Fixture for quality system."""
    return QualitySystem()

@pytest.fixture
def sample_response():
    """Fixture for sample response."""
    return (
        "Machine learning is a subset of artificial intelligence. "
        "It uses statistical techniques to enable computers to learn from data. "
        "Neural networks are a popular machine learning approach. "
        "They are inspired by biological neurons in the brain."
    )

@pytest.fixture
def sample_query():
    """Fixture for sample query."""
    return "What is machine learning and how does it work?"

@pytest.fixture
def sample_context():
    """Fixture for sample context."""
    return (
        "Machine learning is a field of artificial intelligence. "
        "It involves using algorithms to parse data, learn from it, "
        "and make informed decisions. Neural networks are one type "
        "of machine learning model that simulate brain function."
    )

def test_basic_quality_evaluation(
    quality_system,
    sample_query,
    sample_response,
    sample_context
):
    """Test basic quality evaluation functionality."""
    metrics = quality_system.evaluate_response(
        query=sample_query,
        response=sample_response,
        context=sample_context
    )
    
    # Check metric ranges
    assert 0 <= metrics.relevance_score <= 1
    assert 0 <= metrics.coherence_score <= 1
    assert 0 <= metrics.factuality_score <= 1
    assert 0 <= metrics.context_adherence <= 1
    assert 0 <= metrics.overall_score <= 1
    
    # Check metadata
    assert metrics.metadata["query"] == sample_query
    assert metrics.metadata["context_length"] == len(sample_context)
    assert metrics.metadata["response_length"] == len(sample_response)

def test_quality_feedback(
    quality_system,
    sample_query,
    sample_response,
    sample_context
):
    """Test quality feedback generation."""
    metrics = quality_system.evaluate_response(
        query=sample_query,
        response=sample_response,
        context=sample_context
    )
    
    feedback = quality_system.generate_feedback(
        metrics=metrics,
        response=sample_response,
        context=sample_context
    )
    
    # Check feedback structure
    assert isinstance(feedback.suggestions, list)
    assert isinstance(feedback.improvements, dict)
    assert 0 <= feedback.priority <= 1
    
    # Check improvements content
    if metrics.relevance_score < quality_system.quality_threshold:
        assert "relevance" in feedback.improvements
        
    if metrics.coherence_score < quality_system.quality_threshold:
        assert "coherence" in feedback.improvements
        
    if metrics.factuality_score < quality_system.quality_threshold:
        assert "factuality" in feedback.improvements
        
    if metrics.context_adherence < quality_system.quality_threshold:
        assert "context" in feedback.improvements

@given(
    query=text_content_strategy(),
    response=text_content_strategy(),
    context=text_content_strategy()
)
@settings(max_examples=100)
def test_quality_properties(quality_system, query, response, context):
    """Test quality evaluation properties."""
    metrics = quality_system.evaluate_response(
        query=query,
        response=response,
        context=context
    )
    
    # Property 1: Scores should be normalized
    assert all(
        0 <= score <= 1
        for score in [
            metrics.relevance_score,
            metrics.coherence_score,
            metrics.factuality_score,
            metrics.context_adherence,
            metrics.overall_score
        ]
    )
    
    # Property 2: Overall score should be weighted average
    expected_overall = sum(
        score * weight
        for score, weight in [
            (metrics.relevance_score, quality_system.quality_weights["relevance"]),
            (metrics.coherence_score, quality_system.quality_weights["coherence"]),
            (metrics.factuality_score, quality_system.quality_weights["factuality"]),
            (metrics.context_adherence, quality_system.quality_weights["context_adherence"])
        ]
    )
    assert abs(metrics.overall_score - expected_overall) < 1e-6
    
    # Property 3: Feedback priority should correlate with scores
    feedback = quality_system.generate_feedback(metrics, response, context)
    if metrics.overall_score < quality_system.quality_threshold:
        assert feedback.priority > 0
    else:
        assert feedback.priority == 0

def test_relevance_evaluation(quality_system):
    """Test relevance score calculation."""
    # Test exact match
    query = "What is machine learning?"
    response = "Machine learning is a field of AI that enables computers to learn."
    score = quality_system._evaluate_relevance(query, response)
    assert score > 0.7  # High relevance expected
    
    # Test irrelevant response
    response = "The weather is nice today."
    score = quality_system._evaluate_relevance(query, response)
    assert score < 0.3  # Low relevance expected

def test_coherence_evaluation(quality_system):
    """Test coherence score calculation."""
    # Test coherent text
    response = (
        "Machine learning is powerful. It enables computers to learn "
        "from data. This learning process improves over time."
    )
    score = quality_system._evaluate_coherence(response)
    assert score > 0.7  # High coherence expected
    
    # Test incoherent text
    response = (
        "Machine learning computers. Weather is sunny today. "
        "Bananas are yellow fruit. Cars drive fast."
    )
    score = quality_system._evaluate_coherence(response)
    assert score < 0.5  # Low coherence expected

def test_factuality_evaluation(quality_system):
    """Test factuality score calculation."""
    context = (
        "Machine learning uses statistical techniques. "
        "It enables computers to learn from data. "
        "Neural networks are inspired by the brain."
    )
    
    # Test factual response
    response = (
        "Machine learning uses statistics to enable "
        "computer learning. Neural networks are brain-inspired."
    )
    score = quality_system._evaluate_factuality(response, context)
    assert score > 0.7  # High factuality expected
    
    # Test response with unsupported claims
    response = (
        "Machine learning was invented in 2020. "
        "It requires quantum computers to work."
    )
    score = quality_system._evaluate_factuality(response, context)
    assert score < 0.3  # Low factuality expected

def test_context_adherence(quality_system):
    """Test context adherence evaluation."""
    context = (
        "Deep learning is a subset of machine learning "
        "that uses neural networks with multiple layers."
    )
    
    # Test high adherence
    response = (
        "Deep learning uses multi-layer neural networks "
        "as a machine learning approach."
    )
    score = quality_system._evaluate_context_adherence(response, context)
    assert score > 0.7  # High adherence expected
    
    # Test low adherence
    response = (
        "Machine learning is used in many applications "
        "like image recognition and natural language processing."
    )
    score = quality_system._evaluate_context_adherence(response, context)
    assert score < 0.5  # Low adherence expected

def test_improvement_suggestions(quality_system):
    """Test improvement suggestion generation."""
    query = "What is deep learning?"
    response = "Deep learning uses neural networks."
    context = (
        "Deep learning is an advanced machine learning technique "
        "that uses multi-layer neural networks. These networks "
        "can automatically learn hierarchical representations."
    )
    
    metrics = quality_system.evaluate_response(query, response, context)
    feedback = quality_system.generate_feedback(metrics, response, context)
    
    # Check relevance improvements
    if "relevance" in feedback.improvements:
        relevance_impr = feedback.improvements["relevance"]
        assert "focus_areas" in relevance_impr
        assert "query_aspects" in relevance_impr
        assert "suggested_additions" in relevance_impr
        
    # Check coherence improvements
    if "coherence" in feedback.improvements:
        coherence_impr = feedback.improvements["coherence"]
        assert "structure" in coherence_impr
        assert "transitions" in coherence_impr
        assert "flow" in coherence_impr
        
    # Check factuality improvements
    if "factuality" in feedback.improvements:
        factuality_impr = feedback.improvements["factuality"]
        assert "unsupported_claims" in factuality_impr
        assert "missing_context" in factuality_impr
        assert "verification_needed" in factuality_impr

def test_performance(quality_system):
    """Test performance characteristics."""
    query = "What is machine learning?"
    response = "Machine learning is a type of artificial intelligence."
    context = (
        "Machine learning is a field of AI that enables "
        "systems to learn from data."
    )
    
    # Measure evaluation performance
    eval_metrics = measure_performance(
        quality_system.evaluate_response,
        query=query,
        response=response,
        context=context
    )
    
    # Property 1: Evaluation should be reasonably fast
    assert eval_metrics.latency < 1.0, "Evaluation too slow"
    
    # Property 2: Memory usage should be bounded
    assert eval_metrics.memory_usage < 1e9, "Memory usage too high" 