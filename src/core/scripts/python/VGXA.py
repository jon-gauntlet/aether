import pytest
import asyncio
import numpy as np
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from lib.autonomic.pattern_learning import (
    PatternLearner,
    PatternStore,
    Pattern,
    PatternMetrics,
    LearningConfig
)

@pytest.fixture
def pattern_store(tmp_path):
    """Create pattern store instance with temporary storage"""
    store = PatternStore()
    store.storage_path = str(tmp_path / "patterns")
    store._init_storage()
    return store

@pytest.fixture
def pattern_learner(pattern_store):
    """Create pattern learner instance"""
    config = LearningConfig(
        min_confidence=0.7,
        max_patterns=100,
        learning_rate=0.01,
        batch_size=32,
        epochs=10
    )
    learner = PatternLearner(config)
    learner.store = pattern_store
    return learner

@pytest.fixture
def patterns():
    """Create test patterns"""
    now = datetime.now()
    return [
        Pattern(
            id="test_pattern_001",
            type="resource_usage",
            subtype="cpu_trend",
            data={
                'values': [45.0, 48.0, 52.0, 55.0, 58.0],
                'timestamps': [
                    (now - timedelta(minutes=i)).isoformat()
                    for i in range(5, 0, -1)
                ]
            },
            metadata={
                'source': 'test',
                'metric': 'cpu_usage',
                'context_id': 'test_context_001'
            },
            confidence=0.85,
            created_at=now,
            updated_at=now
        ),
        Pattern(
            id="test_pattern_002",
            type="resource_usage",
            subtype="memory_cycle",
            data={
                'values': [60.0, 75.0, 65.0, 80.0, 70.0],
                'timestamps': [
                    (now - timedelta(minutes=i)).isoformat()
                    for i in range(5, 0, -1)
                ]
            },
            metadata={
                'source': 'test',
                'metric': 'memory_usage',
                'context_id': 'test_context_002'
            },
            confidence=0.9,
            created_at=now,
            updated_at=now
        )
    ]

@pytest.mark.asyncio
async def test_store_pattern(pattern_store, patterns):
    """Test pattern storage"""
    # Store patterns
    for pattern in patterns:
        success = await pattern_store.store(pattern)
        assert success

    # Retrieve patterns
    for pattern in patterns:
        retrieved = await pattern_store.get(pattern.id)
        assert retrieved is not None
        assert retrieved.id == pattern.id
        assert retrieved.type == pattern.type
        assert retrieved.confidence == pattern.confidence

@pytest.mark.asyncio
async def test_update_pattern(pattern_store, patterns):
    """Test pattern update"""
    # Store initial pattern
    pattern = patterns[0]
    await pattern_store.store(pattern)

    # Update pattern
    pattern.confidence = 0.95
    pattern.data['values'].append(62.0)
    success = await pattern_store.update(pattern)
    assert success

    # Verify update
    updated = await pattern_store.get(pattern.id)
    assert updated.confidence == 0.95
    assert len(updated.data['values']) == len(pattern.data['values'])

@pytest.mark.asyncio
async def test_search_patterns(pattern_store, patterns):
    """Test pattern search"""
    # Store patterns
    for pattern in patterns:
        await pattern_store.store(pattern)

    # Search by type
    cpu_patterns = await pattern_store.search(
        type="resource_usage",
        subtype="cpu_trend"
    )
    assert len(cpu_patterns) == 1
    assert cpu_patterns[0].subtype == "cpu_trend"

    # Search by confidence
    high_conf = await pattern_store.search(
        min_confidence=0.9
    )
    assert len(high_conf) == 1
    assert high_conf[0].confidence >= 0.9

@pytest.mark.asyncio
async def test_pattern_learning(pattern_learner, patterns):
    """Test pattern learning process"""
    # Add patterns for learning
    for pattern in patterns:
        await pattern_learner.add_pattern(pattern)

    # Generate synthetic data
    timestamps = [
        datetime.now() - timedelta(minutes=i)
        for i in range(100, 0, -1)
    ]
    cpu_values = np.linspace(40, 80, 100) + np.random.normal(0, 2, 100)
    memory_values = 70 + 10 * np.sin(np.linspace(0, 4*np.pi, 100))

    # Train on synthetic data
    await pattern_learner.train(
        metrics={
            'cpu_usage': list(zip(timestamps, cpu_values)),
            'memory_usage': list(zip(timestamps, memory_values))
        }
    )

    # Verify learned patterns
    patterns = await pattern_learner.get_learned_patterns()
    assert len(patterns) > 0
    assert any(p.type == "resource_usage" for p in patterns)

@pytest.mark.asyncio
async def test_pattern_prediction(pattern_learner, patterns):
    """Test pattern prediction"""
    # Add patterns and train
    for pattern in patterns:
        await pattern_learner.add_pattern(pattern)

    # Make predictions
    predictions = await pattern_learner.predict(
        metric="cpu_usage",
        horizon=timedelta(minutes=5)
    )
    assert len(predictions) > 0
    assert all(isinstance(v, float) for v in predictions)

@pytest.mark.asyncio
async def test_pattern_validation(pattern_learner, patterns):
    """Test pattern validation"""
    # Add patterns
    for pattern in patterns:
        await pattern_learner.add_pattern(pattern)

    # Validate patterns
    validation_results = await pattern_learner.validate_patterns()
    assert isinstance(validation_results, dict)
    assert all(isinstance(v, float) for v in validation_results.values())

@pytest.mark.asyncio
async def test_pattern_cleanup(pattern_learner, patterns):
    """Test pattern cleanup"""
    # Add patterns
    for pattern in patterns:
        await pattern_learner.add_pattern(pattern)

    # Add old pattern
    old_pattern = patterns[0].copy()
    old_pattern.id = "old_pattern"
    old_pattern.created_at = datetime.now() - timedelta(days=30)
    old_pattern.confidence = 0.5
    await pattern_learner.add_pattern(old_pattern)

    # Run cleanup
    cleaned = await pattern_learner.cleanup(
        max_age=timedelta(days=7),
        min_confidence=0.6
    )
    assert cleaned == 1

@pytest.mark.asyncio
async def test_learner_start_stop(pattern_learner):
    """Test learner start/stop"""
    # Start learner
    await pattern_learner.start()
    assert pattern_learner.active

    # Let it run briefly
    await asyncio.sleep(2)

    # Stop learner
    await pattern_learner.stop()
    assert not pattern_learner.active

@pytest.mark.asyncio
async def test_learner_error_handling(pattern_learner):
    """Test learner error handling"""
    # Mock store.cleanup to raise an exception
    async def mock_cleanup(*args, **kwargs):
        raise Exception("Test error")

    pattern_learner.store.cleanup = mock_cleanup

    # Start learner
    await pattern_learner.start()
    assert pattern_learner.active

    # Let it try to clean up
    await asyncio.sleep(2)

    # Verify learner is still running
    assert pattern_learner.active

    # Stop learner
    await pattern_learner.stop()
    assert not pattern_learner.active 