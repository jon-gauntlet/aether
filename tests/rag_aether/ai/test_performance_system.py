"""Tests for RAG performance optimization system."""
import pytest
import asyncio
import time
from unittest.mock import Mock, patch
import numpy as np

from rag_aether.ai.performance_system import (
    PerformanceMonitor,
    PerformanceOptimizer,
    PerformanceMetrics,
    ResourceUsage,
    with_performance_monitoring
)

@pytest.fixture
def performance_monitor():
    """Fixture for performance monitor."""
    return PerformanceMonitor(
        window_size=10,
        log_interval=1.0,
        enable_gpu=False
    )

@pytest.fixture
def performance_optimizer(performance_monitor):
    """Fixture for performance optimizer."""
    return PerformanceOptimizer(
        monitor=performance_monitor,
        target_latency=0.1,
        target_memory=70.0,
        optimization_interval=1.0
    )

def test_performance_context(performance_monitor):
    """Test performance measurement context."""
    with performance_monitor.measure("test_op") as perf:
        # Simulate work
        time.sleep(0.1)
        perf.set_batch_size(5)
        perf.add_metadata(test_key="test_value")
        
    # Check recorded metrics
    metrics = performance_monitor.get_metrics("test_op")
    assert len(metrics) == 1
    
    metric = metrics[0]
    assert metric.operation == "test_op"
    assert metric.batch_size == 5
    assert metric.latency >= 0.1
    assert metric.metadata["test_key"] == "test_value"

def test_resource_monitoring(performance_monitor):
    """Test system resource monitoring."""
    usage = performance_monitor.get_resource_usage()
    
    assert 0 <= usage.cpu_percent <= 100
    assert 0 <= usage.memory_percent <= 100
    assert isinstance(usage.disk_io, dict)
    assert isinstance(usage.network_io, dict)

def test_metrics_statistics(performance_monitor):
    """Test metrics statistical calculations."""
    # Add sample metrics
    for i in range(5):
        metrics = PerformanceMetrics(
            latency=0.1 * (i + 1),
            throughput=10.0 / (i + 1),
            memory_usage=50.0 + i,
            cpu_usage=30.0 + i,
            gpu_usage=None,
            batch_size=1,
            timestamp="2024-01-15T10:00:00",
            operation="test_op",
            metadata={}
        )
        performance_monitor.record_metrics(metrics, "test_op")
        
    # Get statistics
    stats = performance_monitor.get_statistics("test_op")
    
    # Check statistics structure
    for field in ["latency", "throughput", "memory_usage", "cpu_usage"]:
        assert field in stats
        field_stats = stats[field]
        assert "mean" in field_stats
        assert "std" in field_stats
        assert "min" in field_stats
        assert "max" in field_stats
        assert "p95" in field_stats
        
    # Verify some specific values
    assert 0.1 <= stats["latency"]["mean"] <= 0.5
    assert stats["memory_usage"]["min"] >= 50.0
    assert stats["cpu_usage"]["max"] <= 35.0

@pytest.mark.asyncio
async def test_performance_optimization(performance_optimizer):
    """Test performance optimization process."""
    # Add metrics indicating high latency
    metrics = PerformanceMetrics(
        latency=1.0,  # High latency
        throughput=1.0,
        memory_usage=90.0,  # High memory usage
        cpu_usage=50.0,
        gpu_usage=None,
        batch_size=10,
        timestamp="2024-01-15T10:00:00",
        operation="test_op",
        metadata={}
    )
    performance_optimizer.monitor.record_metrics(metrics, "test_op")
    
    # Run optimization
    await performance_optimizer.optimize("test_op")
    
    # Check optimization results
    assert performance_optimizer.get_batch_size("test_op") < 10  # Should reduce batch size
    assert performance_optimizer.get_cache_size("test_op") < 1000  # Should reduce cache size

