"""Tests for equilibrium management functionality."""

import pytest
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch, AsyncMock

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
    # Mock LLM service
    manager.llm_service = AsyncMock()
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
    
    # Mock LLM semantic analysis
    equilibrium_manager.llm_service.analyze_similarity.return_value = 0.85
    
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
    assert 0 <= state.semantic_score <= 1
    assert 0 <= state.context_understanding <= 1

@pytest.mark.asyncio
async def test_semantic_link_enhancement(equilibrium_manager):
    # Create test contexts
    context1 = await equilibrium_manager.context_manager.create_context(
        context_type='test',
        data={'value': 1}
    )
    
    context2 = await equilibrium_manager.context_manager.create_context(
        context_type='test',
        data={'value': 2}
    )
    
    # Mock LLM analysis results
    equilibrium_manager.llm_service.analyze_relationship.return_value = [{
        'type': 'semantic',
        'insights': {
            'relationship_type': 'semantic_similarity',
            'confidence': 0.9
        }
    }]
    
    # Test semantic enhancement
    await equilibrium_manager._strengthen_links()
    
    # Verify enhanced links
    links = await equilibrium_manager._get_information_links()
    semantic_links = [l for l in links if l['metadata'].get('llm_enhanced')]
    assert len(semantic_links) > 0
    assert semantic_links[0]['strength'] >= equilibrium_manager.config.min_semantic_score

@pytest.mark.asyncio
async def test_context_chain_analysis(equilibrium_manager):
    # Create test contexts
    contexts = []
    for i in range(3):
        context = await equilibrium_manager.context_manager.create_context(
            context_type='test',
            data={'value': i}
        )
        contexts.append(context)
    
    # Mock LLM chain analysis
    equilibrium_manager.llm_service.analyze_relationship_chain.return_value = {
        'is_valid': True,
        'source_intermediate_type': 'semantic',
        'source_intermediate_strength': 0.85,
        'intermediate_target_type': 'semantic',
        'intermediate_target_strength': 0.85,
        'metadata': {'chain_confidence': 0.9}
    }
    
    # Create intermediate links
    await equilibrium_manager._create_intermediate_links(
        contexts[0],
        contexts[2],
        [contexts[1]]
    )
    
    # Verify chain links
    links = await equilibrium_manager._get_information_links()
    chain_links = [l for l in links if 'chain_position' in l['metadata']]
    assert len(chain_links) == 2
    assert all(l['strength'] >= 0.85 for l in chain_links)

@pytest.mark.asyncio
async def test_pattern_recovery(equilibrium_manager):
    # Create test contexts with pattern
    contexts = []
    for i in range(3):
        context = await equilibrium_manager.context_manager.create_context(
            context_type='test',
            data={'value': i},
            metadata={'pattern_id': 'test_pattern'}
        )
        contexts.append(context)
    
    # Mock LLM pattern analysis
    equilibrium_manager.llm_service.analyze_pattern_recovery.return_value = {
        'should_recover': True,
        'actions': [{
            'type': 'create_link',
            'source_id': contexts[0].id,
            'target_id': contexts[1].id,
            'link_type': 'recovered',
            'confidence': 0.9,
            'metadata': {'recovery_reason': 'pattern_match'}
        }]
    }
    
    # Attempt recovery
    await equilibrium_manager._recover_information()
    
    # Verify recovered links
    links = await equilibrium_manager._get_information_links()
    recovered_links = [l for l in links if l['metadata'].get('llm_recovered')]
    assert len(recovered_links) > 0
    assert recovered_links[0]['strength'] >= 0.9

@pytest.mark.asyncio
async def test_domain_relevance_assessment(equilibrium_manager):
    # Create test context
    context = await equilibrium_manager.context_manager.create_context(
        context_type='test',
        data={'value': 1},
        metadata={'domain': 'test_domain'}
    )
    
    # Mock LLM domain assessment
    equilibrium_manager.llm_service.assess_domain_relevance.return_value = {
        'relevance': 0.85,
        'confidence': 0.9,
        'domain_aspects': ['test_aspect']
    }
    
    # Assess domain relevance
    assessment = await equilibrium_manager._assess_domain_relevance(context)
    
    # Verify assessment
    assert assessment['relevance'] >= 0.8
    assert assessment['confidence'] >= 0.8
    assert len(assessment['domain_aspects']) > 0

@pytest.mark.asyncio
async def test_context_relationship_analysis(equilibrium_manager):
    # Create test contexts with relationships
    context1 = await equilibrium_manager.context_manager.create_context(
        context_type='test',
        data={'value': 1}
    )
    
    context2 = await equilibrium_manager.context_manager.create_context(
        context_type='test',
        data={'value': 2}
    )
    
    # Create test relationship
    await equilibrium_manager.create_information_link(
        context1.id,
        context2.id,
        'test_relationship',
        0.9,
        {'test_metadata': True}
    )
    
    # Get relationships
    relationships = equilibrium_manager._get_context_relationships(context1)
    
    # Verify relationships
    assert len(relationships) > 0
    assert relationships[0]['type'] == 'test_relationship'
    assert relationships[0]['strength'] == 0.9
    assert relationships[0]['metadata']['test_metadata'] is True

@pytest.mark.asyncio
async def test_context_history_tracking(equilibrium_manager):
    # Create test context with history
    context = await equilibrium_manager.context_manager.create_context(
        context_type='test',
        data={'value': 1},
        metadata={
            'history': [
                {
                    'timestamp': datetime.now().isoformat(),
                    'action': 'create',
                    'details': {'initial_value': 1}
                },
                {
                    'timestamp': (datetime.now() - timedelta(hours=1)).isoformat(),
                    'action': 'modify',
                    'details': {'previous_value': 0}
                }
            ]
        }
    )
    
    # Get history
    history = equilibrium_manager._get_context_history(context)
    
    # Verify history
    assert len(history) > 0
    assert all('timestamp' in entry for entry in history)
    assert all('action' in entry for entry in history)
    assert len(history) <= equilibrium_manager.config.context_window_size 