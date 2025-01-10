import pytest
import asyncio
import numpy as np
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from lib.autonomic.optimization import (
    OptimizationManager,
    OptimizationStore,
    Optimizer,
    OptimizationConfig,
    OptimizationStrategy,
    OptimizationResult,
    OptimizationMetrics,
    OptimizationEvent
)

@pytest.fixture
def optimization_store(tmp_path):
    """Create optimization store instance with temporary storage"""
    store = OptimizationStore()
    store.storage_path = str(tmp_path / "optimizations")
    store._init_storage()
    return store

@pytest.fixture
def optimization_manager(optimization_store):
    """Create optimization manager instance"""
    config = OptimizationConfig(
        check_interval=5.0,
        max_iterations=100,
        convergence_threshold=0.001,
        learning_rate=0.01,
        enable_parallel=True,
        max_parallel_jobs=4
    )
    manager = OptimizationManager(config)
    manager.store = optimization_store
    return manager

@pytest.fixture
def optimization_strategies():
    """Create test optimization strategies"""
    return [
        OptimizationStrategy(
            id="test_strategy_001",
            name="resource_optimization",
            type="resource",
            parameters={
                'target_metrics': ['cpu_usage', 'memory_usage'],
                'constraints': {
                    'cpu_usage': {'min': 0, 'max': 80},
                    'memory_usage': {'min': 0, 'max': 85}
                },
                'weights': {
                    'cpu_usage': 0.6,
                    'memory_usage': 0.4
                }
            },
            objective="minimize",
            algorithm="gradient_descent",
            metadata={
                'description': 'Optimize resource usage',
                'priority': 'high'
            }
        ),
        OptimizationStrategy(
            id="test_strategy_002",
            name="performance_optimization",
            type="performance",
            parameters={
                'target_metrics': ['response_time', 'throughput'],
                'constraints': {
                    'response_time': {'max': 500},  # ms
                    'throughput': {'min': 1000}     # requests/sec
                },
                'weights': {
                    'response_time': 0.5,
                    'throughput': 0.5
                }
            },
            objective="maximize",
            algorithm="bayesian",
            metadata={
                'description': 'Optimize system performance',
                'priority': 'medium'
            }
        )
    ]

@pytest.mark.asyncio
async def test_store_strategy(optimization_store, optimization_strategies):
    """Test optimization strategy storage"""
    # Store strategies
    for strategy in optimization_strategies:
        success = await optimization_store.store_strategy(strategy)
        assert success

    # Retrieve strategies
    for strategy in optimization_strategies:
        retrieved = await optimization_store.get_strategy(strategy.id)
        assert retrieved is not None
        assert retrieved.id == strategy.id
        assert retrieved.name == strategy.name
        assert retrieved.type == strategy.type

@pytest.mark.asyncio
async def test_resource_optimization(optimization_manager, optimization_strategies):
    """Test resource optimization"""
    # Add strategy
    strategy = optimization_strategies[0]
    await optimization_manager.add_strategy(strategy)

    # Test data
    metrics = {
        'cpu_usage': 90.0,  # Above target
        'memory_usage': 88.0  # Above target
    }

    # Mock system control functions
    async def mock_apply_changes(*args):
        return True

    with patch.object(optimization_manager, '_apply_changes', mock_apply_changes):
        # Run optimization
        result = await optimization_manager.optimize_resources(metrics)
        assert isinstance(result, OptimizationResult)
        assert result.success
        assert result.metrics['cpu_usage'] < metrics['cpu_usage']
        assert result.metrics['memory_usage'] < metrics['memory_usage']

@pytest.mark.asyncio
async def test_performance_optimization(optimization_manager, optimization_strategies):
    """Test performance optimization"""
    # Add strategy
    strategy = optimization_strategies[1]
    await optimization_manager.add_strategy(strategy)

    # Test data
    metrics = {
        'response_time': 600,  # Above target
        'throughput': 800      # Below target
    }

    # Mock performance tuning functions
    async def mock_tune_performance(*args):
        return {'response_time': 450, 'throughput': 1200}

    with patch.object(optimization_manager, '_tune_performance', mock_tune_performance):
        # Run optimization
        result = await optimization_manager.optimize_performance(metrics)
        assert isinstance(result, OptimizationResult)
        assert result.success
        assert result.metrics['response_time'] < metrics['response_time']
        assert result.metrics['throughput'] > metrics['throughput']

@pytest.mark.asyncio
async def test_custom_optimizer(optimization_manager):
    """Test custom optimizer implementation"""
    # Create custom optimizer
    class CustomOptimizer(Optimizer):
        async def optimize(self, current_state, strategy):
            # Simple optimization logic
            optimized_state = {
                k: v * 0.8 if strategy.objective == "minimize" else v * 1.2
                for k, v in current_state.items()
            }
            return OptimizationResult(
                success=True,
                metrics=optimized_state,
                changes=[{'metric': k, 'from': v, 'to': optimized_state[k]}
                        for k, v in current_state.items()]
            )

    # Register custom optimizer
    optimization_manager.register_optimizer('custom', CustomOptimizer())

    # Create custom strategy
    strategy = OptimizationStrategy(
        id="custom_strategy",
        name="custom_optimization",
        type="custom",
        objective="minimize",
        algorithm="custom"
    )

    # Test optimization
    current_state = {'metric1': 100, 'metric2': 200}
    result = await optimization_manager.optimize(current_state, strategy)
    assert result.success
    assert all(v < current_state[k] for k, v in result.metrics.items())

