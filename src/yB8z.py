import pytest
import asyncio
import numpy as np
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from lib.autonomic.performance import (
    PerformanceMonitor,
    PerformanceStore,
    PerformanceMetrics,
    ResourceUsage,
    OperationMetrics,
    PerformanceConfig,
    PerformanceAlert,
    AlertSeverity
)

@pytest.fixture
def performance_store(tmp_path):
    """Create performance store instance with temporary storage"""
    store = PerformanceStore()
    store.storage_path = str(tmp_path / "performance")
    store._init_storage()
    return store

@pytest.fixture
def performance_monitor(performance_store):
    """Create performance monitor instance"""
    config = PerformanceConfig(
        collection_interval=1.0,
        aggregation_interval=60.0,
        alert_check_interval=5.0,
        retention_period=timedelta(days=30),
        enable_profiling=True
    )
    monitor = PerformanceMonitor(config)
    monitor.store = performance_store
    return monitor

@pytest.fixture
def performance_metrics():
    """Create test performance metrics"""
    now = datetime.now()
    return [
        PerformanceMetrics(
            id=f"test_metrics_{i}",
            timestamp=now - timedelta(minutes=i),
            resource_usage=ResourceUsage(
                cpu_percent=50.0 + i,
                memory_percent=60.0 + i,
                io_read_bytes=1000000 + i*1000,
                io_write_bytes=2000000 + i*1000,
                network_sent_bytes=3000000 + i*1000,
                network_recv_bytes=4000000 + i*1000
            ),
            operation_metrics={
                'request_count': 1000 + i*10,
                'error_count': i,
                'average_response_time': 100.0 + i
            },
            component_metrics={
                'monitor': {'active': True, 'latency': 50.0},
                'analyzer': {'active': True, 'latency': 75.0},
                'planner': {'active': True, 'latency': 100.0},
                'executor': {'active': True, 'latency': 150.0}
            }
        )
        for i in range(5)
    ]

@pytest.mark.asyncio
async def test_store_metrics(performance_store, performance_metrics):
    """Test metrics storage"""
    # Store metrics
    for metrics in performance_metrics:
        success = await performance_store.store(metrics)
        assert success

    # Retrieve metrics
    for metrics in performance_metrics:
        retrieved = await performance_store.get(metrics.id)
        assert retrieved is not None
        assert retrieved.id == metrics.id
        assert retrieved.resource_usage.cpu_percent == metrics.resource_usage.cpu_percent
        assert retrieved.operation_metrics == metrics.operation_metrics

@pytest.mark.asyncio
async def test_metrics_collection(performance_monitor):
    """Test metrics collection"""
    # Collect metrics
    metrics = await performance_monitor.collect_metrics()
    assert isinstance(metrics, PerformanceMetrics)
    assert metrics.resource_usage is not None
    assert metrics.operation_metrics is not None
    assert metrics.component_metrics is not None

@pytest.mark.asyncio
async def test_metrics_aggregation(performance_store, performance_metrics):
    """Test metrics aggregation"""
    # Store metrics
    for metrics in performance_metrics:
        await performance_store.store(metrics)

    # Aggregate metrics
    start_time = datetime.now() - timedelta(hours=1)
    end_time = datetime.now()
    aggregated = await performance_store.aggregate_metrics(
        start_time=start_time,
        end_time=end_time,
        interval=timedelta(minutes=5)
    )

    assert isinstance(aggregated, dict)
    assert 'cpu_percent' in aggregated
    assert 'memory_percent' in aggregated
    assert 'request_count' in aggregated

@pytest.mark.asyncio
async def test_performance_profiling(performance_monitor):
    """Test performance profiling"""
    # Start profiling
    profile_id = await performance_monitor.start_profiling("test_operation")

    # Simulate operation
    await asyncio.sleep(0.1)

    # Stop profiling
    profile_data = await performance_monitor.stop_profiling(profile_id)
    assert isinstance(profile_data, dict)
    assert 'duration' in profile_data
    assert 'memory_usage' in profile_data
    assert 'cpu_usage' in profile_data

@pytest.mark.asyncio
async def test_alert_generation(performance_monitor, performance_metrics):
    """Test performance alert generation"""
    # Set up alert handler
    alerts = []
    def alert_handler(alert):
        alerts.append(alert)

    performance_monitor.on_alert(alert_handler)

    # Add alert condition
    await performance_monitor.add_alert_condition(
        name="high_cpu",
        condition=lambda m: m.resource_usage.cpu_percent > 80.0,
        severity=AlertSeverity.WARNING
    )

    # Process metrics that should trigger alert
    metrics = performance_metrics[0]
    metrics.resource_usage.cpu_percent = 85.0
    await performance_monitor.process_metrics(metrics)

    # Verify alert generation
    assert len(alerts) > 0
    assert isinstance(alerts[0], PerformanceAlert)
    assert alerts[0].severity == AlertSeverity.WARNING

