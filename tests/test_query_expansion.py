"""Tests for query expansion module."""
import pytest
from unittest.mock import Mock, patch
import torch
from rag_aether.ai.query_expansion import (
    QueryProcessor,
    QueryExpander,
    expand_query,
    get_flow_context
)
from rag_aether.core.errors import QueryProcessingError, QueryExpansionError

@pytest.fixture
def mock_t5_tokenizer():
    """Mock T5 tokenizer."""
    with patch('rag_aether.ai.query_expansion.T5Tokenizer') as mock:
        tokenizer = Mock()
        # Create mock tensor
        mock_tensor = torch.tensor([[1, 2, 3]])
        mock_tensor.to = Mock(return_value=mock_tensor)
        
        # Mock tokenizer call
        tokenizer.return_value = {
            "input_ids": mock_tensor,
            "attention_mask": mock_tensor
        }
        
        # Mock batch decode
        tokenizer.batch_decode.return_value = [
            "expanded test query about flow",
            "another expanded query",
            "third expansion"
        ]
        
        mock.from_pretrained.return_value = tokenizer
        yield mock

@pytest.fixture
def mock_t5_model():
    """Mock T5 model."""
    with patch('rag_aether.ai.query_expansion.T5ForConditionalGeneration') as mock:
        model = Mock()
        # Create mock tensor for generation output
        mock_outputs = [torch.tensor([1, 2, 3]) for _ in range(3)]
        model.generate.return_value = mock_outputs
        model.to.return_value = model
        mock.from_pretrained.return_value = model
        yield mock

@pytest.mark.asyncio
async def test_query_processor_initialization():
    """Test QueryProcessor initialization."""
    processor = QueryProcessor()
    assert processor.max_length == 512
    assert processor.min_length == 3

@pytest.mark.asyncio
async def test_query_processor_process():
    """Test query processing."""
    processor = QueryProcessor()
    result = await processor.process("test query")
    
    assert isinstance(result, str)
    assert result == "test query"

@pytest.mark.asyncio
async def test_query_processor_process_empty():
    """Test processing empty query."""
    processor = QueryProcessor()
    with pytest.raises(QueryProcessingError):
        await processor.process("")

@pytest.mark.asyncio
async def test_query_processor_process_too_long():
    """Test processing too long query."""
    processor = QueryProcessor(max_length=5)
    with pytest.raises(QueryProcessingError):
        await processor.process("this is too long")

@pytest.mark.asyncio
async def test_query_processor_batch_processing():
    """Test batch query processing."""
    processor = QueryProcessor()
    queries = ["query1", "query2"]
    results = await processor.process_batch(queries)
    
    assert len(results) == 2
    assert all(isinstance(r, str) for r in results)
    assert results == ["query1", "query2"]

@pytest.mark.asyncio
async def test_query_expander_initialization(mock_t5_tokenizer, mock_t5_model):
    """Test QueryExpander initialization."""
    expander = QueryExpander()
    assert expander.tokenizer == mock_t5_tokenizer.from_pretrained.return_value
    assert expander.model == mock_t5_model.from_pretrained.return_value

@pytest.mark.asyncio
async def test_query_expander_expand():
    """Test query expansion."""
    expander = QueryExpander()
    result = await expander.expand_query("test query")
    
    assert isinstance(result, dict)
    assert result["original_query"] == "test query"
    assert isinstance(result["expanded_queries"], list)
    assert len(result["expanded_queries"]) > 0
    assert isinstance(result["metadata"], dict)

@pytest.mark.asyncio
async def test_query_expander_expand_with_context():
    """Test query expansion with context."""
    expander = QueryExpander()
    context = {"flow": {"state": ["flow"], "performance": ["performance"]}}
    result = await expander.expand_query("test query", context=str(context))
    
    assert isinstance(result, dict)
    assert result["original_query"] == "test query"
    assert isinstance(result["expanded_queries"], list)
    assert len(result["expanded_queries"]) > 0
    assert isinstance(result["context"], dict)
    assert "flow" in result["context"]

@pytest.mark.asyncio
async def test_query_expander_expand_queries():
    """Test batch query expansion."""
    expander = QueryExpander()
    queries = ["query1", "query2"]
    results = await expander.expand_queries(queries)
    
    assert len(results) == 2
    assert all(isinstance(r, dict) for r in results)
    assert all("original_query" in r for r in results)
    assert all("expanded_queries" in r for r in results)
    assert all(len(r["expanded_queries"]) > 0 for r in results) 