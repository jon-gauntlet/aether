import pytest
import asyncio
import psutil
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from lib.autonomic.resource_optimization import (
    ResourceOptimizer,
    OptimizationStore,
    OptimizationAction,
    ResourceProfile,
    OptimizationConfig
)

@pytest.fixture
def optimization_store(tmp_path):
    """Create optimization store instance with temporary storage"""
    store = OptimizationStore()
    store.storage_path = str(tmp_path / "optimizations")
    store._init_storage()
    return store

@pytest.fixture
def resource_optimizer(optimization_store):
    """Create resource optimizer instance"""
    config = OptimizationConfig(
        min_cpu_threshold=70.0,
        max_cpu_threshold=90.0,
        min_memory_threshold=60.0,
        max_memory_threshold=85.0,
        optimization_interval=300.0,
        cooldown_period=600.0
    )
    optimizer = ResourceOptimizer(config)
    optimizer.store = optimization_store
    return optimizer

@pytest.fixture
def optimization_actions():
    """Create test optimization actions"""
    now = datetime.now()
    return [
        OptimizationAction(
            id="test_action_001",
            type="cpu_scaling",
            target="system",
            parameters={
                'current_usage': 85.0,
                'target_usage': 70.0,
                'scale_factor': 1.5
            },
            status="pending",
            created_at=now,
            updated_at=now,
            priority=1
        ),
        OptimizationAction(
            id="test_action_002",
            type="memory_cleanup",
            target="process",
            parameters={
                'process_name': 'python',
                'pid': 1000,
                'current_usage': 75.0,
                'target_usage': 60.0
            },
            status="pending",
            created_at=now,
            updated_at=now,
            priority=2
        )
    ]

@pytest.fixture
def resource_profiles():
    """Create test resource profiles"""
    now = datetime.now()
    return [
        ResourceProfile(
            id="test_profile_001",
            name="development",
            cpu_allocation=2.0,
            memory_allocation=4096,
            io_priority="normal",
            created_at=now,
            updated_at=now,
            active=True
        ),
        ResourceProfile(
            id="test_profile_002",
            name="analysis",
            cpu_allocation=4.0,
            memory_allocation=8192,
            io_priority="high",
            created_at=now,
            updated_at=now,
            active=True
        )
    ]

@pytest.mark.asyncio
async def test_store_optimization_action(optimization_store, optimization_actions):
    """Test optimization action storage"""
    # Store actions
    for action in optimization_actions:
        success = await optimization_store.store_action(action)
        assert success

    # Retrieve actions
    for action in optimization_actions:
        retrieved = await optimization_store.get_action(action.id)
        assert retrieved is not None
        assert retrieved.id == action.id
        assert retrieved.type == action.type
        assert retrieved.status == action.status

@pytest.mark.asyncio
async def test_update_optimization_action(optimization_store, optimization_actions):
    """Test optimization action update"""
    # Store initial action
    action = optimization_actions[0]
    await optimization_store.store_action(action)

    # Update action
    action.status = "completed"
    action.parameters['scale_factor'] = 2.0
    success = await optimization_store.update_action(action)
    assert success

    # Verify update
    updated = await optimization_store.get_action(action.id)
    assert updated.status == "completed"
    assert updated.parameters['scale_factor'] == 2.0

@pytest.mark.asyncio
async def test_resource_profile_management(resource_optimizer, resource_profiles):
    """Test resource profile management"""
    # Add profiles
    for profile in resource_profiles:
        success = await resource_optimizer.add_profile(profile)
        assert success

    # Get profiles
    retrieved = await resource_optimizer.get_profiles()
    assert len(retrieved) == len(resource_profiles)
    assert all(isinstance(p, ResourceProfile) for p in retrieved)

    # Update profile
    profile = resource_profiles[0]
    profile.cpu_allocation = 3.0
    success = await resource_optimizer.update_profile(profile)
    assert success

    # Verify update
    updated = await resource_optimizer.get_profile(profile.id)
    assert updated.cpu_allocation == 3.0

