import os
import json
import logging
from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime
from systemd import journal

from .manager import Context

@dataclass
class Pattern:
    id: str
    timestamp: datetime
    pattern_type: str
    data: Dict
    confidence: float
    source_contexts: List[str]
    metadata: Dict = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}
            
class PatternStore:
    def __init__(self, base_path: str = "/home/jon/.local/share/cursor/patterns"):
        self.base_path = base_path
        self.log = logging.getLogger("pattern_store")
        self.log.addHandler(journal.JournalHandler())
        self.log.setLevel(logging.INFO)
        self._ensure_paths()
        
    def _ensure_paths(self):
        """Ensure required directory structure exists"""
        for path in ['code', 'workflow', 'integration', 'synthesized']:
            os.makedirs(os.path.join(self.base_path, path), exist_ok=True)
            
    async def store(self, patterns: List[Pattern]) -> bool:
        """Store validated patterns"""
        try:
            for pattern in patterns:
                # Determine storage path
                if pattern.metadata.get("synthesized", False):
                    dir_name = "synthesized"
                else:
                    dir_name = pattern.pattern_type
                    
                path = os.path.join(self.base_path, dir_name, f"{pattern.id}.json")
                
                with open(path, 'w') as f:
                    json.dump({
                        'id': pattern.id,
                        'timestamp': pattern.timestamp.isoformat(),
                        'pattern_type': pattern.pattern_type,
                        'data': pattern.data,
                        'confidence': pattern.confidence,
                        'source_contexts': pattern.source_contexts,
                        'metadata': pattern.metadata
                    }, f)
                    
            self.log.info(f"Stored {len(patterns)} patterns")
            return True
        except Exception as e:
            self.log.error(f"Failed to store patterns: {e}")
            return False
            
    async def load(self, pattern_id: str) -> Optional[Pattern]:
        """Load pattern by ID"""
        try:
            # Search in all directories
            for dir_name in ['code', 'workflow', 'integration', 'synthesized']:
                path = os.path.join(self.base_path, dir_name, f"{pattern_id}.json")
                if os.path.exists(path):
                    with open(path) as f:
                        data = json.load(f)
                        return Pattern(
                            id=data['id'],
                            timestamp=datetime.fromisoformat(data['timestamp']),
                            pattern_type=data['pattern_type'],
                            data=data['data'],
                            confidence=data['confidence'],
                            source_contexts=data['source_contexts'],
                            metadata=data.get('metadata', {})
                        )
            return None
        except Exception as e:
            self.log.error(f"Failed to load pattern {pattern_id}: {e}")
            return None
            
    async def list_patterns(self, pattern_type: Optional[str] = None) -> List[Pattern]:
        """List patterns of specified type"""
        try:
            patterns = []
            
            # Determine which directories to search
            if pattern_type:
                dirs = [pattern_type]
            else:
                dirs = ['code', 'workflow', 'integration', 'synthesized']
                
            # Load patterns from each directory
            for dir_name in dirs:
                dir_path = os.path.join(self.base_path, dir_name)
                if not os.path.exists(dir_path):
                    continue
                    
                for filename in os.listdir(dir_path):
                    if filename.endswith(".json"):
                        path = os.path.join(dir_path, filename)
                        with open(path) as f:
                            data = json.load(f)
                            patterns.append(Pattern(
                                id=data['id'],
                                timestamp=datetime.fromisoformat(data['timestamp']),
                                pattern_type=data['pattern_type'],
                                data=data['data'],
                                confidence=data['confidence'],
                                source_contexts=data['source_contexts'],
                                metadata=data.get('metadata', {})
                            ))
                            
            return patterns
        except Exception as e:
            self.log.error(f"Failed to list patterns: {e}")
            return []
            
