import pytest
import asyncio
import logging
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from lib.autonomic.logging import (
    LogManager,
    LogStore,
    LogEntry,
    LogLevel,
    LogFilter,
    MonitoringConfig
)

@pytest.fixture
def log_store(tmp_path):
    """Create log store instance with temporary storage"""
    store = LogStore()
    store.storage_path = str(tmp_path / "logs")
    store._init_storage()
    return store

@pytest.fixture
def log_manager(log_store):
    """Create log manager instance"""
    config = MonitoringConfig(
        max_log_size=1024*1024,  # 1MB
        rotation_interval=timedelta(days=1),
        retention_period=timedelta(days=30),
        min_level=LogLevel.INFO,
        enable_console=True,
        enable_file=True
    )
    manager = LogManager(config)
    manager.store = log_store
    return manager

@pytest.fixture
def log_entries():
    """Create test log entries"""
    now = datetime.now()
    return [
        LogEntry(
            id="test_log_001",
            timestamp=now - timedelta(minutes=i),
            level=LogLevel.INFO,
            component="test_component",
            message="Test log message",
            context={
                'operation': 'test_operation',
                'status': 'success'
            },
            metadata={
                'source': 'test',
                'version': '1.0.0'
            }
        )
        for i in range(5)
    ] + [
        LogEntry(
            id="test_log_error_001",
            timestamp=now - timedelta(minutes=10),
            level=LogLevel.ERROR,
            component="test_component",
            message="Test error message",
            context={
                'operation': 'test_operation',
                'status': 'error',
                'error': 'Test error'
            },
            metadata={
                'source': 'test',
                'version': '1.0.0'
            }
        )
    ]

@pytest.mark.asyncio
async def test_store_log_entry(log_store, log_entries):
    """Test log entry storage"""
    # Store entries
    for entry in log_entries:
        success = await log_store.store(entry)
        assert success

    # Retrieve entries
    for entry in log_entries:
        retrieved = await log_store.get(entry.id)
        assert retrieved is not None
        assert retrieved.id == entry.id
        assert retrieved.level == entry.level
        assert retrieved.message == entry.message

@pytest.mark.asyncio
async def test_log_filtering(log_store, log_entries):
    """Test log filtering"""
    # Store entries
    for entry in log_entries:
        await log_store.store(entry)

    # Create filter
    log_filter = LogFilter(
        level=LogLevel.ERROR,
        component="test_component",
        start_time=datetime.now() - timedelta(hours=1),
        end_time=datetime.now()
    )

    # Filter logs
    filtered = await log_store.filter_logs(log_filter)
    assert len(filtered) > 0
    assert all(e.level == LogLevel.ERROR for e in filtered)

@pytest.mark.asyncio
async def test_log_aggregation(log_store, log_entries):
    """Test log aggregation"""
    # Store entries
    for entry in log_entries:
        await log_store.store(entry)

    # Aggregate by level
    aggregated = await log_store.aggregate_logs(
        group_by=['level'],
        start_time=datetime.now() - timedelta(hours=1),
        end_time=datetime.now()
    )
    assert isinstance(aggregated, dict)
    assert LogLevel.INFO.value in aggregated
    assert LogLevel.ERROR.value in aggregated

@pytest.mark.asyncio
async def test_log_rotation(log_manager):
    """Test log rotation"""
    # Generate large log entries
    large_message = "x" * 1000  # 1KB message
    for _ in range(1100):  # Should trigger rotation at 1MB
        await log_manager.log(
            level=LogLevel.INFO,
            component="test_component",
            message=large_message
        )

    # Verify rotation
    files = await log_manager.get_log_files()
    assert len(files) > 1

@pytest.mark.asyncio
async def test_log_cleanup(log_manager, log_entries):
    """Test log cleanup"""
    # Store entries
    for entry in log_entries:
        await log_manager.store.store(entry)

    # Add old entry
    old_entry = log_entries[0].copy()
    old_entry.id = "old_log"
    old_entry.timestamp = datetime.now() - timedelta(days=60)
    await log_manager.store.store(old_entry)

    # Run cleanup
    cleaned = await log_manager.cleanup()
    assert cleaned > 0

