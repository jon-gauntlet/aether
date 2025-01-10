#!/usr/bin/env python3
"""
LLM Manager - Handles local LLM model management and inference
"""

import os
import json
import asyncio
import logging
from typing import Dict, Optional, List
from dataclasses import dataclass
import psutil

# Configure logging
logger = logging.getLogger('llm_manager')

@dataclass
class ModelConfig:
    name: str
    path: str
    threads: int
    context_size: int
    batch_size: int
    memory_limit: str

class ResourceMonitor:
    def __init__(self, config_path: str = "/home/jon/ai_system_evolution/config/resources.json"):
        self.config = self._load_config(config_path)
        
    def _load_config(self, path: str) -> Dict:
        try:
            if os.path.exists(path):
                with open(path) as f:
                    return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load config: {e}")
            
        # Default configuration
        return {
            "llm_resources": {
                "max_concurrent": 2,
                "memory_per_model": "1G",
                "cpu_priority": "low",
                "gpu_enabled": False
            },
            "model_configs": {
                "llama2-7b-q4": {
                    "threads": 4,
                    "context_size": 2048,
                    "batch_size": 1
                }
            }
        }
        
    def _parse_memory(self, mem_str: str) -> int:
        """Convert memory string (e.g. '1G') to bytes"""
        units = {'K': 1024, 'M': 1024**2, 'G': 1024**3}
        unit = mem_str[-1].upper()
        value = int(mem_str[:-1])
        return value * units.get(unit, 1)
        
    def system_idle(self) -> bool:
        """Check if system resources are available"""
        cpu_percent = psutil.cpu_percent()
        mem = psutil.virtual_memory()
        
        return (cpu_percent < 30 and 
                mem.available > self._parse_memory(self.config['llm_resources']['memory_per_model']))
                
    def can_load_model(self, model_name: str) -> bool:
        """Check if a model can be loaded"""
        if model_name not in self.config['model_configs']:
            return False
            
        return self.system_idle()

class LLMManager:
    def __init__(self, models_path: str = "/home/jon/ai_system_evolution/data/models"):
        self.models_path = models_path
        self.models: Dict[str, ModelConfig] = {}
        self.active_model: Optional[str] = None
        self.resource_monitor = ResourceMonitor()
        self._ensure_paths()
        
    def _ensure_paths(self):
        """Ensure required directories exist"""
        os.makedirs(self.models_path, exist_ok=True)
        
    async def initialize(self):
        """Initialize LLM infrastructure"""
        if not self.resource_monitor.system_idle():
            logger.info("System busy, deferring model loading")
            return
            
        try:
            await self._load_models()
        except Exception as e:
            logger.error(f"Failed to initialize models: {e}")
            
    async def _load_models(self):
        """Load available models"""
        config = self.resource_monitor.config['model_configs']
        
        for model_name, model_config in config.items():
            model_path = os.path.join(self.models_path, model_name)
            
            if not os.path.exists(model_path):
                logger.warning(f"Model {model_name} not found at {model_path}")
                continue
                
            if not self.resource_monitor.can_load_model(model_name):
                logger.info(f"Insufficient resources to load {model_name}")
                continue
                
            self.models[model_name] = ModelConfig(
                name=model_name,
                path=model_path,
                threads=model_config['threads'],
                context_size=model_config['context_size'],
                batch_size=model_config['batch_size'],
                memory_limit=self.resource_monitor.config['llm_resources']['memory_per_model']
            )
            
            logger.info(f"Loaded model {model_name}")
            
    def _select_model(self, task: Dict) -> Optional[str]:
        """Select appropriate model for task"""
        if not self.models:
            return None
            
        # TODO: Implement model selection logic based on task requirements
        # For now, just return the first available model
        return next(iter(self.models.keys()))
        
    async def process(self, task: Dict) -> Optional[Dict]:
        """Process a task using appropriate model"""
        model_name = self._select_model(task)
        if not model_name:
            logger.error("No suitable model available")
            return None
            
        try:
            # TODO: Implement actual model inference
            # For now, just return a placeholder response
            return {
                "status": "success",
                "model": model_name,
                "result": "Placeholder response"
            }
        except Exception as e:
            logger.error(f"Failed to process task: {e}")
            return None
            
    async def shutdown(self):
        """Clean shutdown of LLM infrastructure"""
        # TODO: Implement model unloading and cleanup
        self.models.clear()
        self.active_model = None 