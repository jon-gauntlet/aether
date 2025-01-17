"""Property-based tests for RAG system behavior."""
from typing import List, Dict, Any
import pytest
from hypothesis import given, settings, strategies as st
from hypothesis.stateful import Bundle, RuleBasedStateMachine, rule
import numpy as np
from datetime import datetime, timedelta
from rag_aether.ai.rag_system import BaseRAG, RAGSystem
import torch

from tests.rag_aether.test_utils import (
    text_content_strategy,
    metadata_strategy,
    assert_results_ordered,
    assert_response_quality,
    measure_performance,
    PerformanceMetrics,
    mock_async_context
)

settings.register_profile("rag_tests", deadline=5000)  # 5 seconds deadline
settings.load_profile("rag_tests")

# Custom strategies
def message_strategy():
    """Strategy for generating test messages."""
    return st.fixed_dictionaries({
        "id": st.integers(min_value=1),
        "content": st.text(min_size=1, max_size=100),
        "author": st.text(min_size=1, max_size=20),
        "timestamp": st.floats(
            min_value=1577836800,  # 2020-01-01
            max_value=1893456000,  # 2030-01-01
            allow_infinity=False,
            allow_nan=False
        ),
        "channel_id": st.text(min_size=1, max_size=20),
        "thread_id": st.text(min_size=1, max_size=20)
    })

# Core RAG Properties
@given(
    query=st.text(min_size=1),
    documents=st.lists(st.text(min_size=1), min_size=1)
)
def test_retrieval_properties(base_rag, query, documents):
    """Test retrieval properties."""
    # Setup
    rag = RAGSystem()
    
    # Index documents
    docs = [{"text": doc} for doc in documents]
    rag.add_documents(docs)
    
    # Test properties
    results = await rag.search(query, k=min(5, len(documents)))
    
    # Property 1: Results should be ordered by relevance
    scores = [r["score"] for r in results]
    assert_results_ordered(scores)
    
    # Property 2: Number of results should not exceed k
    assert len(results) <= 5
    
    # Property 3: All results should come from indexed documents
    assert all(r["document"]["text"] in documents for r in results)

@given(
    documents=st.lists(text_content_strategy(), min_size=1, max_size=10),
    metadata=st.lists(metadata_strategy(), min_size=1, max_size=10)
)
@settings(max_examples=100)
def test_document_processing_properties(documents: List[str], metadata: List[Dict[str, Any]]):
    """Test document processing properties."""
    if len(documents) != len(metadata):
        return  # Skip if lengths don't match
        
    # Process documents
    processed = []
    for doc, meta in zip(documents, metadata):
        processed.append({
            "text": doc,
            "metadata": meta
        })
        
        # Check properties
        assert len(processed) <= len(documents)
        assert all(len(p["text"]) > 0 for p in processed)
        assert all(isinstance(p["metadata"]["timestamp"], str) for p in processed)

class TestRAGStateMachine(RuleBasedStateMachine):
    """State machine for testing RAG system behavior."""
    
    def __init__(self):
        super().__init__()
        self.rag = RAGSystem()
        self.documents = []
        self.metadata = []
        
    documents = Bundle('documents')
    queries = Bundle('queries')
    
    @rule(target=documents, content=text_content_strategy(), metadata=metadata_strategy())
    def add_document(self, content, metadata):
        """Add a document to the system."""
        doc = {"text": content, "metadata": metadata}
        self.rag.add_documents([doc])
        self.documents.append(content)
        self.metadata.append(metadata)
        return content
        
    @rule(target=queries, content=text_content_strategy())
    def add_query(self, content):
        """Add a query to test."""
        return content
        
    @rule(query=queries)
    async def test_retrieval(self, query):
        """Test retrieval behavior."""
        if not self.documents:
            return
            
        results = await self.rag.search(query, k=min(5, len(self.documents)))
        
        # Invariant 1: Results should be ordered
        scores = [r["score"] for r in results]
        assert_results_ordered(scores)
        
        # Invariant 2: Results should come from indexed documents
        assert all(r["document"]["text"] in self.documents for r in results)

# Performance Properties
def test_performance_properties():
    """Test performance-related properties."""
    rag = RAGSystem()
    documents = [{"text": f"Test document {i}"} for i in range(100)]
    
    # Measure indexing performance
    index_metrics = measure_performance(rag.add_documents, documents)
    
    # Property 1: Indexing throughput should scale reasonably
    assert index_metrics.throughput > 0.1, "Indexing too slow"
    
    # Property 2: Memory usage should be bounded
    assert index_metrics.memory_usage < 1e9, "Memory usage too high"

