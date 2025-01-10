import os
import pytest
import asyncio
from pathlib import Path
from unittest.mock import Mock, patch, AsyncMock
from services.llm_service import LLMService, ModelConfig, ResourceLimits, ModelLoadError, ConfigurationError

@pytest.fixture
def test_models_dir(tmp_path):
    models_dir = tmp_path / "models"
    models_dir.mkdir()
    return models_dir

@pytest.fixture
def sample_config():
    return {
        "name": "test-model",
        "version": "1.0.0",
        "memory_requirements_gb": 2.0,
        "capabilities": ["test"],
        "parameters": {
            "max_tokens": 1024,
            "temperature": 0.7
        }
    }

@pytest.fixture
def mock_manager():
    manager = AsyncMock()
    manager.load_model = AsyncMock()
    manager.unload_model = AsyncMock()
    return manager

@pytest.fixture
async def service(test_models_dir, mock_manager):
    with patch('services.llm_service.LLMManager', return_value=mock_manager):
        service = LLMService(str(test_models_dir))
        await service.initialize()
        yield service
        await service.shutdown()

@pytest.mark.asyncio
async def test_service_initialization(service):
    assert service.models == {}
    assert service.active_model is None
    assert isinstance(service.limits, ResourceLimits)

@pytest.mark.asyncio
async def test_load_model_config(service, test_models_dir, sample_config):
    model_dir = test_models_dir / "test-model"
    model_dir.mkdir()
    config_path = model_dir / "config.json"
    config_path.write_text(json.dumps(sample_config))
    
    config = service._load_model_config("test-model")
    assert isinstance(config, ModelConfig)
    assert config.name == sample_config["name"]
    assert config.version == sample_config["version"]
    assert config.memory_requirements_gb == sample_config["memory_requirements_gb"]

@pytest.mark.asyncio
async def test_load_model_config_missing_file(service):
    with pytest.raises(ConfigurationError):
        service._load_model_config("nonexistent-model")

@pytest.mark.asyncio
async def test_load_model_config_invalid_json(service, test_models_dir):
    model_dir = test_models_dir / "invalid-model"
    model_dir.mkdir()
    config_path = model_dir / "config.json"
    config_path.write_text("invalid json")
    
    with pytest.raises(ConfigurationError):
        service._load_model_config("invalid-model")

@pytest.mark.asyncio
async def test_validate_model_requirements(service, sample_config):
    config = ModelConfig(**sample_config)
    
    # Test with sufficient memory
    with patch('psutil.virtual_memory') as mock_vm:
        mock_vm.return_value.available = 8 * 1024 * 1024 * 1024  # 8GB
        assert await service._validate_model_requirements(config)
    
    # Test with insufficient memory
    with patch('psutil.virtual_memory') as mock_vm:
        mock_vm.return_value.available = 1 * 1024 * 1024 * 1024  # 1GB
        assert not await service._validate_model_requirements(config)

@pytest.mark.asyncio
async def test_get_model(service, test_models_dir, sample_config, mock_manager):
    # Setup test model
    model_dir = test_models_dir / "test-model"
    model_dir.mkdir()
    config_path = model_dir / "config.json"
    config_path.write_text(json.dumps(sample_config))
    
    mock_instance = AsyncMock()
    mock_manager.load_model.return_value = mock_instance
    
    # Test loading new model
    model = await service.get_model("test-model")
    assert model == mock_instance
    assert service.active_model == "test-model"
    assert "test-model" in service.models
    
    # Test getting already loaded model
    model = await service.get_model("test-model")
    assert model == mock_instance
    mock_manager.load_model.assert_called_once()

@pytest.mark.asyncio
async def test_unload_inactive_models(service, mock_manager):
    # Setup mock models
    service.models = {
        "model1": AsyncMock(),
        "model2": AsyncMock(),
        "model3": AsyncMock()
    }
    service.active_model = "model1"
    
    await service.unload_inactive_models()
    
    assert len(service.models) == 1
    assert "model1" in service.models
    assert mock_manager.unload_model.call_count == 2

@pytest.mark.asyncio
async def test_collect_metrics(service):
    metrics = await service._collect_metrics()
    assert "cpu_percent" in metrics
    assert "memory_gb" in metrics
    assert "models_loaded" in metrics
    assert metrics["models_loaded"] == len(service.models)

@pytest.mark.asyncio
async def test_get_model_info(service, test_models_dir, sample_config):
    # Setup test model
    model_dir = test_models_dir / "test-model"
    model_dir.mkdir()
    config_path = model_dir / "config.json"
    config_path.write_text(json.dumps(sample_config))
    
    service.models = {"test-model": AsyncMock()}
    service.active_model = "test-model"
    
    info = await service.get_model_info()
    assert len(info) == 1
    assert info[0]["name"] == "test-model"
    assert info[0]["loaded"] is True
    assert info[0]["active"] is True 