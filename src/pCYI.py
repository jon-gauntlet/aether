import pytest
import asyncio
import numpy as np
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from lib.autonomic.resource_optimization import (
    ResourceManager,
    ResourceStore,
    ResourceProfile,
    OptimizationConfig,
    ResourceMetrics,
    OptimizationAction,
    ResourceEvent,
    OptimizationResult
)

@pytest.fixture
def resource_store(tmp_path):
    """Create resource store instance with temporary storage"""
    store = ResourceStore()
    store.storage_path = str(tmp_path / "resources")
    store._init_storage()
    return store

@pytest.fixture
def resource_manager(resource_store):
    """Create resource manager instance"""
    config = OptimizationConfig(
        scan_interval=timedelta(minutes=5),
        optimization_threshold=0.8,
        min_resource_level=0.2,
        max_resource_level=0.9,
        cooldown_period=timedelta(minutes=15),
        batch_size=10
    )
    manager = ResourceManager(config)
    manager.store = resource_store
    return manager

@pytest.fixture
def resource_metrics():
    """Create test resource metrics data"""
    now = datetime.now()
    timestamps = [now - timedelta(minutes=i) for i in range(100)]
    
    # Generate synthetic resource metrics
    metrics = []
    for i in range(100):
        # Add resource pressure points
        is_pressure = i in [20, 40, 60, 80]
        pressure_factor = 1.5 if is_pressure else 1.0
        
        metrics.append(
            ResourceMetrics(
                timestamp=timestamps[i],
                values={
                    'cpu_usage': np.random.normal(60, 10) * pressure_factor,
                    'memory_usage': np.random.normal(70, 15) * pressure_factor,
                    'disk_usage': np.random.normal(50, 5) * pressure_factor,
                    'network_bandwidth': np.random.normal(40, 8) * pressure_factor
                },
                metadata={
                    'environment': 'production',
                    'component': 'api_server',
                    'needs_optimization': is_pressure
                }
            )
        )
    return metrics

@pytest.mark.asyncio
async def test_store_resource_metrics(resource_store, resource_metrics):
    """Test resource metrics storage"""
    # Store resource metrics
    for metrics in resource_metrics:
        success = await resource_store.store_metrics(metrics)
        assert success

    # Retrieve resource metrics
    stored_metrics = await resource_store.get_metrics(
        start_time=datetime.now() - timedelta(hours=1),
        end_time=datetime.now()
    )
    assert len(stored_metrics) == len(resource_metrics)

@pytest.mark.asyncio
async def test_resource_profiling(resource_manager, resource_metrics):
    """Test resource profiling"""
    # Add resource metrics
    for metrics in resource_metrics:
        await resource_manager.add_metrics(metrics)

    # Generate resource profile
    profile = await resource_manager.generate_profile(
        metrics=['cpu_usage', 'memory_usage', 'disk_usage', 'network_bandwidth']
    )

    assert isinstance(profile, ResourceProfile)
    assert all(m in profile.metrics for m in 
              ['cpu_usage', 'memory_usage', 'disk_usage', 'network_bandwidth'])
    assert all(0 <= v <= 1 for v in profile.utilization.values())

@pytest.mark.asyncio
async def test_optimization_actions(resource_manager, resource_metrics):
    """Test optimization action generation"""
    # Add resource metrics
    for metrics in resource_metrics:
        await resource_manager.add_metrics(metrics)

    # Generate optimization actions
    actions = await resource_manager.generate_actions()
    assert isinstance(actions, list)
    assert len(actions) > 0
    assert all(isinstance(a, OptimizationAction) for a in actions)
    assert all(a.priority >= 0 for a in actions)

@pytest.mark.asyncio
async def test_action_application(resource_manager, resource_metrics):
    """Test optimization action application"""
    # Generate and apply actions
    actions = await test_optimization_actions(resource_manager, resource_metrics)
    results = []
    
    for action in actions[:3]:  # Test first 3 actions
        result = await resource_manager.apply_action(action)
        results.append(result)
        
        assert isinstance(result, OptimizationResult)
        assert result.success
        assert result.metrics_before['cpu_usage'] >= result.metrics_after['cpu_usage']

@pytest.mark.asyncio
async def test_resource_adaptation(resource_manager, resource_metrics):
    """Test resource adaptation"""
    # Split data into training and testing
    train_metrics = resource_metrics[:70]
    test_metrics = resource_metrics[70:]

    # Train on initial data
    for metrics in train_metrics:
        await resource_manager.add_metrics(metrics)
    
    initial_profile = await resource_manager.generate_profile(
        metrics=['cpu_usage', 'memory_usage']
    )

    # Add test data and adapt
    for metrics in test_metrics:
        await resource_manager.add_metrics(metrics)
    
    adapted_profile = await resource_manager.generate_profile(
        metrics=['cpu_usage', 'memory_usage']
    )

    # Verify adaptation
    assert adapted_profile.efficiency > initial_profile.efficiency
    assert adapted_profile.stability > initial_profile.stability

