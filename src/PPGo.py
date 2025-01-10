import os
import sys
import asyncio
import logging
from typing import Dict, Optional, List
import json

# Add project root to Python path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, project_root)

from lib.llm.downloader import ModelDownloader

# Configure logging
os.makedirs('/home/jon/.local/share/cursor/logs', exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    filename='/home/jon/.local/share/cursor/logs/model_service.log'
)
logger = logging.getLogger('model_service')

class ModelService:
    def __init__(self):
        self.downloader = ModelDownloader()
        self.active = False
        self.download_queue = asyncio.Queue()
        
    async def start(self):
        """Start the model service"""
        if self.active:
            return
            
        self.active = True
        logger.info("Model service starting")
        
        try:
            # Start download processing
            await asyncio.gather(
                self._process_downloads(),
                self._verify_models()
            )
        except Exception as e:
            logger.error(f"Service error: {e}")
            self.active = False
            
    async def stop(self):
        """Stop the model service"""
        self.active = False
        logger.info("Model service stopping")
        await self.downloader.cleanup()
        
    async def _process_downloads(self):
        """Process download queue"""
        while self.active:
            try:
                # Get download request from queue
                request = await self.download_queue.get()
                
                # Process download
                model_name = request['model']
                force = request.get('force', False)
                
                success = await self.downloader.download_model(model_name, force)
                
                # Store result
                await self._store_result(request, success)
                
                # Mark task as done
                self.download_queue.task_done()
                
                # Sleep briefly between downloads
                await asyncio.sleep(1)
            except Exception as e:
                logger.error(f"Download processing error: {e}")
                await asyncio.sleep(5)
                
    async def _verify_models(self):
        """Periodically verify model integrity"""
        while self.active:
            try:
                # Get list of available models
                available = self.downloader.get_available_models()
                
                # Verify each model
                for model_name in available:
                    if not await self.downloader.verify_model(model_name):
                        logger.warning(f"Model verification failed: {model_name}")
                        # Queue for re-download
                        await self.download_queue.put({
                            'model': model_name,
                            'force': True,
                            'reason': 'verification_failed'
                        })
                        
                # Sleep for a while before next verification
                await asyncio.sleep(3600)  # Check every hour
            except Exception as e:
                logger.error(f"Model verification error: {e}")
                await asyncio.sleep(300)
                
    async def _store_result(self, request: Dict, success: bool):
        """Store download result"""
        try:
            # Ensure results directory exists
            results_dir = "/home/jon/.local/share/cursor/models/results"
            os.makedirs(results_dir, exist_ok=True)
            
            # Store result
            result_path = os.path.join(results_dir, f"{request['model']}_download.json")
            with open(result_path, 'w') as f:
                json.dump({
                    'request': request,
                    'success': success,
                    'timestamp': str(datetime.now())
                }, f)
        except Exception as e:
            logger.error(f"Failed to store result: {e}")
            
    async def request_download(self, model_name: str, force: bool = False) -> bool:
        """Request model download"""
        try:
            await self.download_queue.put({
                'model': model_name,
                'force': force,
                'timestamp': str(datetime.now())
            })
            return True
        except Exception as e:
            logger.error(f"Download request error: {e}")
            return False
            
    def get_status(self) -> Dict:
        """Get service status"""
        return {
            'active': self.active,
            'queue_size': self.download_queue.qsize(),
            'available_models': self.downloader.get_available_models(),
            'downloadable_models': self.downloader.get_downloadable_models()
        }

async def main():
    """Main service entry point"""
    service = ModelService()
    
    try:
        # Start service
        logger.info("Model service initialized")
        await service.start()
    except KeyboardInterrupt:
        await service.stop()
    except Exception as e:
        logger.error(f"Service failed: {e}")
        await service.stop()
        raise

if __name__ == "__main__":
    asyncio.run(main()) 