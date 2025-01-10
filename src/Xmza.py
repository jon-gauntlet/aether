import os
import json
import asyncio
import aiohttp
import aiofiles
import logging
from pathlib import Path
from typing import Dict, Optional
from systemd import journal
from tqdm.asyncio import tqdm

class ModelDownloader:
    MODEL_URLS = {
        "llama2-7b-q4": "https://huggingface.co/TheBloke/Llama-2-7B-GGUF/resolve/main/llama-2-7b.Q4_K_M.gguf",
        "codellama-7b-q4": "https://huggingface.co/TheBloke/CodeLlama-7B-GGUF/resolve/main/codellama-7b.Q4_K_M.gguf",
        "llama2-13b-q4": "https://huggingface.co/TheBloke/Llama-2-13B-GGUF/resolve/main/llama-2-13b.Q4_K_M.gguf",
        "phi-2-q4": "https://huggingface.co/TheBloke/phi-2-GGUF/resolve/main/phi-2.Q4_K_M.gguf"
    }
    
    def __init__(self, downloads_dir: Path, results_dir: Path):
        self.downloads_dir = downloads_dir
        self.results_dir = results_dir
        self.log = logging.getLogger("model_downloader")
        self.log.addHandler(journal.JournalHandler())
        self.log.setLevel(logging.INFO)
        
        self.downloads_dir.mkdir(parents=True, exist_ok=True)
        self.results_dir.mkdir(parents=True, exist_ok=True)
        
        self.active_downloads = {}
        self.download_lock = asyncio.Lock()
        
    def _get_download_path(self, model_name: str) -> Path:
        return self.downloads_dir / f"{model_name}.gguf.download"
        
    def _get_final_path(self, model_name: str) -> Path:
        return self.results_dir / f"{model_name}.bin"
        
    async def download_model(self, model_name: str, model_config: Dict) -> bool:
        if model_name not in self.MODEL_URLS:
            self.log.error(f"Unknown model: {model_name}")
            return False
            
        final_path = self._get_final_path(model_name)
        if final_path.exists():
            self.log.info(f"Model already exists: {model_name}")
            return True
            
        async with self.download_lock:
            if model_name in self.active_downloads:
                self.log.info(f"Download already in progress: {model_name}")
                return False
                
            self.active_downloads[model_name] = asyncio.Event()
            
        try:
            download_path = self._get_download_path(model_name)
            url = self.MODEL_URLS[model_name]
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status != 200:
                        self.log.error(f"Failed to download {model_name}: {response.status}")
                        return False
                        
                    total_size = int(response.headers.get("content-length", 0))
                    
                    async with aiofiles.open(download_path, "wb") as f:
                        with tqdm(
                            total=total_size,
                            unit="B",
                            unit_scale=True,
                            desc=f"Downloading {model_name}"
                        ) as progress:
                            async for chunk in response.content.iter_chunked(8192):
                                await f.write(chunk)
                                progress.update(len(chunk))
                                
            # Move to final location
            download_path.rename(final_path)
            self.log.info(f"Download complete: {model_name}")
            return True
            
        except Exception as e:
            self.log.error(f"Download error for {model_name}: {str(e)}")
            if download_path.exists():
                download_path.unlink()
            return False
            
        finally:
            self.active_downloads[model_name].set()
            del self.active_downloads[model_name]
            
    async def wait_for_download(self, model_name: str) -> bool:
        if model_name in self.active_downloads:
            await self.active_downloads[model_name].wait()
            return self._get_final_path(model_name).exists()
        return False
        
    def is_downloading(self, model_name: str) -> bool:
        return model_name in self.active_downloads
        
    def is_available(self, model_name: str) -> bool:
        return self._get_final_path(model_name).exists()
        
    async def get_status(self) -> Dict:
        return {
            "active_downloads": list(self.active_downloads.keys()),
            "available_models": [
                model_name
                for model_name in self.MODEL_URLS
                if self.is_available(model_name)
            ]
        } 