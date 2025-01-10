import pytest
import asyncio
from datetime import datetime
from unittest.mock import Mock, patch

from lib.autonomic.manager import AutonomicManager

@pytest.fixture
def manager():
    """Create autonomic manager instance"""
    return AutonomicManager()

@pytest.mark.asyncio
async def test_manager_start_stop(manager):
    """Test manager start/stop"""
    # Start manager
    await manager.start()
    assert manager.active

    # Verify all components started
    assert manager.monitor.active
    assert manager.analyzer.active
    assert manager.planner.active
    assert manager.executor.active
    assert manager.knowledge.active

    # Let it run briefly
    await asyncio.sleep(2)

    # Stop manager
    await manager.stop()
    assert not manager.active

    # Verify all components stopped
    assert not manager.monitor.active
    assert not manager.analyzer.active
    assert not manager.planner.active
    assert not manager.executor.active
    assert not manager.knowledge.active

@pytest.mark.asyncio
async def test_manager_component_failure(manager):
    """Test manager handling of component failure"""
    # Mock monitor to fail on start
    async def mock_monitor_start():
        raise Exception("Test error")

    manager.monitor.start = mock_monitor_start

    # Attempt to start manager
    with pytest.raises(Exception):
        await manager.start()

    # Verify manager and components are not active
    assert not manager.active
    assert not manager.monitor.active
    assert not manager.analyzer.active
    assert not manager.planner.active
    assert not manager.executor.active
    assert not manager.knowledge.active

@pytest.mark.asyncio
async def test_manager_coordination(manager):
    """Test manager component coordination"""
    # Start manager
    await manager.start()
    assert manager.active

    # Let coordination run
    await asyncio.sleep(2)

    # Get status
    status = await manager.get_status()

    # Verify status
    assert status['active']
    assert all(c['active'] for c in status['components'].values())
    assert 'timestamp' in status

    # Stop manager
    await manager.stop()
    assert not manager.active

@pytest.mark.asyncio
async def test_manager_component_recovery(manager):
    """Test manager handling of component recovery"""
    # Start manager
    await manager.start()
    assert manager.active

    # Simulate component failure
    manager.monitor.active = False

    # Let coordination detect and handle failure
    await asyncio.sleep(6)  # Allow for coordination check

    # Verify manager stopped due to component failure
    assert not manager.active
    assert not manager.monitor.active
    assert not manager.analyzer.active
    assert not manager.planner.active
    assert not manager.executor.active
    assert not manager.knowledge.active

@pytest.mark.asyncio
async def test_manager_error_handling(manager):
    """Test manager error handling"""
    # Mock coordination to raise an exception
    async def mock_coordinate():
        raise Exception("Test error")

    manager._coordinate_components = mock_coordinate

    # Start manager
    await manager.start()
    assert manager.active

    # Let error occur
    await asyncio.sleep(2)

    # Verify manager is still running
    assert manager.active

    # Stop manager
    await manager.stop()
    assert not manager.active

@pytest.mark.asyncio
async def test_manager_status_reporting(manager):
    """Test manager status reporting"""
    # Start manager
    await manager.start()
    assert manager.active

    # Get initial status
    status1 = await manager.get_status()
    assert status1['active']
    timestamp1 = datetime.fromisoformat(status1['timestamp'])

    # Wait briefly
    await asyncio.sleep(1)

    # Get updated status
    status2 = await manager.get_status()
    assert status2['active']
    timestamp2 = datetime.fromisoformat(status2['timestamp'])

    # Verify timestamp updated
    assert timestamp2 > timestamp1

    # Stop manager
    await manager.stop()
    assert not manager.active

    # Get final status
    status3 = await manager.get_status()
    assert not status3['active']

@pytest.mark.asyncio
async def test_manager_graceful_shutdown(manager):
    """Test manager graceful shutdown"""
    # Start manager
    await manager.start()
    assert manager.active

    # Let components initialize
    await asyncio.sleep(1)

    # Stop manager
    await manager.stop()
    assert not manager.active

    # Verify all components stopped gracefully
    assert not any(c['active'] for c in (await manager.get_status())['components'].values())

@pytest.mark.asyncio
async def test_manager_restart(manager):
    """Test manager restart capability"""
    # First start
    await manager.start()
    assert manager.active

    # Stop
    await manager.stop()
    assert not manager.active

    # Second start
    await manager.start()
    assert manager.active

    # Verify all components active
    status = await manager.get_status()
    assert all(c['active'] for c in status['components'].values())

    # Final stop
    await manager.stop()
    assert not manager.active 