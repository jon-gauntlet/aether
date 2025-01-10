import pytest
import asyncio
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from lib.autonomic.planner import (
    ActionPlanner,
    ResourceAction,
    PatternAction,
    Action,
    Anomaly,
    Pattern
)

@pytest.fixture
def anomalies():
    """Create test anomalies"""
    now = datetime.now()
    return [
        Anomaly(
            timestamp=now,
            metric_type='cpu_percent',
            value=95.0,
            threshold=90.0,
            severity='critical',
            description='CPU usage critically high'
        ),
        Anomaly(
            timestamp=now,
            metric_type='memory_percent',
            value=85.0,
            threshold=80.0,
            severity='warning',
            description='Memory usage high'
        ),
        Anomaly(
            timestamp=now,
            metric_type='context_growth_rate',
            value=150.0,
            threshold=100.0,
            severity='warning',
            description='Context growth rate high'
        )
    ]

@pytest.fixture
def patterns():
    """Create test patterns"""
    now = datetime.now()
    return [
        Pattern(
            start_time=now - timedelta(hours=1),
            end_time=now,
            metric_type='cpu_percent',
            pattern_type='increasing_trend',
            confidence=0.8,
            data={
                'slope': 2.5,
                'start_value': 50.0,
                'end_value': 80.0,
                'duration': 3600
            }
        ),
        Pattern(
            start_time=now - timedelta(hours=1),
            end_time=now,
            metric_type='memory_percent',
            pattern_type='cycle',
            confidence=0.9,
            data={
                'period': 600,
                'amplitude': 15.0,
                'frequency': 1/600
            }
        )
    ]

@pytest.fixture
def resource_action():
    """Create resource action instance"""
    return ResourceAction()

@pytest.fixture
def pattern_action():
    """Create pattern action instance"""
    return PatternAction()

@pytest.fixture
def planner():
    """Create planner instance"""
    return ActionPlanner()

@pytest.mark.asyncio
async def test_handle_cpu_anomaly(resource_action, anomalies):
    """Test CPU anomaly handling"""
    # Get CPU anomaly
    cpu_anomaly = next(a for a in anomalies if a.metric_type == 'cpu_percent')

    # Handle anomaly
    action = await resource_action._handle_high_cpu(cpu_anomaly)

    # Verify action
    assert action.action_type == 'scale_cpu'
    assert action.priority == 1
    assert action.parameters['scale_factor'] == 1.5
    assert action.status == 'pending'

@pytest.mark.asyncio
async def test_handle_memory_anomaly(resource_action, anomalies):
    """Test memory anomaly handling"""
    # Get memory anomaly
    memory_anomaly = next(a for a in anomalies if a.metric_type == 'memory_percent')

    # Handle anomaly
    action = await resource_action._handle_high_memory(memory_anomaly)

    # Verify action
    assert action.action_type == 'optimize_memory'
    assert action.priority == 3
    assert action.parameters['cleanup_level'] == 'moderate'
    assert action.status == 'pending'

@pytest.mark.asyncio
async def test_handle_growth_anomaly(resource_action, anomalies):
    """Test growth anomaly handling"""
    # Get growth anomaly
    growth_anomaly = next(a for a in anomalies if a.metric_type == 'context_growth_rate')

    # Handle anomaly
    action = await resource_action._handle_context_growth(growth_anomaly)

    # Verify action
    assert action.action_type == 'optimize_contexts'
    assert action.priority == 4
    assert action.parameters['optimization_level'] == 'moderate'
    assert action.status == 'pending'

@pytest.mark.asyncio
async def test_handle_trend_pattern(pattern_action, patterns):
    """Test trend pattern handling"""
    # Get trend pattern
    trend_pattern = next(p for p in patterns if p.pattern_type == 'increasing_trend')

    # Handle pattern
    action = await pattern_action._handle_increasing_trend(trend_pattern)

    # Verify action
    assert action is not None
    assert action.action_type == 'prepare_scaling'
    assert action.priority == 3
    assert action.parameters['trend_slope'] > 0
    assert action.status == 'pending'

@pytest.mark.asyncio
async def test_handle_cycle_pattern(pattern_action, patterns):
    """Test cycle pattern handling"""
    # Get cycle pattern
    cycle_pattern = next(p for p in patterns if p.pattern_type == 'cycle')

    # Handle pattern
    action = await pattern_action._handle_cycle(cycle_pattern)

    # Verify action
    assert action is not None
    assert action.action_type == 'optimize_cycle'
    assert action.priority == 5
    assert 'period' in action.parameters
    assert action.status == 'pending'

@pytest.mark.asyncio
async def test_planner_start_stop(planner):
    """Test planner start/stop"""
    # Start planner
    await planner.start()
    assert planner.active

    # Let it run briefly
    await asyncio.sleep(2)

    # Stop planner
    await planner.stop()
    assert not planner.active

@pytest.mark.asyncio
async def test_planner_error_handling(planner):
    """Test planner error handling"""
    # Mock _get_recent_analysis to raise an exception
    async def mock_get_analysis(*args):
        raise Exception("Test error")

    planner._get_recent_analysis = mock_get_analysis

    # Start planner
    await planner.start()
    assert planner.active

    # Let it try to plan actions
    await asyncio.sleep(2)

    # Verify planner is still running
    assert planner.active

    # Stop planner
    await planner.stop()
    assert not planner.active 