@pytest.mark.asyncio
async def test_optimize_cpu_usage(resource_optimizer):
    """Test CPU usage optimization"""
    # Mock system metrics
    mock_metrics = Mock()
    mock_metrics.cpu_percent = 85.0
    mock_metrics.timestamp = datetime.now()

    # Optimize CPU
    action = await resource_optimizer.optimize_cpu(mock_metrics)
    assert isinstance(action, OptimizationAction)
    assert action.type == "cpu_scaling"
    assert action.parameters['current_usage'] == 85.0

@pytest.mark.asyncio
async def test_optimize_memory_usage(resource_optimizer):
    """Test memory usage optimization"""
    # Mock process metrics
    mock_metrics = Mock()
    mock_metrics.name = "python"
    mock_metrics.pid = 1000
    mock_metrics.memory_percent = 75.0
    mock_metrics.timestamp = datetime.now()

    # Optimize memory
    action = await resource_optimizer.optimize_memory(mock_metrics)
    assert isinstance(action, OptimizationAction)
    assert action.type == "memory_cleanup"
    assert action.parameters['process_name'] == "python"

@pytest.mark.asyncio
async def test_apply_optimization(resource_optimizer, optimization_actions):
    """Test optimization application"""
    # Mock container for CPU scaling
    class MockContainer:
        def update(self, **kwargs):
            pass

    class MockClient:
        def containers(self):
            return Mock(get=lambda x: MockContainer())

    with patch('docker.from_env', return_value=MockClient()):
        # Apply CPU scaling action
        action = optimization_actions[0]
        success = await resource_optimizer.apply_optimization(action)
        assert success

        # Verify action status
        updated = await resource_optimizer.store.get_action(action.id)
        assert updated.status == "completed"

@pytest.mark.asyncio
async def test_optimization_history(optimization_store, optimization_actions):
    """Test optimization history tracking"""
    # Store actions
    for action in optimization_actions:
        await optimization_store.store_action(action)

    # Get history
    start_time = datetime.now() - timedelta(hours=1)
    end_time = datetime.now()
    history = await optimization_store.get_history(start_time, end_time)
    
    assert isinstance(history, list)
    assert len(history) > 0
    assert all(isinstance(a, OptimizationAction) for a in history)

@pytest.mark.asyncio
async def test_optimizer_start_stop(resource_optimizer):
    """Test optimizer start/stop"""
    # Start optimizer
    await resource_optimizer.start()
    assert resource_optimizer.active

    # Let it run briefly
    await asyncio.sleep(2)

    # Stop optimizer
    await resource_optimizer.stop()
    assert not resource_optimizer.active

@pytest.mark.asyncio
async def test_optimizer_error_handling(resource_optimizer):
    """Test optimizer error handling"""
    # Mock optimize_cpu to raise an exception
    async def mock_optimize(*args):
        raise Exception("Test error")

    resource_optimizer.optimize_cpu = mock_optimize

    # Start optimizer
    await resource_optimizer.start()
    assert resource_optimizer.active

    # Let it try to optimize
    await asyncio.sleep(2)

    # Verify optimizer is still running
    assert resource_optimizer.active

    # Stop optimizer
    await resource_optimizer.stop()
    assert not resource_optimizer.active

@pytest.mark.asyncio
async def test_cooldown_period(resource_optimizer, optimization_actions):
    """Test optimization cooldown period"""
    # Store recent action
    action = optimization_actions[0]
    await resource_optimizer.store.store_action(action)

    # Attempt optimization during cooldown
    mock_metrics = Mock()
    mock_metrics.cpu_percent = 85.0
    mock_metrics.timestamp = datetime.now()

    action = await resource_optimizer.optimize_cpu(mock_metrics)
    assert action is None  # Should not optimize during cooldown

@pytest.mark.asyncio
async def test_optimization_priorities(resource_optimizer, optimization_actions):
    """Test optimization priority handling"""
    # Store actions with different priorities
    for action in optimization_actions:
        await resource_optimizer.store.store_action(action)

    # Get pending actions
    pending = await resource_optimizer.store.get_pending_actions()
    assert len(pending) > 0
    assert all(a.priority >= pending[0].priority for a in pending)  # Should be sorted by priority 