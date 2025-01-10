import os
import json
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime
from systemd import journal
import uuid

from .manager import Context

@dataclass
class Pattern:
    """A learned pattern that can be used for optimization and evolution."""
    id: str
    timestamp: datetime
    pattern_type: str  # 'code', 'workflow', or 'integration'
    data: Dict[str, Any]
    confidence: float
    source_contexts: List[str]
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class LearnerConfig:
    """Configuration for pattern learning."""
    min_confidence: float = 0.7
    max_patterns_per_type: int = 100
    pattern_types: List[str] = field(default_factory=lambda: ['code', 'workflow', 'integration'])
    learning_rate: float = 0.1
    decay_factor: float = 0.95

class PatternLearner:
    """Learns patterns from system behavior and evolution."""
    
    def __init__(self, config: Optional[LearnerConfig] = None):
        self.config = config or LearnerConfig()
        self.patterns: Dict[str, List[Pattern]] = {
            pattern_type: []
            for pattern_type in self.config.pattern_types
        }
    
    async def learn(self, context_data: Dict[str, Any]) -> Optional[Pattern]:
        """Learn a new pattern from context data."""
        pattern_type = self._determine_pattern_type(context_data)
        if not pattern_type:
            return None
            
        # Extract pattern data
        pattern_data = self._extract_pattern_data(context_data, pattern_type)
        if not pattern_data:
            return None
            
        # Calculate confidence
        confidence = self._calculate_confidence(pattern_data, pattern_type)
        if confidence < self.config.min_confidence:
            return None
            
        # Create pattern
        pattern = Pattern(
            id=str(uuid.uuid4()),
            timestamp=datetime.now(),
            pattern_type=pattern_type,
            data=pattern_data,
            confidence=confidence,
            source_contexts=[context_data.get('context_id', 'unknown')],
            metadata={
                'learned': True,
                'learning_timestamp': datetime.now().isoformat()
            }
        )
        
        # Store pattern
        await self._store_pattern(pattern)
        
        return pattern
    
    async def update_pattern(self, pattern: Pattern, new_data: Dict[str, Any]) -> Pattern:
        """Update an existing pattern with new data."""
        # Merge pattern data
        merged_data = self._merge_pattern_data(pattern.data, new_data)
        
        # Recalculate confidence
        confidence = self._calculate_confidence(merged_data, pattern.pattern_type)
        
        # Create updated pattern
        updated = Pattern(
            id=pattern.id,
            timestamp=datetime.now(),
            pattern_type=pattern.pattern_type,
            data=merged_data,
            confidence=confidence,
            source_contexts=pattern.source_contexts,
            metadata={
                **pattern.metadata,
                'updated': True,
                'update_timestamp': datetime.now().isoformat()
            }
        )
        
        # Update stored pattern
        await self._update_stored_pattern(updated)
        
        return updated
    
    def _determine_pattern_type(self, context_data: Dict[str, Any]) -> Optional[str]:
        """Determine the pattern type from context data."""
        if 'code_changes' in context_data or 'code_metrics' in context_data:
            return 'code'
        elif 'workflow_steps' in context_data or 'task_sequence' in context_data:
            return 'workflow'
        elif 'service_dependencies' in context_data or 'api_calls' in context_data:
            return 'integration'
        return None
    
    def _extract_pattern_data(self, context_data: Dict[str, Any], pattern_type: str) -> Dict[str, Any]:
        """Extract relevant data for pattern creation."""
        if pattern_type == 'code':
            return self._extract_code_pattern(context_data)
        elif pattern_type == 'workflow':
            return self._extract_workflow_pattern(context_data)
        elif pattern_type == 'integration':
            return self._extract_integration_pattern(context_data)
        return {}
    
    def _extract_code_pattern(self, context_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract code pattern data."""
        pattern_data = {}
        
        if 'code_metrics' in context_data:
            metrics = context_data['code_metrics']
            pattern_data.update({
                'complexity': metrics.get('complexity', 0.0),
                'coverage': metrics.get('test_coverage', 0.0),
                'dependencies': metrics.get('dependencies', []),
                'tests': metrics.get('test_cases', [])
            })
            
        if 'code_changes' in context_data:
            changes = context_data['code_changes']
            pattern_data.update({
                'files_changed': len(changes.get('files', [])),
                'lines_changed': changes.get('total_lines', 0),
                'commit_message': changes.get('message', '')
            })
            
        return pattern_data
    
    def _extract_workflow_pattern(self, context_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract workflow pattern data."""
        pattern_data = {}
        
        if 'workflow_steps' in context_data:
            steps = context_data['workflow_steps']
            pattern_data.update({
                'steps': steps.get('sequence', []),
                'success_rate': steps.get('success_rate', 0.0),
                'completion_time': steps.get('completion_time', 0)
            })
            
        if 'task_sequence' in context_data:
            sequence = context_data['task_sequence']
            pattern_data.update({
                'task_count': len(sequence),
                'task_types': list(set(t.get('type') for t in sequence)),
                'dependencies': [t.get('depends_on') for t in sequence if 'depends_on' in t]
            })
            
        return pattern_data
    
    def _extract_integration_pattern(self, context_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract integration pattern data."""
        pattern_data = {}
        
        if 'service_dependencies' in context_data:
            deps = context_data['service_dependencies']
            pattern_data.update({
                'dependencies': deps.get('services', []),
                'stability': deps.get('stability_score', 0.0),
                'latency': deps.get('average_latency', 0)
            })
            
        if 'api_calls' in context_data:
            calls = context_data['api_calls']
            pattern_data.update({
                'endpoints': list(set(c.get('endpoint') for c in calls)),
                'success_rate': sum(1 for c in calls if c.get('success', False)) / len(calls),
                'error_types': list(set(c.get('error_type') for c in calls if 'error_type' in c))
            })
            
        return pattern_data
    
    def _calculate_confidence(self, pattern_data: Dict[str, Any], pattern_type: str) -> float:
        """Calculate confidence score for a pattern."""
        if not pattern_data:
            return 0.0
            
        # Base confidence on data completeness
        if pattern_type == 'code':
            required_fields = {'complexity', 'coverage', 'dependencies'}
        elif pattern_type == 'workflow':
            required_fields = {'steps', 'success_rate', 'completion_time'}
        else:  # integration
            required_fields = {'dependencies', 'success_rate', 'stability'}
            
        # Calculate completeness
        completeness = sum(1 for f in required_fields if f in pattern_data) / len(required_fields)
        
        # Calculate quality metrics
        quality = 0.0
        if pattern_type == 'code':
            quality = (
                pattern_data.get('coverage', 0) * 0.4 +
                (1 - pattern_data.get('complexity', 1)) * 0.4 +
                min(len(pattern_data.get('tests', [])) / 5, 1.0) * 0.2
            )
        elif pattern_type == 'workflow':
            quality = (
                pattern_data.get('success_rate', 0) * 0.6 +
                min(1.0, 300 / max(pattern_data.get('completion_time', 300), 1)) * 0.4
            )
        else:  # integration
            quality = (
                pattern_data.get('success_rate', 0) * 0.4 +
                pattern_data.get('stability', 0) * 0.4 +
                min(len(pattern_data.get('dependencies', [])) / 5, 1.0) * 0.2
            )
            
        return (completeness * 0.4 + quality * 0.6) * (1 - self.config.learning_rate)
    
    def _merge_pattern_data(self, old_data: Dict[str, Any], new_data: Dict[str, Any]) -> Dict[str, Any]:
        """Merge old and new pattern data."""
        merged = old_data.copy()
        
        for key, new_value in new_data.items():
            if key not in merged:
                merged[key] = new_value
            else:
                old_value = merged[key]
                if isinstance(old_value, (int, float)) and isinstance(new_value, (int, float)):
                    # Exponential moving average for numerical values
                    merged[key] = old_value * (1 - self.config.learning_rate) + new_value * self.config.learning_rate
                elif isinstance(old_value, list) and isinstance(new_value, list):
                    # Combine lists, keeping unique values
                    merged[key] = list(set(old_value + new_value))
                else:
                    # For other types, prefer new value if confidence is higher
                    merged[key] = new_value
                    
        return merged
    
    async def _store_pattern(self, pattern: Pattern) -> None:
        """Store a new pattern."""
        patterns = self.patterns[pattern.pattern_type]
        patterns.append(pattern)
        
        # Remove old patterns if limit exceeded
        if len(patterns) > self.config.max_patterns_per_type:
            # Sort by confidence and timestamp
            patterns.sort(key=lambda p: (p.confidence, p.timestamp))
            # Remove oldest, lowest confidence patterns
            self.patterns[pattern.pattern_type] = patterns[-self.config.max_patterns_per_type:]
    
    async def _update_stored_pattern(self, pattern: Pattern) -> None:
        """Update a stored pattern."""
        patterns = self.patterns[pattern.pattern_type]
        for i, p in enumerate(patterns):
            if p.id == pattern.id:
                patterns[i] = pattern
                break 