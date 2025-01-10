import os
import sys
import asyncio
import logging
import aiohttp
import aiofiles
from typing import Dict, Optional, List
from tqdm import tqdm

logger = logging.getLogger('llm_downloader')

MODEL_URLS = {
    'llama2-7b-q4': 'https://huggingface.co/TheBloke/Llama-2-7B-GGUF/resolve/main/llama-2-7b.Q4_K_M.gguf',
    'codellama-7b-q4': 'https://huggingface.co/TheBloke/CodeLlama-7B-GGUF/resolve/main/codellama-7b.Q4_K_M.gguf',
    'llama2-13b-q4': 'https://huggingface.co/TheBloke/Llama-2-13B-GGUF/resolve/main/llama-2-13b.Q4_K_M.gguf',
    'phi-2-q4': 'https://huggingface.co/TheBloke/phi-2-GGUF/resolve/main/phi-2.Q4_K_M.gguf'
}

class ModelDownloader:
    def __init__(self, models_path: str = "/home/jon/ai_system_evolution/data/models"):
        self.models_path = models_path
        os.makedirs(models_path, exist_ok=True)
        
    async def download_model(self, model_name: str, force: bool = False) -> bool:
        """Download a specific model"""
        if model_name not in MODEL_URLS:
            logger.error(f"Unknown model: {model_name}")
            return False
            
        model_path = os.path.join(self.models_path, f"{model_name}.gguf")
        if os.path.exists(model_path) and not force:
            logger.info(f"Model {model_name} already exists")
            return True
            
        url = MODEL_URLS[model_name]
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status != 200:
                        logger.error(f"Failed to download {model_name}: {response.status}")
                        return False
                        
                    total_size = int(response.headers.get('content-length', 0))
                    
                    # Create progress bar
                    progress = tqdm(
                        total=total_size,
                        unit='iB',
                        unit_scale=True,
                        desc=f"Downloading {model_name}"
                    )
                    
                    # Download with progress
                    async with aiofiles.open(model_path, 'wb') as f:
                        async for chunk in response.content.iter_chunked(8192):
                            await f.write(chunk)
                            progress.update(len(chunk))
                            
                    progress.close()
                    
                    if os.path.getsize(model_path) != total_size:
                        logger.error(f"Download incomplete for {model_name}")
                        os.remove(model_path)
                        return False
                        
                    logger.info(f"Successfully downloaded {model_name}")
                    return True
                    
        except Exception as e:
            logger.error(f"Error downloading {model_name}: {e}")
            if os.path.exists(model_path):
                os.remove(model_path)
            return False
            
    async def download_models(self, models: List[str] = None, force: bool = False) -> Dict[str, bool]:
        """Download multiple models"""
        if models is None:
            models = list(MODEL_URLS.keys())
            
        results = {}
        for model_name in models:
            results[model_name] = await self.download_model(model_name, force)
            
        return results
        
    def get_available_models(self) -> List[str]:
        """Get list of available models"""
        available = []
        for model_name in MODEL_URLS:
            model_path = os.path.join(self.models_path, f"{model_name}.gguf")
            if os.path.exists(model_path):
                available.append(model_name)
        return available
        
    def get_downloadable_models(self) -> List[str]:
        """Get list of models available for download"""
        return list(MODEL_URLS.keys())
        
    async def verify_model(self, model_name: str) -> bool:
        """Verify model file integrity"""
        if model_name not in MODEL_URLS:
            return False
            
        model_path = os.path.join(self.models_path, f"{model_name}.gguf")
        if not os.path.exists(model_path):
            return False
            
        try:
            async with aiohttp.ClientSession() as session:
                async with session.head(MODEL_URLS[model_name]) as response:
                    expected_size = int(response.headers.get('content-length', 0))
                    actual_size = os.path.getsize(model_path)
                    return expected_size == actual_size
        except Exception as e:
            logger.error(f"Error verifying {model_name}: {e}")
            return False
            
    async def cleanup(self):
        """Clean up incomplete downloads"""
        for model_name in MODEL_URLS:
            model_path = os.path.join(self.models_path, f"{model_name}.gguf")
            if os.path.exists(model_path):
                if not await self.verify_model(model_name):
                    logger.warning(f"Removing incomplete model: {model_name}")
                    os.remove(model_path) 