import os
import sys
import asyncio
import logging
from typing import Dict, Optional, List, Any
import json
import psutil
from dataclasses import dataclass
from pathlib import Path

# Add project root to Python path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, project_root)

from lib.llm.manager import LLMManager

# Configure logging
log_dir = Path('/home/jon/.local/share/cursor/logs')
log_dir.mkdir(parents=True, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_dir / 'llm_service.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('llm_service')

@dataclass
class ModelConfig:
    name: str
    version: str
    memory_requirements_gb: float
    capabilities: List[str]
    parameters: Dict[str, Any]
    
    @classmethod
    def from_dict(cls, data: dict) -> 'ModelConfig':
        required_fields = {'name', 'version', 'memory_requirements_gb', 'capabilities'}
        missing_fields = required_fields - set(data.keys())
        if missing_fields:
            raise ValueError(f"Missing required fields: {missing_fields}")
            
        return cls(
            name=data['name'],
            version=data['version'],
            memory_requirements_gb=float(data['memory_requirements_gb']),
            capabilities=data.get('capabilities', []),
            parameters=data.get('parameters', {})
        )

@dataclass
class ResourceLimits:
    max_memory_gb: float = 4.0
    max_cpu_percent: float = 30.0
    max_models_loaded: int = 2

class ModelLoadError(Exception):
    """Raised when model loading fails."""
    pass

class ConfigurationError(Exception):
    """Raised when model configuration is invalid."""
    pass

class LLMService:
    def __init__(self, model_path: str = "/home/jon/ai_system_evolution/data/models"):
        self.model_path = model_path
        self.models: Dict[str, Any] = {}
        self.active_model: Optional[str] = None
        self.limits = ResourceLimits()
        self._load_lock = asyncio.Lock()
        self.manager = LLMManager()
        
    async def initialize(self) -> None:
        """Initialize service during system idle time."""
        try:
            await self.manager.initialize()
            if await self._is_system_idle():
                async with self._load_lock:
                    await self._load_models()
        except Exception as e:
            logger.error(f"Failed to initialize service: {e}")
            raise

    async def shutdown(self) -> None:
        """Gracefully shutdown the service."""
        try:
            async with self._load_lock:
                for model_name in list(self.models.keys()):
                    await self._unload_model(model_name)
            await self.manager.shutdown()
        except Exception as e:
            logger.error(f"Error during shutdown: {e}")
            raise

    async def _unload_model(self, model_name: str) -> None:
        """Properly unload and cleanup a model."""
        if model_name not in self.models:
            return
            
        try:
            model = self.models[model_name]
            await self.manager.unload_model(model)
            del self.models[model_name]
            if self.active_model == model_name:
                self.active_model = None
            logger.info(f"Successfully unloaded model {model_name}")
        except Exception as e:
            logger.error(f"Error unloading model {model_name}: {e}")
            raise

    async def _is_system_idle(self) -> bool:
        """Check if system is idle enough for model loading."""
        cpu_percent = psutil.cpu_percent(interval=1)
        mem = psutil.virtual_memory()
        mem_available_gb = mem.available / (1024 * 1024 * 1024)
        
        return (cpu_percent < self.limits.max_cpu_percent and 
                mem_available_gb > self.limits.max_memory_gb)
    
    async def _load_models(self) -> None:
        """Load models while respecting resource constraints."""
        for model in os.listdir(self.model_path):
            if len(self.models) >= self.limits.max_models_loaded:
                break
                
            if await self._can_load_model(model):
                try:
                    model_config = self._load_model_config(model)
                    if await self._validate_model_requirements(model_config):
                        self.models[model] = await self._load_model(model)
                except Exception as e:
                    print(f"Failed to load model {model}: {e}")
                    continue
    
    def _load_model_config(self, model_name: str) -> ModelConfig:
        """Load and validate model configuration."""
        config_path = Path(self.model_path) / model_name / "config.json"
        if not config_path.exists():
            raise ConfigurationError(f"No config found for model {model_name}")
            
        try:
            with open(config_path, 'r') as f:
                config_data = json.load(f)
            return ModelConfig.from_dict(config_data)
        except json.JSONDecodeError as e:
            raise ConfigurationError(f"Invalid JSON in config for {model_name}: {e}")
        except ValueError as e:
            raise ConfigurationError(f"Invalid config for {model_name}: {e}")
    
    async def _validate_model_requirements(self, config: ModelConfig) -> bool:
        """Validate if model requirements can be met."""
        try:
            mem = psutil.virtual_memory()
            available_gb = mem.available / (1024 * 1024 * 1024)
            
            if available_gb < (config.memory_requirements_gb + 0.5):
                logger.warning(
                    f"Insufficient memory for {config.name} v{config.version}. "
                    f"Required: {config.memory_requirements_gb}GB, Available: {available_gb:.1f}GB"
                )
                return False
                
            if len(self.models) >= self.limits.max_models_loaded:
                logger.warning(
                    f"Maximum number of models ({self.limits.max_models_loaded}) already loaded"
                )
                return False
                
            return True
            
        except Exception as e:
            logger.error(f"Error validating requirements for {config.name}: {e}")
            return False
    
    async def _can_load_model(self, model_name: str) -> bool:
        """Check if it's safe to load a model."""
        if model_name in self.models:
            return False
            
        mem = psutil.virtual_memory()
        mem_available_gb = mem.available / (1024 * 1024 * 1024)
        
        return mem_available_gb > self.limits.max_memory_gb
    
    async def _load_model(self, model_name: str) -> Any:
        """Load model implementation with proper error handling."""
        try:
            config = self._load_model_config(model_name)
            
            # Load model through manager
            model = await self.manager.load_model(
                model_path=str(Path(self.model_path) / model_name),
                config=config
            )
            
            logger.info(f"Successfully loaded model {model_name} v{config.version}")
            return model
            
        except Exception as e:
            raise ModelLoadError(f"Failed to load model {model_name}: {e}")
    
    async def get_model(self, model_name: str) -> Optional[any]:
        """Get a loaded model, loading it if necessary and possible."""
        if model_name in self.models:
            self.active_model = model_name
            return self.models[model_name]
            
        async with self._load_lock:
            if await self._can_load_model(model_name):
                try:
                    model_config = self._load_model_config(model_name)
                    if await self._validate_model_requirements(model_config):
                        self.models[model_name] = await self._load_model(model_name)
                        self.active_model = model_name
                        return self.models[model_name]
                except Exception as e:
                    logger.error(f"Failed to load model {model_name}: {e}")
                    return None
        return None
    
    async def unload_inactive_models(self) -> None:
        """Unload models that haven't been used recently to free resources."""
        if not self.active_model:
            return
            
        async with self._load_lock:
            for model_name in list(self.models.keys()):
                if model_name != self.active_model:
                    try:
                        await self._unload_model(model_name)
                    except Exception as e:
                        logger.error(f"Failed to unload model {model_name}: {e}")
    
    async def get_model_info(self) -> List[dict]:
        """Get information about all available models."""
        model_info = []
        for model_name in os.listdir(self.model_path):
            try:
                config = self._load_model_config(model_name)
                info = {
                    "name": model_name,
                    "loaded": model_name in self.models,
                    "active": model_name == self.active_model,
                    "requirements": config.get("memory_requirements_gb", 0),
                    "capabilities": config.get("capabilities", [])
                }
                model_info.append(info)
            except Exception as e:
                logger.error(f"Failed to get info for model {model_name}: {e}")
                continue
        return model_info

    async def _collect_metrics(self) -> Dict[str, float]:
        """Collect resource usage metrics."""
        process = psutil.Process()
        return {
            "cpu_percent": process.cpu_percent(),
            "memory_gb": process.memory_info().rss / (1024 * 1024 * 1024),
            "models_loaded": len(self.models)
        }

async def main():
    """Service entry point."""
    service = LLMService()
    try:
        await service.initialize()
        
        # Example usage and metrics collection
        while True:
            if service.models:
                metrics = await service._collect_metrics()
                logger.info(f"Service metrics: {metrics}")
                
                if metrics["memory_gb"] > service.limits.max_memory_gb:
                    await service.unload_inactive_models()
                    
            await asyncio.sleep(60)  # Check every minute
            
    except Exception as e:
        logger.error(f"Service error: {e}")
        raise
    finally:
        await service.shutdown()

if __name__ == "__main__":
    asyncio.run(main()) 