import pytest
import asyncio
from datetime import datetime, timedelta
from pathlib import Path
from lib.autonomic.manager import AutonomicManager, EvolutionMetrics, EvolutionPolicy

@pytest.fixture
def test_data_dir(tmp_path):
    data_dir = tmp_path / "autonomic"
    data_dir.mkdir()
    return data_dir

@pytest.fixture
def sample_metrics():
    return {
        "cpu_percent": 30.0,
        "memory_gb": 4.0,
        "models_loaded": 2,
        "error_rate": 0.01,
        "response_time": 0.5
    }

@pytest.fixture
async def manager(test_data_dir):
    manager = AutonomicManager(test_data_dir)
    await manager.initialize()
    yield manager

@pytest.mark.asyncio
async def test_manager_initialization(test_data_dir):
    manager = AutonomicManager(test_data_dir)
    await manager.initialize()
    assert test_data_dir.exists()
    assert manager.metrics_file.exists() == False
    assert len(manager.recent_metrics) == 0

@pytest.mark.asyncio
async def test_record_metrics(manager, sample_metrics):
    await manager.record_metrics(sample_metrics)
    assert len(manager.recent_metrics) == 1
    assert manager.metrics_file.exists()
    
    metric = manager.recent_metrics[0]
    assert isinstance(metric, EvolutionMetrics)
    assert metric.cpu_usage == sample_metrics["cpu_percent"]
    assert metric.memory_usage == sample_metrics["memory_gb"]
    assert metric.model_loads == sample_metrics["models_loaded"]
    assert metric.error_rate == sample_metrics["error_rate"]
    assert metric.response_time == sample_metrics["response_time"]
    assert 0 <= metric.improvement_score <= 1

@pytest.mark.asyncio
async def test_calculate_improvement_score(manager, sample_metrics):
    score = manager._calculate_improvement_score(sample_metrics)
    assert 0 <= score <= 1
    
    # Test with poor metrics
    poor_metrics = {
        "cpu_percent": 90.0,
        "memory_gb": 7.5,
        "models_loaded": 1,
        "error_rate": 0.5,
        "response_time": 4.0
    }
    poor_score = manager._calculate_improvement_score(poor_metrics)
    assert poor_score < score
    
    # Test with excellent metrics
    good_metrics = {
        "cpu_percent": 10.0,
        "memory_gb": 2.0,
        "models_loaded": 2,
        "error_rate": 0.0,
        "response_time": 0.1
    }
    good_score = manager._calculate_improvement_score(good_metrics)
    assert good_score > score

@pytest.mark.asyncio
async def test_should_evolve(manager, sample_metrics):
    # Not enough metrics
    assert await manager.should_evolve() == False
    
    # Add some metrics
    await manager.record_metrics(sample_metrics)
    assert await manager.should_evolve() == False  # Still need more metrics
    
    # Add metrics with improvement
    better_metrics = {
        "cpu_percent": 20.0,
        "memory_gb": 3.0,
        "models_loaded": 2,
        "error_rate": 0.005,
        "response_time": 0.3
    }
    await manager.record_metrics(better_metrics)
    
    # Should evolve now
    assert await manager.should_evolve() == True
    
    # Test daily limit
    manager.changes_today = manager.policy.max_daily_changes
    assert await manager.should_evolve() == False

@pytest.mark.asyncio
async def test_cleanup_old_metrics(manager, sample_metrics):
    # Add some old metrics
    old_time = datetime.now() - timedelta(days=2)
    manager.recent_metrics.append(
        EvolutionMetrics(
            timestamp=old_time,
            cpu_usage=sample_metrics["cpu_percent"],
            memory_usage=sample_metrics["memory_gb"],
            model_loads=sample_metrics["models_loaded"],
            error_rate=sample_metrics["error_rate"],
            response_time=sample_metrics["response_time"],
            improvement_score=0.8
        )
    )
    
    # Add current metrics
    await manager.record_metrics(sample_metrics)
    assert len(manager.recent_metrics) == 2
    
    # Cleanup should remove old metrics
    manager._cleanup_old_metrics()
    assert len(manager.recent_metrics) == 1
    assert manager.recent_metrics[0].timestamp > old_time

@pytest.mark.asyncio
async def test_record_evolution(manager):
    initial_changes = manager.changes_today
    initial_time = manager.last_evolution
    
    await manager.record_evolution()
    
    assert manager.changes_today == initial_changes + 1
    assert manager.last_evolution > initial_time
    
    # Test day change reset
    manager.last_evolution = datetime.now() - timedelta(days=1)
    await manager.record_evolution()
    assert manager.changes_today == 1

@pytest.mark.asyncio
async def test_get_evolution_status(manager, sample_metrics):
    await manager.record_metrics(sample_metrics)
    status = await manager.get_evolution_status()
    
    assert "last_evolution" in status
    assert "changes_today" in status
    assert "recent_metrics_count" in status
    assert "current_improvement_score" in status
    assert "can_evolve" in status
    assert status["recent_metrics_count"] == len(manager.recent_metrics) 