@pytest.mark.asyncio
async def test_parallel_optimization(optimization_manager, optimization_strategies):
    """Test parallel optimization execution"""
    # Add strategies
    for strategy in optimization_strategies:
        await optimization_manager.add_strategy(strategy)

    # Test data for multiple components
    component_metrics = {
        'component1': {
            'cpu_usage': 85.0,
            'memory_usage': 82.0
        },
        'component2': {
            'cpu_usage': 78.0,
            'memory_usage': 88.0
        }
    }

    # Run parallel optimization
    results = await optimization_manager.optimize_parallel(component_metrics)
    assert len(results) == len(component_metrics)
    assert all(isinstance(r, OptimizationResult) for r in results.values())

@pytest.mark.asyncio
async def test_optimization_monitoring(optimization_manager, optimization_strategies):
    """Test optimization monitoring"""
    # Set up monitoring handler
    events = []
    def event_handler(event):
        events.append(event)

    optimization_manager.on_optimization_event(event_handler)

    # Run optimization
    strategy = optimization_strategies[0]
    await optimization_manager.add_strategy(strategy)
    await optimization_manager.optimize_resources({'cpu_usage': 90.0, 'memory_usage': 85.0})

    # Verify events
    assert len(events) > 0
    assert all(isinstance(e, OptimizationEvent) for e in events)

@pytest.mark.asyncio
async def test_optimization_constraints(optimization_manager):
    """Test optimization constraint handling"""
    # Create strategy with constraints
    strategy = OptimizationStrategy(
        id="constrained_strategy",
        name="constrained_optimization",
        type="resource",
        parameters={
            'constraints': {
                'metric1': {'min': 10, 'max': 50},
                'metric2': {'min': 20, 'max': 60}
            }
        }
    )

    # Test data
    metrics = {
        'metric1': 60,  # Above max
        'metric2': 15   # Below min
    }

    # Run optimization
    result = await optimization_manager.optimize(metrics, strategy)
    assert result.success
    assert 10 <= result.metrics['metric1'] <= 50
    assert 20 <= result.metrics['metric2'] <= 60

@pytest.mark.asyncio
async def test_optimization_convergence(optimization_manager):
    """Test optimization convergence"""
    # Create strategy with convergence settings
    strategy = OptimizationStrategy(
        id="convergence_strategy",
        name="convergence_test",
        type="resource",
        parameters={
            'convergence_threshold': 0.001,
            'max_iterations': 10
        }
    )

    # Mock optimization step function
    iteration_count = 0
    async def mock_optimize_step(*args):
        nonlocal iteration_count
        iteration_count += 1
        return {'value': 1.0 / iteration_count}  # Converging sequence

    with patch.object(optimization_manager, '_optimize_step', mock_optimize_step):
        # Run optimization
        result = await optimization_manager.optimize({'value': 1.0}, strategy)
        assert result.success
        assert iteration_count < strategy.parameters['max_iterations']

@pytest.mark.asyncio
async def test_optimization_history(optimization_manager, optimization_strategies):
    """Test optimization history tracking"""
    # Add strategy
    strategy = optimization_strategies[0]
    await optimization_manager.add_strategy(strategy)

    # Run multiple optimizations
    for i in range(3):
        metrics = {
            'cpu_usage': 80.0 + i,
            'memory_usage': 75.0 + i
        }
        await optimization_manager.optimize_resources(metrics)

    # Get history
    history = await optimization_manager.get_optimization_history(
        start_time=datetime.now() - timedelta(hours=1),
        end_time=datetime.now()
    )
    assert len(history) == 3
    assert all('metrics' in entry for entry in history)
    assert all('result' in entry for entry in history)

@pytest.mark.asyncio
async def test_optimization_metrics(optimization_manager, optimization_strategies):
    """Test optimization metrics collection"""
    # Add strategy and run optimization
    strategy = optimization_strategies[0]
    await optimization_manager.add_strategy(strategy)
    
    metrics = {'cpu_usage': 85.0, 'memory_usage': 80.0}
    await optimization_manager.optimize_resources(metrics)

    # Get optimization metrics
    opt_metrics = await optimization_manager.get_optimization_metrics()
    assert isinstance(opt_metrics, OptimizationMetrics)
    assert opt_metrics.total_optimizations > 0
    assert opt_metrics.success_rate >= 0
    assert opt_metrics.average_improvement > 0

@pytest.mark.asyncio
async def test_manager_start_stop(optimization_manager):
    """Test manager start/stop"""
    # Start manager
    await optimization_manager.start()
    assert optimization_manager.active

    # Let it run briefly
    await asyncio.sleep(2)

    # Stop manager
    await optimization_manager.stop()
    assert not optimization_manager.active

@pytest.mark.asyncio
async def test_manager_error_handling(optimization_manager):
    """Test manager error handling"""
    # Mock store.store_strategy to raise an exception
    async def mock_store(*args):
        raise Exception("Test error")

    optimization_manager.store.store_strategy = mock_store

    # Start manager
    await optimization_manager.start()
    assert optimization_manager.active

    # Try to add strategy (should handle error gracefully)
    await optimization_manager.add_strategy(optimization_strategies[0])

    # Verify manager is still running
    assert optimization_manager.active

    # Stop manager
    await optimization_manager.stop()
    assert not optimization_manager.active 