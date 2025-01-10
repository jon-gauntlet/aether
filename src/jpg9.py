import os
import json
import asyncio
from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime
import logging
from systemd import journal

@dataclass
class Context:
    id: str
    timestamp: datetime
    data: Dict
    source: str
    privacy_level: str
    metadata: Dict = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}
            
class ContextStore:
    def __init__(self, base_path: str = "/home/jon/.local/share/cursor/contexts"):
        self.base_path = base_path
        self.log = logging.getLogger("context_store")
        self.log.addHandler(journal.JournalHandler())
        self.log.setLevel(logging.INFO)
        self._ensure_paths()
        
    def _ensure_paths(self):
        """Ensure required directory structure exists"""
        for path in ['active', 'archived', 'synthesized', 'principles']:
            os.makedirs(os.path.join(self.base_path, path), exist_ok=True)
            
    async def save(self, context: Context) -> bool:
        """Save context to appropriate location"""
        try:
            # Determine storage location
            if context.metadata.get("permanent", False):
                path = os.path.join(self.base_path, "principles", f"{context.id}.json")
            elif context.metadata.get("synthesized", False):
                path = os.path.join(self.base_path, "synthesized", f"{context.id}.json")
            else:
                path = os.path.join(self.base_path, "active", f"{context.id}.json")
                
            # Save context
            async with asyncio.Lock():
                with open(path, 'w') as f:
                    json.dump({
                        'id': context.id,
                        'timestamp': context.timestamp.isoformat(),
                        'data': context.data,
                        'source': context.source,
                        'privacy_level': context.privacy_level,
                        'metadata': context.metadata
                    }, f)
                    
            self.log.info(f"Saved context {context.id} to {path}")
            return True
        except Exception as e:
            self.log.error(f"Failed to save context {context.id}: {e}")
            return False
            
    async def load(self, context_id: str) -> Optional[Context]:
        """Load context by ID"""
        try:
            # Search in all directories
            for dir_name in ['active', 'archived', 'synthesized', 'principles']:
                path = os.path.join(self.base_path, dir_name, f"{context_id}.json")
                if os.path.exists(path):
                    with open(path) as f:
                        data = json.load(f)
                        return Context(
                            id=data['id'],
                            timestamp=datetime.fromisoformat(data['timestamp']),
                            data=data['data'],
                            source=data['source'],
                            privacy_level=data['privacy_level'],
                            metadata=data.get('metadata', {})
                        )
            return None
        except Exception as e:
            self.log.error(f"Failed to load context {context_id}: {e}")
            return None
            
    async def archive(self, context_id: str) -> bool:
        """Move context to archive"""
        try:
            context = await self.load(context_id)
            if not context:
                return False
                
            # Move to archive
            old_path = os.path.join(self.base_path, "active", f"{context_id}.json")
            new_path = os.path.join(self.base_path, "archived", f"{context_id}.json")
            
            if os.path.exists(old_path):
                os.rename(old_path, new_path)
                self.log.info(f"Archived context {context_id}")
                return True
            return False
        except Exception as e:
            self.log.error(f"Failed to archive context {context_id}: {e}")
            return False
            
    async def list_contexts(self, dir_name: str = "active") -> List[Context]:
        """List contexts in specified directory"""
        try:
            contexts = []
            dir_path = os.path.join(self.base_path, dir_name)
            
            if not os.path.exists(dir_path):
                return []
                
            for filename in os.listdir(dir_path):
                if filename.endswith(".json"):
                    path = os.path.join(dir_path, filename)
                    with open(path) as f:
                        data = json.load(f)
                        contexts.append(Context(
                            id=data['id'],
                            timestamp=datetime.fromisoformat(data['timestamp']),
                            data=data['data'],
                            source=data['source'],
                            privacy_level=data['privacy_level'],
                            metadata=data.get('metadata', {})
                        ))
            return contexts
        except Exception as e:
            self.log.error(f"Failed to list contexts in {dir_name}: {e}")
            return []

