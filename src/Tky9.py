import pytest
import asyncio
import psutil
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from lib.autonomic.metrics import (
    MetricsCollector,
    MetricsStore,
    SystemMetrics,
    ResourceMetrics,
    ProcessMetrics,
    MetricsConfig
)

@pytest.fixture
def metrics_store(tmp_path):
    """Create metrics store instance with temporary storage"""
    store = MetricsStore()
    store.storage_path = str(tmp_path / "metrics")
    store._init_storage()
    return store

@pytest.fixture
def metrics_collector(metrics_store):
    """Create metrics collector instance"""
    config = MetricsConfig(
        collection_interval=1.0,
        storage_interval=5.0,
        max_samples=1000,
        process_names=['python', 'node']
    )
    collector = MetricsCollector(config)
    collector.store = metrics_store
    return collector

@pytest.fixture
def system_metrics():
    """Create test system metrics"""
    now = datetime.now()
    return [
        SystemMetrics(
            timestamp=now - timedelta(minutes=i),
            cpu_percent=50.0 + i,
            memory_percent=60.0 + i,
            swap_percent=20.0 + i/2,
            disk_usage={
                '/': {
                    'total': 500_000_000_000,
                    'used': 250_000_000_000,
                    'free': 250_000_000_000
                }
            },
            network_io={
                'bytes_sent': 1000000 + i*1000,
                'bytes_recv': 2000000 + i*1000,
                'packets_sent': 1000 + i,
                'packets_recv': 2000 + i
            },
            system_load=[2.5, 2.0, 1.5]
        )
        for i in range(5)
    ]

@pytest.fixture
def process_metrics():
    """Create test process metrics"""
    now = datetime.now()
    return [
        ProcessMetrics(
            timestamp=now - timedelta(minutes=i),
            name='python',
            pid=1000 + i,
            cpu_percent=25.0 + i,
            memory_percent=30.0 + i,
            threads=4,
            open_files=10 + i,
            connections=2 + i,
            io_counters={
                'read_bytes': 100000 + i*1000,
                'write_bytes': 200000 + i*1000
            }
        )
        for i in range(5)
    ]

@pytest.mark.asyncio
async def test_store_metrics(metrics_store, system_metrics, process_metrics):
    """Test metrics storage"""
    # Store system metrics
    for metrics in system_metrics:
        success = await metrics_store.store_system_metrics(metrics)
        assert success

    # Store process metrics
    for metrics in process_metrics:
        success = await metrics_store.store_process_metrics(metrics)
        assert success

    # Retrieve metrics
    start_time = datetime.now() - timedelta(minutes=5)
    end_time = datetime.now()
    
    retrieved_system = await metrics_store.get_system_metrics(start_time, end_time)
    assert len(retrieved_system) > 0
    assert all(isinstance(m, SystemMetrics) for m in retrieved_system)

    retrieved_process = await metrics_store.get_process_metrics(start_time, end_time)
    assert len(retrieved_process) > 0
    assert all(isinstance(m, ProcessMetrics) for m in retrieved_process)

@pytest.mark.asyncio
async def test_collect_system_metrics(metrics_collector):
    """Test system metrics collection"""
    # Collect metrics
    metrics = await metrics_collector._collect_system_metrics()
    assert isinstance(metrics, SystemMetrics)
    assert metrics.timestamp is not None
    assert isinstance(metrics.cpu_percent, float)
    assert isinstance(metrics.memory_percent, float)
    assert isinstance(metrics.disk_usage, dict)
    assert isinstance(metrics.network_io, dict)
    assert isinstance(metrics.system_load, list)

@pytest.mark.asyncio
async def test_collect_process_metrics(metrics_collector):
    """Test process metrics collection"""
    # Mock process list
    mock_process = Mock()
    mock_process.name = Mock(return_value='python')
    mock_process.pid = 1000
    mock_process.cpu_percent = Mock(return_value=25.0)
    mock_process.memory_percent = Mock(return_value=30.0)
    mock_process.num_threads = Mock(return_value=4)
    mock_process.open_files = Mock(return_value=[])
    mock_process.connections = Mock(return_value=[])
    mock_process.io_counters = Mock(return_value=psutil._pslinux.pio(
        read_bytes=100000,
        write_bytes=200000,
        read_chars=300000,
        write_chars=400000
    ))

    with patch('psutil.process_iter', return_value=[mock_process]):
        # Collect metrics
        metrics = await metrics_collector._collect_process_metrics()
        assert len(metrics) > 0
        assert all(isinstance(m, ProcessMetrics) for m in metrics)

@pytest.mark.asyncio
async def test_metrics_aggregation(metrics_store, system_metrics):
    """Test metrics aggregation"""
    # Store metrics
    for metrics in system_metrics:
        await metrics_store.store_system_metrics(metrics)

    # Aggregate metrics
    start_time = datetime.now() - timedelta(minutes=5)
    end_time = datetime.now()
    aggregated = await metrics_store.aggregate_system_metrics(
        start_time,
        end_time,
        interval=timedelta(minutes=1)
    )

    assert isinstance(aggregated, dict)
    assert 'cpu_percent' in aggregated
    assert 'memory_percent' in aggregated
    assert all(isinstance(v, list) for v in aggregated.values())

@pytest.mark.asyncio
async def test_metrics_cleanup(metrics_store, system_metrics, process_metrics):
    """Test metrics cleanup"""
    # Store metrics
    for metrics in system_metrics:
        await metrics_store.store_system_metrics(metrics)
    for metrics in process_metrics:
        await metrics_store.store_process_metrics(metrics)

    # Add old metrics
    old_system = system_metrics[0]
    old_system.timestamp = datetime.now() - timedelta(days=30)
    await metrics_store.store_system_metrics(old_system)

    old_process = process_metrics[0]
    old_process.timestamp = datetime.now() - timedelta(days=30)
    await metrics_store.store_process_metrics(old_process)

    # Run cleanup
    cleaned = await metrics_store.cleanup(max_age=timedelta(days=7))
    assert cleaned > 0

@pytest.mark.asyncio
async def test_collector_start_stop(metrics_collector):
    """Test collector start/stop"""
    # Start collector
    await metrics_collector.start()
    assert metrics_collector.active

    # Let it collect some metrics
    await asyncio.sleep(2)

    # Stop collector
    await metrics_collector.stop()
    assert not metrics_collector.active

@pytest.mark.asyncio
async def test_collector_error_handling(metrics_collector):
    """Test collector error handling"""
    # Mock collect_system_metrics to raise an exception
    async def mock_collect(*args):
        raise Exception("Test error")

    metrics_collector._collect_system_metrics = mock_collect

    # Start collector
    await metrics_collector.start()
    assert metrics_collector.active

    # Let it try to collect metrics
    await asyncio.sleep(2)

    # Verify collector is still running
    assert metrics_collector.active

    # Stop collector
    await metrics_collector.stop()
    assert not metrics_collector.active

@pytest.mark.asyncio
async def test_metrics_query(metrics_store, system_metrics):
    """Test metrics querying"""
    # Store metrics
    for metrics in system_metrics:
        await metrics_store.store_system_metrics(metrics)

    # Query metrics
    query_results = await metrics_store.query_metrics(
        metric_type="system",
        fields=["cpu_percent", "memory_percent"],
        filters={
            "cpu_percent": {"gt": 50.0},
            "memory_percent": {"lt": 70.0}
        },
        sort_by="timestamp",
        limit=10
    )

    assert isinstance(query_results, list)
    assert len(query_results) > 0
    assert all(50.0 < m.cpu_percent < 70.0 for m in query_results) 