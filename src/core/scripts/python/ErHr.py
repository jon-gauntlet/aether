import os
import sys
import asyncio
import logging
from typing import Dict, Optional, List
from datetime import datetime
import uuid
from systemd import journal

# Add project root to Python path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, project_root)

from lib.context.manager import Context, ContextManager
from lib.context.learner import PatternLearner, Pattern

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
        self.processing_queue = asyncio.Queue()
        self.synthesis_queue = asyncio.Queue()
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
            privacy_level="internal",
            metadata={
                "permanent": True,
                "system": True
            }
        )
        
        # Store principles
        asyncio.create_task(self.context_manager.preserve_context(principles_context))
        
    async def start(self):
        """Start the context service"""
        if self.active:
            return
            
        self.active = True
        logger.info("Context service starting")
        
        # Start background tasks
        asyncio.create_task(self._process_contexts())
        asyncio.create_task(self._synthesize_patterns())
        asyncio.create_task(self._cleanup_old_contexts())
        
    async def stop(self):
        """Stop the context service"""
        self.active = False
        logger.info("Context service stopping")
        
    async def add_context(self, context_data: Dict, source: str = "user") -> Optional[str]:
        """Add new context to the system"""
        try:
            # Create context
            context = Context(
                id=str(uuid.uuid4()),
                timestamp=datetime.now(),
                data=context_data,
                source=source,
                privacy_level="internal"  # Will be adjusted by privacy boundary
            )
            
            # Queue for processing
            await self.processing_queue.put(context)
            
            logger.info(f"Queued context {context.id} for processing")
            return context.id
        except Exception as e:
            logger.error(f"Failed to add context: {e}")
            return None
            
    async def _process_contexts(self):
        """Process context queue"""
        while self.active:
            try:
                # Get context from queue
                context = await self.processing_queue.get()
                
                # Preserve context
                if await self.context_manager.preserve_context(context):
                    # Learn patterns
                    if await self.pattern_learner.learn_from_context(context):
                        # Queue for pattern synthesis if patterns were learned
                        await self.synthesis_queue.put(context.id)
                        
                logger.info(f"Processed context {context.id}")
                
            except Exception as e:
                logger.error(f"Context processing error: {e}")
                await asyncio.sleep(1)
                
    async def _synthesize_patterns(self):
        """Synthesize patterns from processed contexts"""
        while self.active:
            try:
                # Get context ID from queue
                context_id = await self.synthesis_queue.get()
                
                # Get patterns from context
                patterns = await self.pattern_learner.get_patterns()
                if not patterns:
                    continue
                    
                # Group patterns by type
                pattern_groups = {}
                for pattern in patterns:
                    if pattern.pattern_type not in pattern_groups:
                        pattern_groups[pattern.pattern_type] = []
                    pattern_groups[pattern.pattern_type].append(pattern)
                    
                # Synthesize each group
                for pattern_type, group in pattern_groups.items():
                    synthesized = await self.pattern_learner.synthesize_patterns(group)
                    if synthesized:
                        logger.info(f"Synthesized new {pattern_type} pattern")
                        
            except Exception as e:
                logger.error(f"Pattern synthesis error: {e}")
                await asyncio.sleep(1)
                
    async def _cleanup_old_contexts(self):
        """Archive old contexts"""
        while self.active:
            try:
                # Get active contexts
                contexts = await self.context_manager.list_contexts()
                
                # Check each context
                now = datetime.now()
                for context in contexts:
                    # Skip permanent contexts
                    if context.metadata.get("permanent", False):
                        continue
                        
                    # Archive contexts older than 7 days
                    age = now - context.timestamp
                    if age.days > 7:
                        await self.context_manager.archive_context(context.id)
                        logger.info(f"Archived old context {context.id}")
                        
                # Sleep for an hour
                await asyncio.sleep(3600)
                
            except Exception as e:
                logger.error(f"Context cleanup error: {e}")
                await asyncio.sleep(300)
                
    async def get_context(self, context_id: str) -> Optional[Context]:
        """Get context by ID"""
        return await self.context_manager.get_context(context_id)
        
    async def get_patterns(self, pattern_type: Optional[str] = None) -> List[Pattern]:
        """Get patterns of specified type"""
        return await self.pattern_learner.get_patterns(pattern_type)
        
    async def get_status(self) -> Dict:
        """Get service status"""
        return {
            'active': self.active,
            'queued_contexts': self.processing_queue.qsize(),
            'queued_syntheses': self.synthesis_queue.qsize()
        }

async def main():
    """Main service entry point"""
    service = ContextService()
    
    try:
        # Start service
        await service.start()
        
        # Keep running
        while True:
            await asyncio.sleep(1)
            
    except KeyboardInterrupt:
        await service.stop()
    except Exception as e:
        logger.error(f"Service error: {e}")
        await service.stop()
        raise

if __name__ == "__main__":
    asyncio.run(main()) 