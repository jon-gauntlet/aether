"""Test configuration and shared fixtures."""

import pytest
import pytest_asyncio
from unittest.mock import Mock, AsyncMock, patch
import torch
import numpy as np
from datetime import datetime, timedelta

@pytest.fixture
def mock_embedding_model():
    """Mock embedding model for testing."""
    mock = Mock()
    
    def mock_encode(texts, convert_to_tensor=True, device=None):
        # Create mock embeddings
        embeddings = torch.randn(len(texts), 384)  # Using 384 dimensions
        if device:
            embeddings = embeddings.to(device)
        return embeddings
        
    mock.encode = mock_encode
    return mock

@pytest.fixture
def mock_anthropic():
    """Mock Anthropic client for testing."""
    mock = Mock()
    mock.messages = AsyncMock()
    mock.messages.create.return_value = Mock(
        content=[Mock(text="Test response")]
    )
    return mock

@pytest.fixture
def sample_messages():
    """Sample messages for testing."""
    base_time = datetime.now()
    return [
        {
            "content": "How do I use the search feature?",
            "channel": "general",
            "user_id": "user1",
            "timestamp": (base_time - timedelta(hours=1)).isoformat(),
            "thread_id": None
        },
        {
            "content": "What's the latest deployment status?",
            "channel": "deployments",
            "user_id": "user2",
            "timestamp": base_time.isoformat(),
            "thread_id": "thread1"
        }
    ]

def pytest_configure(config):
    """Configure pytest."""
    config.addinivalue_line(
        "markers",
        "asyncio: mark test as async"
    )
    
    # Set asyncio_mode to strict
    config.option.asyncio_mode = "strict"
    
    # Set default fixture loop scope
    config.option.asyncio_default_fixture_loop_scope = "function" 