# Property-based tests
@given(messages=st.lists(message_strategy(), min_size=1))
def test_message_ingestion_properties(rag_system, messages):
    """Test message ingestion properties."""
    # Convert messages to documents
    docs = [{"text": msg["content"], "metadata": msg} for msg in messages]
    rag_system.add_documents(docs)
    
    # Property 1: All messages should be ingested successfully
    assert len(rag_system.documents) == len(messages)
    
    # Property 2: Messages should maintain order
    for i, msg in enumerate(messages):
        assert rag_system.documents[i]["text"] == msg["content"]

@given(
    messages=st.lists(message_strategy(), min_size=1, max_size=10),
    query=text_content_strategy()
)
def test_search_context_properties(messages, query):
    """Test properties of search context."""
    # Sort messages by timestamp
    sorted_msgs = sorted(messages, key=lambda m: m["timestamp"])
    
    # Get context window
    context_size = min(3, len(sorted_msgs))
    context = sorted_msgs[-context_size:]
    
    # Check properties
    assert len(context) <= context_size
    assert all(c["timestamp"] <= sorted_msgs[-1]["timestamp"] for c in context)
    assert len(context) <= len(sorted_msgs)

@given(
    messages=st.lists(message_strategy(), min_size=1, max_size=10),
    time_window=st.integers(min_value=1, max_value=7)
)
def test_time_window_properties(messages, time_window):
    """Test properties of time window filtering."""
    # Sort messages by timestamp
    sorted_msgs = sorted(messages, key=lambda m: m["timestamp"])
    
    # Get time window
    end_time = sorted_msgs[-1]["timestamp"]
    start_time = end_time - (time_window * 24 * 3600)
    
    # Filter messages in window
    window_msgs = [
        m for m in sorted_msgs
        if start_time <= m["timestamp"] <= end_time
    ]
    
    # Check properties
    assert all(start_time <= m["timestamp"] <= end_time for m in window_msgs)
    assert all(m["timestamp"] <= end_time for m in sorted_msgs)
    assert len(window_msgs) <= len(sorted_msgs)

@given(
    messages=st.lists(message_strategy(), min_size=1, max_size=10),
    channel_id=st.text(min_size=1, max_size=20)
)
def test_channel_context_properties(messages, channel_id):
    """Test properties of channel context."""
    # Filter messages by channel
    channel_msgs = [m for m in messages if m["channel_id"] == channel_id]
    
    # Check properties
    assert all(m["channel_id"] == channel_id for m in channel_msgs)
    assert len(channel_msgs) <= len(messages)

@given(
    messages=st.lists(message_strategy(), min_size=1, max_size=10),
    thread_id=st.text(min_size=1, max_size=20)
)
def test_thread_context_properties(messages, thread_id):
    """Test properties of thread context."""
    # Filter messages by thread
    thread_msgs = [m for m in messages if m["thread_id"] == thread_id]
    
    # Check properties
    assert all(m["thread_id"] == thread_id for m in thread_msgs)
    assert len(thread_msgs) <= len(messages)

@pytest.fixture(scope="module")
def base_rag():
    """Fixture for BaseRAG instance."""
    return BaseRAG()

@pytest.fixture(scope="module")
def rag_system():
    """Fixture for RAGSystem instance."""
    return RAGSystem()

@pytest.fixture
def sample_documents():
    """Fixture for sample documents."""
    return [
        {"text": "Document 1"},
        {"text": "Document 2"},
        {"text": "Document 3"}
    ]

def test_base_rag_initialization(base_rag):
    """Test BaseRAG initialization."""
    assert base_rag.model_name == "BAAI/bge-small-en"
    assert base_rag.device == torch.device("cuda" if torch.cuda.is_available() else "cpu")

def test_rag_system_initialization(rag_system):
    """Test RAGSystem initialization."""
    assert rag_system.model_name == "BAAI/bge-small-en"
    assert rag_system.documents == []
    assert rag_system.document_embeddings is None

def test_add_documents(rag_system, sample_documents):
    """Test adding documents."""
    rag_system.add_documents(sample_documents)
    assert len(rag_system.documents) == len(sample_documents)
    assert rag_system.document_embeddings is not None

@pytest.mark.asyncio
async def test_search_empty_system(rag_system):
    """Test search with empty system."""
    results = await rag_system.search("test query")
    assert results == []

@pytest.mark.asyncio
async def test_search_with_documents(rag_system, sample_documents):
    """Test search with documents."""
    rag_system.add_documents(sample_documents)
    results = await rag_system.search("test query")
    assert len(results) > 0
    assert all("score" in r for r in results)
    assert all("document" in r for r in results)

def test_encode_texts():
    base_rag = BaseRAG()
    texts = ["test text 1", "test text 2"]
    embeddings = base_rag.encode_texts(texts)
    assert embeddings.shape[0] == len(texts)
    assert embeddings.shape[1] == base_rag.embedding_dim
    assert str(embeddings.device).startswith('cuda')  # Allow both cuda and cuda:0 