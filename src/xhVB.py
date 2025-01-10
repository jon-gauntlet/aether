"""Tests for equilibrium management functionality."""

import pytest
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

from lib.equilibrium.manager import (
    EquilibriumManager,
    EquilibriumState,
    EquilibriumMetrics,
    EquilibriumConfig
)
from lib.context.manager import Context

@pytest.fixture
async def equilibrium_manager():
    manager = EquilibriumManager()
    await manager.initialize()
    return manager

@pytest.mark.asyncio
async def test_equilibrium_state_calculation(equilibrium_manager):
    # Create test contexts and links
    context1 = await equilibrium_manager.context_manager.create_context(
        context_type='test',
        data={'value': 1},
        metadata={'test': True}
    )
    
    context2 = await equilibrium_manager.context_manager.create_context(
        context_type='test',
        data={'value': 2},
        metadata={'test': True}
    )
    
    # Create information link
    await equilibrium_manager.create_information_link(
        context1.id,
        context2.id,
        'test',
        0.8
    )
    
    # Check equilibrium state
    state = await equilibrium_manager.check_equilibrium()
    assert isinstance(state, EquilibriumState)
    assert 0 <= state.stability_score <= 1
    assert 0 <= state.entropy_level <= 1
    assert 0 <= state.coherence_score <= 1
    assert 0 <= state.integration_rate <= 1
    assert 0 <= state.preservation_score <= 1

@pytest.mark.asyncio
async def test_information_link_management(equilibrium_manager):
    # Create test contexts
    context1 = await equilibrium_manager.context_manager.create_context(
        context_type='test',
        data={'value': 1}
    )
    
    context2 = await equilibrium_manager.context_manager.create_context(
        context_type='test',
        data={'value': 2}
    )
    
    # Create link
    await equilibrium_manager.create_information_link(
        context1.id,
        context2.id,
        'test',
        0.8,
        {'test': True}
    )
    
    # Verify link exists
    links = await equilibrium_manager._get_information_links()
    assert len(links) == 1
    assert links[0]['source_id'] == context1.id
    assert links[0]['target_id'] == context2.id
    assert links[0]['strength'] == 0.8
    
    # Verify link
    await equilibrium_manager.verify_information_links()
    links = await equilibrium_manager._get_information_links()
    assert len(links) == 1  # Link should still exist
    
    # Remove context and verify link is removed
    await equilibrium_manager.context_manager.delete_context(context1.id)
    await equilibrium_manager.verify_information_links()
    links = await equilibrium_manager._get_information_links()
    assert len(links) == 0

@pytest.mark.asyncio
async def test_system_rebalancing(equilibrium_manager):
    # Create unstable state
    state = EquilibriumState(
        timestamp=datetime.now(),
        stability_score=0.5,  # Below threshold
        entropy_level=0.4,  # Above threshold
        coherence_score=0.6,  # Below threshold
        integration_rate=0.8,  # Below threshold
        preservation_score=0.9  # Below threshold
    )
    
    # Attempt rebalancing
    await equilibrium_manager._rebalance_system(state)
    
    # Verify recovery attempt was recorded
    assert equilibrium_manager.metrics.recovery_attempts == 1
    
    # Verify cooldown is enforced
    await equilibrium_manager._rebalance_system(state)
    assert equilibrium_manager.metrics.recovery_attempts == 1  # Should not increment

@pytest.mark.asyncio
async def test_information_recovery(equilibrium_manager):
    # Create test pattern with multiple contexts
    contexts = []
    for i in range(3):
        context = await equilibrium_manager.context_manager.create_context(
            context_type='test',
            data={'value': i},
            metadata={'test': True}
        )
        contexts.append(context)
    
    # Create links between contexts
    for i in range(len(contexts)):
        for j in range(i + 1, len(contexts)):
            await equilibrium_manager.create_information_link(
                contexts[i].id,
                contexts[j].id,
                'test',
                0.9
            )
    
    # Delete a context to simulate information loss
    await equilibrium_manager.context_manager.delete_context(contexts[1].id)
    
    # Attempt recovery
    await equilibrium_manager._recover_information()
    
    # Verify recovery created new links
    links = await equilibrium_manager._get_information_links()
    assert any(link['metadata'].get('recovered') for link in links)

@pytest.mark.asyncio
async def test_link_strengthening(equilibrium_manager):
    # Create test contexts with weak link
    context1 = await equilibrium_manager.context_manager.create_context(
        context_type='test',
        data={'value': 1}
    )
    
    context2 = await equilibrium_manager.context_manager.create_context(
        context_type='test',
        data={'value': 2}
    )
    
    # Create intermediate context
    intermediate = await equilibrium_manager.context_manager.create_context(
        context_type='test',
        data={'value': 1.5}
    )
    
    # Create weak link
    await equilibrium_manager.create_information_link(
        context1.id,
        context2.id,
        'test',
        0.5  # Weak link
    )
    
    # Attempt to strengthen links
    await equilibrium_manager._strengthen_links()
    
    # Verify reinforcement links were created
    links = await equilibrium_manager._get_information_links()
    reinforcement_links = [l for l in links if l['link_type'] == 'reinforcement']
    assert len(reinforcement_links) > 0

@pytest.mark.asyncio
async def test_entropy_management(equilibrium_manager):
    # Create test contexts with high entropy
    contexts = []
    for i in range(5):
        context = await equilibrium_manager.context_manager.create_context(
            context_type='test',
            data={'value': i}
        )
        contexts.append(context)
    
    # Calculate initial entropy
    initial_entropy = await equilibrium_manager._calculate_entropy()
    
    # Reorganize information
    await equilibrium_manager._reorganize_information()
    
    # Calculate new entropy
    final_entropy = await equilibrium_manager._calculate_entropy()
    
    # Entropy should decrease after reorganization
    assert final_entropy <= initial_entropy

@pytest.mark.asyncio
async def test_equilibrium_maintenance(equilibrium_manager):
    # Mock check_equilibrium to simulate unstable state
    unstable_state = EquilibriumState(
        timestamp=datetime.now(),
        stability_score=0.5,
        entropy_level=0.4,
        coherence_score=0.6,
        integration_rate=0.8,
        preservation_score=0.9
    )
    
    with patch.object(
        equilibrium_manager,
        'check_equilibrium',
        return_value=unstable_state
    ):
        # Run maintenance cycle
        maintenance_task = asyncio.create_task(
            equilibrium_manager.maintain_equilibrium()
        )
        
        # Let it run for a short time
        await asyncio.sleep(0.1)
        maintenance_task.cancel()
        
        try:
            await maintenance_task
        except asyncio.CancelledError:
            pass
        
        # Verify maintenance actions were taken
        assert equilibrium_manager.metrics.recovery_attempts > 0 