@pytest.mark.asyncio
async def test_performance_analysis(performance_monitor, performance_metrics):
    """Test performance analysis"""
    # Store historical metrics
    for metrics in performance_metrics:
        await performance_monitor.store.store(metrics)

    # Analyze performance trends
    analysis = await performance_monitor.analyze_performance(
        start_time=datetime.now() - timedelta(hours=1),
        end_time=datetime.now()
    )

    assert isinstance(analysis, dict)
    assert 'trends' in analysis
    assert 'anomalies' in analysis
    assert 'recommendations' in analysis

@pytest.mark.asyncio
async def test_resource_threshold_monitoring(performance_monitor):
    """Test resource threshold monitoring"""
    # Set up threshold handler
    threshold_events = []
    def threshold_handler(metric, value, threshold):
        threshold_events.append((metric, value, threshold))

    performance_monitor.on_threshold_exceeded(threshold_handler)

    # Set thresholds
    thresholds = {
        'cpu_percent': 80.0,
        'memory_percent': 75.0
    }
    await performance_monitor.set_thresholds(thresholds)

    # Process metrics that exceed thresholds
    metrics = PerformanceMetrics(
        id="test",
        timestamp=datetime.now(),
        resource_usage=ResourceUsage(
            cpu_percent=85.0,
            memory_percent=80.0,
            io_read_bytes=0,
            io_write_bytes=0,
            network_sent_bytes=0,
            network_recv_bytes=0
        ),
        operation_metrics={},
        component_metrics={}
    )
    await performance_monitor.process_metrics(metrics)

    # Verify threshold events
    assert len(threshold_events) == 2  # Both CPU and memory thresholds exceeded

@pytest.mark.asyncio
async def test_performance_reporting(performance_monitor, performance_metrics):
    """Test performance reporting"""
    # Store metrics
    for metrics in performance_metrics:
        await performance_monitor.store.store(metrics)

    # Generate report
    report = await performance_monitor.generate_report(
        start_time=datetime.now() - timedelta(hours=1),
        end_time=datetime.now(),
        include_components=True,
        include_operations=True
    )

    assert isinstance(report, dict)
    assert 'summary' in report
    assert 'components' in report
    assert 'operations' in report
    assert 'recommendations' in report

@pytest.mark.asyncio
async def test_component_performance_tracking(performance_monitor):
    """Test component performance tracking"""
    # Start component tracking
    await performance_monitor.start_component_tracking("test_component")

    # Record operations
    for i in range(5):
        await performance_monitor.record_operation(
            component="test_component",
            operation="test_operation",
            duration=100.0 + i,
            success=True
        )

    # Get component metrics
    metrics = await performance_monitor.get_component_metrics("test_component")
    assert isinstance(metrics, dict)
    assert 'operation_count' in metrics
    assert 'average_duration' in metrics
    assert 'success_rate' in metrics

@pytest.mark.asyncio
async def test_performance_data_export(performance_monitor, performance_metrics):
    """Test performance data export"""
    # Store metrics
    for metrics in performance_metrics:
        await performance_monitor.store.store(metrics)

    # Export data
    export_data = await performance_monitor.export_performance_data(
        start_time=datetime.now() - timedelta(hours=1),
        end_time=datetime.now(),
        format='json'
    )
    assert isinstance(export_data, str)
    assert len(export_data) > 0

@pytest.mark.asyncio
async def test_monitor_start_stop(performance_monitor):
    """Test monitor start/stop"""
    # Start monitor
    await performance_monitor.start()
    assert performance_monitor.active

    # Let it run briefly
    await asyncio.sleep(2)

    # Stop monitor
    await performance_monitor.stop()
    assert not performance_monitor.active

@pytest.mark.asyncio
async def test_monitor_error_handling(performance_monitor):
    """Test monitor error handling"""
    # Mock collect_metrics to raise an exception
    async def mock_collect(*args):
        raise Exception("Test error")

    performance_monitor.collect_metrics = mock_collect

    # Start monitor
    await performance_monitor.start()
    assert performance_monitor.active

    # Let it try to collect metrics
    await asyncio.sleep(2)

    # Verify monitor is still running
    assert performance_monitor.active

    # Stop monitor
    await performance_monitor.stop()
    assert not performance_monitor.active

@pytest.mark.asyncio
async def test_performance_cleanup(performance_monitor, performance_metrics):
    """Test performance data cleanup"""
    # Store metrics
    for metrics in performance_metrics:
        await performance_monitor.store.store(metrics)

    # Add old metrics
    old_metrics = performance_metrics[0].copy()
    old_metrics.id = "old_metrics"
    old_metrics.timestamp = datetime.now() - timedelta(days=60)
    await performance_monitor.store.store(old_metrics)

    # Run cleanup
    cleaned = await performance_monitor.cleanup(max_age=timedelta(days=30))
    assert cleaned > 0 