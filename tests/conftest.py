"""Test configuration and helpers for faster debugging."""
import pytest
import logging
from typing import Generator, Any
from pathlib import Path
from _pytest.fixtures import SubRequest

# Configure logging for better test output
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)

logger = logging.getLogger(__name__)

def pytest_configure(config):
    """Configure test run for optimal debugging."""
    # Register custom markers
    config.addinivalue_line("markers", "unit: mark test as unit test")
    config.addinivalue_line("markers", "fast: mark test as fast test")
    config.addinivalue_line("markers", "integration: mark test as integration test")
    config.addinivalue_line("markers", "slow: mark test as slow running")
    
    # Show test progress
    reporter = config.pluginmanager.getplugin('terminalreporter')
    reporter.verbosity = 2
    reporter.showfspath = False

def pytest_runtest_setup(item):
    """Log test start for better visibility during debugging."""
    logger.info(f"\nRunning: {item.name}")

def pytest_runtest_logreport(report):
    """Enhanced test reporting for faster debugging."""
    if report.failed:
        logger.error(f"\nTest failed: {report.nodeid}")
        if report.longrepr:
            # Extract relevant error info
            lines = str(report.longrepr).split('\n')
            error_msg = '\n'.join(lines[-5:]) if len(lines) > 5 else '\n'.join(lines)
            logger.error(f"Error:\n{error_msg}")

@pytest.fixture(scope="session")
def test_data_dir() -> Path:
    """Fast access to test data directory."""
    return Path(__file__).parent / "data"

@pytest.fixture
def mock_embeddings():
    """Fast mock for embeddings."""
    return lambda x: [0.1] * 384  # Typical embedding size

@pytest.fixture
def mock_rag_system(mock_embeddings):
    """Quick RAG system for testing."""
    from rag_aether.ai.rag_system import RAGSystem
    
    system = RAGSystem(
        use_mock_embeddings=True,
        embedding_fn=mock_embeddings
    )
    return system

@pytest.fixture
def capture_logs(caplog) -> Generator[Any, None, None]:
    """Capture logs with proper cleanup."""
    caplog.set_level(logging.INFO)
    yield caplog
    caplog.clear()

def pytest_addoption(parser):
    """Add custom options for faster test runs."""
    parser.addoption(
        "--quick",
        action="store_true",
        default=False,
        help="run only quick tests"
    )
    parser.addoption(
        "--focus",
        action="store",
        help="run only tests containing this string"
    )

def pytest_collection_modifyitems(config, items):
    """Smart test selection for faster debugging."""
    # Handle quick mode
    if config.getoption("--quick"):
        skip_slow = pytest.mark.skip(reason="not running slow tests")
        for item in items:
            if "slow" in item.keywords:
                item.add_marker(skip_slow)
    
    # Handle focus mode
    focus = config.getoption("--focus")
    if focus:
        focus = focus.lower()
        selected = []
        deselected = []
        for item in items:
            if focus in item.name.lower():
                selected.append(item)
            else:
                deselected.append(item)
        config.hook.pytest_deselected(items=deselected)
        items[:] = selected 