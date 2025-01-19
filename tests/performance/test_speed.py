"""Speed benchmarks for the RAG system."""
import pytest
import pytest_asyncio
import asyncio
import time
from typing import List, Dict, Any
from unittest.mock import AsyncMock, Mock
from rag_aether.ai.rag_system import RAGSystem

# Sample test data
SAMPLE_TEXTS = [
    """Flow state is a mental state in which a person performing an activity is fully immersed
    and focused. It is characterized by complete absorption in what one does, and a resulting
    transformation in one's sense of time.""",
    """Deep work is the ability to focus without distraction on a cognitively demanding task.
    It's a skill that allows you to quickly master complicated information and produce better
    results in less time."""
] * 50  # Create 100 documents for testing

SAMPLE_QUERIES = [
    "What is flow state?",
    "How does deep work help productivity?",
    "What are the characteristics of flow?",
    "How can I achieve deep work?",
    "What happens during flow state?"
]

def create_mock_rag_system():
    """Create RAG system with mocks for testing."""
    system = RAGSystem()
    
    # Mock OpenAI client
    mock_openai = AsyncMock()
    mock_openai.embeddings.create.return_value.data = [Mock(embedding=[0.1] * 1536)]
    mock_openai.chat.completions.create.return_value.choices = [
        Mock(message=Mock(content="Test response"))
    ]
    
    # Mock vector store
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
    
    # Mock query expander
    mock_query_expander = AsyncMock()
    mock_query_expander.expand_query.return_value = {
        "original_query": "test",
        "expanded_queries": ["test", "expanded test"],
        "metadata": {
            "model": "t5-base",
            "device": "cpu"
        }
    }
    
    # Set up mocks
    system.client = mock_openai
    system.vector_store = mock_vector_store
    system.query_expander = mock_query_expander
    
    return system

@pytest_asyncio.fixture
async def rag_system():
    """Create and initialize RAG system for testing."""
    system = create_mock_rag_system()
    # Pre-ingest documents
    for i, text in enumerate(SAMPLE_TEXTS):
        await system.ingest_text(text, metadata={"id": i, "source": "test"})
    return system

@pytest.mark.asyncio
@pytest.mark.benchmark(
    group="ingestion",
    min_rounds=5,
    disable_gc=True,
    warmup=False
)
async def test_ingestion_speed(benchmark, rag_system):
    """Benchmark document ingestion speed."""
    async def run_ingestion():
        await rag_system.ingest_text(
            SAMPLE_TEXTS[0],
            metadata={"id": "benchmark", "source": "test"}
        )
    
    await benchmark(run_ingestion)

@pytest.mark.asyncio
@pytest.mark.benchmark(
    group="query",
    min_rounds=5,
    disable_gc=True,
    warmup=False
)
async def test_query_speed(benchmark, rag_system):
    """Benchmark query processing speed."""
    async def run_query():
        return await rag_system.query(SAMPLE_QUERIES[0])
    
    results = await benchmark(run_query)
    assert len(results) > 0

@pytest.mark.asyncio
@pytest.mark.benchmark(
    group="query_with_cache",
    min_rounds=5,
    disable_gc=True,
    warmup=False
)
async def test_query_speed_with_cache(benchmark, rag_system):
    """Benchmark query processing speed with cache."""
    # First query to populate cache
    await rag_system.query(SAMPLE_QUERIES[0])
    
    async def run_cached_query():
        return await rag_system.query(SAMPLE_QUERIES[0])
    
    results = await benchmark(run_cached_query)
    assert len(results) > 0

@pytest.mark.asyncio
@pytest.mark.benchmark(
    group="batch_ingestion",
    min_rounds=5,
    disable_gc=True,
    warmup=False
)
async def test_batch_ingestion_speed(benchmark, rag_system):
    """Benchmark batch document ingestion speed."""
    texts = SAMPLE_TEXTS[:10]  # Take 10 documents for batch processing
    metadata = [{"id": i, "source": "test"} for i in range(len(texts))]
    
    async def run_batch_ingestion():
        for text, meta in zip(texts, metadata):
            await rag_system.ingest_text(text, meta)
    
    await benchmark(run_batch_ingestion)

if __name__ == "__main__":
    pytest.main(["-v", "--benchmark-only"]) 