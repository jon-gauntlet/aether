#!/usr/bin/env python3
"""
LLM Manager - Handles local LLM model management and inference
"""

import os
import json
import asyncio
import logging
import psutil
from pathlib import Path
from typing import Dict, List, Optional
from systemd import journal
from llama_cpp import Llama

class ModelInstance:
    def __init__(self, model_path: Path, config: Dict):
        self.model_path = model_path
        self.config = config
        self.model: Optional[Llama] = None
        self.last_used = 0
        self.load_lock = asyncio.Lock()
        self.inference_lock = asyncio.Lock()
        self.error_count = 0
        
    async def load(self):
        async with self.load_lock:
            if self.model is not None:
                return
                
            self.model = Llama(
                model_path=str(self.model_path),
                n_ctx=self.config["context_size"],
                n_batch=self.config["batch_size"],
                n_threads=self.config["threads"]
            )
            
    async def unload(self):
        async with self.load_lock:
            if self.model is None:
                return
                
            del self.model
            self.model = None
            
    async def generate(self, prompt: str, **kwargs) -> str:
        async with self.inference_lock:
            if self.model is None:
                await self.load()
                
            try:
                output = self.model(
                    prompt,
                    max_tokens=kwargs.get("max_tokens", self.config["max_tokens"]),
                    temperature=kwargs.get("temperature", 0.7),
                    top_p=kwargs.get("top_p", 0.9),
                    stop=kwargs.get("stop", None)
                )
                self.error_count = 0
                return output["choices"][0]["text"]
                
            except Exception as e:
                self.error_count += 1
                if self.error_count >= 3:
                    await self.unload()  # Force reload on next use
                raise

class LLMManager:
    def __init__(self, models_dir: Optional[Path] = None):
        self.models_dir = models_dir or Path("/home/jon/ai_system_evolution/data/models")
        self.instances: Dict[str, ModelInstance] = {}
        self.logger = logging.getLogger('llm_manager')
        
    async def initialize(self):
        """Initialize the manager."""
        self.logger.info("Initializing LLM Manager")
        # Ensure models directory exists
        self.models_dir.mkdir(parents=True, exist_ok=True)
        
    async def shutdown(self):
        """Shutdown the manager and cleanup resources."""
        self.logger.info("Shutting down LLM Manager")
        for model_name in list(self.instances.keys()):
            await self.unload_model(model_name)
            
    async def load_model(self, model_path: str, config: Dict) -> ModelInstance:
        """Load a model with the given configuration."""
        model_path = Path(model_path)
        model_name = model_path.name
        
        if model_name in self.instances:
            self.logger.info(f"Model {model_name} already loaded")
            return self.instances[model_name]
            
        try:
            instance = ModelInstance(model_path, config)
            await instance.load()
            self.instances[model_name] = instance
            self.logger.info(f"Successfully loaded model {model_name}")
            return instance
        except Exception as e:
            self.logger.error(f"Failed to load model {model_name}: {e}")
            raise
            
    async def unload_model(self, model: ModelInstance):
        """Unload a model instance."""
        model_name = model.model_path.name
        if model_name not in self.instances:
            return
            
        try:
            await model.unload()
            del self.instances[model_name]
            self.logger.info(f"Successfully unloaded model {model_name}")
        except Exception as e:
            self.logger.error(f"Failed to unload model {model_name}: {e}")
            raise
            
    async def get_status(self) -> Dict:
        """Get status of all loaded models."""
        return {
            name: {
                "loaded": instance.model is not None,
                "last_used": instance.last_used,
                "error_count": instance.error_count
            }
            for name, instance in self.instances.items()
        } 