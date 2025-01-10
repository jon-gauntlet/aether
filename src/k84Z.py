import pytest
import asyncio
import json
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from lib.autonomic.state import (
    StateManager,
    StateStore,
    SystemState,
    StateTransition,
    StateSnapshot,
    StateConfig
)

@pytest.fixture
def state_store(tmp_path):
    """Create state store instance with temporary storage"""
    store = StateStore()
    store.storage_path = str(tmp_path / "states")
    store._init_storage()
    return store

@pytest.fixture
def state_manager(state_store):
    """Create state manager instance"""
    config = StateConfig(
        snapshot_interval=300.0,  # 5 minutes
        max_snapshots=100,
        max_transitions=1000,
        retention_period=timedelta(days=7)
    )
    manager = StateManager(config)
    manager.store = state_store
    return manager

@pytest.fixture
def system_states():
    """Create test system states"""
    now = datetime.now()
    return [
        SystemState(
            id="test_state_001",
            timestamp=now - timedelta(minutes=i),
            name="running",
            components={
                'monitor': {'status': 'active', 'last_update': now},
                'analyzer': {'status': 'active', 'last_update': now},
                'planner': {'status': 'active', 'last_update': now},
                'executor': {'status': 'active', 'last_update': now}
            },
            metrics={
                'cpu_usage': 45.0,
                'memory_usage': 60.0,
                'active_contexts': 5
            },
            metadata={
                'version': '1.0.0',
                'environment': 'development'
            }
        )
        for i in range(5)
    ]

@pytest.fixture
def state_transitions():
    """Create test state transitions"""
    now = datetime.now()
    return [
        StateTransition(
            id="test_transition_001",
            timestamp=now - timedelta(minutes=i),
            from_state="initializing",
            to_state="running",
            trigger="system_startup",
            components_affected=['monitor', 'analyzer', 'planner', 'executor'],
            metadata={
                'duration': 5.0,
                'success': True
            }
        )
        for i in range(5)
    ]

@pytest.mark.asyncio
async def test_store_system_state(state_store, system_states):
    """Test system state storage"""
    # Store states
    for state in system_states:
        success = await state_store.store_state(state)
        assert success

    # Retrieve states
    for state in system_states:
        retrieved = await state_store.get_state(state.id)
        assert retrieved is not None
        assert retrieved.id == state.id
        assert retrieved.name == state.name
        assert retrieved.components == state.components

@pytest.mark.asyncio
async def test_store_state_transition(state_store, state_transitions):
    """Test state transition storage"""
    # Store transitions
    for transition in state_transitions:
        success = await state_store.store_transition(transition)
        assert success

    # Retrieve transitions
    for transition in state_transitions:
        retrieved = await state_store.get_transition(transition.id)
        assert retrieved is not None
        assert retrieved.id == transition.id
        assert retrieved.from_state == transition.from_state
        assert retrieved.to_state == transition.to_state

@pytest.mark.asyncio
async def test_state_snapshot(state_manager, system_states):
    """Test state snapshot creation"""
    # Set initial state
    current_state = system_states[0]
    await state_manager.set_state(current_state)

    # Create snapshot
    snapshot = await state_manager.create_snapshot()
    assert isinstance(snapshot, StateSnapshot)
    assert snapshot.state.id == current_state.id
    assert snapshot.components == current_state.components

@pytest.mark.asyncio
async def test_state_restoration(state_manager, system_states):
    """Test state restoration"""
    # Create snapshot
    original_state = system_states[0]
    await state_manager.set_state(original_state)
    snapshot = await state_manager.create_snapshot()

    # Change state
    new_state = system_states[1]
    await state_manager.set_state(new_state)

    # Restore from snapshot
    success = await state_manager.restore_snapshot(snapshot.id)
    assert success

    # Verify restoration
    current = await state_manager.get_current_state()
    assert current.components == original_state.components

@pytest.mark.asyncio
async def test_state_transition_tracking(state_manager, system_states):
    """Test state transition tracking"""
    # Perform state transitions
    for state in system_states:
        await state_manager.set_state(state)

    # Get transition history
    start_time = datetime.now() - timedelta(hours=1)
    end_time = datetime.now()
    transitions = await state_manager.get_transitions(start_time, end_time)
    
    assert isinstance(transitions, list)
    assert len(transitions) == len(system_states) - 1  # n states = n-1 transitions

