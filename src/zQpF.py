import pytest
import asyncio
import os
import sqlite3
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from lib.autonomic.knowledge import (
    KnowledgeManager,
    KnowledgeStore,
    KnowledgeItem
)

@pytest.fixture
def knowledge_store(tmp_path):
    """Create knowledge store instance with temporary database"""
    store = KnowledgeStore()
    store.db_path = str(tmp_path / "test_knowledge.db")
    store._init_db()
    return store

@pytest.fixture
def knowledge_manager(knowledge_store):
    """Create knowledge manager instance"""
    manager = KnowledgeManager()
    manager.store = knowledge_store
    return manager

@pytest.fixture
def knowledge_items():
    """Create test knowledge items"""
    now = datetime.now()
    return [
        KnowledgeItem(
            id="pattern_cpu_001",
            category="metrics",
            subcategory="patterns",
            content={
                'metric_type': 'cpu_percent',
                'pattern_type': 'increasing_trend',
                'pattern_data': {
                    'slope': 2.5,
                    'duration': 3600
                }
            },
            metadata={
                'detection_time': now.isoformat()
            },
            created_at=now,
            updated_at=now,
            confidence=0.8,
            source="test"
        ),
        KnowledgeItem(
            id="optimization_memory_001",
            category="optimization",
            subcategory="results",
            content={
                'action_type': 'optimize_memory',
                'parameters': {
                    'cleanup_level': 'moderate'
                },
                'result': 'Memory usage optimized',
                'success': True
            },
            metadata={
                'execution_time': now.isoformat()
            },
            created_at=now,
            updated_at=now,
            confidence=1.0,
            source="test"
        )
    ]

@pytest.mark.asyncio
async def test_store_knowledge(knowledge_store, knowledge_items):
    """Test knowledge storage"""
    # Store items
    for item in knowledge_items:
        success = await knowledge_store.store(item)
        assert success

    # Retrieve items
    for item in knowledge_items:
        retrieved = await knowledge_store.get(item.id)
        assert retrieved is not None
        assert retrieved.id == item.id
        assert retrieved.category == item.category
        assert retrieved.confidence == item.confidence

@pytest.mark.asyncio
async def test_search_knowledge(knowledge_store, knowledge_items):
    """Test knowledge search"""
    # Store items
    for item in knowledge_items:
        await knowledge_store.store(item)

    # Search by category
    metrics_items = await knowledge_store.search(
        category="metrics",
        min_confidence=0.5
    )
    assert len(metrics_items) == 1
    assert metrics_items[0].category == "metrics"

    # Search by subcategory
    pattern_items = await knowledge_store.search(
        subcategory="patterns",
        min_confidence=0.5
    )
    assert len(pattern_items) == 1
    assert pattern_items[0].subcategory == "patterns"

@pytest.mark.asyncio
async def test_delete_knowledge(knowledge_store, knowledge_items):
    """Test knowledge deletion"""
    # Store items
    for item in knowledge_items:
        await knowledge_store.store(item)

    # Delete item
    success = await knowledge_store.delete(knowledge_items[0].id)
    assert success

    # Verify deletion
    deleted_item = await knowledge_store.get(knowledge_items[0].id)
    assert deleted_item is None

@pytest.mark.asyncio
async def test_cleanup_knowledge(knowledge_store, knowledge_items):
    """Test knowledge cleanup"""
    # Store items
    for item in knowledge_items:
        await knowledge_store.store(item)

    # Add old item
    old_item = KnowledgeItem(
        id="old_item_001",
        category="test",
        subcategory="old",
        content={'test': 'data'},
        metadata={},
        created_at=datetime.now() - timedelta(days=31),
        updated_at=datetime.now() - timedelta(days=31),
        confidence=0.3,
        source="test"
    )
    await knowledge_store.store(old_item)

    # Run cleanup
    deleted = await knowledge_store.cleanup(
        max_age=timedelta(days=30),
        min_confidence=0.5
    )
    assert deleted == 1

@pytest.mark.asyncio
async def test_add_metric_pattern(knowledge_manager):
    """Test adding metric pattern"""
    # Add pattern
    success = await knowledge_manager.add_metric_pattern(
        metric_type="cpu_percent",
        pattern_type="increasing_trend",
        pattern_data={
            'slope': 2.5,
            'duration': 3600
        },
        confidence=0.8,
        source="test"
    )
    assert success

    # Verify pattern was stored
    patterns = await knowledge_manager.get_similar_patterns(
        metric_type="cpu_percent",
        pattern_type="increasing_trend"
    )
    assert len(patterns) == 1
    assert patterns[0].content['metric_type'] == "cpu_percent"

@pytest.mark.asyncio
async def test_add_optimization_result(knowledge_manager):
    """Test adding optimization result"""
    # Add result
    success = await knowledge_manager.add_optimization_result(
        action_type="optimize_memory",
        parameters={
            'cleanup_level': 'moderate'
        },
        result="Memory usage optimized",
        success=True,
        source="test"
    )
    assert success

    # Verify result was stored
    results = await knowledge_manager.get_optimization_history(
        action_type="optimize_memory"
    )
    assert len(results) == 1
    assert results[0].content['action_type'] == "optimize_memory"

@pytest.mark.asyncio
async def test_manager_start_stop(knowledge_manager):
    """Test manager start/stop"""
    # Start manager
    await knowledge_manager.start()
    assert knowledge_manager.active

    # Let it run briefly
    await asyncio.sleep(2)

    # Stop manager
    await knowledge_manager.stop()
    assert not knowledge_manager.active

@pytest.mark.asyncio
async def test_manager_error_handling(knowledge_manager):
    """Test manager error handling"""
    # Mock store.cleanup to raise an exception
    async def mock_cleanup(*args, **kwargs):
        raise Exception("Test error")

    knowledge_manager.store.cleanup = mock_cleanup

    # Start manager
    await knowledge_manager.start()
    assert knowledge_manager.active

    # Let it try to clean up
    await asyncio.sleep(2)

    # Verify manager is still running
    assert knowledge_manager.active

    # Stop manager
    await knowledge_manager.stop()
    assert not knowledge_manager.active 