@pytest.mark.asyncio
async def test_optimization_thresholds(performance_optimizer):
    """Test optimization threshold behavior."""
    # Add metrics within acceptable thresholds
    metrics = PerformanceMetrics(
        latency=0.05,  # Below target
        throughput=20.0,
        memory_usage=60.0,  # Below target
        cpu_usage=30.0,
        gpu_usage=None,
        batch_size=1,
        timestamp="2024-01-15T10:00:00",
        operation="test_op",
        metadata={}
    )
    performance_optimizer.monitor.record_metrics(metrics, "test_op")
    
    # Initial values
    initial_batch_size = performance_optimizer.get_batch_size("test_op")
    initial_cache_size = performance_optimizer.get_cache_size("test_op")
    
    # Run optimization
    await performance_optimizer.optimize("test_op")
    
    # Check that values increased or stayed same
    assert performance_optimizer.get_batch_size("test_op") >= initial_batch_size
    assert performance_optimizer.get_cache_size("test_op") >= initial_cache_size

@pytest.mark.asyncio
async def test_optimization_interval(performance_optimizer):
    """Test optimization interval enforcement."""
    # First optimization
    await performance_optimizer.optimize("test_op")
    first_time = performance_optimizer.last_optimization
    
    # Immediate second attempt
    await performance_optimizer.optimize("test_op")
    second_time = performance_optimizer.last_optimization
    
    # Should not have optimized again
    assert first_time == second_time

class TestClass:
    """Test class for performance monitoring decorator."""
    
    def __init__(self):
        self.performance_monitor = PerformanceMonitor(
            window_size=10,
            log_interval=1.0,
            enable_gpu=False
        )
        
    @with_performance_monitoring("test_operation")
    async def test_method(self, arg1, arg2, kwarg1=None):
        """Test method with performance monitoring."""
        await asyncio.sleep(0.1)
        return arg1 + arg2

@pytest.mark.asyncio
async def test_performance_decorator():
    """Test performance monitoring decorator."""
    test_obj = TestClass()
    
    # Call monitored method
    result = await test_obj.test_method(1, 2, kwarg1="test")
    assert result == 3
    
    # Check recorded metrics
    metrics = test_obj.performance_monitor.get_metrics("test_operation")
    assert len(metrics) == 1
    
    metric = metrics[0]
    assert metric.operation == "test_operation"
    assert metric.latency >= 0.1
    assert metric.metadata["function"] == "test_method"
    assert metric.metadata["args_length"] == 2
    assert "kwarg1" in metric.metadata["kwargs_keys"]

def test_gpu_monitoring():
    """Test GPU monitoring initialization."""
    with patch("torch.cuda.is_available", return_value=True):
        with patch("pynvml.nvmlInit"), \
             patch("pynvml.nvmlDeviceGetHandleByIndex"), \
             patch("pynvml.nvmlDeviceGetUtilizationRates") as mock_gpu:
            
            # Mock GPU utilization
            mock_gpu.return_value = Mock(gpu=50)
            
            monitor = PerformanceMonitor(enable_gpu=True)
            usage = monitor.get_resource_usage()
            
            assert usage.gpu_percent == 50

def test_metrics_window(performance_monitor):
    """Test metrics window behavior."""
    # Add more metrics than window size
    window_size = performance_monitor.window_size
    
    for i in range(window_size + 5):
        metrics = PerformanceMetrics(
            latency=0.1,
            throughput=10.0,
            memory_usage=50.0,
            cpu_usage=30.0,
            gpu_usage=None,
            batch_size=1,
            timestamp="2024-01-15T10:00:00",
            operation="test_op",
            metadata={}
        )
        performance_monitor.record_metrics(metrics, "test_op")
        
    # Check window size enforcement
    metrics = performance_monitor.get_metrics("test_op")
    assert len(metrics) == window_size

def test_error_handling(performance_monitor):
    """Test error handling in performance context."""
    try:
        with performance_monitor.measure("test_op"):
            raise ValueError("Test error")
    except ValueError:
        pass
        
    # Should not have recorded metrics for failed operation
    metrics = performance_monitor.get_metrics("test_op")
    assert len(metrics) == 0 