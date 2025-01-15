"""Test utilities for RAG system testing."""
from typing import List, Dict, Any, Optional
import numpy as np
import pytest
from unittest.mock import MagicMock, patch
from sentence_transformers import SentenceTransformer
import faiss
from hypothesis import strategies as st

class MockEmbeddingModel:
    """Mock embedding model for testing."""
    def __init__(self, dimension: int = 384):
        self.dimension = dimension
        
    def encode(self, texts: List[str], **kwargs) -> np.ndarray:
        """Return deterministic mock embeddings."""
        if isinstance(texts, str):
            texts = [texts]
        embeddings = np.zeros((len(texts), self.dimension))
        for i, text in enumerate(texts):
            # Create deterministic but unique embedding based on text
            embedding = np.array([hash(f"{text}_{j}") % 100 / 100 for j in range(self.dimension)])
            embeddings[i] = embedding / np.linalg.norm(embedding)
        return embeddings
        
    def get_sentence_embedding_dimension(self) -> int:
        """Return embedding dimension."""
        return self.dimension

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
        {"type": "technical", "author": "alice", "timestamp": 1000},
        {"type": "technical", "author": "bob", "timestamp": 1001},
        {"type": "technical", "author": "alice", "timestamp": 1002},
        {"type": "other", "author": "charlie", "timestamp": 1003}
    ]

@pytest.fixture
def sample_chat_messages():
    """Fixture for sample chat messages."""
    from rag_aether.ai.rag import ChatMessage
    return [
        ChatMessage(
            content="Testing the system with message one",
            channel_id="test-channel",
            user_id="alice",
            timestamp=1000
        ),
        ChatMessage(
            content="Responding to the first message",
            channel_id="test-channel",
            user_id="bob",
            timestamp=1001
        )
    ]

def assert_embeddings_similar(emb1: np.ndarray, emb2: np.ndarray, tolerance: float = 1e-5):
    """Assert that two embeddings are similar within tolerance."""
    # Normalize embeddings
    emb1 = emb1 / np.linalg.norm(emb1)
    emb2 = emb2 / np.linalg.norm(emb2)
    # Check cosine similarity
    similarity = np.dot(emb1, emb2)
    assert similarity > (1 - tolerance), f"Embeddings not similar: {similarity}"

def assert_results_ordered(scores: List[float], tolerance: float = 1e-5):
    """Assert that results are ordered by decreasing score."""
    for i in range(len(scores) - 1):
        assert scores[i] >= scores[i + 1] - tolerance, \
            f"Results not ordered at position {i}: {scores[i]} < {scores[i + 1]}"

class AsyncMock(MagicMock):
    """Mock for async functions."""
    async def __call__(self, *args, **kwargs):
        return super(AsyncMock, self).__call__(*args, **kwargs)

def mock_async_return(result):
    """Create async mock that returns a value."""
    async def mock_coro(*args, **kwargs):
        return result
    return mock_coro 

# Hypothesis strategies for RAG testing
def text_content_strategy():
    """Strategy for generating valid text content."""
    return st.text(
        alphabet=st.characters(blacklist_categories=('Cs',)),
        min_size=1,
        max_size=1000
    )

def metadata_strategy():
    """Strategy for generating valid metadata."""
    return st.fixed_dictionaries({
        'type': st.sampled_from(['technical', 'general', 'other']),
        'author': st.text(min_size=1, max_size=50),
        'timestamp': st.integers(min_value=0)
    })

def embedding_strategy(dimension: int = 384):
    """Strategy for generating valid embeddings."""
    return st.lists(
        st.floats(min_value=-1, max_value=1),
        min_size=dimension,
        max_size=dimension
    ).map(lambda x: np.array(x) / np.linalg.norm(x)) 