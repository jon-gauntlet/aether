import pytest
import asyncio
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

from lib.autonomic.manager import AutonomicManager, EvolutionMetrics, EvolutionPolicy
from services.llm_service import LLMService, WorkloadMetrics, ResourceLimits

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
async def test_hyperfocus_detection(autonomic_manager):
    # Create metrics indicating high productivity
    metrics = EvolutionMetrics(
        timestamp=datetime.now(),
        cpu_usage=25.0,
        memory_usage=3.0,
        model_loads=2,
        error_rate=0.05,
        response_time=0.2,
        improvement_score=0.9
    )
    
    # Should detect hyperfocus
    is_hyperfocus = await autonomic_manager.detect_hyperfocus_state(metrics)
    assert is_hyperfocus is True
    
    # Create metrics indicating lower productivity
    metrics.error_rate = 0.3
    metrics.response_time = 0.8
    metrics.improvement_score = 0.4
    
    # Should not detect hyperfocus
    is_hyperfocus = await autonomic_manager.detect_hyperfocus_state(metrics)
    assert is_hyperfocus is False

@pytest.mark.asyncio
async def test_focus_preservation(autonomic_manager):
    # Simulate recent evolution
    autonomic_manager.last_evolution = datetime.now() - timedelta(minutes=45)
    
    # Should preserve focus within window
    should_preserve = await autonomic_manager.should_preserve_focus(is_hyperfocus=True)
    assert should_preserve is True
    
    # Simulate long running session
    autonomic_manager.last_evolution = datetime.now() - timedelta(hours=18)
    
    # Should suggest break after max sustained focus
    should_preserve = await autonomic_manager.should_preserve_focus(is_hyperfocus=True)
    assert should_preserve is False

@pytest.mark.asyncio
async def test_quality_maintenance(llm_service):
    # Simulate normal operation
    llm_service.workload_metrics.update_metrics(
        response_time=0.2,
        had_error=False,
        quality=0.95
    )
    
    # Quality should be good
    assert llm_service.workload_metrics.quality_score > 0.9
    
    # Simulate degraded operation
    for _ in range(10):
        llm_service.workload_metrics.update_metrics(
            response_time=0.8,
            had_error=True,
            quality=0.6
        )
    
    # Quality should be degraded
    assert llm_service.workload_metrics.quality_score < 0.7
    
    # Should trigger quality recovery
    await llm_service.maintain_quality()
    
    # Should reset metrics after recovery
    assert llm_service.workload_metrics.quality_score == 1.0
    assert llm_service.workload_metrics.error_count == 0

@pytest.mark.asyncio
async def test_resource_management_under_fatigue(llm_service):
    # Simulate extended operation
    llm_service.workload_metrics.start_time = datetime.now() - timedelta(hours=20)
    for _ in range(100):
        llm_service.workload_metrics.update_metrics(
            response_time=0.5,
            had_error=True,
            quality=0.7
        )
    
    # Should have high fatigue
    assert llm_service.workload_metrics.fatigue_indicator > 0.5
    
    # Mock model config
    config = MagicMock()
    config.memory_requirements_gb = 2.0
    
    # Should be more conservative with resources
    with patch('psutil.Process') as mock_process:
        mock_process.return_value.memory_info.return_value.rss = 2 * 1024 * 1024 * 1024
        mock_process.return_value.cpu_percent.return_value = 20
        
        # Should reject even with available resources due to fatigue
        is_valid = await llm_service._validate_model_requirements(config)
        assert is_valid is False 