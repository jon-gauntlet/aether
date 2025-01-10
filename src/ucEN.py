"""Base parser class for security findings ETL."""

import json
import logging
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import jsonschema
import yaml


class BaseParser(ABC):
    """Abstract base class for all security finding parsers."""

    def __init__(self, config: Dict[str, Any], schema_path: str):
        """Initialize the parser with configuration and schema.

        Args:
            config: Parser-specific configuration from parser_configs.yaml
            schema_path: Path to the normalized schema JSON file
        """
        self.config = config
        self.logger = logging.getLogger(self.__class__.__name__)
        
        # Load and validate schema
        with open(schema_path) as f:
            self.schema = json.load(f)
            
        # Set up severity mapping
        self.severity_map = config.get('severity_map', {})
        self.required_fields = set(config.get('required_fields', []))
        self.preserve_fields = set(config.get('preserve_fields', []))

    @abstractmethod
    def parse(self, content: Union[str, Dict]) -> List[Dict[str, Any]]:
        """Parse the source content into a list of normalized findings.
        
        Args:
            content: Raw content from source file (either JSON string or dict)
            
        Returns:
            List of normalized finding dictionaries
        """
        pass

    def load_file(self, file_path: Union[str, Path]) -> Any:
        """Load and parse a findings file.
        
        Args:
            file_path: Path to the findings file
            
        Returns:
            Parsed file content
        """
        file_path = Path(file_path)
        self.logger.info(f"Loading file: {file_path}")
        
        try:
            with open(file_path) as f:
                content = f.read()
                return json.loads(content)
        except json.JSONDecodeError as e:
            self.logger.error(f"Failed to parse JSON from {file_path}: {e}")
            raise
        except Exception as e:
            self.logger.error(f"Failed to load file {file_path}: {e}")
            raise

    def normalize_severity(self, severity: Union[str, int, float]) -> Dict[str, Any]:
        """Normalize the severity value to our schema format.
        
        Args:
            severity: Source severity value
            
        Returns:
            Normalized severity dictionary with level and score
        """
        # Convert to string for mapping lookup
        severity_str = str(severity).lower()
        
        # Get normalized score from mapping
        score = self.severity_map.get(severity_str, 5.0)  # Default to medium if unknown
        
        # Map score to level
        if score >= 9.0:
            level = "Critical"
        elif score >= 7.0:
            level = "High"
        elif score >= 4.0:
            level = "Medium"
        elif score >= 2.0:
            level = "Low"
        else:
            level = "Info"
            
        return {
            "level": level,
            "score": score
        }

    def validate_finding(self, finding: Dict[str, Any]) -> bool:
        """Validate a normalized finding against the schema.
        
        Args:
            finding: Normalized finding dictionary
            
        Returns:
            True if valid, raises ValidationError if not
        """
        try:
            jsonschema.validate(instance=finding, schema=self.schema)
            return True
        except jsonschema.exceptions.ValidationError as e:
            self.logger.error(f"Schema validation failed: {e}")
            raise

    def preserve_source_data(self, finding: Dict[str, Any], source_data: Dict[str, Any]) -> Dict[str, Any]:
        """Preserve specified fields from source data in the normalized finding.
        
        Args:
            finding: Normalized finding dictionary
            source_data: Original source data dictionary
            
        Returns:
            Updated finding with preserved source data
        """
        if not self.preserve_fields:
            return finding
            
        preserved = {}
        for field in self.preserve_fields:
            if field in source_data:
                preserved[field] = source_data[field]
                
        if preserved:
            finding['source_data'] = preserved
            
        return finding

    def check_required_fields(self, data: Dict[str, Any]) -> None:
        """Verify all required fields are present in source data.
        
        Args:
            data: Source data dictionary
            
        Raises:
            ValueError if required fields are missing
        """
        missing = self.required_fields - set(data.keys())
        if missing:
            raise ValueError(f"Missing required fields: {missing}")

    def generate_id(self, finding: Dict[str, Any]) -> str:
        """Generate a unique ID for a finding.
        
        Args:
            finding: Normalized finding dictionary
            
        Returns:
            Unique ID string
        """
        # Use source-provided ID if available
        if 'id' in finding:
            return finding['id']
            
        # Generate ID from hash of key fields
        import hashlib
        id_fields = [
            finding.get('title', ''),
            finding.get('description', ''),
            str(finding.get('evidence', {}))
        ]
        id_string = '|'.join(id_fields)
        return hashlib.sha256(id_string.encode()).hexdigest()[:12] 