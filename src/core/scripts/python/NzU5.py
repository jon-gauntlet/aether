import pytest
import asyncio
import os
import json
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from lib.autonomic.executor import (
    ActionExecutor,
    ResourceExecutor,
    PatternExecutor,
    Action
)

@pytest.fixture
def actions():
    """Create test actions"""
    now = datetime.now()
    return [
        Action(
            timestamp=now,
            action_type='scale_cpu',
            priority=1,
            description='Scale up CPU resources',
            parameters={
                'current_usage': 95.0,
                'target_usage': 70.0,
                'scale_factor': 1.5
            },
            status='pending'
        ),
        Action(
            timestamp=now,
            action_type='optimize_memory',
            priority=3,
            description='Optimize memory usage',
            parameters={
                'current_usage': 85.0,
                'target_usage': 70.0,
                'cleanup_level': 'moderate'
            },
            status='pending'
        ),
        Action(
            timestamp=now,
            action_type='prepare_scaling',
            priority=3,
            description='Prepare for CPU scaling',
            parameters={
                'metric_type': 'cpu_percent',
                'trend_duration': 3600,
                'trend_slope': 2.5,
                'confidence': 0.8
            },
            status='pending'
        )
    ]

@pytest.fixture
def resource_executor():
    """Create resource executor instance"""
    return ResourceExecutor()

@pytest.fixture
def pattern_executor():
    """Create pattern executor instance"""
    return PatternExecutor()

@pytest.fixture
def executor():
    """Create executor instance"""
    return ActionExecutor()

@pytest.mark.asyncio
async def test_scale_cpu(resource_executor, actions):
    """Test CPU scaling"""
    # Get scale CPU action
    scale_action = next(a for a in actions if a.action_type == 'scale_cpu')

    # Mock docker client
    class MockContainer:
        def __init__(self):
            self.attrs = {'HostConfig': {'NanoCpus': int(2e9)}}
        def update(self, **kwargs):
            pass

    class MockClient:
        def containers(self):
            return Mock(get=lambda x: MockContainer())

    resource_executor.docker_client = Mock(containers=Mock(get=lambda x: MockContainer()))

    # Execute action
    result = await resource_executor._scale_cpu(scale_action)

    # Verify result
    assert result.startswith("Scaled CPU")
    assert "cores" in result

@pytest.mark.asyncio
async def test_optimize_memory(resource_executor, actions):
    """Test memory optimization"""
    # Get optimize memory action
    optimize_action = next(a for a in actions if a.action_type == 'optimize_memory')

    # Execute action
    result = await resource_executor._optimize_memory(optimize_action)

    # Verify result
    assert result == "Optimized memory usage settings"

@pytest.mark.asyncio
async def test_prepare_scaling(pattern_executor, actions, tmp_path):
    """Test scaling preparation"""
    # Get prepare scaling action
    prepare_action = next(a for a in actions if a.action_type == 'prepare_scaling')

    # Create temporary config file
    config_path = tmp_path / "scaling.json"
    config_path.parent.mkdir(parents=True, exist_ok=True)
    config_path.write_text('{"scaling_rules": {}}')

    # Mock config path
    with patch('os.path.join', return_value=str(config_path)):
        # Execute action
        result = await pattern_executor._prepare_scaling(prepare_action)

    # Verify result
    assert result.startswith("Updated scaling rules")
    assert prepare_action.parameters['metric_type'] in result

@pytest.mark.asyncio
async def test_executor_start_stop(executor):
    """Test executor start/stop"""
    # Start executor
    await executor.start()
    assert executor.active

    # Let it run briefly
    await asyncio.sleep(2)

    # Stop executor
    await executor.stop()
    assert not executor.active

@pytest.mark.asyncio
async def test_executor_error_handling(executor):
    """Test executor error handling"""
    # Mock _get_pending_actions to raise an exception
    async def mock_get_actions(*args):
        raise Exception("Test error")

    executor._get_pending_actions = mock_get_actions

    # Start executor
    await executor.start()
    assert executor.active

    # Let it try to execute actions
    await asyncio.sleep(2)

    # Verify executor is still running
    assert executor.active

    # Stop executor
    await executor.stop()
    assert not executor.active

@pytest.mark.asyncio
async def test_action_execution_flow(executor, actions, tmp_path):
    """Test complete action execution flow"""
    # Create temporary actions directory
    actions_dir = tmp_path / "actions"
    actions_dir.mkdir(parents=True)
    
    # Create action file
    action_file = actions_dir / "test_actions.json"
    action_file.write_text(json.dumps({
        'timestamp': datetime.now().isoformat(),
        'actions': [{
            'timestamp': a.timestamp.isoformat(),
            'action_type': a.action_type,
            'priority': a.priority,
            'description': a.description,
            'parameters': a.parameters,
            'status': a.status,
            'result': None
        } for a in actions]
    }))

    # Mock paths
    with patch('os.path.join', return_value=str(actions_dir)), \
         patch('os.walk', return_value=[(str(actions_dir), [], ['test_actions.json'])]):
        # Start executor
        await executor.start()
        assert executor.active

        # Let it process actions
        await asyncio.sleep(2)

        # Verify actions were processed
        with open(action_file) as f:
            result = json.load(f)
            assert any(a['status'] == 'completed' for a in result['actions'])

        # Stop executor
        await executor.stop()
        assert not executor.active 