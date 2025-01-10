import os
import sys
import asyncio
import logging
from typing import Dict, Optional, List
import json
import psutil
from dataclasses import dataclass

# Add project root to Python path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, project_root)

from lib.llm.manager import LLMManager

# Configure logging
os.makedirs('/home/jon/.local/share/cursor/logs', exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    filename='/home/jon/.local/share/cursor/logs/llm_service.log'
)
logger = logging.getLogger('llm_service')

@dataclass
class ResourceLimits:
    max_memory_gb: float = 4.0
    max_cpu_percent: float = 30.0
    max_models_loaded: int = 2
    
class LLMService:
    def __init__(self, model_path: str = "/home/jon/ai_system_evolution/data/models"):
        self.model_path = model_path
        self.models: Dict[str, any] = {}
        self.active_model: Optional[str] = None
        self.limits = ResourceLimits()
        self._load_lock = asyncio.Lock()
        
    async def initialize(self) -> None:
        """Initialize service during system idle time."""
        if await self._is_system_idle():
            async with self._load_lock:
                await self._load_models()
    
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
    
    def _load_model_config(self, model_name: str) -> dict:
        """Load and validate model configuration."""
        config_path = os.path.join(self.model_path, model_name, "config.json")
        if not os.path.exists(config_path):
            raise ValueError(f"No config found for model {model_name}")
            
        with open(config_path, 'r') as f:
            return json.load(f)
    
    async def _validate_model_requirements(self, config: dict) -> bool:
        """Validate if model requirements can be met."""
        required_memory = config.get('memory_requirements_gb', 0)
        mem = psutil.virtual_memory()
        available_gb = mem.available / (1024 * 1024 * 1024)
        
        return available_gb >= (required_memory + 0.5)  # 0.5GB buffer
    
    async def _can_load_model(self, model_name: str) -> bool:
        """Check if it's safe to load a model."""
        if model_name in self.models:
            return False
            
        mem = psutil.virtual_memory()
        mem_available_gb = mem.available / (1024 * 1024 * 1024)
        
        return mem_available_gb > self.limits.max_memory_gb
    
    async def _load_model(self, model_name: str) -> any:
        """Load model implementation."""
        # TODO: Implement actual model loading logic
        return {"name": model_name, "loaded": True}
    
    async def get_model(self, model_name: str) -> Optional[any]:
        """Get a loaded model, loading it if necessary and possible."""
        if model_name not in self.models:
            if await self._can_load_model(model_name):
                async with self._load_lock:
                    self.models[model_name] = await self._load_model(model_name)
            else:
                return None
        
        self.active_model = model_name
        return self.models[model_name]
    
    async def unload_inactive_models(self) -> None:
        """Unload inactive models to free resources."""
        async with self._load_lock:
            current_models = list(self.models.keys())
            for model in current_models:
                if model != self.active_model:
                    del self.models[model]
    
    async def get_model_info(self) -> List[dict]:
        """Get information about loaded models."""
        return [
            {
                "name": name,
                "active": name == self.active_model,
                "loaded": bool(model)
            }
            for name, model in self.models.items()
        ]

async def main():
    """Main service entry point"""
    service = LLMService()
    
    try:
        # Start service
        logger.info("LLM service initialized")
        await service.start()
    except KeyboardInterrupt:
        await service.stop()
    except Exception as e:
        logger.error(f"Service failed: {e}")
        await service.stop()
        raise

if __name__ == "__main__":
    asyncio.run(main()) 