"""Property-based tests for RAG system behavior."""
from typing import List, Dict, Any
import pytest
from hypothesis import given, settings, strategies as st
from hypothesis.stateful import Bundle, RuleBasedStateMachine, rule, invariant
import numpy as np
from datetime import datetime, timedelta
from rag_aether.ai.rag_system import RAGSystem

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
@st.composite
def message_strategy(draw):
    """Generate valid message dictionaries"""
    return {
        "content": draw(st.text(min_size=1, max_size=1000)),
        "channel": draw(st.text(min_size=1, max_size=50)),
        "user_id": draw(st.text(min_size=1, max_size=50)),
        "timestamp": draw(st.floats(min_value=0, max_value=datetime.now().timestamp())),
        "thread_id": draw(st.one_of(st.none(), st.text(min_size=1, max_size=50)))
    }

@st.composite
def query_strategy(draw):
    """Generate valid query strings"""
    return draw(st.text(min_size=1, max_size=200))

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
    # Setup
    rag = BaseRAG(embedding_model=MockEmbeddingModel())
    
    # Ensure matching lengths
    documents = documents[:len(metadata)]
    metadata = metadata[:len(documents)]
    
    # Add documents with metadata
    doc_ids = rag.add_documents(documents, metadata=metadata)
    
    # Property 1: Each document should get a unique ID
    assert len(set(doc_ids)) == len(doc_ids)
    
    # Property 2: Metadata should be preserved
    for doc_id, meta in zip(doc_ids, metadata):
        stored_meta = rag.get_document_metadata(doc_id)
        assert all(stored_meta[k] == v for k, v in meta.items())
        
    # Property 3: Documents should be retrievable by ID
    for doc_id, content in zip(doc_ids, documents):
        retrieved = rag.get_document(doc_id)
        assert retrieved.content == content

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
    query=query_strategy()
)
def test_search_context_properties(messages: List[Dict], query: str):
    """Test properties of context search"""
    rag = RAGSystem(use_production_features=True)
    
    # Ingest messages
    for msg in messages:
        rag.ingest_message(msg)
    
    # Property 1: Search should return requested number of results
    k = 3
    results = rag.search_context(query, k=k)
    assert len(results) <= k
    
    # Property 2: Results should have relevance scores
    for result in results:
        assert "relevance_score" in result
        assert isinstance(result["relevance_score"], float)
    
    # Property 3: Results should maintain time ordering within relevance
    for i in range(len(results) - 1):
        if abs(results[i]["relevance_score"] - results[i+1]["relevance_score"]) < 0.01:
            assert results[i]["timestamp"] >= results[i+1]["timestamp"]

@given(
    messages=st.lists(message_strategy(), min_size=1, max_size=10),
    query=query_strategy(),
    time_window=st.integers(min_value=1, max_value=24)
)
def test_time_window_properties(messages: List[Dict], query: str, time_window: int):
    """Test properties of time window filtering"""
    rag = RAGSystem(use_production_features=True)
    
    # Ingest messages
    for msg in messages:
        rag.ingest_message(msg)
    
    # Property 1: Time window should filter old messages
    results = rag.search_context(query, time_window_hours=time_window)
    now = datetime.now()
    
    for result in results:
        msg_time = datetime.fromisoformat(result["ingested_at"])
        age_hours = (now - msg_time).total_seconds() / 3600
        assert age_hours <= time_window

@given(
    messages=st.lists(message_strategy(), min_size=1, max_size=10),
    query=query_strategy()
)
def test_channel_context_properties(messages: List[Dict], query: str):
    """Test properties of channel context"""
    rag = RAGSystem(use_production_features=True)
    
    # Ingest messages
    for msg in messages:
        rag.ingest_message(msg)
    
    # Get context with channels
    context = rag.get_enhanced_context(query, include_channels=True)
    
    if context.get("channel_context"):
        channel = context["semantic_matches"][0]["channel"]
        
        # Property 1: Channel context should only contain messages from that channel
        for msg in context["channel_context"]:
            assert msg["channel"] == channel
        
        # Property 2: Channel context should be time-ordered
        for i in range(len(context["channel_context"]) - 1):
            assert context["channel_context"][i]["timestamp"] >= context["channel_context"][i+1]["timestamp"]

@given(
    messages=st.lists(message_strategy(), min_size=1, max_size=10),
    query=query_strategy()
)
def test_thread_context_properties(messages: List[Dict], query: str):
    """Test properties of thread context"""
    rag = RAGSystem(use_production_features=True)
    
    # Ingest messages
    for msg in messages:
        rag.ingest_message(msg)
    
    # Get context with threads
    context = rag.get_enhanced_context(query, include_threads=True)
    
    if context.get("thread_context"):
        thread_id = context["semantic_matches"][0]["thread_id"]
        
        # Property 1: Thread context should only contain messages from that thread
        for msg in context["thread_context"]:
            assert msg["thread_id"] == thread_id
        
        # Property 2: Thread context should be time-ordered
        for i in range(len(context["thread_context"]) - 1):
            assert context["thread_context"][i]["timestamp"] <= context["thread_context"][i+1]["timestamp"]

# Run the state machine
TestRAGStateMachine.TestCase.settings = settings(max_examples=100)
test_rag_state = TestRAGStateMachine.TestCase 