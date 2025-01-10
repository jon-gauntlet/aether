import os
import json
import asyncio
from typing import Dict, Optional, List
import logging
from llama_cpp import Llama

logger = logging.getLogger('llm_inference')

class ModelInstance:
    def __init__(self, model_path: str, config: Dict):
        self.model = Llama(
            model_path=model_path,
            n_ctx=config.get('context_size', 2048),
            n_batch=config.get('batch_size', 1),
            n_threads=config.get('threads', 4),
            n_gpu_layers=0 if not config.get('gpu_enabled', False) else -1
        )
        self.config = config
        self.last_used = 0
        self.total_tokens = 0
        
    async def generate(self, 
                      prompt: str, 
                      max_tokens: int = 256,
                      temperature: float = 0.7,
                      top_p: float = 0.9,
                      repeat_penalty: float = 1.1) -> Optional[Dict]:
        """Generate response from model"""
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
            logger.error(f"Inference error: {e}")
            return None

class InferenceManager:
    def __init__(self, models_path: str = "/home/jon/ai_system_evolution/data/models"):
        self.models_path = models_path
        self.instances: Dict[str, ModelInstance] = {}
        self.max_instances = 2
        
    async def load_model(self, model_name: str, config: Dict) -> bool:
        """Load a model instance"""
        try:
            if len(self.instances) >= self.max_instances:
                # Unload least recently used model
                await self._unload_lru_model()
                
            model_path = os.path.join(self.models_path, f"{model_name}.gguf")
            if not os.path.exists(model_path):
                logger.error(f"Model file not found: {model_path}")
                return False
                
            self.instances[model_name] = ModelInstance(model_path, config)
            logger.info(f"Loaded model: {model_name}")
            return True
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
                del self.instances[model_name]
                logger.info(f"Unloaded model: {model_name}")
        except Exception as e:
            logger.error(f"Error unloading model {model_name}: {e}")
            
    async def get_instance(self, model_name: str) -> Optional[ModelInstance]:
        """Get model instance, loading if necessary"""
        return self.instances.get(model_name)
        
    async def run_inference(self, 
                          model_name: str,
                          prompt: str,
                          max_tokens: int = 256,
                          temperature: float = 0.7,
                          top_p: float = 0.9,
                          repeat_penalty: float = 1.1) -> Optional[Dict]:
        """Run inference on specified model"""
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
                'last_used': instance.last_used
            }
            for name, instance in self.instances.items()
        } 