"""Memory profiling tests for the RAG system."""
import os
import pytest
from memory_profiler import profile
import numpy as np
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

@pytest.fixture
async def rag_system():
    """Create RAG system for testing."""
    return create_mock_rag_system()

@profile
async def test_memory_ingestion(rag_system):
    """Test memory usage during document ingestion."""
    for i, text in enumerate(SAMPLE_TEXTS):
        await rag_system.ingest_text(
            text,
            metadata={"id": i, "source": "test"}
        )

@profile
async def test_memory_query(rag_system):
    """Test memory usage during querying."""
    for query in SAMPLE_QUERIES:
        results = await rag_system.query(query)
        assert len(results) > 0

if __name__ == "__main__":
    import asyncio
    
    async def run_tests():
        system = create_mock_rag_system()
        print("\nTesting document ingestion memory usage...")
        await test_memory_ingestion(system)
        
        print("\nTesting query memory usage...")
        await test_memory_query(system)
    
    asyncio.run(run_tests()) 