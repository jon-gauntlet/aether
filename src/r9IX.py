import json
import asyncio
import logging
import aiofiles
import psutil
from pathlib import Path
from typing import Dict, List, Optional
from systemd import journal
import os
from datetime import datetime
from dataclasses import dataclass

from lib.llm.downloader import ModelDownloader
from lib.llm.manager import LLMManager

@dataclass
class ModelResources:
    max_memory_gb: float = 4.0
    max_cpu_percent: float = 40.0
    max_concurrent_models: int = 2
    min_free_memory_gb: float = 2.0

class ModelService:
    def __init__(self, model_dir: str = "/home/jon/ai_system_evolution/data/models"):
        self.model_dir = model_dir
        self.loaded_models: Dict[str, any] = {}
        self.model_configs: Dict[str, dict] = {}
        self.resources = ModelResources()
        self._load_lock = asyncio.Lock()
        self._ensure_directories()
        
    def _ensure_directories(self) -> None:
        """Ensure required directories exist."""
        dirs = ['configs', 'weights', 'cache']
        for dir_name in dirs:
            os.makedirs(os.path.join(self.model_dir, dir_name), exist_ok=True)
            
    async def initialize(self) -> None:
        """Initialize the model service."""
        await self._load_model_configs()
        await self._cleanup_cache()
        
    async def _load_model_configs(self) -> None:
        """Load all model configurations."""
        config_dir = os.path.join(self.model_dir, 'configs')
        for filename in os.listdir(config_dir):
            if filename.endswith('.json'):
                model_name = filename[:-5]
                path = os.path.join(config_dir, filename)
                with open(path, 'r') as f:
                    self.model_configs[model_name] = json.load(f)
                    
    async def _cleanup_cache(self) -> None:
        """Clean up old cache files."""
        cache_dir = os.path.join(self.model_dir, 'cache')
        current_time = datetime.now()
        
        for filename in os.listdir(cache_dir):
            path = os.path.join(cache_dir, filename)
            stats = os.stat(path)
            age_hours = (current_time - datetime.fromtimestamp(stats.st_mtime)).total_seconds() / 3600
            
            if age_hours > 24:  # Cache files older than 24 hours
                os.remove(path)
                
    async def load_model(self, model_name: str) -> Optional[any]:
        """Load a model with resource constraints."""
        if model_name not in self.model_configs:
            raise ValueError(f"No configuration found for model {model_name}")
            
        async with self._load_lock:
            if model_name in self.loaded_models:
                return self.loaded_models[model_name]
                
            if not await self._can_load_model(model_name):
                return None
                
            try:
                model = await self._load_model_weights(model_name)
                self.loaded_models[model_name] = model
                return model
            except Exception as e:
                print(f"Failed to load model {model_name}: {e}")
                return None
                
    async def _can_load_model(self, model_name: str) -> bool:
        """Check if model can be loaded within resource constraints."""
        config = self.model_configs[model_name]
        required_memory = config.get('memory_requirements_gb', 0)
        
        # Check system resources
        mem = psutil.virtual_memory()
        available_gb = mem.available / (1024 * 1024 * 1024)
        cpu_percent = psutil.cpu_percent(interval=1)
        
        # Check constraints
        if len(self.loaded_models) >= self.resources.max_concurrent_models:
            return False
            
        if available_gb < (required_memory + self.resources.min_free_memory_gb):
            return False
            
        if cpu_percent > self.resources.max_cpu_percent:
            return False
            
        return True
        
    async def _load_model_weights(self, model_name: str) -> any:
        """Load model weights with caching."""
        config = self.model_configs[model_name]
        weights_path = os.path.join(self.model_dir, 'weights', f"{model_name}.weights")
        cache_path = os.path.join(self.model_dir, 'cache', f"{model_name}.cache")
        
        # Check cache first
        if os.path.exists(cache_path):
            return self._load_from_cache(cache_path)
            
        # Load weights
        model = self._load_weights(weights_path, config)
        
        # Cache for future use
        self._cache_model(model, cache_path)
        
        return model
        
    def _load_from_cache(self, cache_path: str) -> any:
        """Load model from cache."""
        # TODO: Implement cache loading
        return {"name": "cached_model", "loaded": True}
        
    def _load_weights(self, weights_path: str, config: dict) -> any:
        """Load model weights."""
        # TODO: Implement actual model loading
        return {"name": "loaded_model", "loaded": True}
        
    def _cache_model(self, model: any, cache_path: str) -> None:
        """Cache model for future use."""
        # TODO: Implement model caching
        pass
        
    async def unload_model(self, model_name: str) -> bool:
        """Unload a model to free resources."""
        async with self._load_lock:
            if model_name not in self.loaded_models:
                return False
                
            try:
                # TODO: Implement proper model cleanup
                del self.loaded_models[model_name]
                return True
            except Exception as e:
                print(f"Failed to unload model {model_name}: {e}")
                return False
                
    async def get_model_info(self) -> List[dict]:
        """Get information about available models."""
        info = []
        for name, config in self.model_configs.items():
            info.append({
                "name": name,
                "loaded": name in self.loaded_models,
                "memory_required_gb": config.get('memory_requirements_gb', 0),
                "description": config.get('description', ''),
                "capabilities": config.get('capabilities', [])
            })
        return info
        
    async def get_resource_usage(self) -> dict:
        """Get current resource usage."""
        mem = psutil.virtual_memory()
        return {
            "loaded_models": len(self.loaded_models),
            "memory_available_gb": mem.available / (1024 * 1024 * 1024),
            "cpu_percent": psutil.cpu_percent(interval=1),
            "memory_percent": mem.percent
        }

async def main():
    service = ModelService()
    await service.start()
    
    try:
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        await service.stop()

if __name__ == "__main__":
    asyncio.run(main()) 