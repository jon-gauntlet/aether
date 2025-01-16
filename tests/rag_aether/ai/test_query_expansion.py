"""Tests for query expansion module."""

import pytest
from unittest.mock import Mock, patch
import asyncio
import torch
from typing import Dict, Any

from rag_aether.ai.query_expansion import (
    QueryExpander,
    QueryProcessor,
    get_flow_context,
    expand_query
)

@pytest.fixture
async def mock_t5_tokenizer():
    """Mock T5Tokenizer for testing."""
    with patch('transformers.T5Tokenizer') as mock:
        mock.from_pretrained.return_value = Mock()
        mock.return_value.decode = Mock(side_effect=lambda x, skip_special_tokens: f"variation_{x}")
        yield mock

@pytest.fixture
async def mock_t5_model():
    """Mock T5ForConditionalGeneration for testing."""
    with patch('transformers.T5ForConditionalGeneration') as mock:
        model = Mock()
        model.generate.return_value = torch.tensor([[1], [2], [3]])
        mock.from_pretrained.return_value = model
        yield mock

@pytest.fixture
async def query_processor():
    """Create a QueryProcessor instance for testing."""
    return QueryProcessor()

@pytest.fixture
async def expander():
    """Create a QueryExpander instance for testing."""
    with patch("transformers.T5Tokenizer") as mock_tokenizer, \
         patch("transformers.T5ForConditionalGeneration") as mock_model:
        
        tokenizer = Mock()
        tokenizer.decode = Mock(side_effect=lambda x, skip_special_tokens: f"variation_{x}")
        mock_tokenizer.from_pretrained.return_value = tokenizer
        
        model = Mock()
        model.generate.return_value = torch.tensor([[1], [2], [3]])
        mock_model.from_pretrained.return_value = model
        
        expander = QueryExpander(
            model_name="t5-small",
            cache_size=1000
        )
        yield expander

@pytest.mark.asyncio
async def test_query_expansion_core_functionality(expander):
    """Test core query expansion functionality."""
    query = "test query"
    result = await expander.expand_query(query)
    assert isinstance(result, dict)
    assert "original_query" in result
    assert "expanded_queries" in result
    assert len(result["expanded_queries"]) > 0

@pytest.mark.asyncio
async def test_query_expansion_error_handling(expander):
    """Test error handling and edge cases."""
    with pytest.raises(ValueError):
        await expander.expand_query("")
    
    with pytest.raises(ValueError):
        await expander.expand_query("a" * 1000)

@pytest.mark.asyncio
async def test_batch_and_concurrent_processing(expander):
    """Test batch and concurrent query processing."""
    queries = ["query1", "query2", "query3"]
    results = await expander.expand_queries(queries)
    assert len(results) == len(queries)
    assert all(isinstance(r, dict) for r in results)

def test_flow_context_extraction():
    """Test flow context extraction functionality."""
    query = "What are the performance patterns during flow states?"
    context = get_flow_context(query)
    assert isinstance(context, dict)
    assert context.get("has_flow_terms", False)
    assert any(len(terms) > 0 for terms in context["flow_context"].values()) 