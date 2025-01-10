import pytest
import asyncio
from pathlib import Path
from unittest.mock import Mock, patch, AsyncMock
from lib.llm.manager import LLMManager, ModelConfig, ModelInstance

@pytest.fixture
def test_models_dir(tmp_path):
    models_dir = tmp_path / "models"
    models_dir.mkdir()
    return models_dir

@pytest.fixture
def sample_config():
    return ModelConfig(
        name="test-model",
        version="1.0.0",
        memory_requirements_gb=2.0,
        capabilities=["test"],
        parameters={
            "max_tokens": 1024,
            "temperature": 0.7
        }
    )

@pytest.fixture
async def manager(test_models_dir):
    manager = LLMManager(test_models_dir)
    await manager.initialize()
    yield manager
    await manager.shutdown()

@pytest.mark.asyncio
async def test_manager_initialization(test_models_dir):
    manager = LLMManager(test_models_dir)
    await manager.initialize()
    assert test_models_dir.exists()
    assert manager.instances == {}
    await manager.shutdown()

@pytest.mark.asyncio
async def test_load_model(manager, test_models_dir, sample_config):
    # Setup test model file
    model_path = test_models_dir / "test-model"
    model_path.touch()
    
    with patch('lib.llm.manager.Llama') as mock_llama:
        instance = await manager.load_model(str(model_path), sample_config)
        assert isinstance(instance, ModelInstance)
        assert instance.model_path == model_path
        assert instance.config == sample_config
        assert "test-model" in manager.instances
        mock_llama.assert_called_once()

@pytest.mark.asyncio
async def test_load_model_already_loaded(manager, test_models_dir, sample_config):
    model_path = test_models_dir / "test-model"
    model_path.touch()
    
    with patch('lib.llm.manager.Llama') as mock_llama:
        instance1 = await manager.load_model(str(model_path), sample_config)
        instance2 = await manager.load_model(str(model_path), sample_config)
        assert instance1 == instance2
        mock_llama.assert_called_once()

@pytest.mark.asyncio
async def test_unload_model(manager, test_models_dir, sample_config):
    model_path = test_models_dir / "test-model"
    model_path.touch()
    
    with patch('lib.llm.manager.Llama'):
        instance = await manager.load_model(str(model_path), sample_config)
        assert "test-model" in manager.instances
        
        await manager.unload_model(instance)
        assert "test-model" not in manager.instances
        assert instance.model is None

@pytest.mark.asyncio
async def test_model_instance_generate(test_models_dir, sample_config):
    model_path = test_models_dir / "test-model"
    model_path.touch()
    
    mock_llama = Mock()
    mock_llama.create_completion.return_value = {
        'choices': [{'text': 'test output'}]
    }
    
    with patch('lib.llm.manager.Llama', return_value=mock_llama):
        instance = ModelInstance(model_path, sample_config)
        await instance.load()
        
        output = await instance.generate("test prompt")
        assert output == 'test output'
        mock_llama.create_completion.assert_called_once()

@pytest.mark.asyncio
async def test_model_instance_error_handling(test_models_dir, sample_config):
    model_path = test_models_dir / "test-model"
    model_path.touch()
    
    mock_llama = Mock()
    mock_llama.create_completion.side_effect = Exception("Test error")
    
    with patch('lib.llm.manager.Llama', return_value=mock_llama):
        instance = ModelInstance(model_path, sample_config)
        await instance.load()
        
        with pytest.raises(Exception):
            await instance.generate("test prompt")
        assert instance.error_count == 1

@pytest.mark.asyncio
async def test_get_status(manager, test_models_dir, sample_config):
    model_path = test_models_dir / "test-model"
    model_path.touch()
    
    with patch('lib.llm.manager.Llama'):
        await manager.load_model(str(model_path), sample_config)
        status = await manager.get_status()
        
        assert "test-model" in status
        assert "loaded" in status["test-model"]
        assert "last_used" in status["test-model"]
        assert "error_count" in status["test-model"] 