class PatternValidator:
    def __init__(self):
        self.rules = self._load_validation_rules()
        self.log = logging.getLogger("pattern_validator")
        self.log.addHandler(journal.JournalHandler())
        self.log.setLevel(logging.INFO)
        
    def _load_validation_rules(self) -> Dict:
        """Load pattern validation rules"""
        return {
            'code': {
                'min_occurrences': 2,
                'min_confidence': 0.8,
                'require_tests': True,
                'max_complexity': 0.7
            },
            'workflow': {
                'min_occurrences': 3,
                'min_confidence': 0.7,
                'require_completion': True,
                'max_steps': 10
            },
            'integration': {
                'min_occurrences': 2,
                'min_confidence': 0.9,
                'require_success': True,
                'max_dependencies': 5
            }
        }
        
    def validate_all(self, patterns: List[Pattern]) -> List[Pattern]:
        """Validate a list of patterns"""
        valid_patterns = []
        for pattern in patterns:
            if self._validate_pattern(pattern):
                valid_patterns.append(pattern)
            else:
                self.log.warning(f"Pattern {pattern.id} failed validation")
                
        self.log.info(f"Validated {len(valid_patterns)} of {len(patterns)} patterns")
        return valid_patterns
        
    def _validate_pattern(self, pattern: Pattern) -> bool:
        """Validate individual pattern against rules"""
        try:
            rules = self.rules.get(pattern.pattern_type, {})
            
            # Check confidence threshold
            if pattern.confidence < rules.get('min_confidence', 0.7):
                return False
                
            # Check minimum occurrences
            if len(pattern.source_contexts) < rules.get('min_occurrences', 2):
                return False
                
            # Additional validation based on pattern type
            if pattern.pattern_type == 'code':
                return self._validate_code_pattern(pattern)
            elif pattern.pattern_type == 'workflow':
                return self._validate_workflow_pattern(pattern)
            elif pattern.pattern_type == 'integration':
                return self._validate_integration_pattern(pattern)
                
            return True
        except Exception as e:
            self.log.error(f"Pattern validation error: {e}")
            return False
            
    def _validate_code_pattern(self, pattern: Pattern) -> bool:
        """Validate code-specific pattern rules"""
        rules = self.rules['code']
        
        # Check for tests
        if rules['require_tests'] and 'tests' not in pattern.data:
            return False
            
        # Check complexity
        if pattern.data.get('complexity', 0) > rules['max_complexity']:
            return False
            
        return True
        
    def _validate_workflow_pattern(self, pattern: Pattern) -> bool:
        """Validate workflow-specific pattern rules"""
        rules = self.rules['workflow']
        
        # Check completion status
        if rules['require_completion'] and not pattern.data.get('completed', False):
            return False
            
        # Check number of steps
        if len(pattern.data.get('steps', [])) > rules['max_steps']:
            return False
            
        return True
        
    def _validate_integration_pattern(self, pattern: Pattern) -> bool:
        """Validate integration-specific pattern rules"""
        rules = self.rules['integration']
        
        # Check success status
        if rules['require_success'] and not pattern.data.get('success', False):
            return False
            
        # Check number of dependencies
        if len(pattern.data.get('dependencies', [])) > rules['max_dependencies']:
            return False
            
        return True

