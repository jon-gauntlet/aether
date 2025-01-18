"""Test utilities for RAG system tests."""
from typing import Dict, Any
import time
import psutil
import hypothesis.strategies as st
from datetime import datetime
from contextlib import asynccontextmanager

def text_content_strategy():
    """Strategy for generating text content."""
    return st.text(
        min_size=1,
        max_size=1000,
        alphabet=st.characters(blacklist_categories=('Cs',))
    )

def metadata_strategy():
    """Strategy for generating metadata."""
    return st.fixed_dictionaries({
        'timestamp': st.builds(
            lambda: datetime.now().isoformat()
        ),
        'source': st.text(min_size=1, max_size=20),
        'author': st.text(min_size=1, max_size=20),
        'tags': st.lists(st.text(min_size=1, max_size=10), min_size=0, max_size=5)
    })

def assert_results_ordered(scores: list):
    """Assert that results are ordered by score."""
    assert all(scores[i] >= scores[i + 1] for i in range(len(scores) - 1))

def assert_response_quality(response: str, min_length: int = 10):
    """Assert that response meets quality criteria."""
    assert len(response) >= min_length
    assert response.strip() == response
    assert response[0].isupper()
    assert response[-1] in '.!?'

class PerformanceMetrics:
    """Container for performance metrics."""
    
    def __init__(self, duration: float, memory_usage: int, throughput: float):
        self.duration = duration
        self.memory_usage = memory_usage
        self.throughput = throughput

def measure_performance(func, *args, **kwargs) -> PerformanceMetrics:
    """Measure performance metrics of a function."""
    process = psutil.Process()
    start_memory = process.memory_info().rss
    start_time = time.time()
    
    # Execute function
    result = func(*args, **kwargs)
    
    # Calculate metrics
    end_time = time.time()
    end_memory = process.memory_info().rss
    duration = end_time - start_time
    memory_usage = end_memory - start_memory
    throughput = len(args[0]) / duration if args else 0
    
    return PerformanceMetrics(duration, memory_usage, throughput)

@asynccontextmanager
async def mock_async_context():
    """Mock async context for testing."""
    try:
        yield
    finally:
        pass 