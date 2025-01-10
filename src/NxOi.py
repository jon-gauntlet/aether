import os
import sys
import asyncio
import logging
from typing import Dict, Optional
import json

# Add project root to Python path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, project_root)

from lib.llm.manager import LLMManager

# Configure logging
os.makedirs('/home/jon/.local/share/cursor/logs', exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    filename='/home/jon/.local/share/cursor/logs/llm_service.log'
)
logger = logging.getLogger('llm_service')

class LLMService:
    def __init__(self):
        self.manager = LLMManager()
        self.active = False
        self.task_queue = asyncio.Queue()
        
    async def start(self):
        """Start the LLM service"""
        if self.active:
            return
            
        self.active = True
        logger.info("LLM service starting")
        
        try:
            # Initialize LLM infrastructure
            await self.manager.initialize()
            
            # Start task processing
            await asyncio.gather(
                self._process_tasks()
            )
        except Exception as e:
            logger.error(f"Service error: {e}")
            self.active = False
            
    async def stop(self):
        """Stop the LLM service"""
        self.active = False
        logger.info("LLM service stopping")
        await self.manager.shutdown()
        
    async def _process_tasks(self):
        """Process tasks from queue"""
        while self.active:
            try:
                # Get task from queue
                task = await self.task_queue.get()
                
                # Process task
                result = await self.manager.process(task)
                
                # Store result if needed
                if result:
                    await self._store_result(task, result)
                    
                # Mark task as done
                self.task_queue.task_done()
                
                # Sleep briefly to prevent CPU overuse
                await asyncio.sleep(0.1)
            except Exception as e:
                logger.error(f"Task processing error: {e}")
                await asyncio.sleep(1)
                
    async def _store_result(self, task: Dict, result: Dict):
        """Store task result"""
        try:
            # Ensure results directory exists
            results_dir = "/home/jon/.local/share/cursor/llm/results"
            os.makedirs(results_dir, exist_ok=True)
            
            # Store result
            result_path = os.path.join(results_dir, f"{task.get('id', 'unknown')}.json")
            with open(result_path, 'w') as f:
                json.dump({
                    'task': task,
                    'result': result,
                    'timestamp': str(datetime.now())
                }, f)
        except Exception as e:
            logger.error(f"Failed to store result: {e}")
            
    async def submit_task(self, task: Dict) -> bool:
        """Submit a task for processing"""
        try:
            await self.task_queue.put(task)
            return True
        except Exception as e:
            logger.error(f"Task submission error: {e}")
            return False
            
    async def get_status(self) -> Dict:
        """Get service status"""
        return {
            'active': self.active,
            'queue_size': self.task_queue.qsize(),
            'models': list(self.manager.models.keys())
        }

async def main():
    """Main service entry point"""
    service = LLMService()
    
    try:
        # Start service
        logger.info("LLM service initialized")
        await service.start()
    except KeyboardInterrupt:
        await service.stop()
    except Exception as e:
        logger.error(f"Service failed: {e}")
        await service.stop()
        raise

if __name__ == "__main__":
    asyncio.run(main()) 