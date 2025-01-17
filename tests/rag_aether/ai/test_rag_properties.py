"""Property-based tests for RAG system behavior."""
from typing import List, Dict, Any
import pytest
from hypothesis import given, settings, strategies as st
from hypothesis.stateful import Bundle, RuleBasedStateMachine, rule, invariant
import numpy as np
from datetime import datetime, timedelta
from rag_aether.ai.rag_system import BaseRAG, RAGSystem
import torch

from tests.rag_aether.test_utils import (
    MockEmbeddingModel,
    text_content_strategy,
    metadata_strategy,
    embedding_strategy,
    assert_embeddings_similar,
    assert_results_ordered,
    assert_response_quality,
    RAGStateMachine,
    measure_performance,
    PerformanceMetrics
)

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

def text_content_strategy():
    """Strategy for generating test content."""
    return st.text(min_size=1, max_size=100)

def metadata_strategy():
    """Strategy for generating test metadata."""
    return st.fixed_dictionaries({
        "source": st.text(min_size=1, max_size=20),
        "timestamp": st.sampled_from([
            "2020-01-01T00:00:00",
            "2021-01-01T00:00:00",
            "2022-01-01T00:00:00"
        ]),
        "author": st.text(min_size=1, max_size=20)
    })

# Core RAG Properties
@given(
    query=text_content_strategy(),
    documents=st.lists(text_content_strategy(), min_size=1, max_size=10)
)
@settings(max_examples=100)
def test_retrieval_properties(query: str, documents: List[str]):
    """Test fundamental RAG retrieval properties."""
    # Setup
    rag = BaseRAG(embedding_model=MockEmbeddingModel())
    
    # Index documents
    rag.add_documents(documents)
    
    # Test properties
    results = rag.retrieve(query, k=min(5, len(documents)))
    
    # Property 1: Results should be ordered by relevance
    assert_results_ordered([r.score for r in results])
    
    # Property 2: Number of results should not exceed k
    assert len(results) <= 5
    
    # Property 3: All results should come from indexed documents
    assert all(r.content in documents for r in results)

@given(
    documents=st.lists(text_content_strategy(), min_size=1, max_size=10),
    metadata=st.lists(metadata_strategy(), min_size=1, max_size=10)
)
@settings(max_examples=100)
def test_document_processing_properties(documents: List[str], metadata: List[Dict[str, Any]]):
    """Test document processing properties."""
    assert len(documents) == len(metadata)
    
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
        assert all(p["metadata"]["timestamp"] in [
            "2020-01-01T00:00:00",
            "2021-01-01T00:00:00",
            "2022-01-01T00:00:00"
        ] for p in processed)

class TestRAGStateMachine(RuleBasedStateMachine):
    """State machine for testing RAG system behavior."""
    
    def __init__(self):
        super().__init__()
        self.rag = BaseRAG(embedding_model=MockEmbeddingModel())
        self.documents = []
        self.metadata = []
        self.doc_ids = []
        
    documents = Bundle('documents')
    queries = Bundle('queries')
    
    @rule(target=documents, content=text_content_strategy(), metadata=metadata_strategy())
    def add_document(self, content, metadata):
        """Add a document to the system."""
        doc_id = self.rag.add_documents([content], metadata=[metadata])[0]
        self.documents.append(content)
        self.metadata.append(metadata)
        self.doc_ids.append(doc_id)
        return content
        
    @rule(target=queries, content=text_content_strategy())
    def add_query(self, content):
        """Add a query to test."""
        return content
        
    @rule(query=queries)
    def test_retrieval(self, query):
        """Test retrieval behavior."""
        if not self.documents:
            return
            
        results = self.rag.retrieve(query, k=min(5, len(self.documents)))
        
        # Invariant 1: Results should be ordered
        scores = [r.score for r in results]
        assert_results_ordered(scores)
        
        # Invariant 2: Results should come from indexed documents
        assert all(r.content in self.documents for r in results)
        
    @invariant()
    def check_consistency(self):
        """Check system consistency."""
        # All documents should be retrievable
        for doc_id, content in zip(self.doc_ids, self.documents):
            retrieved = self.rag.get_document(doc_id)
            assert retrieved.content == content
            
        # All metadata should be preserved
        for doc_id, meta in zip(self.doc_ids, self.metadata):
            stored_meta = self.rag.get_document_metadata(doc_id)
            assert all(stored_meta[k] == v for k, v in meta.items())