class ContextSynthesizer:
    def __init__(self, store: ContextStore):
        self.store = store
        self.log = logging.getLogger("context_synthesizer")
        self.log.addHandler(journal.JournalHandler())
        self.log.setLevel(logging.INFO)
        
    async def update(self, context: Context):
        """Update synthesized contexts with new context"""
        try:
            # Get existing contexts
            active_contexts = await self.store.list_contexts("active")
            
            # Find related contexts
            related = self._find_related_contexts(context, active_contexts)
            
            if related:
                # Synthesize new context
                synthesized = self._synthesize_contexts([context] + related)
                
                # Store synthesized context
                synthesized.metadata["synthesized"] = True
                await self.store.save(synthesized)
                
                self.log.info(f"Synthesized new context from {len(related) + 1} contexts")
        except Exception as e:
            self.log.error(f"Failed to update synthesized contexts: {e}")
            
    def _find_related_contexts(self, context: Context, contexts: List[Context]) -> List[Context]:
        """Find contexts related to given context"""
        related = []
        for other in contexts:
            if other.id != context.id and self._are_contexts_related(context, other):
                related.append(other)
        return related
        
    def _are_contexts_related(self, context1: Context, context2: Context) -> bool:
        """Check if two contexts are related"""
        # Check source relationship
        if context1.source == context2.source:
            return True
            
        # Check data overlap
        common_keys = set(context1.data.keys()) & set(context2.data.keys())
        if len(common_keys) > 0:
            return True
            
        return False
        
    def _synthesize_contexts(self, contexts: List[Context]) -> Context:
        """Synthesize multiple contexts into a new context"""
        # Merge data from all contexts
        merged_data = {}
        for context in contexts:
            self._deep_merge(merged_data, context.data)
            
        return Context(
            id=f"syn_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            timestamp=datetime.now(),
            data=merged_data,
            source="synthesizer",
            privacy_level=max(c.privacy_level for c in contexts),
            metadata={
                "synthesized": True,
                "source_contexts": [c.id for c in contexts]
            }
        )
        
    def _deep_merge(self, target: Dict, source: Dict):
        """Deep merge two dictionaries"""
        for key, value in source.items():
            if key in target and isinstance(target[key], dict) and isinstance(value, dict):
                self._deep_merge(target[key], value)
            else:
                target[key] = value

