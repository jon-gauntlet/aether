import asyncio
import logging
from typing import Dict, Optional
from datetime import datetime
import uuid

from ..lib.context.manager import Context, ContextManager
from ..lib.context.learner import PatternLearner

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    filename='/home/jon/.local/share/cursor/logs/context_service.log'
)
logger = logging.getLogger('context_service')

class ContextService:
    def __init__(self):
        self.context_manager = ContextManager()
        self.pattern_learner = PatternLearner()
        self.active = False
        
    async def start(self):
        """Start the context service"""
        if self.active:
            return
            
        self.active = True
        logger.info("Context service starting")
        
        try:
            await asyncio.gather(
                self._process_contexts(),
                self._learn_patterns()
            )
        except Exception as e:
            logger.error(f"Service error: {e}")
            self.active = False
            
    async def stop(self):
        """Stop the context service"""
        self.active = False
        logger.info("Context service stopping")
        
    async def _process_contexts(self):
        """Process incoming contexts"""
        while self.active:
            try:
                # Process any pending contexts
                contexts = await self._get_pending_contexts()
                for context in contexts:
                    await self.context_manager.preserve_context(context)
                    
                # Sleep briefly to prevent CPU overuse
                await asyncio.sleep(1)
            except Exception as e:
                logger.error(f"Context processing error: {e}")
                await asyncio.sleep(5)
                
    async def _learn_patterns(self):
        """Learn patterns from processed contexts"""
        while self.active:
            try:
                # Get recently processed contexts
                contexts = await self.context_manager.list_contexts()
                
                # Learn patterns from each context
                for context in contexts:
                    await self.pattern_learner.learn_from_context(context)
                    
                # Sleep to allow new contexts to accumulate
                await asyncio.sleep(5)
            except Exception as e:
                logger.error(f"Pattern learning error: {e}")
                await asyncio.sleep(10)
                
    async def _get_pending_contexts(self) -> list[Context]:
        """Get contexts waiting to be processed"""
        # TODO: Implement actual context queue
        return []
        
    async def submit_context(self, data: Dict, source: str, privacy_level: str = "standard") -> Optional[str]:
        """Submit a new context for processing"""
        try:
            context_id = str(uuid.uuid4())
            context = Context(
                id=context_id,
                timestamp=datetime.now(),
                data=data,
                source=source,
                privacy_level=privacy_level
            )
            
            # Immediately process the context
            if await self.context_manager.preserve_context(context):
                return context_id
                
        except Exception as e:
            logger.error(f"Context submission error: {e}")
            
        return None
        
    async def get_patterns(self, pattern_type: Optional[str] = None) -> Dict:
        """Get learned patterns, optionally filtered by type"""
        # TODO: Implement pattern retrieval
        return {}

async def main():
    """Main service entry point"""
    service = ContextService()
    
    try:
        await service.start()
    except KeyboardInterrupt:
        await service.stop()
    except Exception as e:
        logger.error(f"Service failed: {e}")
        await service.stop()
        raise

if __name__ == "__main__":
    asyncio.run(main()) 