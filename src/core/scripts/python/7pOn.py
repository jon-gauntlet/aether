import pytest
import asyncio
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from lib.autonomic.context import (
    ContextManager,
    ContextStore,
    Context,
    ContextPattern,
    ContextMetrics
)

@pytest.fixture
def context_store(tmp_path):
    """Create context store instance with temporary storage"""
    store = ContextStore()
    store.storage_path = str(tmp_path / "contexts")
    store._init_storage()
    return store

@pytest.fixture
def context_manager(context_store):
    """Create context manager instance"""
    manager = ContextManager()
    manager.store = context_store
    return manager

@pytest.fixture
def contexts():
    """Create test contexts"""
    now = datetime.now()
    return [
        Context(
            id="test_context_001",
            type="development",
            state="active",
            data={
                'project': 'ai_system_evolution',
                'module': 'autonomic',
                'function': 'context_management'
            },
            metrics={
                'cpu_usage': 45.0,
                'memory_usage': 60.0,
                'duration': 3600
            },
            patterns=[
                ContextPattern(
                    type="usage",
                    data={
                        'metric': 'cpu_usage',
                        'pattern': 'stable',
                        'confidence': 0.85
                    },
                    timestamp=now
                )
            ],
            created_at=now,
            updated_at=now,
            priority=1
        ),
        Context(
            id="test_context_002",
            type="analysis",
            state="pending",
            data={
                'project': 'ai_system_evolution',
                'module': 'metrics',
                'function': 'pattern_analysis'
            },
            metrics={
                'cpu_usage': 65.0,
                'memory_usage': 75.0,
                'duration': 1800
            },
            patterns=[],
            created_at=now,
            updated_at=now,
            priority=2
        )
    ]

@pytest.mark.asyncio
async def test_store_context(context_store, contexts):
    """Test context storage"""
    # Store contexts
    for context in contexts:
        success = await context_store.store(context)
        assert success

    # Retrieve contexts
    for context in contexts:
        retrieved = await context_store.get(context.id)
        assert retrieved is not None
        assert retrieved.id == context.id
        assert retrieved.type == context.type
        assert retrieved.state == context.state

@pytest.mark.asyncio
async def test_update_context(context_store, contexts):
    """Test context update"""
    # Store initial context
    context = contexts[0]
    await context_store.store(context)

    # Update context
    context.state = "completed"
    context.metrics['cpu_usage'] = 55.0
    success = await context_store.update(context)
    assert success

    # Verify update
    updated = await context_store.get(context.id)
    assert updated.state == "completed"
    assert updated.metrics['cpu_usage'] == 55.0

@pytest.mark.asyncio
async def test_delete_context(context_store, contexts):
    """Test context deletion"""
    # Store context
    context = contexts[0]
    await context_store.store(context)

    # Delete context
    success = await context_store.delete(context.id)
    assert success

    # Verify deletion
    deleted = await context_store.get(context.id)
    assert deleted is None

@pytest.mark.asyncio
async def test_search_contexts(context_store, contexts):
    """Test context search"""
    # Store contexts
    for context in contexts:
        await context_store.store(context)

    # Search by type
    dev_contexts = await context_store.search(
        type="development",
        state="active"
    )
    assert len(dev_contexts) == 1
    assert dev_contexts[0].type == "development"

    # Search by priority
    high_priority = await context_store.search(
        min_priority=2
    )
    assert len(high_priority) == 1
    assert high_priority[0].priority >= 2

@pytest.mark.asyncio
async def test_context_metrics(context_manager, contexts):
    """Test context metrics collection"""
    # Add contexts
    for context in contexts:
        await context_manager.add_context(context)

    # Collect metrics
    metrics = await context_manager.collect_metrics()
    assert isinstance(metrics, ContextMetrics)
    assert metrics.active_contexts > 0
    assert metrics.avg_cpu_usage > 0
    assert metrics.avg_memory_usage > 0

@pytest.mark.asyncio
async def test_pattern_detection(context_manager, contexts):
    """Test context pattern detection"""
    # Add contexts with metrics
    for context in contexts:
        await context_manager.add_context(context)

    # Add metrics over time
    for _ in range(5):
        for context in contexts:
            context.metrics['cpu_usage'] += 5.0
            await context_manager.update_metrics(context)
        await asyncio.sleep(0.1)

    # Detect patterns
    patterns = await context_manager.detect_patterns()
    assert len(patterns) > 0
    assert any(p.type == "usage" for p in patterns)

@pytest.mark.asyncio
async def test_context_cleanup(context_manager, contexts):
    """Test context cleanup"""
    # Add contexts
    for context in contexts:
        await context_manager.add_context(context)

    # Add old context
    old_context = contexts[0].copy()
    old_context.id = "old_context"
    old_context.created_at = datetime.now() - timedelta(days=7)
    old_context.state = "completed"
    await context_manager.add_context(old_context)

    # Run cleanup
    cleaned = await context_manager.cleanup(
        max_age=timedelta(days=5),
        states=["completed"]
    )
    assert cleaned == 1

@pytest.mark.asyncio
async def test_manager_start_stop(context_manager):
    """Test manager start/stop"""
    # Start manager
    await context_manager.start()
    assert context_manager.active

    # Let it run briefly
    await asyncio.sleep(2)

    # Stop manager
    await context_manager.stop()
    assert not context_manager.active

@pytest.mark.asyncio
async def test_manager_error_handling(context_manager):
    """Test manager error handling"""
    # Mock store.cleanup to raise an exception
    async def mock_cleanup(*args, **kwargs):
        raise Exception("Test error")

    context_manager.store.cleanup = mock_cleanup

    # Start manager
    await context_manager.start()
    assert context_manager.active

    # Let it try to clean up
    await asyncio.sleep(2)

    # Verify manager is still running
    assert context_manager.active

    # Stop manager
    await context_manager.stop()
    assert not context_manager.active 