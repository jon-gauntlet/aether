from rag_aether.ai.rag_system import RAGSystem
import os
from dotenv import load_dotenv
import time
import warnings
from langsmith.client import Client
import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, Mock, patch
from rag_aether.core.errors import QueryProcessingError, QueryExpansionError
import torch

# Disable LangSmith telemetry warnings
warnings.filterwarnings("ignore", category=UserWarning, module="langsmith.client")

@pytest_asyncio.fixture
async def mock_rag():
    """Create mock RAG system."""
    # Create mock OpenAI client
    mock_openai = AsyncMock()
    mock_openai.embeddings.create.return_value.data = [Mock(embedding=[0.1] * 1536)]
    mock_openai.chat.completions.create.return_value.choices = [
        Mock(message=Mock(content="Test response"))
    ]
    
    # Create mock vector store
    mock_vector_store = AsyncMock()
    mock_vector_store.search.return_value = [
        {
            "document_id": "test-doc-1",
            "text": "Test document",
            "metadata": {"source": "test"},
            "score": 0.95
        }
    ]
    mock_vector_store.add_documents = AsyncMock(return_value=True)
    
    # Create mock Redis client
    mock_redis = AsyncMock()
    mock_redis.get.return_value = None
    
    # Create mock query expander
    mock_query_expander = AsyncMock()
    def expand_query_side_effect(query, context=None):
        if not query:
            raise QueryExpansionError("Query cannot be empty")
        return {
            "original_query": query,
            "expanded_queries": [query, f"expanded {query}"],
            "metadata": {
                "model": "t5-base",
                "device": "cpu",
                "processor_metrics": {
                    "max_length": 512,
                    "min_length": 3
                }
            }
        }
    mock_query_expander.expand_query.side_effect = expand_query_side_effect
    
    # Create RAG system with mocks
    rag = RAGSystem()
    rag.client = mock_openai
    rag.vector_store = mock_vector_store
    rag.redis = mock_redis
    rag.query_expander = mock_query_expander
    return rag

@pytest.mark.asyncio
async def test_ingest_text(mock_rag):
    """Test text ingestion."""
    result = await mock_rag.ingest_text(
        "Test document",
        metadata={"source": "test"}
    )
    assert result is True
    assert mock_rag.vector_store.add_documents.called

@pytest.mark.asyncio
async def test_query(mock_rag):
    """Test query functionality."""
    results = await mock_rag.query("test query")
    assert len(results) == 1
    assert results[0]["document_id"] == "test-doc-1"
    assert results[0]["text"] == "Test document"
    assert results[0]["score"] == 0.95

@pytest.mark.asyncio
async def test_query_with_cache(mock_rag):
    """Test query with cache hit."""
    # First query (cache miss)
    await mock_rag.query("test query")
    
    # Second query (cache hit)
    mock_rag.redis.get.return_value = [
        {
            "document_id": "test-doc-1",
            "text": "Test document",
            "metadata": {"source": "test"},
            "score": 0.95
        }
    ]
    results = await mock_rag.query("test query")
    assert len(results) == 1
    assert results[0]["document_id"] == "test-doc-1"

@pytest.mark.asyncio
async def test_empty_query(mock_rag):
    """Test empty query handling."""
    with pytest.raises(QueryExpansionError, match="Query cannot be empty"):
        await mock_rag.query("")

@pytest.mark.asyncio
async def test_empty_text_ingestion(mock_rag):
    """Test empty text ingestion handling."""
    with pytest.raises(ValueError):
        await mock_rag.ingest_text("")

@pytest.mark.asyncio
async def test_rag_pipeline(mock_rag):
    """Test the complete RAG pipeline."""
    print("\n🔍 Testing RAG Pipeline")
    print("=" * 60)
    
    # Test document ingestion
    print("\n2. Testing document ingestion...")
    test_docs = [
        {
            "text": """
            Flow state is a mental state in which a person performing an activity is fully immersed
            and focused. It is characterized by complete absorption in what one does, and a resulting
            transformation in one's sense of time. The concept was introduced by Mihaly Csikszentmihalyi.
            """,
            "metadata": {"source": "flow_state", "type": "concept"}
        },
        {
            "text": """
            Deep work is the ability to focus without distraction on a cognitively demanding task.
            It's a skill that allows you to quickly master complicated information and produce better
            results in less time. Deep work will make you better at what you do and provide the sense
            of true fulfillment that comes from craftsmanship.
            """,
            "metadata": {"source": "deep_work", "type": "concept"}
        }
    ]
    
    for doc in test_docs:
        result = await mock_rag.ingest_text(doc["text"], doc["metadata"])
        assert result is True
    
    # Test query
    print("\n3. Testing query...")
    results = await mock_rag.query("What is flow state?")
    assert len(results) > 0
    assert all("document_id" in r for r in results)
    assert all("score" in r for r in results)
    assert all("text" in r for r in results)
    assert all("metadata" in r for r in results)

if __name__ == "__main__":
    test_rag_pipeline() 