class PrivacyBoundary:
    def __init__(self):
        self.rules = self._load_rules()
        self.log = logging.getLogger("privacy_boundary")
        self.log.addHandler(journal.JournalHandler())
        self.log.setLevel(logging.INFO)
        
    def _load_rules(self) -> Dict:
        """Load privacy rules from config"""
        try:
            config_path = "/home/jon/.config/cursor/privacy_rules.json"
            if os.path.exists(config_path):
                with open(config_path) as f:
                    return json.load(f)
        except Exception as e:
            self.log.warning(f"Failed to load privacy rules: {e}, using defaults")
            
        # Default rules if config not found
        return {
            'sensitive_patterns': [
                'api_key', 'password', 'token', 'secret',
                'private_key', 'ssh_key', 'auth', 'credential'
            ],
            'protected_paths': [
                '/home/jon/.ssh',
                '/home/jon/.config/cursor/private',
                '/home/jon/.local/share/cursor/private',
                '/home/jon/.gnupg'
            ],
            'sanitization_rules': {
                'api_keys': 'redact',
                'paths': 'relativize',
                'usernames': 'anonymize',
                'emails': 'mask',
                'ips': 'mask_partial'
            },
            'privacy_levels': {
                'public': 0,
                'internal': 1,
                'private': 2,
                'sensitive': 3
            }
        }
        
    def sanitize(self, context: Context) -> Context:
        """Sanitize context according to privacy rules"""
        try:
            sanitized_data = self._sanitize_data(context.data)
            privacy_level = self._determine_privacy_level(context.data)
            
            return Context(
                id=context.id,
                timestamp=context.timestamp,
                data=sanitized_data,
                source=context.source,
                privacy_level=privacy_level,
                metadata={
                    **(context.metadata or {}),
                    'sanitized': True,
                    'original_privacy_level': context.privacy_level
                }
            )
        except Exception as e:
            self.log.error(f"Failed to sanitize context {context.id}: {e}")
            return context
            
    def _sanitize_data(self, data: Dict) -> Dict:
        """Apply sanitization rules to data"""
        if isinstance(data, dict):
            return {k: self._sanitize_data(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [self._sanitize_data(v) for v in data]
        elif isinstance(data, str):
            return self._sanitize_string(data)
        return data
        
    def _sanitize_string(self, value: str) -> str:
        """Sanitize individual string values"""
        # Check for sensitive patterns
        for pattern in self.rules['sensitive_patterns']:
            if pattern in value.lower():
                return '[REDACTED]'
                
        # Apply path sanitization
        for path in self.rules['protected_paths']:
            if path in value:
                return value.replace(path, '[PROTECTED_PATH]')
                
        # Apply email masking
        if '@' in value and '.' in value:
            parts = value.split('@')
            if len(parts) == 2:
                username, domain = parts
                return f"{username[0]}{'*' * (len(username)-2)}{username[-1]}@{domain}"
                
        # Apply IP masking
        if self._is_ip_address(value):
            parts = value.split('.')
            if len(parts) == 4:
                return f"{parts[0]}.{parts[1]}.*.*"
                
        return value
        
    def _is_ip_address(self, value: str) -> bool:
        """Check if string is an IP address"""
        parts = value.split('.')
        if len(parts) != 4:
            return False
            
        try:
            return all(0 <= int(p) <= 255 for p in parts)
        except ValueError:
            return False
            
    def _determine_privacy_level(self, data: Dict) -> str:
        """Determine appropriate privacy level for data"""
        # Count occurrences of sensitive patterns
        sensitive_count = 0
        str_data = json.dumps(data)
        
        for pattern in self.rules['sensitive_patterns']:
            sensitive_count += str_data.lower().count(pattern)
            
        # Determine level based on sensitivity
        if sensitive_count > 5:
            return 'sensitive'
        elif sensitive_count > 2:
            return 'private'
        elif sensitive_count > 0:
            return 'internal'
        return 'public'

class ContextManager:
    def __init__(self):
        self.store = ContextStore()
        self.synthesizer = ContextSynthesizer(self.store)
        self.privacy = PrivacyBoundary()
        self.log = logging.getLogger("context_manager")
        self.log.addHandler(journal.JournalHandler())
        self.log.setLevel(logging.INFO)
        
    async def preserve_context(self, context: Context) -> bool:
        """Preserve context while respecting privacy boundaries"""
        try:
            # Sanitize context
            sanitized = self.privacy.sanitize(context)
            
            # Save sanitized context
            if not await self.store.save(sanitized):
                return False
                
            # Update synthesized patterns
            await self.synthesizer.update(sanitized)
            
            self.log.info(f"Preserved context {context.id}")
            return True
        except Exception as e:
            self.log.error(f"Failed to preserve context {context.id}: {e}")
            return False
            
    async def get_context(self, context_id: str) -> Optional[Context]:
        """Retrieve context by ID"""
        return await self.store.load(context_id)
        
    async def list_contexts(self, source: Optional[str] = None) -> List[Context]:
        """List available contexts, optionally filtered by source"""
        contexts = await self.store.list_contexts()
        if source:
            contexts = [c for c in contexts if c.source == source]
        return contexts
        
    async def archive_context(self, context_id: str) -> bool:
        """Archive a context"""
        return await self.store.archive(context_id)
        
    async def get_synthesized_contexts(self) -> List[Context]:
        """Get all synthesized contexts"""
        return await self.store.list_contexts("synthesized") 