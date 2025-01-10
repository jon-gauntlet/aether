"""Base parser class for security findings."""

import hashlib
import json
import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

import jsonschema


class BaseParser(ABC):
    """Base class for security finding parsers."""

    def __init__(self, config: Dict[str, Any], schema: Dict[str, Any]):
        """Initialize the parser.
        
        Args:
            config: Parser configuration dictionary
            schema: JSON schema for normalized findings
        """
        self.config = config
        self.schema = schema
        self.logger = logging.getLogger(self.__class__.__name__)
        
        # Load severity mappings
        self.severity_map = {
            'critical': 9.0,
            'high': 7.0,
            'medium': 5.0,
            'low': 3.0,
            'info': 1.0
        }

    @abstractmethod
    def parse(self, content: Any) -> List[Dict[str, Any]]:
        """Parse tool output into normalized findings.
        
        Args:
            content: Tool output content
            
        Returns:
            List of normalized finding dictionaries
        """
        pass

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
            'level': severity,
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
        try:
            jsonschema.validate(finding, self.schema)
        except jsonschema.exceptions.ValidationError as e:
            self.logger.error(f"Schema validation failed: {e}")
            raise

    def preserve_source_data(self, normalized: Dict[str, Any], original: Dict[str, Any]) -> Dict[str, Any]:
        """Preserve source-specific fields in normalized finding.
        
        Args:
            normalized: Normalized finding dictionary
            original: Original finding dictionary
            
        Returns:
            Updated normalized finding dictionary
        """
        # Get fields to preserve from config
        preserve_fields = self.config.get('preserve_fields', [])
        
        # Add source data if fields should be preserved
        if preserve_fields:
            source_data = {}
            for field in preserve_fields:
                if field in original:
                    source_data[field] = original[field]
                    
            if source_data:
                normalized['source_data'] = source_data
                
        return normalized

    def generate_id(self, finding: Dict[str, Any]) -> str:
        """Generate unique ID for finding.
        
        Args:
            finding: Finding dictionary
            
        Returns:
            Unique ID string
        """
        # Convert finding to string and hash
        finding_str = json.dumps(finding, sort_keys=True)
        return hashlib.sha256(finding_str.encode()).hexdigest()[:8] 