import os
import sys
import asyncio
import logging
from typing import Dict, Optional
from datetime import datetime
import uuid

# Add project root to Python path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, project_root)

from lib.context.manager import Context, ContextManager
from lib.context.learner import PatternLearner

# Configure logging
os.makedirs('/home/jon/.local/share/cursor/logs', exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    filename='/home/jon/.local/share/cursor/logs/context_service.log'
)
logger = logging.getLogger('context_service')

# System Guiding Principles
SYSTEM_PRINCIPLES = {
    "core_principles": {
        "autonomy": "Work autonomously with no need for re-prompting",
        "wisdom": "Be wise - don't break the system",
        "integration": "Ensure everything is integrated properly and plays well together",
        "validation": "Thoroughly validate all work",
        "reuse": "Check what exists before implementing something new",
        "preservation": "Save guiding principles for future sessions"
    },
    "implementation_rules": {
        "check_existing": True,
        "validate_changes": True,
        "ensure_integration": True,
        "preserve_state": True,
        "maintain_stability": True
    },
    "operational_guidelines": {
        "autonomous_operation": {
            "enabled": True,
            "constraints": [
                "Never break existing functionality",
                "Always validate changes",
                "Preserve system stability"
            ]
        },
        "integration_requirements": {
            "check_dependencies": True,
            "verify_compatibility": True,
            "test_interactions": True
        }
    }
}

class ContextService:
    def __init__(self):
        self.context_manager = ContextManager()
        self.pattern_learner = PatternLearner()
        self.active = False
        self._store_principles()
        
    def _store_principles(self):
        """Store system guiding principles in context"""
        principles_context = Context(
            id=str(uuid.uuid4()),
            timestamp=datetime.now(),
            data={
                "type": "system_principles",
                "principles": SYSTEM_PRINCIPLES,
                "metadata": {
                    "permanent": True,
                    "priority": "high",
                    "scope": "global"
                }
            },
            source="system",
            privacy_level="internal"
        )
        
        # Ensure principles directory exists
        principles_dir = os.path.join("/home/jon/.local/share/cursor/contexts/principles")
        os.makedirs(principles_dir, exist_ok=True)
        
        # Store principles
        try:
            with open(os.path.join(principles_dir, "guiding_principles.json"), "w") as f:
                import json
                json.dump(principles_context.__dict__, f, default=str)
        except Exception as e:
            logger.error(f"Failed to store principles: {e}")
        
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
        # Notify systemd we're ready
        logger.info("Context service initialized")
        
        # Start service
        await service.start()
    except KeyboardInterrupt:
        await service.stop()
    except Exception as e:
        logger.error(f"Service failed: {e}")
        await service.stop()
        raise

if __name__ == "__main__":
    asyncio.run(main()) 