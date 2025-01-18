"""Test utilities for RAG system testing."""
from typing import List, Dict, Any, Optional, Callable
import numpy as np
import pytest
from unittest.mock import MagicMock, patch
from sentence_transformers import SentenceTransformer
import faiss
from hypothesis import strategies as st, given, settings
from hypothesis.stateful import RuleBasedStateMachine, Bundle, rule
import asyncio
import json
from dataclasses import dataclass
from contextlib import contextmanager
import time
import psutil
import os

# Enhanced mock embedding model with more realistic behavior
class MockEmbeddingModel:
    """Mock embedding model for testing."""
    def __init__(self, dimension: int = 384, latency: float = 0.0):
        self.dimension = dimension
        self.latency = latency
        self._cache = {}
        
    def encode(self, texts: List[str], **kwargs) -> np.ndarray:
        """Return deterministic mock embeddings with optional latency."""
        if isinstance(texts, str):
            texts = [texts]
            
        # Simulate real-world latency
        if self.latency > 0:
            time.sleep(self.latency)
            
        # Use cache for efficiency
        embeddings = np.zeros((len(texts), self.dimension))
        for i, text in enumerate(texts):
            if text in self._cache:
                embeddings[i] = self._cache[text]
            else:
                # Create deterministic but unique embedding based on text
                embedding = np.array([hash(f"{text}_{j}") % 100 / 100 for j in range(self.dimension)])
                embedding = embedding / np.linalg.norm(embedding)
                self._cache[text] = embedding
                embeddings[i] = embedding
                
        return embeddings
        
    def get_sentence_embedding_dimension(self) -> int:
        """Return embedding dimension."""
        return self.dimension

# Enhanced test fixtures
@pytest.fixture
def mock_embedding_model():
    """Fixture for mock embedding model."""
    return MockEmbeddingModel()

@pytest.fixture
def mock_faiss_index():
    """Fixture for mock FAISS index."""
    dimension = 384
    index = faiss.IndexFlatIP(dimension)  # Inner product for cosine similarity
    return faiss.IndexIDMap(index)  # Add ID mapping

@pytest.fixture
def sample_texts():
    """Fixture for sample texts."""
    return [
        "This is a test document about machine learning.",
        "Another document discussing natural language processing.",
        "A third document about deep learning and AI.",
        "Something completely different about cooking recipes."
    ]

@pytest.fixture
def sample_metadata():
    """Fixture for sample metadata."""
    return [
        {"source": "doc1", "timestamp": "2024-01-15T10:00:00", "author": "user1"},
        {"source": "doc2", "timestamp": "2024-01-15T10:01:00", "author": "user2"},
        {"source": "doc3", "timestamp": "2024-01-15T10:02:00", "author": "user1"},
        {"source": "doc4", "timestamp": "2024-01-15T10:03:00", "author": "user3"}
    ]

@pytest.fixture
def sample_chat_messages():
    """Fixture for sample chat messages with thread structure."""
    return [
        {
            "id": "msg1",
            "content": "How does machine learning work?",
            "author": "user1",
            "timestamp": "2024-01-15T10:00:00",
            "thread_id": None
        },
        {
            "id": "msg2",
            "content": "It's a type of artificial intelligence.",
            "author": "user2",
            "timestamp": "2024-01-15T10:01:00",
            "thread_id": "msg1"
        },
        {
            "id": "msg3",
            "content": "Can you give an example?",
            "author": "user1",
            "timestamp": "2024-01-15T10:02:00",
            "thread_id": "msg1"
        }
    ]

# Enhanced assertion utilities
def assert_embeddings_similar(emb1: np.ndarray, emb2: np.ndarray, tolerance: float = 1e-5):
    """Assert two embeddings are similar within tolerance."""
    assert emb1.shape == emb2.shape, f"Embedding shapes differ: {emb1.shape} vs {emb2.shape}"
    assert np.allclose(emb1, emb2, atol=tolerance), f"Embeddings differ by more than {tolerance}"

def assert_results_ordered(scores: List[float], tolerance: float = 1e-5):
    """Assert results are in descending order."""
    for i in range(len(scores) - 1):
        assert scores[i] >= scores[i + 1] - tolerance, f"Results not ordered at index {i}"

