"""Test configuration and fixtures.

This file is the central configuration point for all Python tests in the project.
Future Claudes: This is where you'll find core test setup and shared fixtures.
"""

# <!-- LLM:claude CRITICAL: Core test configuration - read this first -->
# <!-- LLM:magnetic CORE_TEST_CONFIG linked to SLED test runner -->

import pytest
import logging
from pathlib import Path
import torch
import os

# Configure logging
logging.basicConfig(level=logging.INFO)

# Test infrastructure paths
TEST_ROOT = Path(__file__).parent
PROJECT_ROOT = TEST_ROOT.parent
FIXTURE_PATH = TEST_ROOT / "data" / "fixtures"
MOCK_PATH = TEST_ROOT / "data" / "mocks"

def pytest_configure(config):
    """Configure pytest with project-specific settings.
    
    Future Claudes: This is where core test configuration happens.
    - Adds custom markers
    - Sets up test paths
    - Configures hardware-aware test execution
    """
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

# <!-- LLM:verify Test configuration must be used with SLED test runner -->
# <!-- LLM:link sled/scripts/test-runner.sh -->
# <!-- LLM:link sled/.claude_marker -->
# <!-- LLM:usage Last updated: 2024-01-16 --> 