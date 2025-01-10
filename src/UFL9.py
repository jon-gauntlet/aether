import os
import json
import asyncio
import logging
from typing import Dict, Optional, List
import psutil
from llama_cpp import Llama

logger = logging.getLogger('llm_inference')

class ModelInstance:
    def __init__(self, model_path: str, config: Dict):
        self.model = None
        self.model_path = model_path
        self.config = config
        self.last_used = 0
        self.total_tokens = 0
        self.error_count = 0
        self.last_error = None
        self._load_lock = asyncio.Lock()
        
    async def ensure_loaded(self) -> bool:
        """Ensure model is loaded, with retries"""
        if self.model is not None:
            return True
            
        async with self._load_lock:
            try:
                if self.model is not None:  # Double-check after acquiring lock
                    return True
                    
                self.model = Llama(
                    model_path=self.model_path,
                    n_ctx=self.config.get('context_size', 2048),
                    n_batch=self.config.get('batch_size', 1),
                    n_threads=self.config.get('threads', 4),
                    n_gpu_layers=0 if not self.config.get('gpu_enabled', False) else -1
                )
                self.error_count = 0
                self.last_error = None
                return True
            except Exception as e:
                self.error_count += 1
                self.last_error = str(e)
                logger.error(f"Failed to load model: {e}")
                return False
                
    async def unload(self):
        """Unload model to free memory"""
        async with self._load_lock:
            if self.model is not None:
                del self.model
                self.model = None
        
    async def generate(self, 
                      prompt: str, 
                      max_tokens: int = 256,
                      temperature: float = 0.7,
                      top_p: float = 0.9,
                      repeat_penalty: float = 1.1) -> Optional[Dict]:
        """Generate response from model"""
        if not await self.ensure_loaded():
            return None
            
        try:
            # Run inference in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.model(
                    prompt,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    top_p=top_p,
                    repeat_penalty=repeat_penalty,
                    echo=False
                )
            )
            
            self.total_tokens += response['usage']['total_tokens']
            return {
                'text': response['choices'][0]['text'].strip(),
                'usage': response['usage']
            }
        except Exception as e:
            self.error_count += 1
            self.last_error = str(e)
            logger.error(f"Inference error: {e}")
            
            # Attempt recovery by reloading model
            if self.error_count <= 3:
                await self.unload()
                if await self.ensure_loaded():
                    return await self.generate(
                        prompt, max_tokens, temperature, top_p, repeat_penalty
                    )
            return None

class InferenceManager:
    def __init__(self, models_path: str = "/home/jon/ai_system_evolution/data/models"):
        self.models_path = models_path
        self.instances: Dict[str, ModelInstance] = {}
        self.max_instances = 2
        self._load_lock = asyncio.Lock()
        self._last_memory_check = 0
        self._memory_check_interval = 60  # Check memory every 60 seconds
        
    async def _check_memory(self) -> bool:
        """Check if system has enough memory"""
        current_time = asyncio.get_event_loop().time()
        if current_time - self._last_memory_check < self._memory_check_interval:
            return True
            
        self._last_memory_check = current_time
        mem = psutil.virtual_memory()
        
        # If memory usage is too high, unload some models
        if mem.percent > 80:
            logger.warning("Memory usage high, unloading models")
            await self._unload_unused_models()
            return False
            
        return True
        
    async def _unload_unused_models(self):
        """Unload models that haven't been used recently"""
        current_time = asyncio.get_event_loop().time()
        for name, instance in list(self.instances.items()):
            if current_time - instance.last_used > 300:  # 5 minutes
                await self.unload_model(name)
        
    async def load_model(self, model_name: str, config: Dict) -> bool:
        """Load a model instance"""
        try:
            async with self._load_lock:
                if len(self.instances) >= self.max_instances:
                    # Unload least recently used model
                    await self._unload_lru_model()
                    
                if not await self._check_memory():
                    return False
                    
                model_path = os.path.join(self.models_path, f"{model_name}.gguf")
                if not os.path.exists(model_path):
                    logger.error(f"Model file not found: {model_path}")
                    return False
                    
                instance = ModelInstance(model_path, config)
                if await instance.ensure_loaded():
                    self.instances[model_name] = instance
                    logger.info(f"Loaded model: {model_name}")
                    return True
                return False
        except Exception as e:
            logger.error(f"Failed to load model {model_name}: {e}")
            return False
            
    async def _unload_lru_model(self):
        """Unload least recently used model"""
        if not self.instances:
            return
            
        lru_model = min(self.instances.items(), key=lambda x: x[1].last_used)
        await self.unload_model(lru_model[0])
        
    async def unload_model(self, model_name: str):
        """Unload a model instance"""
        try:
            if model_name in self.instances:
                await self.instances[model_name].unload()
                del self.instances[model_name]
                logger.info(f"Unloaded model: {model_name}")
        except Exception as e:
            logger.error(f"Error unloading model {model_name}: {e}")
            
    async def get_instance(self, model_name: str) -> Optional[ModelInstance]:
        """Get model instance, loading if necessary"""
        instance = self.instances.get(model_name)
        if instance and await instance.ensure_loaded():
            return instance
        return None
        
    async def run_inference(self, 
                          model_name: str,
                          prompt: str,
                          max_tokens: int = 256,
                          temperature: float = 0.7,
                          top_p: float = 0.9,
                          repeat_penalty: float = 1.1) -> Optional[Dict]:
        """Run inference on specified model"""
        if not await self._check_memory():
            logger.error("Insufficient memory for inference")
            return None
            
        instance = await self.get_instance(model_name)
        if not instance:
            logger.error(f"Model {model_name} not loaded")
            return None
            
        try:
            result = await instance.generate(
                prompt=prompt,
                max_tokens=max_tokens,
                temperature=temperature,
                top_p=top_p,
                repeat_penalty=repeat_penalty
            )
            
            if result:
                instance.last_used = asyncio.get_event_loop().time()
                
            return result
        except Exception as e:
            logger.error(f"Inference error for {model_name}: {e}")
            return None
            
    def get_stats(self) -> Dict:
        """Get inference statistics"""
        return {
            name: {
                'total_tokens': instance.total_tokens,
                'last_used': instance.last_used,
                'error_count': instance.error_count,
                'last_error': instance.last_error
            }
            for name, instance in self.instances.items()
        } 