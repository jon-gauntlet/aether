"""Tests for query expansion module."""

import pytest
from unittest.mock import Mock, patch, PropertyMock
import asyncio
import torch
from typing import Dict, Any

from rag_aether.ai.query_expansion import (
    QueryExpander,
    QueryProcessor,
    get_flow_context,
    QueryExpansionError,
    QueryProcessingError
)

@pytest.fixture
async def mock_t5_tokenizer():
    """Mock T5Tokenizer for testing."""
    with patch('transformers.T5Tokenizer') as mock:
        tokenizer = Mock()
        tokenizer.decode = Mock(side_effect=lambda x, skip_special_tokens: f"expanded_{x}")
        mock.from_pretrained.return_value = tokenizer
        yield mock

@pytest.fixture
async def mock_t5_model():
    """Mock T5ForConditionalGeneration for testing."""
    with patch('transformers.T5ForConditionalGeneration') as mock:
        model = Mock()
        model.generate = Mock(return_value=torch.tensor([[1], [2], [3]]))
        mock.from_pretrained.return_value = model
        yield mock

@pytest.fixture
async def query_processor():
    """Create a QueryProcessor instance for testing."""
    return QueryProcessor()

@pytest.fixture
async def expander(mock_t5_tokenizer, mock_t5_model):
    """Create a QueryExpander instance for testing."""
    expander = QueryExpander(
        model_name="t5-small",
        cache_size=1000
    )
    return expander

@pytest.mark.asyncio
async def test_query_expansion_core_functionality(expander):
    """Test core query expansion functionality."""
    query = "test query"
    result = await expander.expand_query(query)
    
    assert isinstance(result, dict)
    assert result["original_query"] == query
    assert isinstance(result["expanded_queries"], list)
    assert len(result["expanded_queries"]) > 0
    assert isinstance(result["context"], dict)
    assert isinstance(result["metadata"], dict)

@pytest.mark.asyncio
async def test_query_expansion_error_handling(expander):
    """Test error handling and edge cases."""
    with pytest.raises(QueryExpansionError):
        await expander.expand_query("")
    
    with pytest.raises(QueryProcessingError):
        await expander.expand_query("a" * 1000)

@pytest.mark.asyncio
async def test_batch_and_concurrent_processing(expander):
    """Test batch and concurrent query processing."""
    queries = ["query1", "query2", "query3"]
    results = await expander.expand_queries(queries)
    
    assert len(results) == len(queries)
    assert all(isinstance(r, dict) for r in results)
    assert all("original_query" in r for r in results)
    assert all("expanded_queries" in r for r in results)
    assert all(len(r["expanded_queries"]) > 0 for r in results)

@pytest.mark.asyncio
async def test_caching_behavior(expander):
    """Test query expansion caching."""
    query = "test caching"
    initial_count = expander.generate_count
    
    # First call should hit the model
    result1 = await expander.expand_query(query)
    assert expander.generate_count == initial_count + 1
    
    # Second call should use cache
    result2 = await expander.expand_query(query)
    assert expander.generate_count == initial_count + 1  # Count shouldn't increase
    
    assert result1 == result2

@pytest.mark.asyncio
async def test_context_handling(expander):
    """Test query expansion with context."""
    query = "test query"
    context = {"domain": "testing"}
    metadata = {"source": "test"}
    
    result = await expander.expand_query(query, context=str(context), metadata=metadata)
    
    assert result["original_query"] == query
    assert result["context"] == context
    assert result["metadata"] == metadata

def test_flow_context_extraction():
    """Test flow context extraction functionality."""
    query = "What are the performance patterns during flow states?"
    context = get_flow_context(query)
    
    assert isinstance(context, dict)
    assert context["has_flow_terms"] is True
    assert "performance" in context["flow_context"]
    assert "state" in context["flow_context"]
    assert "patterns" in context["flow_context"]
    assert "flow" in context["flow_context"]["state"]
    assert "pattern" in context["flow_context"]["patterns"]

@pytest.mark.asyncio
async def test_query_processor_validation(query_processor):
    """Test query processor validation."""
    # Valid query
    processed = await query_processor.process("valid query")
    assert processed == "valid query"
    
    # Too short
    with pytest.raises(QueryProcessingError):
        await query_processor.process("a")
    
    # Too long
    with pytest.raises(QueryProcessingError):
        await query_processor.process("a" * 1000)
    
    # Empty
    with pytest.raises(QueryProcessingError):
        await query_processor.process("")

@pytest.mark.asyncio
async def test_query_processor_batch(query_processor):
    """Test query processor batch processing."""
    queries = ["query1", "query2", "query3"]
    processed = await query_processor.process_batch(queries)
    
    assert len(processed) == len(queries)
    assert all(isinstance(p, str) for p in processed)
    
    with pytest.raises(QueryProcessingError):
        await query_processor.process_batch([])

@pytest.mark.asyncio
async def test_similar_query_filtering(expander):
    """Test filtering of similar expanded queries."""
    variations = [
        "test query",
        "test query rephrased",
        "test query",  # Duplicate
        "completely different query"
    ]
    
    filtered = expander._filter_similar(variations)
    assert len(filtered) < len(variations)
    assert "test query" in filtered
    assert "completely different query" in filtered 