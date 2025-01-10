import pytest
import asyncio
import json
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from lib.autonomic.events import (
    EventManager,
    EventStore,
    Event,
    EventHandler,
    EventFilter,
    EventConfig,
    EventPriority
)

@pytest.fixture
def event_store(tmp_path):
    """Create event store instance with temporary storage"""
    store = EventStore()
    store.storage_path = str(tmp_path / "events")
    store._init_storage()
    return store

@pytest.fixture
def event_manager(event_store):
    """Create event manager instance"""
    config = EventConfig(
        max_handlers=100,
        max_queue_size=1000,
        processing_timeout=30.0,
        retry_limit=3,
        enable_persistence=True
    )
    manager = EventManager(config)
    manager.store = event_store
    return manager

@pytest.fixture
def events():
    """Create test events"""
    now = datetime.now()
    return [
        Event(
            id="test_event_001",
            type="system.startup",
            source="test_component",
            timestamp=now - timedelta(minutes=i),
            data={
                'status': 'success',
                'components': ['monitor', 'analyzer', 'planner', 'executor']
            },
            metadata={
                'version': '1.0.0',
                'environment': 'test'
            },
            priority=EventPriority.HIGH
        )
        for i in range(5)
    ] + [
        Event(
            id="test_event_error_001",
            type="system.error",
            source="test_component",
            timestamp=now - timedelta(minutes=10),
            data={
                'error': 'Test error',
                'component': 'test_component',
                'severity': 'critical'
            },
            metadata={
                'version': '1.0.0',
                'environment': 'test'
            },
            priority=EventPriority.CRITICAL
        )
    ]

@pytest.mark.asyncio
async def test_store_event(event_store, events):
    """Test event storage"""
    # Store events
    for event in events:
        success = await event_store.store(event)
        assert success

    # Retrieve events
    for event in events:
        retrieved = await event_store.get(event.id)
        assert retrieved is not None
        assert retrieved.id == event.id
        assert retrieved.type == event.type
        assert retrieved.data == event.data

@pytest.mark.asyncio
async def test_event_filtering(event_store, events):
    """Test event filtering"""
    # Store events
    for event in events:
        await event_store.store(event)

    # Create filter
    event_filter = EventFilter(
        type="system.error",
        source="test_component",
        min_priority=EventPriority.HIGH,
        start_time=datetime.now() - timedelta(hours=1),
        end_time=datetime.now()
    )

    # Filter events
    filtered = await event_store.filter_events(event_filter)
    assert len(filtered) > 0
    assert all(e.type == "system.error" for e in filtered)
    assert all(e.priority >= EventPriority.HIGH for e in filtered)

@pytest.mark.asyncio
async def test_event_handling(event_manager):
    """Test event handling"""
    # Set up event handler
    handled_events = []
    async def test_handler(event):
        handled_events.append(event)
        return True

    # Register handler
    handler = EventHandler(
        name="test_handler",
        event_type="test.event",
        handler_func=test_handler
    )
    await event_manager.register_handler(handler)

    # Emit event
    event = Event(
        id="test_001",
        type="test.event",
        source="test",
        timestamp=datetime.now(),
        data={'test': 'data'}
    )
    await event_manager.emit(event)

    # Let event processing complete
    await asyncio.sleep(1)

    # Verify handling
    assert len(handled_events) == 1
    assert handled_events[0].id == event.id

@pytest.mark.asyncio
async def test_event_priority_handling(event_manager):
    """Test event priority handling"""
    # Set up handlers
    handled_events = []
    async def priority_handler(event):
        handled_events.append(event)
        return True

    # Register handlers for different priorities
    for priority in EventPriority:
        handler = EventHandler(
            name=f"handler_{priority.name}",
            event_type="test.event",
            handler_func=priority_handler,
            priority=priority
        )
        await event_manager.register_handler(handler)

    # Emit events with different priorities
    events = [
        Event(
            id=f"test_{p.name}",
            type="test.event",
            source="test",
            timestamp=datetime.now(),
            data={'priority': p.name},
            priority=p
        )
        for p in EventPriority
    ]

    for event in events:
        await event_manager.emit(event)

    # Let event processing complete
    await asyncio.sleep(1)

    # Verify handling order (higher priority events should be handled first)
    assert len(handled_events) == len(events)
    priorities = [e.priority for e in handled_events]
    assert priorities == sorted(priorities, reverse=True)

