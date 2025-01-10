#!/usr/bin/env python3
"""
LLM Manager - Handles local LLM model management and inference
"""

import os
import json
import asyncio
import logging
from typing import Dict, Optional, Any
from dataclasses import dataclass
from pathlib import Path

import llama_cpp
from llama_cpp import Llama

@dataclass
class ModelConfig:
    name: str
    path: str
    threads: int
    context_size: int
    batch_size: int
    model_type: str
    
class ResourceMonitor:
    """Monitors system resources for LLM operations"""
    
    def __init__(self):
        self.logger = logging.getLogger("llm.resources")
        
    def check_resources(self) -> bool:
        """Check if system has enough resources to load/run models"""
        try:
            # Check CPU usage
            cpu_usage = os.popen("top -bn1 | grep 'Cpu(s)' | awk '{print $2}'").read().strip()
            if float(cpu_usage) > 70:  # CPU usage > 70%
                return False
                
            # Check memory
            mem = os.popen("free -m | grep Mem | awk '{print $4}'").read().strip()
            if int(mem) < 2048:  # Less than 2GB free
                return False
                
            return True
        except Exception as e:
            self.logger.error(f"Error checking resources: {e}")
            return False
            
    def get_optimal_threads(self) -> int:
        """Get optimal number of threads based on system state"""
        try:
            cpu_count = len(os.sched_getaffinity(0))
            return max(1, min(4, cpu_count // 2))
        except Exception as e:
            self.logger.error(f"Error getting optimal threads: {e}")
            return 1

class LLMManager:
    """Manages local LLM models and inference"""
    
    def __init__(self, config_path: str = None):
        self.logger = logging.getLogger("llm.manager")
        self.models: Dict[str, Llama] = {}
        self.active_model: Optional[str] = None
        self.resource_monitor = ResourceMonitor()
        
        # Load config
        if config_path is None:
            config_path = os.path.expanduser("~/.config/cursor/llm/config.json")
        self.config_path = config_path
        self.config = self._load_config()
        
    def _load_config(self) -> dict:
        """Load LLM configuration"""
        try:
            with open(self.config_path) as f:
                return json.load(f)
        except Exception as e:
            self.logger.error(f"Error loading config: {e}")
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
            
    async def initialize(self) -> bool:
        """Initialize LLM system"""
        if not self.resource_monitor.check_resources():
            self.logger.warning("Insufficient resources to initialize LLM system")
            return False
            
        try:
            # Load primary model
            if await self._load_model("llama2-7b-q4"):
                self.active_model = "llama2-7b-q4"
                self.logger.info("LLM system initialized successfully")
                return True
            return False
        except Exception as e:
            self.logger.error(f"Error initializing LLM system: {e}")
            return False
            
    async def _load_model(self, model_name: str) -> bool:
        """Load a specific model"""
        if model_name in self.models:
            return True
            
        try:
            model_path = os.path.expanduser(f"~/ai_system_evolution/data/models/{model_name}.gguf")
            if not os.path.exists(model_path):
                self.logger.error(f"Model file not found: {model_path}")
                return False
                
            config = self.config["model_configs"].get(model_name, {})
            threads = config.get("threads", self.resource_monitor.get_optimal_threads())
            context_size = config.get("context_size", 2048)
            batch_size = config.get("batch_size", 1)
            
            model = Llama(
                model_path=model_path,
                n_ctx=context_size,
                n_batch=batch_size,
                n_threads=threads
            )
            
            self.models[model_name] = model
            self.logger.info(f"Loaded model: {model_name}")
            return True
        except Exception as e:
            self.logger.error(f"Error loading model {model_name}: {e}")
            return False
            
    def _select_model(self, task: dict) -> Optional[str]:
        """Select appropriate model for task"""
        try:
            if task.get("type") == "code":
                return "codellama-7b-q4"
            elif task.get("complexity", 0) > 0.8:
                return "llama2-13b-q4"
            elif task.get("complexity", 0) < 0.3:
                return "phi-2-q4"
            return "llama2-7b-q4"
        except Exception as e:
            self.logger.error(f"Error selecting model: {e}")
            return None
            
    async def process(self, task: dict) -> Optional[str]:
        """Process a task using appropriate model"""
        try:
            model_name = self._select_model(task)
            if not model_name:
                return None
                
            if model_name not in self.models:
                if not await self._load_model(model_name):
                    model_name = self.active_model
                    
            if not model_name or model_name not in self.models:
                return None
                
            model = self.models[model_name]
            prompt = task.get("prompt", "")
            
            result = model(
                prompt,
                max_tokens=task.get("max_tokens", 256),
                temperature=task.get("temperature", 0.7),
                top_p=task.get("top_p", 0.9),
                repeat_penalty=task.get("repeat_penalty", 1.1)
            )
            
            return result.get("choices", [{}])[0].get("text", "").strip()
        except Exception as e:
            self.logger.error(f"Error processing task: {e}")
            return None
            
    async def cleanup(self):
        """Clean up resources"""
        try:
            for model_name, model in self.models.items():
                try:
                    del model
                except:
                    pass
            self.models.clear()
            self.active_model = None
        except Exception as e:
            self.logger.error(f"Error during cleanup: {e}")
            
    def __del__(self):
        """Cleanup on deletion"""
        asyncio.create_task(self.cleanup()) 