@pytest.mark.asyncio
async def test_log_streaming(log_manager):
    """Test log streaming"""
    # Set up stream handler
    received_logs = []
    def stream_handler(entry):
        received_logs.append(entry)

    # Start streaming
    await log_manager.start_streaming(stream_handler)

    # Generate some logs
    for i in range(5):
        await log_manager.log(
            level=LogLevel.INFO,
            component="test_component",
            message=f"Test message {i}"
        )

    # Let streaming catch up
    await asyncio.sleep(1)

    # Verify received logs
    assert len(received_logs) == 5
    assert all(isinstance(e, LogEntry) for e in received_logs)

@pytest.mark.asyncio
async def test_error_monitoring(log_manager):
    """Test error monitoring"""
    # Set up error handler
    error_notifications = []
    def error_handler(entry):
        error_notifications.append(entry)

    # Enable error monitoring
    log_manager.on_error(error_handler)

    # Generate error log
    await log_manager.log(
        level=LogLevel.ERROR,
        component="test_component",
        message="Test error",
        context={'error': 'Test error details'}
    )

    # Verify error notification
    assert len(error_notifications) == 1
    assert error_notifications[0].level == LogLevel.ERROR

@pytest.mark.asyncio
async def test_log_search(log_store, log_entries):
    """Test log searching"""
    # Store entries
    for entry in log_entries:
        await log_store.store(entry)

    # Search logs
    results = await log_store.search(
        query="error",
        fields=['message', 'context.error'],
        start_time=datetime.now() - timedelta(hours=1),
        end_time=datetime.now()
    )
    assert len(results) > 0
    assert all('error' in e.message.lower() or 
              'error' in str(e.context.get('error', '')).lower() 
              for e in results)

@pytest.mark.asyncio
async def test_manager_start_stop(log_manager):
    """Test manager start/stop"""
    # Start manager
    await log_manager.start()
    assert log_manager.active

    # Let it run briefly
    await asyncio.sleep(2)

    # Stop manager
    await log_manager.stop()
    assert not log_manager.active

@pytest.mark.asyncio
async def test_manager_error_handling(log_manager):
    """Test manager error handling"""
    # Mock store.store to raise an exception
    async def mock_store(*args):
        raise Exception("Test error")

    log_manager.store.store = mock_store

    # Start manager
    await log_manager.start()
    assert log_manager.active

    # Try to log (should handle error gracefully)
    await log_manager.log(
        level=LogLevel.INFO,
        component="test_component",
        message="Test message"
    )

    # Verify manager is still running
    assert log_manager.active

    # Stop manager
    await log_manager.stop()
    assert not log_manager.active

@pytest.mark.asyncio
async def test_log_export(log_manager, log_entries):
    """Test log export"""
    # Store entries
    for entry in log_entries:
        await log_manager.store.store(entry)

    # Export logs
    export_data = await log_manager.export_logs(
        start_time=datetime.now() - timedelta(hours=1),
        end_time=datetime.now(),
        format='json'
    )
    assert isinstance(export_data, str)
    assert len(export_data) > 0

@pytest.mark.asyncio
async def test_monitoring_alerts(log_manager):
    """Test monitoring alerts"""
    # Set up alert handler
    alerts = []
    def alert_handler(alert):
        alerts.append(alert)

    # Configure alert conditions
    await log_manager.add_alert_condition(
        name="error_threshold",
        condition=lambda stats: stats.error_count > 0,
        interval=timedelta(minutes=5)
    )

    # Enable alerts
    log_manager.on_alert(alert_handler)

    # Generate error to trigger alert
    await log_manager.log(
        level=LogLevel.ERROR,
        component="test_component",
        message="Test error"
    )

    # Let alert processing complete
    await asyncio.sleep(1)

    # Verify alert
    assert len(alerts) > 0
    assert alerts[0].name == "error_threshold" 