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
        
        # Extract vulnerability classifications for reference data
        classifications = content.get('classifications', {})
        
        # Process each vulnerability category
        for vuln_type, findings in content.get('vulnerabilities', {}).items():
            # Skip empty findings
            if not findings:
                continue
                
            # Get category info
            category_info = classifications.get(vuln_type, {})
            
            # Process each finding in this category
            for finding in findings:
                try:
                    self.check_required_fields(finding)
                    
                    # Create normalized finding
                    normalized = {
                        'id': f"WAPITI-{self.generate_id(finding)}",
                        'title': vuln_type,
                        'source': {
                            'tool': 'wapiti',
                            'type': 'dast',
                            'original_id': None  # Wapiti doesn't provide individual IDs
                        },
                        'description': category_info.get('desc', ''),
                        'finding_type': self._determine_finding_type(vuln_type),
                        'security_category': self._map_category(vuln_type),
                        'severity': self._determine_severity(finding, vuln_type),
                        'evidence': {
                            'request': finding.get('http_request'),
                            'reproduction': [
                                f"URL: {finding.get('path')}",
                                f"Method: {finding.get('method', 'GET')}",
                                f"Parameter: {finding.get('parameter', '')}",
                                f"Info: {finding.get('info', '')}"
                            ],
                            'curl_command': finding.get('curl_command')
                        },
                        'remediation': category_info.get('sol', '').split('. '),
                        'references': self._extract_references(category_info)
                    }
                    
                    # Add metadata
                    normalized['metadata'] = {
                        'cwe_id': self._extract_cwe(category_info),
                        'tags': [vuln_type]
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

    def _determine_finding_type(self, vuln_type: str) -> str:
        """Map vulnerability type to finding type.
        
        Args:
            vuln_type: Wapiti vulnerability type
            
        Returns:
            Normalized finding type
        """
        type_map = {
            'SQL Injection': 'vulnerable_code',
            'Blind SQL Injection': 'vulnerable_code',
            'Cross Site Scripting': 'vulnerable_code',
            'CRLF Injection': 'vulnerable_code',
            'Command execution': 'vulnerable_code',
            'Path Traversal': 'vulnerable_code',
            'File Handling': 'vulnerable_code',
            'Backup file': 'information_disclosure',
            'Weak credentials': 'insecure_defaults',
            'Content Security Policy Configuration': 'misconfiguration',
            'HTTP Secure Headers': 'misconfiguration',
            'Secure Flag cookie': 'misconfiguration',
            'HttpOnly Flag cookie': 'misconfiguration'
        }
        
        return type_map.get(vuln_type, 'other')

    def _map_category(self, vuln_type: str) -> str:
        """Map Wapiti vulnerability type to security category.
        
        Args:
            vuln_type: Wapiti vulnerability type
            
        Returns:
            Normalized security category
        """
        category_map = {
            'SQL Injection': '6. Injection',
            'Blind SQL Injection': '6. Injection',
            'Cross Site Scripting': '6. Injection',
            'CRLF Injection': '6. Injection',
            'Command execution': '6. Injection',
            'Path Traversal': '6. Injection',
            'Weak credentials': '2. Authentication',
            'Content Security Policy Configuration': '8. Security Headers',
            'HTTP Secure Headers': '8. Security Headers',
            'Secure Flag cookie': '3. Session Management',
            'HttpOnly Flag cookie': '3. Session Management',
            'Backup file': '5. Information Disclosure'
        }
        
        return category_map.get(vuln_type, '10. Other')

    def _determine_severity(self, finding: Dict[str, Any], vuln_type: str) -> Dict[str, Any]:
        """Determine severity based on vulnerability type and context.
        
        Args:
            finding: Raw finding dictionary
            vuln_type: Vulnerability type
            
        Returns:
            Normalized severity dictionary
        """
        # High severity types
        high_severity = {
            'SQL Injection',
            'Blind SQL Injection',
            'Command execution',
            'Path Traversal',
            'Weak credentials'
        }
        
        # Medium severity types
        medium_severity = {
            'Cross Site Scripting',
            'CRLF Injection',
            'File Handling'
        }
        
        if vuln_type in high_severity:
            base_severity = 'high'
        elif vuln_type in medium_severity:
            base_severity = 'medium'
        else:
            base_severity = 'low'
            
        return self.normalize_severity(base_severity)

    def _extract_references(self, category_info: Dict[str, Any]) -> List[Dict[str, str]]:
        """Extract reference links from category info.
        
        Args:
            category_info: Category information dictionary
            
        Returns:
            List of reference dictionaries
        """
        references = []
        for title, url in category_info.get('ref', {}).items():
            references.append({
                'title': title,
                'url': url
            })
        return references

    def _extract_cwe(self, category_info: Dict[str, Any]) -> List[str]:
        """Extract CWE IDs from references.
        
        Args:
            category_info: Category information dictionary
            
        Returns:
            List of CWE IDs
        """
        cwe_ids = []
        for title in category_info.get('ref', {}).keys():
            if 'CWE-' in title:
                # Extract CWE ID from title
                cwe = title.split('CWE-')[1].split(':')[0].strip()
                cwe_ids.append(cwe)
        return cwe_ids 