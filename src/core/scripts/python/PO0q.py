import os
import json
from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime

from .manager import Context

@dataclass
class Pattern:
    id: str
    timestamp: datetime
    pattern_type: str
    data: Dict
    confidence: float
    source_contexts: List[str]
    
class PatternStore:
    def __init__(self, base_path: str = "/home/jon/.local/share/cursor/patterns"):
        self.base_path = base_path
        self._ensure_paths()
        
    def _ensure_paths(self):
        """Ensure required directory structure exists"""
        for path in ['code', 'workflow', 'integration']:
            os.makedirs(os.path.join(self.base_path, path), exist_ok=True)
            
    async def store(self, patterns: List[Pattern]) -> bool:
        """Store validated patterns"""
        try:
            for pattern in patterns:
                path = os.path.join(self.base_path, pattern.pattern_type, f"{pattern.id}.json")
                with open(path, 'w') as f:
                    json.dump({
                        'id': pattern.id,
                        'timestamp': pattern.timestamp.isoformat(),
                        'pattern_type': pattern.pattern_type,
                        'data': pattern.data,
                        'confidence': pattern.confidence,
                        'source_contexts': pattern.source_contexts
                    }, f)
            return True
        except Exception:
            return False
            
class PatternValidator:
    def __init__(self):
        self.rules = self._load_validation_rules()
        
    def _load_validation_rules(self) -> Dict:
        """Load pattern validation rules"""
        return {
            'code': {
                'min_occurrences': 2,
                'min_confidence': 0.8,
                'require_tests': True
            },
            'workflow': {
                'min_occurrences': 3,
                'min_confidence': 0.7,
                'require_completion': True
            },
            'integration': {
                'min_occurrences': 2,
                'min_confidence': 0.9,
                'require_success': True
            }
        }
        
    def validate_all(self, patterns: List[Pattern]) -> List[Pattern]:
        """Validate a list of patterns"""
        return [p for p in patterns if self._validate_pattern(p)]
        
    def _validate_pattern(self, pattern: Pattern) -> bool:
        """Validate individual pattern against rules"""
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
        
    def _validate_code_pattern(self, pattern: Pattern) -> bool:
        """Validate code-specific pattern rules"""
        if self.rules['code']['require_tests']:
            return 'tests' in pattern.data
        return True
        
    def _validate_workflow_pattern(self, pattern: Pattern) -> bool:
        """Validate workflow-specific pattern rules"""
        if self.rules['workflow']['require_completion']:
            return pattern.data.get('completion_rate', 0) > 0.8
        return True
        
    def _validate_integration_pattern(self, pattern: Pattern) -> bool:
        """Validate integration-specific pattern rules"""
        if self.rules['integration']['require_success']:
            return pattern.data.get('success_rate', 0) > 0.9
        return True

class PatternLearner:
    def __init__(self):
        self.patterns = PatternStore()
        self.validator = PatternValidator()
        
    def _extract_patterns(self, context: Context) -> List[Pattern]:
        """Extract patterns from context"""
        patterns = []
        
        # Extract code patterns
        if 'code' in context.data:
            patterns.extend(self._extract_code_patterns(context))
            
        # Extract workflow patterns
        if 'workflow' in context.data:
            patterns.extend(self._extract_workflow_patterns(context))
            
        # Extract integration patterns
        if 'integration' in context.data:
            patterns.extend(self._extract_integration_patterns(context))
            
        return patterns
        
    def _extract_code_patterns(self, context: Context) -> List[Pattern]:
        """Extract code-specific patterns"""
        patterns = []
        code_data = context.data['code']
        
        # TODO: Implement code pattern extraction
        # This would analyze code structure, common idioms, etc.
        
        return patterns
        
    def _extract_workflow_patterns(self, context: Context) -> List[Pattern]:
        """Extract workflow-specific patterns"""
        patterns = []
        workflow_data = context.data['workflow']
        
        # TODO: Implement workflow pattern extraction
        # This would analyze task sequences, timing, etc.
        
        return patterns
        
    def _extract_integration_patterns(self, context: Context) -> List[Pattern]:
        """Extract integration-specific patterns"""
        patterns = []
        integration_data = context.data['integration']
        
        # TODO: Implement integration pattern extraction
        # This would analyze tool usage, data flow, etc.
        
        return patterns
        
    async def learn_from_context(self, context: Context) -> bool:
        """Learn patterns from a context"""
        try:
            # Extract patterns
            patterns = self._extract_patterns(context)
            
            # Validate patterns
            valid_patterns = self.validator.validate_all(patterns)
            
            # Store valid patterns
            return await self.patterns.store(valid_patterns)
        except Exception:
            return False 