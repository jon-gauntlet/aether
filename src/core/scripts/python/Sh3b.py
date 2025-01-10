import pytest
import asyncio
import json
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from lib.autonomic.adaptation import (
    AdaptationManager,
    AdaptationStore,
    AdaptationStrategy,
    AdaptationRule,
    AdaptationAction,
    AdaptationConfig,
    AdaptationResult,
    AdaptationEvent,
    AdaptationMetrics
)

@pytest.fixture
def adaptation_store(tmp_path):
    """Create adaptation store instance with temporary storage"""
    store = AdaptationStore()
    store.storage_path = str(tmp_path / "adaptations")
    store._init_storage()
    return store

@pytest.fixture
def adaptation_manager(adaptation_store):
    """Create adaptation manager instance"""
    config = AdaptationConfig(
        check_interval=5.0,
        max_adaptations=10,
        cooldown_period=timedelta(minutes=5),
        enable_learning=True,
        max_concurrent_adaptations=3
    )
    manager = AdaptationManager(config)
    manager.store = adaptation_store
    return manager

@pytest.fixture
def adaptation_strategies():
    """Create test adaptation strategies"""
    now = datetime.now()
    return [
        AdaptationStrategy(
            id="test_strategy_001",
            name="performance_adaptation",
            type="performance",
            rules=[
                AdaptationRule(
                    id="rule_001",
                    condition={
                        'metric': 'response_time',
                        'operator': 'greater_than',
                        'threshold': 500  # ms
                    },
                    actions=[
                        AdaptationAction(
                            type="scale",
                            parameters={
                                'component': 'api_server',
                                'direction': 'up',
                                'amount': 1
                            }
                        )
                    ],
                    priority=1
                ),
                AdaptationRule(
                    id="rule_002",
                    condition={
                        'metric': 'error_rate',
                        'operator': 'greater_than',
                        'threshold': 0.05  # 5%
                    },
                    actions=[
                        AdaptationAction(
                            type="circuit_breaker",
                            parameters={
                                'service': 'problematic_service',
                                'state': 'open',
                                'duration': 300  # seconds
                            }
                        )
                    ],
                    priority=2
                )
            ],
            metadata={
                'description': 'Performance adaptation strategy',
                'version': '1.0.0'
            },
            created_at=now,
            updated_at=now,
            active=True
        ),
        AdaptationStrategy(
            id="test_strategy_002",
            name="resource_adaptation",
            type="resource",
            rules=[
                AdaptationRule(
                    id="rule_003",
                    condition={
                        'metric': 'memory_usage',
                        'operator': 'greater_than',
                        'threshold': 85.0  # percent
                    },
                    actions=[
                        AdaptationAction(
                            type="optimize",
                            parameters={
                                'resource': 'memory',
                                'action': 'cleanup',
                                'target_usage': 70.0
                            }
                        )
                    ],
                    priority=1
                )
            ],
            metadata={
                'description': 'Resource adaptation strategy',
                'version': '1.0.0'
            },
            created_at=now,
            updated_at=now,
            active=True
        )
    ]

@pytest.mark.asyncio
async def test_store_strategy(adaptation_store, adaptation_strategies):
    """Test adaptation strategy storage"""
    # Store strategies
    for strategy in adaptation_strategies:
        success = await adaptation_store.store_strategy(strategy)
        assert success

    # Retrieve strategies
    for strategy in adaptation_strategies:
        retrieved = await adaptation_store.get_strategy(strategy.id)
        assert retrieved is not None
        assert retrieved.id == strategy.id
        assert retrieved.name == strategy.name
        assert len(retrieved.rules) == len(strategy.rules)

@pytest.mark.asyncio
async def test_performance_adaptation(adaptation_manager, adaptation_strategies):
    """Test performance adaptation"""
    # Add strategy
    strategy = adaptation_strategies[0]
    await adaptation_manager.add_strategy(strategy)

    # Test data
    metrics = {
        'response_time': 600,  # Above threshold
        'error_rate': 0.02     # Below threshold
    }

    # Mock adaptation execution
    async def mock_execute_action(*args):
        return True

    with patch.object(adaptation_manager, '_execute_action', mock_execute_action):
        # Run adaptation
        result = await adaptation_manager.adapt(metrics)
        assert isinstance(result, AdaptationResult)
        assert result.success
        assert len(result.actions_taken) == 1
        assert result.actions_taken[0].type == "scale"

@pytest.mark.asyncio
async def test_resource_adaptation(adaptation_manager, adaptation_strategies):
    """Test resource adaptation"""
    # Add strategy
    strategy = adaptation_strategies[1]
    await adaptation_manager.add_strategy(strategy)

    # Test data
    metrics = {
        'memory_usage': 90.0  # Above threshold
    }

    # Mock adaptation execution
    async def mock_execute_action(*args):
        return True

    with patch.object(adaptation_manager, '_execute_action', mock_execute_action):
        # Run adaptation
        result = await adaptation_manager.adapt(metrics)
        assert isinstance(result, AdaptationResult)
        assert result.success
        assert len(result.actions_taken) == 1
        assert result.actions_taken[0].type == "optimize"

