import pytest
import asyncio
import json
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from lib.autonomic.recovery import (
    RecoveryManager,
    RecoveryStore,
    RecoveryPoint,
    RecoveryStrategy,
    RecoveryConfig,
    RecoveryStatus,
    SystemState,
    ComponentState,
    RecoveryEvent
)

@pytest.fixture
def recovery_store(tmp_path):
    """Create recovery store instance with temporary storage"""
    store = RecoveryStore()
    store.storage_path = str(tmp_path / "recovery")
    store._init_storage()
    return store

@pytest.fixture
def recovery_manager(recovery_store):
    """Create recovery manager instance"""
    config = RecoveryConfig(
        check_interval=5.0,
        max_attempts=3,
        retry_delay=timedelta(seconds=5),
        snapshot_interval=timedelta(minutes=15),
        enable_automatic_recovery=True
    )
    manager = RecoveryManager(config)
    manager.store = recovery_store
    return manager

@pytest.fixture
def recovery_points():
    """Create test recovery points"""
    now = datetime.now()
    return [
        RecoveryPoint(
            id="test_recovery_001",
            timestamp=now - timedelta(minutes=i),
            system_state=SystemState(
                components={
                    'monitor': ComponentState(
                        status='active',
                        metrics={'cpu': 50.0, 'memory': 60.0},
                        last_update=now
                    ),
                    'analyzer': ComponentState(
                        status='active',
                        metrics={'cpu': 45.0, 'memory': 55.0},
                        last_update=now
                    ),
                    'planner': ComponentState(
                        status='active',
                        metrics={'cpu': 40.0, 'memory': 50.0},
                        last_update=now
                    ),
                    'executor': ComponentState(
                        status='active',
                        metrics={'cpu': 35.0, 'memory': 45.0},
                        last_update=now
                    )
                },
                metrics={
                    'total_cpu': 170.0,
                    'total_memory': 210.0,
                    'active_components': 4
                }
            ),
            metadata={
                'version': '1.0.0',
                'trigger': 'scheduled'
            },
            status=RecoveryStatus.VALID
        )
        for i in range(5)
    ]

@pytest.mark.asyncio
async def test_store_recovery_point(recovery_store, recovery_points):
    """Test recovery point storage"""
    # Store recovery points
    for point in recovery_points:
        success = await recovery_store.store(point)
        assert success

    # Retrieve recovery points
    for point in recovery_points:
        retrieved = await recovery_store.get(point.id)
        assert retrieved is not None
        assert retrieved.id == point.id
        assert retrieved.status == point.status
        assert len(retrieved.system_state.components) == len(point.system_state.components)

@pytest.mark.asyncio
async def test_create_recovery_point(recovery_manager):
    """Test recovery point creation"""
    # Mock system state collection
    mock_state = SystemState(
        components={
            'test_component': ComponentState(
                status='active',
                metrics={'cpu': 50.0},
                last_update=datetime.now()
            )
        },
        metrics={'total_cpu': 50.0}
    )

    with patch('lib.autonomic.recovery.collect_system_state', return_value=mock_state):
        # Create recovery point
        point = await recovery_manager.create_recovery_point()
        assert isinstance(point, RecoveryPoint)
        assert point.system_state.components['test_component'].status == 'active'

@pytest.mark.asyncio
async def test_recovery_execution(recovery_manager, recovery_points):
    """Test recovery execution"""
    # Mock component recovery
    async def mock_recover_component(*args, **kwargs):
        return True

    with patch('lib.autonomic.recovery.recover_component', mock_recover_component):
        # Execute recovery
        point = recovery_points[0]
        strategy = RecoveryStrategy(
            components=['monitor', 'analyzer'],
            order=['monitor', 'analyzer'],
            actions={
                'monitor': {'action': 'restart'},
                'analyzer': {'action': 'restart'}
            }
        )
        
        result = await recovery_manager.execute_recovery(point, strategy)
        assert result.success
        assert result.recovered_components == ['monitor', 'analyzer']

@pytest.mark.asyncio
async def test_automatic_recovery(recovery_manager):
    """Test automatic recovery"""
    # Mock failure detection
    failed_components = ['test_component']
    async def mock_detect_failures(*args):
        return failed_components

    # Mock recovery execution
    async def mock_execute_recovery(*args):
        return Mock(success=True, recovered_components=failed_components)

    with patch('lib.autonomic.recovery.detect_failures', mock_detect_failures), \
         patch.object(recovery_manager, 'execute_recovery', mock_execute_recovery):
        # Enable automatic recovery
        await recovery_manager.enable_automatic_recovery()

        # Let automatic recovery run
        await asyncio.sleep(2)

        # Verify recovery was attempted
        history = await recovery_manager.get_recovery_history()
        assert len(history) > 0

