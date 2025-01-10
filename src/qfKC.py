"""Base parser class for all finding parsers."""

import hashlib
import json
import logging
from typing import Any, Dict, List, Optional

import jsonschema


class BaseParser:
    """Base class for all finding parsers."""
    
    source_tool = None  # Override in subclasses
    
    def __init__(self, config: Optional[Dict[str, Any]] = None, schema: Optional[Dict[str, Any]] = None):
        """Initialize parser.
        
        Args:
            config: Parser configuration
            schema: Schema for normalized findings
        """
        self.config = config or {}
        self.schema = schema or {}
        self.logger = logging.getLogger(self.__class__.__name__)
        
        # Load severity mappings
        self.severity_map = {
            'critical': 9.0,
            'high': 7.0,
            'medium': 5.0,
            'low': 3.0,
            'info': 1.0
        }
        
    def parse(self, content: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse findings from tool output.
        
        Args:
            content: Parsed JSON content from tool output
            
        Returns:
            List of normalized finding dictionaries
        """
        raise NotImplementedError("Subclasses must implement parse()")
        
    def check_required_fields(self, finding: Dict[str, Any]) -> None:
        """Check that required fields are present in finding.
        
        Args:
            finding: Raw finding dictionary
            
        Raises:
            ValueError: If required fields are missing
        """
        required_fields = self.config.get('required_fields', [])
        missing_fields = []
        
        for field in required_fields:
            if not finding.get(field):
                missing_fields.append(field)
                
        if missing_fields:
            raise ValueError(f"Missing required fields: {', '.join(missing_fields)}")
            
    def normalize_severity(self, severity: str) -> Dict[str, Any]:
        """Normalize severity level to common format.
        
        Args:
            severity: Raw severity string
            
        Returns:
            Normalized severity dictionary
        """
        severity = severity.lower()
        
        return {
            'level': severity.capitalize(),
            'score': self.severity_map.get(severity, 5.0),
            'justification': f"Based on {self.__class__.__name__} severity level: {severity}"
        }
        
    def validate_finding(self, finding: Dict[str, Any]) -> None:
        """Validate finding against schema.
        
        Args:
            finding: Finding dictionary to validate
            
        Raises:
            jsonschema.exceptions.ValidationError: If validation fails
        """
        if self.schema:
            try:
                jsonschema.validate(finding, self.schema)
            except jsonschema.exceptions.ValidationError as e:
                self.logger.error(f"Schema validation failed: {e}")
                raise
            
    def preserve_source_data(self, normalized: Dict[str, Any], original: Dict[str, Any]) -> Dict[str, Any]:
        """Preserve original source data in normalized finding.
        
        Args:
            normalized: Normalized finding dictionary
            original: Original finding dictionary
            
        Returns:
            Updated normalized finding dictionary
        """
        if self.config.get('preserve_source_data', False):
            normalized['source_data'] = original
        return normalized
        
    def generate_id(self, finding: Dict[str, Any]) -> str:
        """Generate unique ID for finding.
        
        Args:
            finding: Finding dictionary
            
        Returns:
            Generated ID string
        """
        # Create deterministic string from finding
        finding_str = json.dumps(finding, sort_keys=True)
        
        # Generate hash
        hash_obj = hashlib.sha256(finding_str.encode())
        return hash_obj.hexdigest()[:8] 