import os
import sys
import asyncio
import logging
from typing import Dict, Optional, List
from datetime import datetime
import uuid
from systemd import journal
import json
from dataclasses import dataclass
import hashlib

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

@dataclass
class ContextBoundary:
    max_context_size_mb: float = 50.0
    max_contexts: int = 100
    retention_days: int = 30

class ContextService:
    def __init__(self, base_path: str = "/home/jon/.local/share/cursor/contexts"):
        self.base_path = base_path
        self.active_contexts: Dict[str, dict] = {}
        self.boundaries = ContextBoundary()
        self._lock = asyncio.Lock()
        self._ensure_directories()
        self._running = True
        self._tasks = []
        
    def _ensure_directories(self) -> None:
        """Ensure required directories exist."""
        dirs = ['active', 'archive', 'patterns']
        for dir_name in dirs:
            os.makedirs(os.path.join(self.base_path, dir_name), exist_ok=True)
            
    async def store_context(self, context: dict, source: str) -> str:
        """Store a context with privacy boundaries."""
        async with self._lock:
            # Sanitize and validate
            sanitized = await self._sanitize_context(context)
            if not await self._validate_context(sanitized):
                raise ValueError("Context validation failed")
                
            # Generate unique ID
            context_id = self._generate_context_id(sanitized)
            
            # Add metadata
            sanitized['metadata'] = {
                'source': source,
                'created': datetime.now().isoformat(),
                'id': context_id
            }
            
            # Store context
            await self._write_context(context_id, sanitized)
            
            # Update patterns
            await self._update_patterns(sanitized)
            
            return context_id
            
    async def _sanitize_context(self, context: dict) -> dict:
        """Remove sensitive information from context."""
        sanitized = context.copy()
        
        # Remove sensitive keys
        sensitive_keys = ['password', 'token', 'secret', 'key']
        for key in sensitive_keys:
            if key in sanitized:
                del sanitized[key]
                
        # Sanitize nested dicts
        for key, value in sanitized.items():
            if isinstance(value, dict):
                sanitized[key] = await self._sanitize_context(value)
                
        return sanitized
        
    async def _validate_context(self, context: dict) -> bool:
        """Validate context meets requirements."""
        # Check size
        context_size = len(json.dumps(context).encode('utf-8')) / (1024 * 1024)
        if context_size > self.boundaries.max_context_size_mb:
            return False
            
        # Check total contexts
        contexts = os.listdir(os.path.join(self.base_path, 'active'))
        if len(contexts) >= self.boundaries.max_contexts:
            await self._archive_old_contexts()
            
        return True
        
    def _generate_context_id(self, context: dict) -> str:
        """Generate unique context ID."""
        context_str = json.dumps(context, sort_keys=True)
        return hashlib.sha256(context_str.encode()).hexdigest()[:12]
        
    async def _write_context(self, context_id: str, context: dict) -> None:
        """Write context to storage."""
        path = os.path.join(self.base_path, 'active', f"{context_id}.json")
        with open(path, 'w') as f:
            json.dump(context, f, indent=2)
            
    async def _update_patterns(self, context: dict) -> None:
        """Update pattern recognition from context."""
        patterns = await self._extract_patterns(context)
        if patterns:
            await self._store_patterns(patterns)
            
    async def _extract_patterns(self, context: dict) -> List[dict]:
        """Extract patterns from context."""
        patterns = []
        
        # Extract key patterns
        key_pattern = {
            'type': 'key_structure',
            'keys': list(self._extract_key_hierarchy(context))
        }
        patterns.append(key_pattern)
        
        # Extract value patterns
        value_patterns = self._extract_value_patterns(context)
        if value_patterns:
            patterns.extend(value_patterns)
            
        return patterns
        
    def _extract_key_hierarchy(self, obj: dict, prefix: str = '') -> List[str]:
        """Extract hierarchical key structure."""
        keys = []
        for key, value in obj.items():
            full_key = f"{prefix}.{key}" if prefix else key
            keys.append(full_key)
            if isinstance(value, dict):
                keys.extend(self._extract_key_hierarchy(value, full_key))
        return keys
        
    def _extract_value_patterns(self, context: dict) -> List[dict]:
        """Extract patterns from values."""
        patterns = []
        
        # Implement value pattern extraction logic here
        # This is a placeholder for more sophisticated pattern recognition
        
        return patterns
        
    async def _store_patterns(self, patterns: List[dict]) -> None:
        """Store extracted patterns."""
        patterns_file = os.path.join(self.base_path, 'patterns', 'context_patterns.json')
        
        existing_patterns = []
        if os.path.exists(patterns_file):
            with open(patterns_file, 'r') as f:
                existing_patterns = json.load(f)
                
        # Merge patterns
        merged = self._merge_patterns(existing_patterns, patterns)
        
        with open(patterns_file, 'w') as f:
            json.dump(merged, f, indent=2)
            
    def _merge_patterns(self, existing: List[dict], new: List[dict]) -> List[dict]:
        """Merge new patterns with existing ones."""
        merged = existing.copy()
        
        for pattern in new:
            if pattern not in merged:
                merged.append(pattern)
                
        return merged
        
    async def _archive_old_contexts(self) -> None:
        """Archive old contexts."""
        active_dir = os.path.join(self.base_path, 'active')
        archive_dir = os.path.join(self.base_path, 'archive')
        
        for filename in os.listdir(active_dir):
            path = os.path.join(active_dir, filename)
            with open(path, 'r') as f:
                context = json.load(f)
                
            created = datetime.fromisoformat(context['metadata']['created'])
            age_days = (datetime.now() - created).days
            
            if age_days > self.boundaries.retention_days:
                os.rename(path, os.path.join(archive_dir, filename))
                
    async def get_context(self, context_id: str) -> Optional[dict]:
        """Retrieve a context by ID."""
        path = os.path.join(self.base_path, 'active', f"{context_id}.json")
        if not os.path.exists(path):
            path = os.path.join(self.base_path, 'archive', f"{context_id}.json")
            
        if os.path.exists(path):
            with open(path, 'r') as f:
                return json.load(f)
                
        return None
        
    async def get_patterns(self) -> List[dict]:
        """Get recognized patterns."""
        patterns_file = os.path.join(self.base_path, 'patterns', 'context_patterns.json')
        if os.path.exists(patterns_file):
            with open(patterns_file, 'r') as f:
                return json.load(f)
        return []
        
    async def start(self):
        """Start the context service."""
        logger.info("Starting context service")
        self._running = True
        
        # Start background tasks
        self._tasks = [
            asyncio.create_task(self._cleanup_task()),
            asyncio.create_task(self._pattern_update_task())
        ]
        
    async def stop(self):
        """Stop the context service gracefully."""
        logger.info("Stopping context service")
        self._running = False
        
        # Cancel all tasks
        for task in self._tasks:
            task.cancel()
            
        try:
            await asyncio.gather(*self._tasks, return_exceptions=True)
        except asyncio.CancelledError:
            pass
            
        # Ensure all pending operations are complete
        async with self._lock:
            # Archive any contexts that need archiving
            await self._archive_old_contexts()
            # Store any pending patterns
            patterns = await self._extract_patterns(self.active_contexts)
            if patterns:
                await self._store_patterns(patterns)
                
        logger.info("Context service stopped")
        
    async def _cleanup_task(self):
        """Background task to clean up old contexts."""
        while self._running:
            try:
                await self._archive_old_contexts()
                await asyncio.sleep(3600)  # Run every hour
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in cleanup task: {e}")
                await asyncio.sleep(60)  # Wait before retrying
                
    async def _pattern_update_task(self):
        """Background task to update patterns."""
        while self._running:
            try:
                patterns = await self._extract_patterns(self.active_contexts)
                if patterns:
                    await self._store_patterns(patterns)
                await asyncio.sleep(1800)  # Run every 30 minutes
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in pattern update task: {e}")
                await asyncio.sleep(60)  # Wait before retrying

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