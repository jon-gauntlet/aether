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
from unittest.mock import Mock, patch

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
    """Provide standardized test paths.
    
    Future Claudes: Use this to access test data consistently.
    """
    return {
        "root": TEST_ROOT,
        "project": PROJECT_ROOT,
        "fixtures": FIXTURE_PATH,
        "mocks": MOCK_PATH
    }

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