class PatternLearner:
    def __init__(self):
        self.store = PatternStore()
        self.validator = PatternValidator()
        self.log = logging.getLogger("pattern_learner")
        self.log.addHandler(journal.JournalHandler())
        self.log.setLevel(logging.INFO)
        
    async def learn_from_context(self, context: Context) -> bool:
        """Learn patterns from context"""
        try:
            # Extract patterns
            patterns = self._extract_patterns(context)
            
            # Validate patterns
            valid_patterns = self.validator.validate_all(patterns)
            
            # Store valid patterns
            if valid_patterns:
                await self.store.store(valid_patterns)
                
            self.log.info(f"Learned {len(valid_patterns)} patterns from context {context.id}")
            return bool(valid_patterns)
        except Exception as e:
            self.log.error(f"Failed to learn from context {context.id}: {e}")
            return False
            
    def _extract_patterns(self, context: Context) -> List[Pattern]:
        """Extract patterns from context"""
        patterns = []
        
        # Extract patterns based on context type
        if context.data.get('type') == 'code':
            patterns.extend(self._extract_code_patterns(context))
        elif context.data.get('type') == 'workflow':
            patterns.extend(self._extract_workflow_patterns(context))
        elif context.data.get('type') == 'integration':
            patterns.extend(self._extract_integration_patterns(context))
            
        return patterns
        
    def _extract_code_patterns(self, context: Context) -> List[Pattern]:
        """Extract code patterns from context"""
        patterns = []
        
        # Extract code patterns
        if 'code' in context.data:
            pattern = Pattern(
                id=f"code_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                timestamp=datetime.now(),
                pattern_type='code',
                data={
                    'code': context.data['code'],
                    'language': context.data.get('language', 'unknown'),
                    'tests': context.data.get('tests', {}),
                    'complexity': context.data.get('complexity', 0.5)
                },
                confidence=0.8,
                source_contexts=[context.id]
            )
            patterns.append(pattern)
            
        return patterns
        
    def _extract_workflow_patterns(self, context: Context) -> List[Pattern]:
        """Extract workflow patterns from context"""
        patterns = []
        
        # Extract workflow patterns
        if 'workflow' in context.data:
            pattern = Pattern(
                id=f"workflow_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                timestamp=datetime.now(),
                pattern_type='workflow',
                data={
                    'steps': context.data['workflow'].get('steps', []),
                    'completed': context.data['workflow'].get('completed', False),
                    'success_rate': context.data['workflow'].get('success_rate', 0.0)
                },
                confidence=0.7,
                source_contexts=[context.id]
            )
            patterns.append(pattern)
            
        return patterns
        
    def _extract_integration_patterns(self, context: Context) -> List[Pattern]:
        """Extract integration patterns from context"""
        patterns = []
        
        # Extract integration patterns
        if 'integration' in context.data:
            pattern = Pattern(
                id=f"integration_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                timestamp=datetime.now(),
                pattern_type='integration',
                data={
                    'components': context.data['integration'].get('components', []),
                    'dependencies': context.data['integration'].get('dependencies', []),
                    'success': context.data['integration'].get('success', False),
                    'error_rate': context.data['integration'].get('error_rate', 0.0)
                },
                confidence=0.9,
                source_contexts=[context.id]
            )
            patterns.append(pattern)
            
        return patterns
        
    async def get_patterns(self, pattern_type: Optional[str] = None) -> List[Pattern]:
        """Get patterns of specified type"""
        return await self.store.list_patterns(pattern_type)
        
    async def synthesize_patterns(self, patterns: List[Pattern]) -> Optional[Pattern]:
        """Synthesize multiple patterns into a new pattern"""
        try:
            if not patterns:
                return None
                
            # Merge pattern data
            merged_data = {}
            for pattern in patterns:
                self._deep_merge(merged_data, pattern.data)
                
            # Create synthesized pattern
            synthesized = Pattern(
                id=f"syn_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                timestamp=datetime.now(),
                pattern_type=patterns[0].pattern_type,
                data=merged_data,
                confidence=sum(p.confidence for p in patterns) / len(patterns),
                source_contexts=list(set().union(*[p.source_contexts for p in patterns])),
                metadata={
                    "synthesized": True,
                    "source_patterns": [p.id for p in patterns]
                }
            )
            
            # Validate and store
            if self.validator.validate_all([synthesized]):
                await self.store.store([synthesized])
                self.log.info(f"Synthesized new pattern from {len(patterns)} patterns")
                return synthesized
                
            return None
        except Exception as e:
            self.log.error(f"Failed to synthesize patterns: {e}")
            return None
            
    def _deep_merge(self, target: Dict, source: Dict):
        """Deep merge two dictionaries"""
        for key, value in source.items():
            if key in target and isinstance(target[key], dict) and isinstance(value, dict):
                self._deep_merge(target[key], value)
            else:
                target[key] = value 