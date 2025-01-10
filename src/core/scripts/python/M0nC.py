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
import pickle
import hashlib

from lib.llm.downloader import ModelDownloader
from lib.llm.manager import LLMManager

@dataclass
class ModelResources:
    max_memory_gb: float = 4.0
    max_cpu_percent: float = 40.0
    max_concurrent_models: int = 2
    min_free_memory_gb: float = 2.0
    cache_retention_hours: int = 24
    max_cache_size_gb: float = 10.0

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
        """Clean up old cache files and enforce size limits."""
        cache_dir = os.path.join(self.model_dir, 'cache')
        current_time = datetime.now()
        
        # Track total cache size
        total_cache_size = 0
        cache_files = []
        
        for filename in os.listdir(cache_dir):
            path = os.path.join(cache_dir, filename)
            stats = os.stat(path)
            age_hours = (current_time - datetime.fromtimestamp(stats.st_mtime)).total_seconds() / 3600
            size_gb = stats.st_size / (1024 * 1024 * 1024)
            
            cache_files.append({
                'path': path,
                'age_hours': age_hours,
                'size_gb': size_gb,
                'last_modified': stats.st_mtime
            })
            total_cache_size += size_gb
            
        # Sort by age, oldest first
        cache_files.sort(key=lambda x: x['last_modified'])
        
        # Remove old files and enforce size limit
        for cache_file in cache_files:
            if (cache_file['age_hours'] > self.resources.cache_retention_hours or 
                total_cache_size > self.resources.max_cache_size_gb):
                os.remove(cache_file['path'])
                total_cache_size -= cache_file['size_gb']

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
        model = await self._load_weights(weights_path, config)
        
        # Cache for future use
        self._cache_model(model, cache_path)
        
        return model
        
    def _load_from_cache(self, cache_path: str) -> any:
        """Load model from cache with validation."""
        try:
            with open(cache_path, 'rb') as f:
                cache_data = pickle.load(f)
                
            # Validate cache structure
            if not all(k in cache_data for k in ['model', 'metadata', 'checksum']):
                raise ValueError("Invalid cache structure")
                
            # Verify checksum
            computed_checksum = self._compute_checksum(cache_data['model'])
            if computed_checksum != cache_data['metadata']['checksum']:
                raise ValueError("Cache checksum mismatch")
                
            # Check version compatibility
            if cache_data['metadata'].get('version') != self._get_current_version():
                raise ValueError("Cache version mismatch")
                
            return cache_data['model']
        except Exception as e:
            logging.warning(f"Cache load failed: {e}")
            return None
            
    def _compute_checksum(self, model: any) -> str:
        """Compute model checksum for validation."""
        model_bytes = pickle.dumps(model)
        return hashlib.sha256(model_bytes).hexdigest()
        
    def _get_current_version(self) -> str:
        """Get current model version for compatibility checking."""
        return "1.0.0"  # TODO: Implement proper versioning
        
    def _cache_model(self, model: any, cache_path: str) -> None:
        """Cache model with metadata and validation."""
        try:
            cache_data = {
                'model': model,
                'metadata': {
                    'timestamp': datetime.now().isoformat(),
                    'version': self._get_current_version(),
                    'checksum': self._compute_checksum(model)
                }
            }
            
            with open(cache_path, 'wb') as f:
                pickle.dump(cache_data, f)
        except Exception as e:
            logging.error(f"Failed to cache model: {e}")
            
    async def _load_weights(self, weights_path: str, config: dict) -> any:
        """Load model weights with progress tracking."""
        try:
            # Check if weights exist
            if not os.path.exists(weights_path):
                raise FileNotFoundError(f"Weights file not found: {weights_path}")
                
            # Get model type from config
            model_type = config.get('type', 'unknown')
            
            # Load appropriate loader
            loader = self._get_model_loader(model_type)
            if not loader:
                raise ValueError(f"Unsupported model type: {model_type}")
                
            # Load with progress tracking
            async with aiofiles.open(weights_path, 'rb') as f:
                total_size = os.path.getsize(weights_path)
                loaded_size = 0
                model_data = bytearray()
                
                while chunk := await f.read(8192):
                    model_data.extend(chunk)
                    loaded_size += len(chunk)
                    self._update_load_progress(loaded_size, total_size)
                    
            # Initialize model
            model = loader.load_model(model_data, config)
            
            # Verify loaded model
            if not self._verify_model(model, config):
                raise ValueError("Model verification failed")
                
            return model
            
        except Exception as e:
            logging.error(f"Failed to load weights: {e}")
            raise
            
    def _get_model_loader(self, model_type: str) -> Optional[any]:
        """Get appropriate model loader for model type."""
        # TODO: Implement model loader factory
        return None
        
    def _update_load_progress(self, loaded: int, total: int) -> None:
        """Update loading progress."""
        progress = (loaded / total) * 100
        logging.info(f"Loading progress: {progress:.1f}%")
        
    def _verify_model(self, model: any, config: dict) -> bool:
        """Verify loaded model meets requirements."""
        # TODO: Implement model verification
        return True
        
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