from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Set
import uuid

from .learner import Pattern

@dataclass
class ValidationConfig:
    """Configuration for pattern validation."""
    min_confidence: float = 0.7
    max_complexity: float = 0.8
    min_source_contexts: int = 2
    max_age_days: int = 30
    required_fields: Dict[str, Set[str]] = None
    
    def __post_init__(self):
        if self.required_fields is None:
            self.required_fields = {
                'code': {'complexity', 'coverage', 'dependencies'},
                'workflow': {'steps', 'success_rate', 'completion_time'},
                'integration': {'dependencies', 'success_rate', 'stability'}
            }

class PatternValidator:
    """Validates patterns before storage or synthesis."""
    
    def __init__(self, config: Optional[ValidationConfig] = None):
        self.config = config or ValidationConfig()
    
    def validate_pattern(self, pattern: Pattern) -> bool:
        """Validate a pattern against all criteria."""
        try:
            return all([
                self._validate_basic_fields(pattern),
                self._validate_confidence(pattern),
                self._validate_complexity(pattern),
                self._validate_source_contexts(pattern),
                self._validate_age(pattern),
                self._validate_data_fields(pattern),
                self._validate_type_specific(pattern)
            ])
        except Exception:
            return False
    
    def _validate_basic_fields(self, pattern: Pattern) -> bool:
        """Validate basic pattern fields."""
        return all([
            isinstance(pattern.id, str) and len(pattern.id) > 0,
            isinstance(pattern.timestamp, datetime),
            isinstance(pattern.pattern_type, str) and pattern.pattern_type in self.config.required_fields,
            isinstance(pattern.data, dict),
            isinstance(pattern.confidence, (int, float)),
            isinstance(pattern.source_contexts, list),
            isinstance(pattern.metadata, dict)
        ])
    
    def _validate_confidence(self, pattern: Pattern) -> bool:
        """Validate pattern confidence."""
        return (
            0.0 <= pattern.confidence <= 1.0 and
            pattern.confidence >= self.config.min_confidence
        )
    
    def _validate_complexity(self, pattern: Pattern) -> bool:
        """Validate pattern complexity."""
        if pattern.pattern_type == 'code':
            complexity = pattern.data.get('complexity', 0.0)
            return 0.0 <= complexity <= self.config.max_complexity
        return True
    
    def _validate_source_contexts(self, pattern: Pattern) -> bool:
        """Validate pattern source contexts."""
        return (
            len(pattern.source_contexts) >= self.config.min_source_contexts and
            all(isinstance(ctx, str) for ctx in pattern.source_contexts)
        )
    
    def _validate_age(self, pattern: Pattern) -> bool:
        """Validate pattern age."""
        if self.config.max_age_days:
            max_age = datetime.now() - timedelta(days=self.config.max_age_days)
            return pattern.timestamp >= max_age
        return True
    
    def _validate_data_fields(self, pattern: Pattern) -> bool:
        """Validate required data fields are present."""
        required = self.config.required_fields.get(pattern.pattern_type, set())
        return all(field in pattern.data for field in required)
    
    def _validate_type_specific(self, pattern: Pattern) -> bool:
        """Validate type-specific pattern requirements."""
        if pattern.pattern_type == 'code':
            return self._validate_code_pattern(pattern)
        elif pattern.pattern_type == 'workflow':
            return self._validate_workflow_pattern(pattern)
        elif pattern.pattern_type == 'integration':
            return self._validate_integration_pattern(pattern)
        return False
    
    def _validate_code_pattern(self, pattern: Pattern) -> bool:
        """Validate code pattern specifics."""
        data = pattern.data
        return all([
            isinstance(data.get('complexity', 0.0), (int, float)),
            0.0 <= data.get('complexity', 0.0) <= 1.0,
            isinstance(data.get('coverage', 0.0), (int, float)),
            0.0 <= data.get('coverage', 0.0) <= 1.0,
            isinstance(data.get('dependencies', []), list),
            all(isinstance(d, str) for d in data.get('dependencies', [])),
            isinstance(data.get('tests', []), list),
            all(isinstance(t, str) for t in data.get('tests', []))
        ])
    
    def _validate_workflow_pattern(self, pattern: Pattern) -> bool:
        """Validate workflow pattern specifics."""
        data = pattern.data
        return all([
            isinstance(data.get('steps', []), list),
            all(isinstance(s, str) for s in data.get('steps', [])),
            isinstance(data.get('success_rate', 0.0), (int, float)),
            0.0 <= data.get('success_rate', 0.0) <= 1.0,
            isinstance(data.get('completion_time', 0), (int, float)),
            data.get('completion_time', 0) >= 0
        ])
    
    def _validate_integration_pattern(self, pattern: Pattern) -> bool:
        """Validate integration pattern specifics."""
        data = pattern.data
        return all([
            isinstance(data.get('dependencies', []), list),
            all(isinstance(d, str) for d in data.get('dependencies', [])),
            isinstance(data.get('success_rate', 0.0), (int, float)),
            0.0 <= data.get('success_rate', 0.0) <= 1.0,
            isinstance(data.get('stability', 0.0), (int, float)),
            0.0 <= data.get('stability', 0.0) <= 1.0
        ])
    
    def get_validation_errors(self, pattern: Pattern) -> List[str]:
        """Get list of validation errors for a pattern."""
        errors = []
        
        # Check basic fields
        if not self._validate_basic_fields(pattern):
            errors.append("Invalid basic fields")
            
        # Check confidence
        if not self._validate_confidence(pattern):
            errors.append(
                f"Confidence {pattern.confidence} below minimum {self.config.min_confidence}"
            )
            
        # Check complexity
        if not self._validate_complexity(pattern):
            errors.append(
                f"Complexity exceeds maximum {self.config.max_complexity}"
            )
            
        # Check source contexts
        if not self._validate_source_contexts(pattern):
            errors.append(
                f"Insufficient source contexts (minimum {self.config.min_source_contexts})"
            )
            
        # Check age
        if not self._validate_age(pattern):
            errors.append(
                f"Pattern too old (maximum age {self.config.max_age_days} days)"
            )
            
        # Check required fields
        if not self._validate_data_fields(pattern):
            missing = self.config.required_fields[pattern.pattern_type] - set(pattern.data.keys())
            errors.append(f"Missing required fields: {missing}")
            
        # Check type-specific validation
        if not self._validate_type_specific(pattern):
            errors.append(f"Failed {pattern.pattern_type}-specific validation")
            
        return errors 