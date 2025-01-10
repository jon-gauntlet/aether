import pytest
import asyncio
import numpy as np
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from lib.autonomic.pattern_recognition import (
    PatternManager,
    PatternStore,
    Pattern,
    PatternConfig,
    PatternData,
    PatternMetrics,
    PatternMatch,
    PatternEvent
)

@pytest.fixture
def pattern_store(tmp_path):
    """Create pattern store instance with temporary storage"""
    store = PatternStore()
    store.storage_path = str(tmp_path / "patterns")
    store._init_storage()
    return store

@pytest.fixture
def pattern_manager(pattern_store):
    """Create pattern manager instance"""
    config = PatternConfig(
        scan_interval=timedelta(minutes=5),
        min_confidence=0.7,
        max_patterns=1000,
        pattern_ttl=timedelta(days=30),
        batch_size=100
    )
    manager = PatternManager(config)
    manager.store = pattern_store
    return manager

@pytest.fixture
def pattern_data():
    """Create test pattern data"""
    now = datetime.now()
    timestamps = [now - timedelta(minutes=i) for i in range(100)]
    
    # Generate synthetic system behavior data
    patterns = []
    for i in range(100):
        patterns.append(
            PatternData(
                timestamp=timestamps[i],
                metrics={
                    'cpu_usage': np.random.normal(60, 10),
                    'memory_usage': np.random.normal(70, 15),
                    'request_count': np.random.randint(100, 1000),
                    'response_time': np.random.normal(200, 50)
                },
                events=[
                    {'type': 'request', 'status': 'success'},
                    {'type': 'cache', 'status': 'hit'}
                ],
                context={
                    'environment': 'production',
                    'component': 'api_server'
                }
            )
        )
    return patterns

@pytest.mark.asyncio
async def test_store_pattern_data(pattern_store, pattern_data):
    """Test pattern data storage"""
    # Store pattern data
    for data in pattern_data:
        success = await pattern_store.store_data(data)
        assert success

    # Retrieve pattern data
    stored_data = await pattern_store.get_pattern_data(
        start_time=datetime.now() - timedelta(hours=1),
        end_time=datetime.now()
    )
    assert len(stored_data) == len(pattern_data)

@pytest.mark.asyncio
async def test_pattern_detection(pattern_manager, pattern_data):
    """Test pattern detection"""
    # Add pattern data
    for data in pattern_data:
        await pattern_manager.add_pattern_data(data)

    # Detect patterns
    patterns = await pattern_manager.detect_patterns(
        metrics=['cpu_usage', 'memory_usage', 'response_time'],
        window_size=timedelta(minutes=30)
    )

    assert isinstance(patterns, list)
    assert len(patterns) > 0
    assert all(isinstance(p, Pattern) for p in patterns)
    assert all(p.confidence > pattern_manager.config.min_confidence 
              for p in patterns)

@pytest.mark.asyncio
async def test_pattern_matching(pattern_manager, pattern_data):
    """Test pattern matching"""
    # First detect patterns
    await test_pattern_detection(pattern_manager, pattern_data)

    # Create test metrics
    test_metrics = {
        'cpu_usage': 65.0,
        'memory_usage': 75.0,
        'response_time': 210.0
    }

    # Match patterns
    matches = await pattern_manager.match_patterns(test_metrics)
    assert isinstance(matches, list)
    assert len(matches) > 0
    assert all(isinstance(m, PatternMatch) for m in matches)
    assert all(m.confidence > 0 for m in matches)

@pytest.mark.asyncio
async def test_pattern_evolution(pattern_manager, pattern_data):
    """Test pattern evolution over time"""
    # Initialize with first batch
    first_half = pattern_data[:50]
    for data in first_half:
        await pattern_manager.add_pattern_data(data)

    patterns1 = await pattern_manager.detect_patterns(
        metrics=['cpu_usage', 'memory_usage'],
        window_size=timedelta(minutes=15)
    )

    # Add second batch
    second_half = pattern_data[50:]
    for data in second_half:
        await pattern_manager.add_pattern_data(data)

    patterns2 = await pattern_manager.detect_patterns(
        metrics=['cpu_usage', 'memory_usage'],
        window_size=timedelta(minutes=15)
    )

    # Verify pattern evolution
    assert len(patterns2) >= len(patterns1)
    assert any(p2.confidence > p1.confidence 
              for p1, p2 in zip(patterns1, patterns2))

