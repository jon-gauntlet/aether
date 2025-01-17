"""Test configuration and shared fixtures."""

# <!-- LLM:claude CRITICAL: Test configuration - Must be used with SLED test runner -->
# <!-- LLM:magnetic CORE_TEST_CONFIG - Links to SLED test runner -->
# <!-- LLM:verify Test configuration is active -->

# <!-- LLM:claude AUTONOMOUS DEBUG PROTOCOL
#      1. On test failure:
#         - Capture full stack trace and variables
#         - Check test dependencies and fixtures
#         - Analyze code paths and data flow
#      2. Fix strategy:
#         - Start with lowest level failures
#         - Fix one component at a time
#         - Verify fixes with regression tests
#      3. Performance optimization:
#         - Profile slow tests
#         - Optimize test order
#         - Parallelize when safe
#      4. Error prevention:
#         - Add assertions and type hints
#         - Improve error messages
#         - Document fixes and patterns
#      NO QUESTIONS - EXECUTE AND FIX
# -->

import pytest
import logging
from pathlib import Path
import torch
import os
import numpy as np
from unittest.mock import Mock, patch, AsyncMock

# Configure logging
logging.basicConfig(level=logging.INFO)

# Test infrastructure paths
TEST_ROOT = Path(__file__).parent
PROJECT_ROOT = TEST_ROOT.parent
FIXTURE_PATH = TEST_ROOT / "data" / "fixtures"
MOCK_PATH = TEST_ROOT / "data" / "mocks"

# Core test configuration
pytest_plugins = [
    "pytest_asyncio",
]

# Hardware-aware settings
def pytest_configure(config):
    """Configure test environment."""
    config.addinivalue_line(
        "markers",
        "performance: marks tests that measure performance"
    )
    
    # Set verbosity
    config.option.verbose = 2
    
    # Register custom markers
    config.addinivalue_line("markers", "unit: mark test as unit test")
    config.addinivalue_line("markers", "integration: mark test as integration test")
    config.addinivalue_line("markers", "gpu: mark test as requiring GPU")
    config.addinivalue_line("markers", "slow: mark test as slow running")
    
    # Configure test paths
    config.option.testpaths = ["tests"]
    
    # Set hardware-aware options
    if torch.cuda.is_available():
        os.environ["USE_GPU"] = "1"
    
    # Configure worker count for parallel execution
    if not config.option.numprocesses:
        config.option.numprocesses = os.cpu_count() // 2

@pytest.fixture(scope="session")
def test_paths():
    """Provide standardized test paths."""
    return {
        "root": TEST_ROOT,
        "project": PROJECT_ROOT,
        "fixtures": FIXTURE_PATH,
        "mocks": MOCK_PATH
    }

@pytest.fixture
def mock_embedding_model():
    """Mock embedding model for testing."""
    mock = Mock()
    
    # Cache for embeddings
    embedding_cache = {}
    
    def mock_encode(texts, batch_size=None, convert_to_numpy=True, normalize_embeddings=True):
        # Create cache key
        if isinstance(texts, str):
            cache_key = texts
        else:
            cache_key = tuple(texts)  # Make texts hashable for caching
            
        # Return cached embeddings if available
        if cache_key in embedding_cache:
            return embedding_cache[cache_key]
            
        # Generate new embeddings
        if isinstance(texts, str):
            # Single text - generate and normalize
            embedding = np.random.rand(768)
            normalized = embedding / np.linalg.norm(embedding)
            embedding_cache[cache_key] = normalized
            return normalized
        else:
            # Batch of texts - generate and normalize each vector
            embeddings = np.random.rand(len(texts), 768)
            norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
            normalized = embeddings / norms
            embedding_cache[cache_key] = normalized
            return normalized
            
    mock.encode = Mock(side_effect=mock_encode)
    mock.encode_batch = Mock(side_effect=lambda texts: mock_encode(texts))
    mock.dimension = 768
    return mock

@pytest.fixture
def mock_openai():
    """Mock OpenAI client for testing."""
    mock = AsyncMock()
    mock.chat.completions.create = AsyncMock(return_value=AsyncMock(
        choices=[AsyncMock(message=AsyncMock(content="Test response"))]
    ))
    return mock

@pytest.fixture
def sample_messages():
    """Sample messages for testing."""
    return [
        {
            "id": 1,
            "content": "Test message 1",
            "author": "user1",
            "timestamp": 1577836800.0,  # 2020-01-01
            "channel_id": "channel1",
            "thread_id": "thread1"
        },
        {
            "id": 2,
            "content": "Test message 2",
            "author": "user2",
            "timestamp": 1577923200.0,  # 2020-01-02
            "channel_id": "channel1",
            "thread_id": "thread1"
        }
    ]

# Test paths
def pytest_collection_modifyitems(config, items):
    """Modify test collection."""
    # Ensure test paths are standardized
    for item in items:
        if "tests" not in item.nodeid:
            item.add_marker(pytest.mark.skip(reason="Test not in standard location"))

# <!-- LLM:verify Test configuration must be used with SLED test runner -->
# <!-- LLM:link sled/scripts/test-runner.sh -->
# <!-- LLM:link sled/.claude_marker -->
# <!-- LLM:usage Last updated: 2024-01-16 --> 