import pytest
import asyncio
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

from lib.context.manager import ContextManager, Context, Pattern
from lib.autonomic.manager import AutonomicManager, EvolutionMetrics
from services.llm_service import LLMService, ResourceState, ModelUsagePredictor

@pytest.fixture
async def context_manager():
    manager = ContextManager()
    await manager.initialize()
    return manager

@pytest.fixture
async def autonomic_manager():
    manager = AutonomicManager()
    await manager.initialize()
    return manager

@pytest.fixture
async def llm_service():
    service = LLMService()
    await service.initialize()
    return service

@pytest.mark.asyncio
async def test_pattern_detection(context_manager):
    # Create test contexts
    contexts = []
    for i in range(5):
        context = await context_manager.create_context(
            context_type='evolution',
            data={
                'cpu_usage': 25.0,
                'memory_usage': 3.0,
                'error_rate': 0.05
            },
            metadata={'success': True}
        )
        contexts.append(context)
    
    # Should detect pattern
    patterns = await context_manager.detect_patterns('evolution')
    assert len(patterns) > 0
    assert patterns[0].confidence >= 0.7
    assert len(patterns[0].contexts) >= 3

@pytest.mark.asyncio
async def test_pattern_based_evolution(autonomic_manager):
    # Create successful evolution pattern
    for i in range(5):
        await autonomic_manager.context_manager.create_context(
            context_type='evolution',
            data={
                'cpu_usage': 25.0,
                'memory_usage': 3.0,
                'error_rate': 0.05,
                'improvement_score': 0.8
            },
            metadata={'success': True}
        )
    
    # Add current metrics
    metrics = EvolutionMetrics(
        timestamp=datetime.now(),
        cpu_usage=25.0,
        memory_usage=3.0,
        model_loads=2,
        error_rate=0.05,
        response_time=0.2,
        improvement_score=0.7
    )
    autonomic_manager.recent_metrics.append(metrics)
    
    # Should recommend evolution based on pattern
    should_evolve = await autonomic_manager.should_evolve()
    assert should_evolve is True

@pytest.mark.asyncio
async def test_dynamic_resource_scaling(llm_service):
    # Simulate hyperfocus state
    metrics = EvolutionMetrics(
        timestamp=datetime.now(),
        cpu_usage=25.0,
        memory_usage=3.0,
        model_loads=2,
        error_rate=0.05,
        response_time=0.2,
        improvement_score=0.9
    )
    
    # Should scale up resources
    await llm_service._adjust_resource_limits()
    assert llm_service.resource_state.is_scaled is True
    assert llm_service.resource_state.current_memory_limit > llm_service.limits.max_memory_gb
    assert llm_service.resource_state.current_cpu_limit > llm_service.limits.max_cpu_percent
    
    # Fast forward past scale duration
    llm_service.resource_state.scale_expiry = datetime.now() - timedelta(minutes=1)
    
    # Should revert scaling
    await llm_service._adjust_resource_limits()
    assert llm_service.resource_state.is_scaled is False
    assert llm_service.resource_state.current_memory_limit == llm_service.limits.max_memory_gb
    assert llm_service.resource_state.current_cpu_limit == llm_service.limits.max_cpu_percent

@pytest.mark.asyncio
async def test_model_usage_prediction(llm_service):
    # Record model usage pattern
    for _ in range(3):
        llm_service.usage_predictor.record_usage('model_a', datetime.now())
        llm_service.usage_predictor.record_usage('model_b', datetime.now())
    
    # Should predict next model
    llm_service.usage_predictor.record_usage('model_a', datetime.now())
    predicted = llm_service.usage_predictor.predict_next_model()
    assert predicted == 'model_b'
    
    # Should preload predicted model
    with patch.object(llm_service, '_load_model') as mock_load:
        await llm_service._preload_predicted_model()
        mock_load.assert_called_once()

@pytest.mark.asyncio
async def test_resource_state_management():
    state = ResourceState(current_memory_limit=4.0, current_cpu_limit=30.0)
    
    # Should start unscaled
    assert state.is_scaled is False
    
    # Should allow initial scaling
    assert state.can_scale is True
    
    # Should track scaling state
    state.update_limits(memory_gb=5.0, cpu_percent=45.0)
    assert state.current_memory_limit == 5.0
    assert state.current_cpu_limit == 45.0
    
    # Should enforce cooldown
    state.last_scale_time = datetime.now()
    assert state.can_scale is False
    
    # Should allow scaling after cooldown
    state.last_scale_time = datetime.now() - timedelta(hours=2)
    assert state.can_scale is True 