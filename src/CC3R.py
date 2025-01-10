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
    def __init__(self, models_dir: Path, config: Dict):
        self.models_dir = models_dir
        self.config = config
        self.log = logging.getLogger("llm_manager")
        self.log.addHandler(journal.JournalHandler())
        self.log.setLevel(logging.INFO)
        
        self.models: Dict[str, ModelInstance] = {}
        self.task_lock = asyncio.Lock()
        
    def _get_model_path(self, model_name: str) -> Path:
        return self.models_dir / f"{model_name}.bin"
        
    async def load_model(self, model_name: str) -> Optional[ModelInstance]:
        if model_name not in self.config["model_configs"]:
            self.log.error(f"Unknown model: {model_name}")
            return None
            
        if model_name not in self.models:
            model_path = self._get_model_path(model_name)
            if not model_path.exists():
                self.log.error(f"Model file not found: {model_path}")
                return None
                
            self.models[model_name] = ModelInstance(
                model_path=model_path,
                config=self.config["model_configs"][model_name]
            )
            
        return self.models[model_name]
        
    async def unload_model(self, model_name: str):
        if model_name in self.models:
            await self.models[model_name].unload()
            del self.models[model_name]
            
    async def unload_unused_models(self):
        current_time = asyncio.get_event_loop().time()
        idle_timeout = self.config["llm_resources"]["idle_timeout"]
        
        for model_name, instance in list(self.models.items()):
            if current_time - instance.last_used > idle_timeout:
                self.log.info(f"Unloading idle model: {model_name}")
                await self.unload_model(model_name)
                
    def _select_model(self, task_type: str, complexity: float) -> str:
        preferences = self.config["task_routing"]["type_preferences"].get(
            task_type,
            [self.config["task_routing"]["default_model"]]
        )
        
        thresholds = self.config["task_routing"]["complexity_thresholds"]
        if complexity <= thresholds["low"]:
            return preferences[0]
        elif complexity <= thresholds["medium"]:
            return preferences[min(1, len(preferences)-1)]
        else:
            return preferences[-1]
            
    async def process_task(self, prompt: str, task_type: str = "general", complexity: float = 0.5, **kwargs) -> Optional[str]:
        async with self.task_lock:
            try:
                model_name = self._select_model(task_type, complexity)
                instance = await self.load_model(model_name)
                if instance is None:
                    return None
                    
                instance.last_used = asyncio.get_event_loop().time()
                return await instance.generate(prompt, **kwargs)
                
            except Exception as e:
                self.log.error(f"Task processing error: {str(e)}")
                return None
                
    async def get_status(self) -> Dict:
        return {
            "loaded_models": list(self.models.keys()),
            "memory_usage": psutil.Process().memory_info().rss / 1024 / 1024,
            "cpu_percent": psutil.Process().cpu_percent()
        } 