"""Tests for RAG performance optimization system."""
import pytest
import numpy as np
from unittest.mock import patch, MagicMock
import time
import threading
from rag_aether.ai.performance_system import (
    PerformanceMonitor,
    with_performance_monitoring,
    performance_section
)
from rag_aether.ai.performance_optimizer import (
    PerformanceOptimizer,
    PerformanceMetrics,
    ResourceUsage
)

def test_performance_monitoring():
    monitor = PerformanceMonitor()
    
    # Record some operations
    monitor.record_operation("test_op", 0.1)
    monitor.record_operation("test_op", 0.2)
    
    # Get metrics
    metrics = monitor.get_metrics()
    
    assert "operations" in metrics
    assert "test_op" in metrics["operations"]
    assert metrics["operations"]["test_op"]["count"] == 2
    assert metrics["operations"]["test_op"]["avg_time"] > 0

def test_performance_decorator():
    monitor = PerformanceMonitor()
    
    @with_performance_monitoring
    def test_func():
        time.sleep(0.1)
        return "test"
        
    result = test_func()
    assert result == "test"
    
    metrics = monitor.get_metrics()
    assert "test_func" in metrics["operations"]
    assert metrics["operations"]["test_func"]["count"] == 1

def test_performance_context():
    monitor = PerformanceMonitor()
    
    with performance_section("test_section"):
        time.sleep(0.1)
        
    metrics = monitor.get_metrics()
    assert "test_section" in metrics["operations"]
    assert metrics["operations"]["test_section"]["count"] == 1

def test_concurrent_monitoring():
    monitor = PerformanceMonitor()
    results = []
    
    def worker():
        with performance_section("worker_op"):
            time.sleep(0.1)
            results.append("done")
            
    threads = [threading.Thread(target=worker) for _ in range(3)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
        
    metrics = monitor.get_metrics()
    assert "worker_op" in metrics["operations"]
    assert metrics["operations"]["worker_op"]["count"] == 3
    assert len(results) == 3

def test_performance_error_handling():
    monitor = PerformanceMonitor()
    
    @with_performance_monitoring
    def error_func():
        time.sleep(0.1)
        raise ValueError("Test error")
        
    with pytest.raises(ValueError):
        error_func()
        
    metrics = monitor.get_metrics()
    assert "error_func" in metrics["operations"]
    assert metrics["operations"]["error_func"]["count"] == 1

def test_optimizer_initialization():
    optimizer = PerformanceOptimizer()
    assert optimizer.min_batch_size == 32
    assert optimizer.max_batch_size == 256
    assert optimizer.target_latency_ms == 100.0
    assert optimizer.min_success_rate == 0.95

def test_embedding_optimization():
    optimizer = PerformanceOptimizer()
    embeddings = np.random.rand(10, 768)
    
    optimized = optimizer.optimize_embeddings(embeddings)
    assert optimized.dtype == np.float16
    assert optimized.shape == embeddings.shape

def test_query_optimization():
    optimizer = PerformanceOptimizer()
    query = "  TEST Query  "
    
    optimized, metadata = optimizer.optimize_query(query)
    assert optimized == "test query"
    assert metadata["original_length"] == len(query)
    assert metadata["optimized_length"] == len(optimized)

def test_metrics_update():
    optimizer = PerformanceOptimizer()
    metrics = PerformanceMetrics(
        operation_name="test",
        duration_ms=50.0,
        memory_mb=100.0,
        success=True
    )
    
    optimizer.update_metrics(metrics)
    assert len(optimizer.metrics) == 1
    assert optimizer.get_batch_size() == optimizer.min_batch_size

def test_resource_usage():
    usage = ResourceUsage.capture()
    assert usage.cpu_percent >= 0
    assert usage.memory_mb > 0
    assert usage.disk_io_read >= 0
    assert usage.disk_io_write >= 0
    assert usage.network_io_sent >= 0
    assert usage.network_io_recv >= 0
    assert usage.timestamp > 0 