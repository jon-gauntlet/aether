import os
import pytest
import asyncio
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from lib.autonomic.monitor import SystemMonitor, SystemMetrics, MetricsStore

@pytest.fixture
def metrics_store(tmp_path):
    """Create a temporary metrics store"""
    store = MetricsStore()
    store.base_path = str(tmp_path)
    return store

@pytest.fixture
def monitor(metrics_store):
    """Create a monitor instance"""
    monitor = SystemMonitor()
    monitor.store = metrics_store
    return monitor

@pytest.mark.asyncio
async def test_collect_metrics(monitor):
    """Test metrics collection"""
    # Collect metrics
    metrics = await monitor._collect_metrics()
    
    # Verify metrics
    assert isinstance(metrics, SystemMetrics)
    assert isinstance(metrics.timestamp, datetime)
    assert isinstance(metrics.cpu_percent, float)
    assert isinstance(metrics.memory_percent, float)
    assert isinstance(metrics.context_count, int)
    assert isinstance(metrics.pattern_count, int)
    
    # Check value ranges
    assert 0 <= metrics.cpu_percent <= 100
    assert 0 <= metrics.memory_percent <= 100
    assert metrics.context_count >= 0
    assert metrics.pattern_count >= 0

@pytest.mark.asyncio
async def test_store_metrics(metrics_store):
    """Test metrics storage"""
    # Create test metrics
    metrics = SystemMetrics(
        timestamp=datetime.now(),
        cpu_percent=50.0,
        memory_percent=60.0,
        context_count=100,
        pattern_count=50
    )
    
    # Store metrics
    stored = await metrics_store.store_metrics([metrics])
    assert stored == 1
    
    # Retrieve metrics
    end_time = datetime.now()
    start_time = end_time - timedelta(hours=1)
    retrieved = await metrics_store.get_metrics(start_time, end_time)
    
    # Verify retrieved metrics
    assert len(retrieved) == 1
    assert retrieved[0].cpu_percent == metrics.cpu_percent
    assert retrieved[0].memory_percent == metrics.memory_percent
    assert retrieved[0].context_count == metrics.context_count
    assert retrieved[0].pattern_count == metrics.pattern_count

@pytest.mark.asyncio
async def test_monitor_start_stop(monitor):
    """Test monitor start/stop"""
    # Start monitor
    await monitor.start()
    assert monitor.active
    
    # Let it run briefly
    await asyncio.sleep(2)
    
    # Stop monitor
    await monitor.stop()
    assert not monitor.active

@pytest.mark.asyncio
async def test_metrics_cleanup(metrics_store):
    """Test metrics cleanup"""
    # Create old metrics
    old_metrics = SystemMetrics(
        timestamp=datetime.now() - timedelta(days=8),
        cpu_percent=50.0,
        memory_percent=60.0,
        context_count=100,
        pattern_count=50
    )
    
    # Create recent metrics
    recent_metrics = SystemMetrics(
        timestamp=datetime.now(),
        cpu_percent=55.0,
        memory_percent=65.0,
        context_count=110,
        pattern_count=55
    )
    
    # Store both metrics
    await metrics_store.store_metrics([old_metrics, recent_metrics])
    
    # Run cleanup
    deleted = await metrics_store.cleanup(max_age=timedelta(days=7))
    assert deleted == 1
    
    # Verify only recent metrics remain
    end_time = datetime.now()
    start_time = end_time - timedelta(days=1)
    remaining = await metrics_store.get_metrics(start_time, end_time)
    
    assert len(remaining) == 1
    assert remaining[0].cpu_percent == recent_metrics.cpu_percent

@pytest.mark.asyncio
async def test_monitor_error_handling(monitor):
    """Test monitor error handling"""
    # Mock _collect_metrics to raise an exception
    async def mock_collect():
        raise Exception("Test error")
        
    monitor._collect_metrics = mock_collect
    
    # Start monitor
    await monitor.start()
    assert monitor.active
    
    # Let it try to collect metrics
    await asyncio.sleep(2)
    
    # Verify monitor is still running
    assert monitor.active
    
    # Stop monitor
    await monitor.stop()
    assert not monitor.active 