@pytest.mark.asyncio
async def test_adaptation_learning(adaptation_manager, adaptation_strategies):
    """Test adaptation learning"""
    # Add strategy
    strategy = adaptation_strategies[0]
    await adaptation_manager.add_strategy(strategy)

    # Mock effectiveness tracking
    effectiveness_data = []
    async def mock_track_effectiveness(action, metrics_before, metrics_after):
        effectiveness_data.append({
            'action': action,
            'improvement': metrics_after['response_time'] - metrics_before['response_time']
        })
        return True

    with patch.object(adaptation_manager, '_track_effectiveness', mock_track_effectiveness):
        # Run adaptation with learning
        metrics_before = {'response_time': 600}
        metrics_after = {'response_time': 450}
        
        result = await adaptation_manager.adapt_and_learn(
            metrics_before,
            lambda: metrics_after
        )
        
        assert result.success
        assert len(effectiveness_data) > 0
        assert effectiveness_data[0]['improvement'] < 0  # Response time decreased

@pytest.mark.asyncio
async def test_adaptation_cooldown(adaptation_manager, adaptation_strategies):
    """Test adaptation cooldown period"""
    # Add strategy
    strategy = adaptation_strategies[0]
    await adaptation_manager.add_strategy(strategy)

    # Run first adaptation
    metrics = {'response_time': 600}
    result1 = await adaptation_manager.adapt(metrics)
    assert result1.success

    # Attempt immediate second adaptation
    result2 = await adaptation_manager.adapt(metrics)
    assert not result2.success  # Should fail due to cooldown
    assert "cooldown" in result2.message.lower()

@pytest.mark.asyncio
async def test_concurrent_adaptations(adaptation_manager, adaptation_strategies):
    """Test concurrent adaptation handling"""
    # Add strategies
    for strategy in adaptation_strategies:
        await adaptation_manager.add_strategy(strategy)

    # Test data for multiple components
    component_metrics = {
        'api_server': {'response_time': 600},
        'database': {'memory_usage': 90.0}
    }

    # Run concurrent adaptations
    results = await adaptation_manager.adapt_concurrent(component_metrics)
    assert len(results) == len(component_metrics)
    assert all(isinstance(r, AdaptationResult) for r in results.values())

@pytest.mark.asyncio
async def test_adaptation_monitoring(adaptation_manager, adaptation_strategies):
    """Test adaptation monitoring"""
    # Set up monitoring handler
    events = []
    def event_handler(event):
        events.append(event)

    adaptation_manager.on_adaptation_event(event_handler)

    # Run adaptation
    strategy = adaptation_strategies[0]
    await adaptation_manager.add_strategy(strategy)
    await adaptation_manager.adapt({'response_time': 600})

    # Verify events
    assert len(events) > 0
    assert all(isinstance(e, AdaptationEvent) for e in events)

@pytest.mark.asyncio
async def test_adaptation_metrics(adaptation_manager, adaptation_strategies):
    """Test adaptation metrics collection"""
    # Add strategy and run adaptations
    strategy = adaptation_strategies[0]
    await adaptation_manager.add_strategy(strategy)
    
    for _ in range(3):
        await adaptation_manager.adapt({'response_time': 600})

    # Get adaptation metrics
    metrics = await adaptation_manager.get_metrics()
    assert isinstance(metrics, AdaptationMetrics)
    assert metrics.total_adaptations == 3
    assert metrics.success_rate >= 0
    assert metrics.average_improvement >= 0

@pytest.mark.asyncio
async def test_adaptation_history(adaptation_manager, adaptation_strategies):
    """Test adaptation history tracking"""
    # Add strategy
    strategy = adaptation_strategies[0]
    await adaptation_manager.add_strategy(strategy)

    # Run multiple adaptations
    for i in range(3):
        metrics = {'response_time': 500 + i * 50}
        await adaptation_manager.adapt(metrics)

    # Get history
    history = await adaptation_manager.get_adaptation_history(
        start_time=datetime.now() - timedelta(hours=1),
        end_time=datetime.now()
    )
    assert len(history) == 3
    assert all('metrics' in entry for entry in history)
    assert all('result' in entry for entry in history)

@pytest.mark.asyncio
async def test_manager_start_stop(adaptation_manager):
    """Test manager start/stop"""
    # Start manager
    await adaptation_manager.start()
    assert adaptation_manager.active

    # Let it run briefly
    await asyncio.sleep(2)

    # Stop manager
    await adaptation_manager.stop()
    assert not adaptation_manager.active

@pytest.mark.asyncio
async def test_manager_error_handling(adaptation_manager):
    """Test manager error handling"""
    # Mock store.store_strategy to raise an exception
    async def mock_store(*args):
        raise Exception("Test error")

    adaptation_manager.store.store_strategy = mock_store

    # Start manager
    await adaptation_manager.start()
    assert adaptation_manager.active

    # Try to add strategy (should handle error gracefully)
    await adaptation_manager.add_strategy(adaptation_strategies[0])

    # Verify manager is still running
    assert adaptation_manager.active

    # Stop manager
    await adaptation_manager.stop()
    assert not adaptation_manager.active 