@pytest.mark.asyncio
async def test_resource_prediction(resource_manager, resource_metrics):
    """Test resource usage prediction"""
    # Add historical data
    for metrics in resource_metrics:
        await resource_manager.add_metrics(metrics)

    # Generate predictions
    predictions = await resource_manager.predict_usage(
        horizon=timedelta(hours=1),
        metrics=['cpu_usage', 'memory_usage']
    )

    assert isinstance(predictions, list)
    assert len(predictions) > 0
    assert all('timestamp' in p for p in predictions)
    assert all('values' in p for p in predictions)
    assert all(isinstance(p['values'], dict) for p in predictions)

@pytest.mark.asyncio
async def test_optimization_strategy(resource_manager, resource_metrics):
    """Test optimization strategy generation"""
    # Add resource metrics
    for metrics in resource_metrics:
        await resource_manager.add_metrics(metrics)

    # Generate strategy
    strategy = await resource_manager.generate_strategy(
        target_metrics=['cpu_usage', 'memory_usage'],
        optimization_goal='efficiency'
    )

    assert isinstance(strategy, dict)
    assert 'actions' in strategy
    assert 'timeline' in strategy
    assert 'expected_benefits' in strategy
    assert len(strategy['actions']) > 0

@pytest.mark.asyncio
async def test_resource_monitoring(resource_manager, resource_metrics):
    """Test resource monitoring"""
    # Set up monitoring handler
    events = []
    def event_handler(event):
        events.append(event)

    resource_manager.on_resource_event(event_handler)

    # Add metrics data with pressure points
    for metrics in resource_metrics:
        await resource_manager.add_metrics(metrics)
        if metrics.metadata.get('needs_optimization'):
            await resource_manager.check_resources()

    # Verify events
    assert len(events) > 0
    assert all(isinstance(e, ResourceEvent) for e in events)

@pytest.mark.asyncio
async def test_optimization_persistence(resource_manager, resource_metrics):
    """Test optimization state persistence"""
    # Generate and save optimization state
    await test_optimization_actions(resource_manager, resource_metrics)
    state_id = await resource_manager.save_state()

    # Load optimization state
    loaded_state = await resource_manager.load_state(state_id)
    assert loaded_state
    
    # Verify optimization still works
    actions = await resource_manager.generate_actions()
    assert len(actions) > 0

@pytest.mark.asyncio
async def test_resource_cleanup(resource_manager, resource_metrics):
    """Test resource data cleanup"""
    # Add old metrics data
    old_time = datetime.now() - timedelta(days=60)
    old_metrics = []
    for metrics in resource_metrics[:10]:
        metrics.timestamp = old_time
        old_metrics.append(metrics)
        await resource_manager.add_metrics(metrics)

    # Add recent metrics data
    for metrics in resource_metrics[10:]:
        await resource_manager.add_metrics(metrics)

    # Run cleanup
    cleaned = await resource_manager.cleanup_metrics()
    assert cleaned > 0

    # Verify old metrics are removed
    stored_metrics = await resource_manager.get_all_metrics()
    assert all(m.timestamp > old_time + timedelta(days=30)
              for m in stored_metrics)

@pytest.mark.asyncio
async def test_optimization_export_import(resource_manager, resource_metrics):
    """Test optimization export/import"""
    # Generate and export optimization data
    await test_optimization_actions(resource_manager, resource_metrics)
    export_data = await resource_manager.export_state()

    # Import optimization data
    imported_state = await resource_manager.import_state(export_data)
    assert imported_state
    
    # Verify optimization still works
    actions = await resource_manager.generate_actions()
    assert len(actions) > 0

@pytest.mark.asyncio
async def test_manager_start_stop(resource_manager):
    """Test manager start/stop"""
    # Start manager
    await resource_manager.start()
    assert resource_manager.active

    # Let it run briefly
    await asyncio.sleep(2)

    # Stop manager
    await resource_manager.stop()
    assert not resource_manager.active

@pytest.mark.asyncio
async def test_manager_error_handling(resource_manager):
    """Test manager error handling"""
    # Mock store.store_metrics to raise an exception
    async def mock_store(*args):
        raise Exception("Test error")

    resource_manager.store.store_metrics = mock_store

    # Start manager
    await resource_manager.start()
    assert resource_manager.active

    # Try to add metrics (should handle error gracefully)
    await resource_manager.add_metrics(resource_metrics[0])

    # Verify manager is still running
    assert resource_manager.active

    # Stop manager
    await resource_manager.stop()
    assert not resource_manager.active 