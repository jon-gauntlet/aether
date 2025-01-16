"""Performance tests for RAG system."""
import pytest
import time
from rag_aether.ai.rag_system import RAGSystem
from rag_aether.core.performance import (
    with_performance_monitoring,
    performance_section,
    get_performance_stats,
    reset_performance_stats
)
from langchain.schema import Document

@pytest.fixture(autouse=True)
def clear_performance_stats():
    """Clear performance stats before each test."""
    reset_performance_stats()
    yield

def test_performance_decorator():
    """Test performance monitoring decorator."""
    @with_performance_monitoring
    def test_func():
        time.sleep(0.1)
        return True
    
    result = test_func()
    assert result is True
    
    stats = get_performance_stats()
    assert "test_func" in stats
    assert stats["test_func"]["calls"] == 1
    assert 0.1 <= stats["test_func"]["total_time"] <= 0.15

def test_performance_section():
    """Test performance section context manager."""
    with performance_section("test_section"):
        time.sleep(0.1)
    
    stats = get_performance_stats()
    assert "test_section" in stats
    assert stats["test_section"]["calls"] == 1
    assert 0.1 <= stats["test_section"]["total_time"] <= 0.15

def test_nested_performance_sections():
    """Test nested performance sections."""
    with performance_section("outer"):
        time.sleep(0.1)
        with performance_section("inner"):
            time.sleep(0.1)
    
    stats = get_performance_stats()
    assert "outer" in stats
    assert "inner" in stats
    assert 0.2 <= stats["outer"]["total_time"] <= 0.25
    assert 0.1 <= stats["inner"]["total_time"] <= 0.15

def test_performance_error_handling():
    """Test performance monitoring with errors."""
    @with_performance_monitoring
    def error_func():
        time.sleep(0.1)
        raise ValueError("Test error")
    
    with pytest.raises(ValueError):
        error_func()
    
    stats = get_performance_stats()
    assert "error_func" in stats
    assert stats["error_func"]["calls"] == 1
    assert 0.1 <= stats["error_func"]["total_time"] <= 0.15

@pytest.mark.performance
def test_rag_system_performance():
    """Test RAG system performance."""
    # Initialize system
    rag = RAGSystem(model_name="BAAI/bge-small-en")
    
    # Sample documents
    docs = [
        Document(text="This is a test document about performance testing.", metadata={"id": 1}),
        Document(text="Another document discussing system benchmarks.", metadata={"id": 2}),
        Document(text="Document about optimization techniques.", metadata={"id": 3})
    ]
    
    # Time document ingestion
    start = time.time()
    rag.ingest_documents(docs)
    ingest_duration = time.time() - start
    
    # Time search operation
    start = time.time()
    results = rag.search("performance optimization", k=3)
    duration = time.time() - start
    
    # Assert reasonable performance
    assert ingest_duration <= 5.0  # Ingestion should complete within 5 seconds
    assert duration <= 3.0  # Search should complete within 3 seconds
    assert len(results) == 3  # Should return requested number of results
    
    # Check result quality
    assert any("performance" in r.text.lower() for r in results)
    assert all(r.score >= 0.0 for r in results)
    assert all(r.score <= 1.0 for r in results)
    
    stats = get_performance_stats()
    assert "search" in stats
    assert stats["search"]["calls"] == 1
    
    # Test query performance
    start = time.perf_counter()
    response = rag.query("test query", k=3)
    duration = time.perf_counter() - start
    
    assert duration <= 1.0  # Query should complete within 1 second
    assert "results" in response
    
    stats = get_performance_stats()
    assert "query" in stats
    assert stats["query"]["calls"] == 1

def test_performance_stats_reset():
    """Test performance stats reset."""
    @with_performance_monitoring
    def test_func():
        time.sleep(0.1)
    
    test_func()
    assert len(get_performance_stats()) > 0
    
    reset_performance_stats()
    assert len(get_performance_stats()) == 0

def test_concurrent_performance_monitoring():
    """Test performance monitoring with concurrent operations."""
    import threading
    
    @with_performance_monitoring
    def worker_func():
        time.sleep(0.1)
    
    threads = []
    for _ in range(3):
        thread = threading.Thread(target=worker_func)
        thread.start()
        threads.append(thread)
    
    for thread in threads:
        thread.join()
    
    stats = get_performance_stats()
    assert "worker_func" in stats
    assert stats["worker_func"]["calls"] == 3 