@pytest.mark.asyncio
async def test_recovery_validation(recovery_manager, recovery_points):
    """Test recovery point validation"""
    # Valid recovery point
    point = recovery_points[0]
    is_valid = await recovery_manager.validate_recovery_point(point)
    assert is_valid

    # Invalid recovery point (missing required component)
    invalid_point = recovery_points[0].copy()
    invalid_point.system_state.components.pop('monitor')
    is_valid = await recovery_manager.validate_recovery_point(invalid_point)
    assert not is_valid

@pytest.mark.asyncio
async def test_recovery_strategy_generation(recovery_manager, recovery_points):
    """Test recovery strategy generation"""
    # Generate strategy for failed components
    failed_components = ['monitor', 'analyzer']
    strategy = await recovery_manager.generate_recovery_strategy(
        recovery_points[0],
        failed_components
    )
    
    assert isinstance(strategy, RecoveryStrategy)
    assert all(c in strategy.components for c in failed_components)
    assert len(strategy.order) == len(failed_components)

@pytest.mark.asyncio
async def test_component_dependencies(recovery_manager):
    """Test component dependency handling"""
    # Define dependencies
    dependencies = {
        'executor': ['planner'],
        'planner': ['analyzer'],
        'analyzer': ['monitor']
    }

    # Generate recovery order
    failed_components = ['executor', 'monitor', 'analyzer']
    order = await recovery_manager.generate_recovery_order(
        failed_components,
        dependencies
    )
    
    # Verify order respects dependencies
    assert order.index('monitor') < order.index('analyzer')
    assert order.index('analyzer') < order.index('executor')

@pytest.mark.asyncio
async def test_recovery_monitoring(recovery_manager, recovery_points):
    """Test recovery monitoring"""
    # Set up monitoring handler
    events = []
    def event_handler(event):
        events.append(event)

    recovery_manager.on_recovery_event(event_handler)

    # Execute recovery
    point = recovery_points[0]
    strategy = RecoveryStrategy(
        components=['test_component'],
        order=['test_component'],
        actions={'test_component': {'action': 'restart'}}
    )
    
    await recovery_manager.execute_recovery(point, strategy)

    # Verify events
    assert len(events) > 0
    assert all(isinstance(e, RecoveryEvent) for e in events)

@pytest.mark.asyncio
async def test_recovery_history(recovery_manager, recovery_points):
    """Test recovery history tracking"""
    # Execute multiple recoveries
    point = recovery_points[0]
    strategy = RecoveryStrategy(
        components=['test_component'],
        order=['test_component'],
        actions={'test_component': {'action': 'restart'}}
    )

    for _ in range(3):
        await recovery_manager.execute_recovery(point, strategy)

    # Get history
    history = await recovery_manager.get_recovery_history()
    assert len(history) == 3
    assert all('timestamp' in entry for entry in history)
    assert all('success' in entry for entry in history)

@pytest.mark.asyncio
async def test_recovery_point_cleanup(recovery_manager, recovery_points):
    """Test recovery point cleanup"""
    # Store recovery points
    for point in recovery_points:
        await recovery_manager.store.store(point)

    # Add old recovery point
    old_point = recovery_points[0].copy()
    old_point.id = "old_point"
    old_point.timestamp = datetime.now() - timedelta(days=60)
    await recovery_manager.store.store(old_point)

    # Run cleanup
    cleaned = await recovery_manager.cleanup(max_age=timedelta(days=30))
    assert cleaned > 0

@pytest.mark.asyncio
async def test_manager_start_stop(recovery_manager):
    """Test manager start/stop"""
    # Start manager
    await recovery_manager.start()
    assert recovery_manager.active

    # Let it run briefly
    await asyncio.sleep(2)

    # Stop manager
    await recovery_manager.stop()
    assert not recovery_manager.active

@pytest.mark.asyncio
async def test_manager_error_handling(recovery_manager):
    """Test manager error handling"""
    # Mock store.store to raise an exception
    async def mock_store(*args):
        raise Exception("Test error")

    recovery_manager.store.store = mock_store

    # Start manager
    await recovery_manager.start()
    assert recovery_manager.active

    # Try to create recovery point (should handle error gracefully)
    await recovery_manager.create_recovery_point()

    # Verify manager is still running
    assert recovery_manager.active

    # Stop manager
    await recovery_manager.stop()
    assert not recovery_manager.active

@pytest.mark.asyncio
async def test_recovery_notifications(recovery_manager, recovery_points):
    """Test recovery notifications"""
    # Set up notification handler
    notifications = []
    def notification_handler(point_id, status):
        notifications.append((point_id, status))

    recovery_manager.on_recovery_status_change(notification_handler)

    # Execute recovery
    point = recovery_points[0]
    strategy = RecoveryStrategy(
        components=['test_component'],
        order=['test_component'],
        actions={'test_component': {'action': 'restart'}}
    )
    
    await recovery_manager.execute_recovery(point, strategy)

    # Verify notifications
    assert len(notifications) > 0
    assert notifications[0][0] == point.id 