@pytest.mark.asyncio
async def test_component_state_tracking(state_manager):
    """Test component state tracking"""
    # Update component states
    components = {
        'monitor': {'status': 'active'},
        'analyzer': {'status': 'active'},
        'planner': {'status': 'inactive'},
        'executor': {'status': 'error'}
    }
    await state_manager.update_component_states(components)

    # Get component states
    current = await state_manager.get_current_state()
    assert current.components == components

@pytest.mark.asyncio
async def test_state_validation(state_manager, system_states):
    """Test state validation"""
    # Valid state
    valid_state = system_states[0]
    is_valid = await state_manager.validate_state(valid_state)
    assert is_valid

    # Invalid state (missing required components)
    invalid_state = system_states[0].copy()
    invalid_state.components.pop('monitor')
    is_valid = await state_manager.validate_state(invalid_state)
    assert not is_valid

@pytest.mark.asyncio
async def test_state_query(state_store, system_states):
    """Test state querying"""
    # Store states
    for state in system_states:
        await state_store.store_state(state)

    # Query states
    query_results = await state_store.query_states(
        name="running",
        component_status={
            'monitor': 'active',
            'analyzer': 'active'
        },
        start_time=datetime.now() - timedelta(hours=1),
        end_time=datetime.now()
    )
    assert len(query_results) > 0
    assert all(s.name == "running" for s in query_results)

@pytest.mark.asyncio
async def test_state_cleanup(state_manager, system_states):
    """Test state cleanup"""
    # Store states
    for state in system_states:
        await state_manager.store.store_state(state)

    # Add old state
    old_state = system_states[0].copy()
    old_state.id = "old_state"
    old_state.timestamp = datetime.now() - timedelta(days=30)
    await state_manager.store.store_state(old_state)

    # Run cleanup
    cleaned = await state_manager.cleanup()
    assert cleaned > 0

@pytest.mark.asyncio
async def test_manager_start_stop(state_manager):
    """Test manager start/stop"""
    # Start manager
    await state_manager.start()
    assert state_manager.active

    # Let it run briefly
    await asyncio.sleep(2)

    # Stop manager
    await state_manager.stop()
    assert not state_manager.active

@pytest.mark.asyncio
async def test_manager_error_handling(state_manager):
    """Test manager error handling"""
    # Mock store.store_state to raise an exception
    async def mock_store(*args):
        raise Exception("Test error")

    state_manager.store.store_state = mock_store

    # Start manager
    await state_manager.start()
    assert state_manager.active

    # Try to set state (should handle error gracefully)
    await state_manager.set_state(SystemState(
        id="test",
        timestamp=datetime.now(),
        name="test",
        components={},
        metrics={},
        metadata={}
    ))

    # Verify manager is still running
    assert state_manager.active

    # Stop manager
    await state_manager.stop()
    assert not state_manager.active

@pytest.mark.asyncio
async def test_state_export_import(state_manager, system_states):
    """Test state export/import"""
    # Set initial state
    await state_manager.set_state(system_states[0])

    # Export state
    export_data = await state_manager.export_state()
    assert isinstance(export_data, dict)
    assert 'state' in export_data
    assert 'components' in export_data['state']

    # Import state
    imported = await state_manager.import_state(export_data)
    assert isinstance(imported, SystemState)
    assert imported.components == system_states[0].components

@pytest.mark.asyncio
async def test_state_notifications(state_manager, system_states):
    """Test state change notifications"""
    # Set up notification handler
    notifications = []
    def state_handler(old_state, new_state):
        notifications.append((old_state, new_state))

    # Enable notifications
    state_manager.on_state_change(state_handler)

    # Change states
    for state in system_states:
        await state_manager.set_state(state)

    # Verify notifications
    assert len(notifications) == len(system_states)
    assert all(isinstance(old, (SystemState, type(None))) and 
              isinstance(new, SystemState) 
              for old, new in notifications) 