def assert_response_quality(response: str, context: str, min_length: int = 10):
    """Assert response meets quality criteria."""
    # Basic checks
    assert len(response) >= min_length, f"Response too short: {len(response)} chars"
    assert response.strip(), "Response is empty or whitespace"
    
    # Content relevance
    assert any(word in response.lower() for word in context.lower().split()), \
        "Response appears unrelated to context"
    
    # Structure checks
    assert response[0].isupper(), "Response should start with capital letter"
    assert response[-1] in '.!?', "Response should end with punctuation"
    
    # Formatting
    assert not response.isupper(), "Response should not be all uppercase"
    assert '\n\n\n' not in response, "Response has too many consecutive newlines"

# Enhanced async testing utilities
class AsyncMock(MagicMock):
    """Mock for async functions."""
    async def __call__(self, *args, **kwargs):
        return super(AsyncMock, self).__call__(*args, **kwargs)

def mock_async_return(result):
    """Create a mock coroutine function."""
    async def mock_coro(*args, **kwargs):
        return result
    return mock_coro

@contextmanager
def mock_async_context():
    """Context manager for async testing."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        yield loop
    finally:
        loop.close()
        asyncio.set_event_loop(None)

# Enhanced property-based testing strategies
def text_content_strategy():
    """Generate realistic text content."""
    return st.text(
        alphabet=st.characters(blacklist_categories=('Cs',)),
        min_size=1,
        max_size=1000
    ).filter(lambda x: x.strip())  # Ensure non-empty content

def metadata_strategy():
    """Generate realistic metadata."""
    return st.fixed_dictionaries({
        'source': st.text(min_size=1, max_size=50),
        'timestamp': st.datetimes().map(lambda x: x.isoformat()),
        'author': st.text(min_size=1, max_size=50)
    })

def embedding_strategy(dimension: int = 384):
    """Generate valid embeddings."""
    return st.lists(
        st.floats(min_value=-1, max_value=1),
        min_size=dimension,
        max_size=dimension
    ).map(lambda x: np.array(x))

# State machine for testing stateful behavior
class RAGStateMachine(RuleBasedStateMachine):
    """State machine for testing RAG system behavior."""
    
    def __init__(self):
        super().__init__()
        self.documents = []
        self.queries = []
        
    documents = Bundle('documents')
    queries = Bundle('queries')
    
    @rule(target=documents, content=text_content_strategy())
    def add_document(self, content):
        """Add a document to the system."""
        self.documents.append(content)
        return content
        
    @rule(target=queries, content=text_content_strategy())
    def add_query(self, content):
        """Add a query to test."""
        self.queries.append(content)
        return content
        
    @rule(query=queries, document=documents)
    def test_retrieval(self, query, document):
        """Test retrieval behavior."""
        # Add retrieval testing logic here
        pass

# Performance testing utilities
@dataclass
class PerformanceMetrics:
    """Container for performance metrics."""
    latency: float
    memory_usage: float
    throughput: float

def measure_performance(func: Callable, *args, **kwargs) -> PerformanceMetrics:
    """Measure performance metrics of a function."""
    process = psutil.Process(os.getpid())
    start_memory = process.memory_info().rss
    start_time = time.time()
    
    result = func(*args, **kwargs)
    
    end_time = time.time()
    end_memory = process.memory_info().rss
    memory_used = end_memory - start_memory
    
    return PerformanceMetrics(
        latency=end_time - start_time,
        memory_usage=memory_used,
        throughput=1.0 / (end_time - start_time)
    )

# Load test data utilities
def load_test_data(file_path: str) -> Dict[str, Any]:
    """Load test data from JSON file."""
    with open(file_path, 'r') as f:
        return json.load(f)

def generate_test_data(num_samples: int) -> List[Dict[str, Any]]:
    """Generate synthetic test data."""
    return [
        {
            'content': f"Test content {i}",
            'metadata': {
                'id': f"doc_{i}",
                'timestamp': f"2024-01-15T{i:02d}:00:00"
            }
        }
        for i in range(num_samples)
    ] 