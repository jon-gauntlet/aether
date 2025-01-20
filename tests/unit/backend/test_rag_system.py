"""Unit tests for RAG system core components."""
import pytest
from unittest.mock import Mock, patch
from rag_aether.ai.rag_system import RAGSystem
from rag_aether.core.errors import RAGError

@pytest.fixture
def mock_sentence_transformer():
    """Mock sentence transformer."""
    with patch('src.rag_aether.ai.rag_system.SentenceTransformer') as mock:
        model = Mock()
        model.get_sentence_embedding_dimension.return_value = 384
        model.encode.return_value = [[0.1] * 384]  # Mock embeddings
        mock.return_value = model
        yield mock

@pytest.fixture
def mock_query_processor():
    """Mock query processor."""
    with patch('src.rag_aether.ai.rag_system.QueryProcessor') as mock:
        processor = Mock()
        processor.process.return_value = Mock(
            expanded="expanded query",
            metadata={"model": "t5-test"}
        )
        mock.return_value = processor
        yield mock

@pytest.fixture
def mock_firebase():
    """Mock Firebase adapter."""
    with patch('src.rag_aether.ai.rag_system.FirebaseAdapter') as mock:
        adapter = Mock()
        adapter.get_conversations.return_value = [
            Mock(
                page_content="test content about flow states",
                metadata={
                    "title": "Flow Discussion",
                    "flow_state": "high",
                    "participants": ["user1", "user2"]
                }
            )
        ]
        mock.return_value = adapter
        yield mock

def test_rag_initialization(mock_sentence_transformer, mock_query_processor, mock_firebase):
    """Test RAG system initialization."""
    rag = RAGSystem(use_mock=True)
    assert rag.model == mock_sentence_transformer.return_value
    assert rag.query_processor == mock_query_processor.return_value
    assert len(rag.documents) == 1

def test_rag_search(mock_sentence_transformer, mock_query_processor, mock_firebase):
    """Test search functionality."""
    rag = RAGSystem(use_mock=True)
    results = rag.search("test query", k=1)
    
    assert len(results) == 1
    assert "flow states" in results[0].page_content
    assert results[0].metadata["flow_state"] == "high"
    assert "search_score" in results[0].metadata
    assert "semantic_score" in results[0].metadata
    assert "bm25_score" in results[0].metadata

def test_rag_query_with_metadata(mock_sentence_transformer, mock_query_processor, mock_firebase):
    """Test query with metadata."""
    rag = RAGSystem(use_mock=True)
    response = rag.query("test query", k=1)
    
    assert isinstance(response, dict)
    assert "query" in response
    assert "expanded_query" in response
    assert "flow_context" in response
    assert len(response["results"]) == 1
    
    result = response["results"][0]
    assert "content" in result
    assert "title" in result
    assert "flow_state" in result
    assert "search_score" in result

def test_rag_query_without_metadata(mock_sentence_transformer, mock_query_processor, mock_firebase):
    """Test query without metadata."""
    rag = RAGSystem(use_mock=True)
    response = rag.query("test query", k=1, include_metadata=False)
    
    assert isinstance(response, str)
    assert "flow states" in response

def test_rag_caching(mock_sentence_transformer, mock_query_processor, mock_firebase):
    """Test result caching."""
    rag = RAGSystem(use_mock=True, use_cache=True)
    
    # First query
    results1 = rag.search("test query", k=1)
    
    # Second query - should use cache
    mock_sentence_transformer.reset_mock()
    results2 = rag.search("test query", k=1)
    
    assert results1 == results2
    mock_sentence_transformer.return_value.encode.assert_not_called()

def test_rag_error_handling(mock_sentence_transformer, mock_query_processor):
    """Test error handling."""
    mock_sentence_transformer.side_effect = Exception("Model error")
    
    with pytest.raises(RAGError) as exc:
        RAGSystem(use_mock=True)
    assert "Model error" in str(exc.value)

def test_rag_performance(mock_sentence_transformer, mock_query_processor, mock_firebase):
    """Test performance monitoring."""
    from rag_aether.core.performance import get_performance_stats, reset_performance_stats
    
    reset_performance_stats()
    rag = RAGSystem(use_mock=True)
    rag.query("test query")
    
    stats = get_performance_stats()
    assert "query" in stats
    assert stats["query"]["calls"] > 0
    assert "search" in stats
    assert stats["search"]["calls"] > 0 