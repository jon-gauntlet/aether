"""Parser for Wapiti DAST findings."""

from typing import Any, Dict, List, Optional

from ..base_parser import BaseParser


class WapitiParser(BaseParser):
    """Parser for Wapiti dynamic analysis findings."""

    def parse(self, content: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse Wapiti JSON output into normalized findings.
        
        Args:
            content: Parsed JSON content from Wapiti output
            
        Returns:
            List of normalized finding dictionaries
        """
        normalized_findings = []
        
        # Get classifications for reference
        classifications = content.get('classifications', {})
        
        # Process each vulnerability type
        for vuln_type, findings in content.get('vulnerabilities', {}).items():
            # Skip empty findings
            if not findings:
                continue
                
            # Get classification info
            classification = classifications.get(vuln_type, {})
            
            # Process each finding
            for finding in findings:
                try:
                    # Create normalized finding
                    normalized = {
                        'id': f"WAPITI-{self.generate_id(finding)}",
                        'title': finding.get('info', vuln_type),
                        'source': {
                            'tool': 'wapiti',
                            'type': 'dast',
                            'original_id': finding.get('id', self.generate_id(finding))
                        },
                        'description': classification.get('desc', ''),
                        'finding_type': self._determine_finding_type(vuln_type, finding),
                        'security_category': self._map_category(vuln_type, finding),
                        'severity': self._determine_severity(finding),
                        'evidence': {
                            'request': finding.get('http_request', ''),
                            'response': '',  # Not available in Wapiti output
                            'reproduction': [
                                f"URL: {finding.get('path', '/')}",
                                f"Method: {finding.get('method', 'GET')}",
                                f"Parameter: {finding.get('parameter', 'N/A')}",
                                f"Curl command: {finding.get('curl_command', 'N/A')}"
                            ]
                        },
                        'remediation': [classification.get('sol', '')],
                        'references': self._get_references(classification.get('ref', {}))
                    }
                    
                    # Add metadata
                    normalized['metadata'] = {
                        'tags': [
                            f"method:{finding.get('method', 'GET').lower()}",
                            f"level:{finding.get('level', 0)}",
                            f"type:{vuln_type}"
                        ]
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

    def _determine_finding_type(self, vuln_type: str, finding: Dict[str, Any]) -> str:
        """Map Wapiti vulnerability to finding type.
        
        Args:
            vuln_type: Type of vulnerability
            finding: Wapiti finding dictionary
            
        Returns:
            Normalized finding type
        """
        type_mapping = {
            'SQL Injection': 'vulnerable_code',
            'Blind SQL Injection': 'vulnerable_code',
            'Cross Site Scripting': 'vulnerable_code',
            'Command execution': 'vulnerable_code',
            'Path Traversal': 'vulnerable_code',
            'CRLF Injection': 'vulnerable_code',
            'XML External Entity': 'vulnerable_code',
            'Backup file': 'insecure_defaults',
            'Weak credentials': 'insecure_defaults',
            'Content Security Policy Configuration': 'misconfiguration',
            'HTTP Secure Headers': 'misconfiguration',
            'HttpOnly Flag cookie': 'misconfiguration',
            'Secure Flag cookie': 'misconfiguration',
            'Cross Site Request Forgery': 'misconfiguration',
            'Htaccess Bypass': 'misconfiguration',
            'Open Redirect': 'misconfiguration',
            'Server Side Request Forgery': 'misconfiguration',
            'Internal Server Error': 'other',
            'Resource consumption': 'other',
            'Fingerprint web technology': 'information_disclosure'
        }
        
        return type_mapping.get(vuln_type, 'other')

    def _map_category(self, vuln_type: str, finding: Dict[str, Any]) -> str:
        """Map Wapiti vulnerability to security category.
        
        Args:
            vuln_type: Type of vulnerability
            finding: Wapiti finding dictionary
            
        Returns:
            Normalized security category
        """
        category_mapping = {
            'SQL Injection': '6. Injection',
            'Blind SQL Injection': '6. Injection',
            'Cross Site Scripting': '7. XSS',
            'Command execution': '6. Injection',
            'Path Traversal': '6. Injection',
            'CRLF Injection': '6. Injection',
            'XML External Entity': '6. Injection',
            'Backup file': '5. Information Disclosure',
            'Weak credentials': '2. Authentication',
            'Content Security Policy Configuration': '8. Security Headers',
            'HTTP Secure Headers': '8. Security Headers',
            'HttpOnly Flag cookie': '3. Session Management',
            'Secure Flag cookie': '3. Session Management',
            'Cross Site Request Forgery': '4. CSRF',
            'Htaccess Bypass': '1. Access Control',
            'Open Redirect': '9. Open Redirect',
            'Server Side Request Forgery': '6. Injection',
            'Internal Server Error': '10. Other',
            'Resource consumption': '10. Other',
            'Fingerprint web technology': '5. Information Disclosure'
        }
        
        return category_mapping.get(vuln_type, '10. Other')

    def _determine_severity(self, finding: Dict[str, Any]) -> Dict[str, Any]:
        """Determine severity based on vulnerability level.
        
        Args:
            finding: Wapiti finding dictionary
            
        Returns:
            Normalized severity dictionary
        """
        # Wapiti levels: 1 (low) to 3 (high)
        level = finding.get('level', 1)
        
        if level >= 3:
            base_severity = 'high'
        elif level == 2:
            base_severity = 'medium'
        else:
            base_severity = 'low'
            
        return self.normalize_severity(base_severity)

    def _get_references(self, refs: Dict[str, str]) -> List[Dict[str, str]]:
        """Convert Wapiti references to normalized format.
        
        Args:
            refs: Dictionary of reference title to URL
            
        Returns:
            List of reference dictionaries
        """
        references = []
        
        for title, url in refs.items():
            references.append({
                'title': title,
                'url': url
            })
            
        return references 