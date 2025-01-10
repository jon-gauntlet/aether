"""Base parser class for all finding parsers."""

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
        
    def parse(self, content: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse findings from tool output.
        
        Args:
            content: Parsed JSON content from tool output
            
        Returns:
            List of normalized finding dictionaries
        """
        raise NotImplementedError("Subclasses must implement parse()")
        
    def validate_finding(self, finding: Dict[str, Any]) -> None:
        """Validate finding against schema.
        
        Args:
            finding: Finding dictionary to validate
            
        Raises:
            jsonschema.exceptions.ValidationError: If validation fails
        """
        if self.schema:
            jsonschema.validate(finding, self.schema)
            
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
        import hashlib
        import json
        
        # Create deterministic string from finding
        finding_str = json.dumps(finding, sort_keys=True)
        
        # Generate hash
        hash_obj = hashlib.sha256(finding_str.encode())
        return hash_obj.hexdigest()[:8] 