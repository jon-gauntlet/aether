import json
import asyncio
import logging
import aiofiles
import psutil
from pathlib import Path
from typing import Dict, List, Optional
from systemd import journal

from lib.llm.downloader import ModelDownloader
from lib.llm.manager import LLMManager

class ModelService:
    def __init__(self):
        self.config_path = Path("/home/jon/ai_system_evolution/config/llm_config.json")
        self.models_dir = Path("/home/jon/.local/share/cursor/models")
        self.downloads_dir = self.models_dir / "downloads"
        self.results_dir = self.models_dir / "results"
        self.log = logging.getLogger("model_service")
        self.log.addHandler(journal.JournalHandler())
        self.log.setLevel(logging.INFO)
        
        self.config = self._load_config()
        self.downloader = ModelDownloader(
            downloads_dir=self.downloads_dir,
            results_dir=self.results_dir
        )
        self.llm_manager = LLMManager(
            models_dir=self.results_dir,
            config=self.config
        )
        
        self.download_queue = asyncio.Queue()
        self.running = False
        
    def _load_config(self) -> Dict:
        with open(self.config_path) as f:
            return json.load(f)
            
    async def start(self):
        self.log.info("Starting model service")
        self.running = True
        
        # Start background tasks
        asyncio.create_task(self._process_downloads())
        asyncio.create_task(self._monitor_resources())
        
        # Queue initial model downloads
        for model_name in self.config["model_configs"]:
            await self.request_download(model_name)
            
    async def stop(self):
        self.log.info("Stopping model service") 
        self.running = False
        
    async def request_download(self, model_name: str):
        if model_name not in self.config["model_configs"]:
            self.log.error(f"Unknown model: {model_name}")
            return
            
        await self.download_queue.put(model_name)
        self.log.info(f"Queued download for {model_name}")
        
    async def _process_downloads(self):
        while self.running:
            try:
                model_name = await self.download_queue.get()
                self.log.info(f"Processing download for {model_name}")
                
                await self.downloader.download_model(
                    model_name,
                    self.config["model_configs"][model_name]
                )
                
                self.log.info(f"Download complete for {model_name}")
                self.download_queue.task_done()
                
            except Exception as e:
                self.log.error(f"Download failed for {model_name}: {str(e)}")
                
    async def _monitor_resources(self):
        while self.running:
            try:
                memory_percent = psutil.virtual_memory().percent
                if memory_percent > self.config["llm_resources"]["memory_threshold"]:
                    self.log.warning(f"Memory usage high: {memory_percent}%")
                    await self.llm_manager.unload_unused_models()
                    
                await asyncio.sleep(self.config["monitoring"]["memory_check_interval"])
                
            except Exception as e:
                self.log.error(f"Resource monitoring error: {str(e)}")
                await asyncio.sleep(60)  # Backoff on error

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