@pytest.mark.asyncio
async def test_event_pattern_matching(event_manager):
    """Test event pattern matching"""
    # Set up pattern handler
    matched_events = []
    async def pattern_handler(event):
        matched_events.append(event)
        return True

    # Register handler with pattern
    handler = EventHandler(
        name="pattern_handler",
        event_type="test.*",  # Wildcard pattern
        handler_func=pattern_handler
    )
    await event_manager.register_handler(handler)

    # Emit events with different types
    events = [
        Event(
            id=f"test_{i}",
            type=f"test.type_{i}",
            source="test",
            timestamp=datetime.now(),
            data={'test': 'data'}
        )
        for i in range(3)
    ]

    for event in events:
        await event_manager.emit(event)

    # Let event processing complete
    await asyncio.sleep(1)

    # Verify pattern matching
    assert len(matched_events) == len(events)

@pytest.mark.asyncio
async def test_event_retry_handling(event_manager):
    """Test event retry handling"""
    # Set up failing handler
    failure_count = 0
    async def failing_handler(event):
        nonlocal failure_count
        failure_count += 1
        if failure_count <= 2:  # Fail twice, succeed on third try
            raise Exception("Test failure")
        return True

    # Register handler
    handler = EventHandler(
        name="failing_handler",
        event_type="test.retry",
        handler_func=failing_handler
    )
    await event_manager.register_handler(handler)

    # Emit event
    event = Event(
        id="test_retry",
        type="test.retry",
        source="test",
        timestamp=datetime.now(),
        data={'test': 'retry'}
    )
    await event_manager.emit(event)

    # Let retry processing complete
    await asyncio.sleep(3)

    # Verify retries
    assert failure_count == 3  # Two failures + one success

@pytest.mark.asyncio
async def test_event_persistence(event_manager, events):
    """Test event persistence"""
    # Store events
    for event in events:
        await event_manager.store.store(event)

    # Simulate manager restart
    await event_manager.stop()
    await event_manager.start()

    # Verify events were persisted
    for event in events:
        retrieved = await event_manager.store.get(event.id)
        assert retrieved is not None
        assert retrieved.id == event.id

@pytest.mark.asyncio
async def test_event_aggregation(event_store, events):
    """Test event aggregation"""
    # Store events
    for event in events:
        await event_store.store(event)

    # Aggregate events
    aggregated = await event_store.aggregate_events(
        group_by=['type', 'source'],
        start_time=datetime.now() - timedelta(hours=1),
        end_time=datetime.now()
    )
    assert isinstance(aggregated, dict)
    assert len(aggregated) > 0

@pytest.mark.asyncio
async def test_manager_start_stop(event_manager):
    """Test manager start/stop"""
    # Start manager
    await event_manager.start()
    assert event_manager.active

    # Let it run briefly
    await asyncio.sleep(2)

    # Stop manager
    await event_manager.stop()
    assert not event_manager.active

@pytest.mark.asyncio
async def test_manager_error_handling(event_manager):
    """Test manager error handling"""
    # Set up failing handler
    async def error_handler(event):
        raise Exception("Test error")

    # Register handler
    handler = EventHandler(
        name="error_handler",
        event_type="test.error",
        handler_func=error_handler
    )
    await event_manager.register_handler(handler)

    # Emit event
    event = Event(
        id="test_error",
        type="test.error",
        source="test",
        timestamp=datetime.now(),
        data={'test': 'error'}
    )
    await event_manager.emit(event)

    # Let error handling complete
    await asyncio.sleep(1)

    # Verify manager is still running
    assert event_manager.active

@pytest.mark.asyncio
async def test_event_metrics(event_manager, events):
    """Test event metrics collection"""
    # Set up handler
    async def test_handler(event):
        await asyncio.sleep(0.1)  # Simulate processing time
        return True

    # Register handler
    handler = EventHandler(
        name="metrics_handler",
        event_type="system.*",
        handler_func=test_handler
    )
    await event_manager.register_handler(handler)

    # Emit events
    for event in events:
        await event_manager.emit(event)

    # Let processing complete
    await asyncio.sleep(2)

    # Get metrics
    metrics = await event_manager.get_metrics()
    assert metrics.total_events > 0
    assert metrics.processed_events > 0
    assert metrics.average_processing_time > 0

@pytest.mark.asyncio
async def test_event_cleanup(event_manager, events):
    """Test event cleanup"""
    # Store events
    for event in events:
        await event_manager.store.store(event)

    # Add old event
    old_event = events[0].copy()
    old_event.id = "old_event"
    old_event.timestamp = datetime.now() - timedelta(days=30)
    await event_manager.store.store(old_event)

    # Run cleanup
    cleaned = await event_manager.cleanup(max_age=timedelta(days=7))
    assert cleaned > 0 