# Performance Properties
def test_performance_properties():
    """Test performance-related properties."""
    rag = BaseRAG(embedding_model=MockEmbeddingModel(latency=0.01))
    documents = [f"Test document {i}" for i in range(100)]
    
    # Measure indexing performance
    index_metrics = measure_performance(rag.add_documents, documents)
    
    # Property 1: Indexing throughput should scale reasonably
    assert index_metrics.throughput > 0.1, "Indexing too slow"
    
    # Property 2: Retrieval latency should be bounded
    query = "test query"
    retrieval_metrics = measure_performance(rag.retrieve, query, k=5)
    assert retrieval_metrics.latency < 1.0, "Retrieval too slow"
    
    # Property 3: Memory usage should be bounded
    assert index_metrics.memory_usage < 1e9, "Memory usage too high"

# Property-based tests
@given(messages=st.lists(message_strategy(), min_size=1, max_size=10))
def test_message_ingestion_properties(messages: List[Dict]):
    """Test properties of message ingestion"""
    rag = RAGSystem(use_production_features=True)
    
    # Property 1: All messages should be ingested successfully
    for msg in messages:
        rag.ingest_message(msg)
        assert len(rag.messages) > 0
        
    # Property 2: Messages should maintain order
    for i, msg in enumerate(messages):
        assert rag.messages[i]["content"] == msg["content"]
        
    # Property 3: Vector IDs should be sequential
    for i, msg in enumerate(rag.messages):
        assert msg["vector_id"] == i

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

# Run the state machine
TestRAGStateMachine.TestCase.settings = settings(max_examples=100)
test_rag_state = TestRAGStateMachine.TestCase 

@pytest.fixture
def base_rag():
    return BaseRAG()
    
@pytest.fixture
def rag_system():
    return RAGSystem()
    
@pytest.fixture
def sample_documents():
    return [
        {"text": "This is a test document about AI", "id": 1},
        {"text": "Another document about machine learning", "id": 2},
        {"text": "Document about natural language processing", "id": 3}
    ]

def test_base_rag_initialization(base_rag):
    assert isinstance(base_rag, BaseRAG)
    assert base_rag.model_name == "BAAI/bge-small-en"
    assert isinstance(base_rag.device, torch.device)
    assert base_rag.model is not None
    
def test_rag_system_initialization(rag_system):
    assert isinstance(rag_system, RAGSystem)
    assert isinstance(rag_system, BaseRAG)
    assert rag_system.documents == []
    assert rag_system.document_embeddings is None
    assert rag_system.query_expander is not None
    
def test_add_documents(rag_system, sample_documents):
    rag_system.add_documents(sample_documents)
    assert len(rag_system.documents) == 3
    assert rag_system.document_embeddings is not None
    assert rag_system.document_embeddings.shape[0] == 3
    
@pytest.mark.asyncio
async def test_search_empty_system(rag_system):
    results = await rag_system.search("test query")
    assert results == []
    
@pytest.mark.asyncio
async def test_search_with_documents(rag_system, sample_documents):
    rag_system.add_documents(sample_documents)
    results = await rag_system.search("AI and machine learning", k=2)
    
    assert len(results) == 2
    assert all(isinstance(r["score"], float) for r in results)
    assert all(0 <= r["score"] <= 1 for r in results)
    assert all("expanded_query" in r for r in results)
    
def test_encode_texts(base_rag):
    texts = ["Test text one", "Test text two"]
    embeddings = base_rag.encode(texts)
    
    assert isinstance(embeddings, torch.Tensor)
    assert embeddings.shape[0] == 2
    assert embeddings.device == base_rag.device 