@pytest.mark.asyncio
async def test_pattern_persistence(pattern_manager, pattern_data):
    """Test pattern persistence"""
    # Detect and save patterns
    await test_pattern_detection(pattern_manager, pattern_data)
    pattern_id = await pattern_manager.save_patterns()

    # Load patterns
    loaded_patterns = await pattern_manager.load_patterns(pattern_id)
    assert isinstance(loaded_patterns, list)
    assert len(loaded_patterns) > 0
    assert all(isinstance(p, Pattern) for p in loaded_patterns)

@pytest.mark.asyncio
async def test_pattern_metrics(pattern_manager, pattern_data):
    """Test pattern metrics collection"""
    # Detect patterns
    await test_pattern_detection(pattern_manager, pattern_data)

    # Get pattern metrics
    metrics = await pattern_manager.get_pattern_metrics()
    assert isinstance(metrics, PatternMetrics)
    assert metrics.total_patterns > 0
    assert metrics.avg_confidence > 0
    assert metrics.detection_rate > 0

@pytest.mark.asyncio
async def test_pattern_cleanup(pattern_manager, pattern_data):
    """Test pattern cleanup"""
    # Add old pattern data
    old_time = datetime.now() - timedelta(days=60)
    old_patterns = []
    for data in pattern_data[:10]:
        data.timestamp = old_time
        old_patterns.append(data)
        await pattern_manager.add_pattern_data(data)

    # Add recent pattern data
    for data in pattern_data[10:]:
        await pattern_manager.add_pattern_data(data)

    # Run cleanup
    cleaned = await pattern_manager.cleanup_patterns()
    assert cleaned > 0

    # Verify old patterns are removed
    patterns = await pattern_manager.get_all_patterns()
    assert all(p.last_seen > old_time + pattern_manager.config.pattern_ttl
              for p in patterns)

@pytest.mark.asyncio
async def test_pattern_export_import(pattern_manager, pattern_data):
    """Test pattern export/import"""
    # Detect and export patterns
    await test_pattern_detection(pattern_manager, pattern_data)
    export_data = await pattern_manager.export_patterns()

    # Import patterns
    imported_patterns = await pattern_manager.import_patterns(export_data)
    assert isinstance(imported_patterns, list)
    assert len(imported_patterns) > 0
    assert all(isinstance(p, Pattern) for p in imported_patterns)

@pytest.mark.asyncio
async def test_pattern_monitoring(pattern_manager, pattern_data):
    """Test pattern monitoring"""
    # Set up monitoring handler
    events = []
    def event_handler(event):
        events.append(event)

    pattern_manager.on_pattern_event(event_handler)

    # Trigger pattern events
    await test_pattern_detection(pattern_manager, pattern_data)

    # Verify events
    assert len(events) > 0
    assert all(isinstance(e, PatternEvent) for e in events)

@pytest.mark.asyncio
async def test_pattern_aggregation(pattern_manager, pattern_data):
    """Test pattern aggregation"""
    # Add pattern data
    for data in pattern_data:
        await pattern_manager.add_pattern_data(data)

    # Aggregate patterns
    aggregated = await pattern_manager.aggregate_patterns(
        metrics=['cpu_usage', 'memory_usage'],
        window_size=timedelta(minutes=15),
        aggregation='mean'
    )

    assert isinstance(aggregated, dict)
    assert 'cpu_usage' in aggregated
    assert 'memory_usage' in aggregated
    assert all(isinstance(v, float) for v in aggregated.values())

@pytest.mark.asyncio
async def test_manager_start_stop(pattern_manager):
    """Test manager start/stop"""
    # Start manager
    await pattern_manager.start()
    assert pattern_manager.active

    # Let it run briefly
    await asyncio.sleep(2)

    # Stop manager
    await pattern_manager.stop()
    assert not pattern_manager.active

@pytest.mark.asyncio
async def test_manager_error_handling(pattern_manager):
    """Test manager error handling"""
    # Mock store.store_data to raise an exception
    async def mock_store(*args):
        raise Exception("Test error")

    pattern_manager.store.store_data = mock_store

    # Start manager
    await pattern_manager.start()
    assert pattern_manager.active

    # Try to add pattern data (should handle error gracefully)
    await pattern_manager.add_pattern_data(pattern_data[0])

    # Verify manager is still running
    assert pattern_manager.active

    # Stop manager
    await pattern_manager.stop()
    assert not pattern_manager.active 