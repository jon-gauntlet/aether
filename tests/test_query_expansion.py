"""Tests for query expansion module."""
import pytest
from unittest.mock import Mock, patch
from rag_aether.ai.query_expansion import (
    QueryProcessor,
    QueryExpander,
    expand_query,
    get_flow_context,
    ExpandedQuery
)
from rag_aether.core.errors import QueryProcessingError

@pytest.fixture
def mock_t5_tokenizer():
    """Mock T5 tokenizer."""
    with patch('src.rag_aether.ai.query_expansion.T5Tokenizer') as mock:
        tokenizer = Mock()
        tokenizer.encode.return_value = Mock(to=lambda x: [1, 2, 3])
        tokenizer.decode.return_value = "expanded test query about flow"
        mock.from_pretrained.return_value = tokenizer
        yield mock

@pytest.fixture
def mock_t5_model():
    """Mock T5 model."""
    with patch('src.rag_aether.ai.query_expansion.T5ForConditionalGeneration') as mock:
        model = Mock()
        model.generate.return_value = [[1, 2, 3]]
        model.to.return_value = model
        mock.from_pretrained.return_value = model
        yield mock

def test_query_processor_initialization(mock_t5_tokenizer, mock_t5_model):
    """Test QueryProcessor initialization."""
    processor = QueryProcessor()
    assert processor.model == mock_t5_model.from_pretrained.return_value
    assert processor.tokenizer == mock_t5_tokenizer.from_pretrained.return_value

def test_query_processor_process(mock_t5_tokenizer, mock_t5_model):
    """Test query processing."""
    processor = QueryProcessor()
    result = processor.process("test query")
    
    assert isinstance(result, ExpandedQuery)
    assert result.original == "test query"
    assert "flow" in result.expanded
    assert result.metadata is not None
    assert "model" in result.metadata

def test_query_processor_process_with_context(mock_t5_tokenizer, mock_t5_model):
    """Test query processing with context."""
    processor = QueryProcessor()
    result = processor.process("test query", context="flow state discussion")
    
    assert isinstance(result, ExpandedQuery)
    mock_t5_tokenizer.from_pretrained.return_value.encode.assert_called_once()
    assert "flow" in result.expanded

def test_query_processor_error_handling(mock_t5_tokenizer, mock_t5_model):
    """Test error handling in query processing."""
    mock_t5_model.from_pretrained.side_effect = Exception("Model error")
    
    with pytest.raises(QueryProcessingError) as exc:
        QueryProcessor()
    assert "Model error" in str(exc.value)

def test_query_processor_batch_processing(mock_t5_tokenizer, mock_t5_model):
    """Test batch query processing."""
    processor = QueryProcessor()
    queries = ["query1", "query2"]
    results = processor.process_batch(queries)
    
    assert len(results) == 2
    assert all(isinstance(r, ExpandedQuery) for r in results)

def test_expand_query_function():
    """Test expand_query utility function."""
    query = "flow performance metrics"
    expanded = expand_query(query)
    
    assert "flow" in expanded
    assert "performance" in expanded
    assert "metrics" in expanded
    assert any(term in expanded for term in ["efficiency", "speed", "throughput"])

def test_get_flow_context():
    """Test flow context extraction."""
    query = "developer performance during flow state"
    context = get_flow_context(query)
    
    assert "flow_terms" in context
    assert "performance_terms" in context
    assert "developer_terms" in context
    assert "flow" in context["flow_terms"]
    assert "performance" in context["performance_terms"]
    assert "developer" in context["developer_terms"]

def test_query_expander_initialization(mock_t5_tokenizer, mock_t5_model):
    """Test QueryExpander initialization."""
    expander = QueryExpander()
    assert expander.model == mock_t5_model.from_pretrained.return_value
    assert expander.tokenizer == mock_t5_tokenizer.from_pretrained.return_value

def test_query_expander_expand(mock_t5_tokenizer, mock_t5_model):
    """Test query expansion."""
    expander = QueryExpander()
    result = expander.expand_query("test query")
    
    assert isinstance(result, ExpandedQuery)
    assert result.original == "test query"
    assert result.expanded is not None
    assert result.metadata["model"] == "t5-base"

def test_query_expander_batch_expand(mock_t5_tokenizer, mock_t5_model):
    """Test batch query expansion."""
    expander = QueryExpander()
    queries = ["query1", "query2"]
    results = expander.batch_expand(queries)
    
    assert len(results) == 2
    assert all(isinstance(r, ExpandedQuery) for r in results)
    assert all(r.metadata["model"] == "t5-base" for r in results) 