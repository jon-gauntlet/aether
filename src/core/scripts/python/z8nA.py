"""Parser for Claude 3.5 Sonnet security findings."""

from typing import Any, Dict, List, Optional

from ..base_parser import BaseParser


class ClaudeParser(BaseParser):
    """Parser for Claude 3.5 Sonnet security findings."""

    def parse(self, content: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Parse Claude findings into normalized format.
        
        Args:
            content: List of findings from Claude
            
        Returns:
            List of normalized finding dictionaries
        """
        normalized_findings = []
        
        for finding in content:
            try:
                self.check_required_fields(finding)
                
                # Create normalized finding
                normalized = {
                    'id': finding['id'],
                    'title': finding['title'],
                    'source': {
                        'tool': 'claude-3.5-sonnet',
                        'type': 'llm',
                        'original_id': finding['id']
                    },
                    'description': finding['description'],
                    'finding_type': self._normalize_finding_type(finding.get('finding_type', 'other')),
                    'security_category': finding['security_category'],
                    'severity': self._normalize_severity(finding['severity']),
                    'evidence': self._normalize_evidence(finding.get('evidence', {})),
                    'remediation': finding.get('remediation', []),
                    'references': self._extract_references(finding)
                }
                
                # Add metadata
                normalized['metadata'] = {
                    'related_findings': finding.get('related_findings', []),
                    'tags': self._generate_tags(finding)
                }
                
                # Preserve source-specific fields
                normalized = self.preserve_source_data(normalized, finding)
                
                # Validate against schema
                self.validate_finding(normalized)
                
                normalized_findings.append(normalized)
                
            except Exception as e:
                self.logger.error(f"Failed to process finding: {e}")
                if not self.config.get('skip_on_error', False):
                    raise
        
        return normalized_findings

    def _normalize_severity(self, severity: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize severity information.
        
        Args:
            severity: Source severity dictionary
            
        Returns:
            Normalized severity dictionary
        """
        level = severity.get('level')
        
        # Get normalized score from mapping
        score = self.severity_map.get(level, 5.0)
        
        return {
            'level': level,
            'score': score,
            'justification': severity.get('justification')
        }

    def _normalize_evidence(self, evidence: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize evidence information.
        
        Args:
            evidence: Source evidence dictionary
            
        Returns:
            Normalized evidence dictionary
        """
        normalized = {}
        
        # Handle file evidence
        if 'file' in evidence:
            normalized['file'] = evidence['file']
        if 'line' in evidence:
            normalized['line'] = evidence['line']
            
        # Handle code evidence
        if 'current_code' in evidence:
            normalized['code'] = evidence['current_code']
            normalized['secure_code'] = evidence.get('secure_code')
            
        # Handle reproduction steps
        if 'reproduction' in evidence:
            normalized['reproduction'] = evidence['reproduction']
        elif 'verification' in evidence:
            normalized['reproduction'] = [evidence['verification']]
            
        # Handle HTTP evidence
        if 'request' in evidence:
            normalized['request'] = evidence['request']
        if 'response' in evidence:
            normalized['response'] = evidence['response']
            
        return normalized

    def _extract_references(self, finding: Dict[str, Any]) -> List[Dict[str, str]]:
        """Extract references from finding.
        
        Args:
            finding: Source finding dictionary
            
        Returns:
            List of reference dictionaries
        """
        references = []
        
        # Extract CWE references from metadata
        if 'metadata' in finding and 'cwe_id' in finding['metadata']:
            for cwe_id in finding['metadata']['cwe_id']:
                references.append({
                    'title': f"CWE-{cwe_id}",
                    'url': f"https://cwe.mitre.org/data/definitions/{cwe_id}.html"
                })
                
        return references

    def _generate_tags(self, finding: Dict[str, Any]) -> List[str]:
        """Generate tags from finding data.
        
        Args:
            finding: Source finding dictionary
            
        Returns:
            List of tag strings
        """
        tags = []
        
        # Add finding type
        if 'finding_type' in finding:
            tags.append(f"type:{finding['finding_type']}")
            
        # Add security category
        if 'security_category' in finding:
            category = finding['security_category'].split('.')[0].strip()
            tags.append(f"category:{category}")
            
        # Add severity
        if 'severity' in finding and 'level' in finding['severity']:
            tags.append(f"severity:{finding['severity']['level'].lower()}")
            
        # Add file type if present
        if 'evidence' in finding and 'file' in finding['evidence']:
            file = finding['evidence']['file']
            if '.' in file:
                ext = file.split('.')[-1]
                tags.append(f"filetype:{ext}")
                
        return tags 

    def _normalize_finding_type(self, finding_type: str) -> str:
        """Normalize finding type to match schema enumeration.
        
        Args:
            finding_type: Source finding type
            
        Returns:
            Normalized finding type
        """
        # Map non-standard types to standard ones
        type_mapping = {
            'missing_configuration': 'misconfiguration',
            'missing_control': 'missing_security_control',
            'information_leak': 'information_disclosure',
            'unsafe_code': 'vulnerable_code',
            'weak_configuration': 'misconfiguration',
            'default_configuration': 'insecure_defaults'
        }
        
        normalized_type = type_mapping.get(finding_type.lower(), finding_type.lower())
        
        # Ensure it's one of the allowed types
        allowed_types = {
            'vulnerable_code',
            'misconfiguration',
            'insecure_defaults',
            'missing_security_control',
            'information_disclosure',
            'other'
        }
        
        return normalized_type if normalized_type in allowed_types else 'other' 