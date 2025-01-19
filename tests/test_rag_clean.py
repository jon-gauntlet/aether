from rag_aether.ai.rag_system import RAGSystem
import os
from dotenv import load_dotenv
import time
import warnings
from langsmith.client import Client
import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, Mock

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
            "text": "Test document",
            "metadata": {"source": "test"},
            "score": 0.95
        }
    ]
    
    # Create mock Redis client
    mock_redis = AsyncMock()
    mock_redis.get.return_value = None
    
    # Create RAG system with mocks
    rag = RAGSystem()
    rag.client = mock_openai
    rag.vector_store = mock_vector_store
    rag.redis = mock_redis
    return rag

@pytest.mark.asyncio
async def test_ingest_text(mock_rag):
    """Test text ingestion."""
    result = await mock_rag.ingest_text(
        "Test document",
        metadata={"source": "test"}
    )
    assert result is True
    mock_rag.vector_store.add_texts.assert_called_once()

@pytest.mark.asyncio
async def test_query(mock_rag):
    """Test query functionality."""
    results = await mock_rag.query("test query")
    assert len(results) > 0
    assert results[0]["score"] > 0
    assert "text" in results[0]
    assert "metadata" in results[0]

@pytest.mark.asyncio
async def test_query_with_cache(mock_rag):
    """Test query with cache hit."""
    # First query (cache miss)
    await mock_rag.query("test query")
    
    # Second query (cache hit)
    mock_rag.redis.get.return_value = [{"text": "Cached result"}]
    results = await mock_rag.query("test query")
    
    assert len(results) > 0
    assert results[0]["text"] == "Cached result"
    mock_rag.vector_store.search.assert_called_once()  # Only called on first query

@pytest.mark.asyncio
async def test_empty_query(mock_rag):
    """Test empty query handling."""
    with pytest.raises(ValueError):
        await mock_rag.query("")

@pytest.mark.asyncio
async def test_empty_text_ingestion(mock_rag):
    """Test empty text ingestion handling."""
    with pytest.raises(ValueError):
        await mock_rag.ingest_text("")

def test_rag_pipeline():
    """Test the complete RAG pipeline."""
    print("\n🔍 Testing RAG Pipeline")
    print("=" * 60)
    
    # Load environment variables
    load_dotenv()
    
    # Disable LangSmith telemetry
    os.environ["LANGCHAIN_TRACING_V2"] = "false"
    os.environ["LANGCHAIN_ENDPOINT"] = ""
    
    # Initialize RAG system
    print("\n1. Initializing RAG system...")
    rag = RAGSystem()
    
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
    
    total_chunks = 0
    for doc in test_docs:
        chunks = rag.ingest_text(doc["text"], doc["metadata"])
        total_chunks += chunks
        print(f"✅ Ingested document from {doc['metadata']['source']} ({chunks} chunks)")
    
    print(f"\nTotal chunks created: {total_chunks}")
    
    # Test retrieval and generation
    print("\n3. Testing retrieval and generation...")
    test_queries = [
        "What is flow state and who introduced it?",
        "How does deep work relate to productivity?",
        "What are the key characteristics of focused work?",
    ]
    
    for query in test_queries:
        print(f"\nQuery: {query}")
        start_time = time.time()
        response = rag.query(query)
        end_time = time.time()
        
        print(f"Response: {response}")
        print(f"Time taken: {end_time - start_time:.2f} seconds")
        print("-" * 60)

if __name__ == "__main__":
    test_rag_pipeline() 