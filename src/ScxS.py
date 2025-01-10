"""Parser for Wapiti DAST findings."""

from typing import Any, Dict, List, Optional
import re

from ..base_parser import BaseParser


class WapitiParser(BaseParser):
    """Parser for Wapiti dynamic analysis findings."""

    source_tool = 'wapiti'

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
                    # Extract CWE IDs from references
                    cwe_ids = self._extract_cwe_ids(classification.get('ref', {}))
                    
                    # Create normalized finding
                    normalized = {
                        'id': f"WAPITI-{vuln_type.upper().replace(' ', '-')}-{self.generate_id(finding)}",
                        'title': f"{vuln_type}: {finding.get('info', 'No details')}",
                        'source': {
                            'tool': 'wapiti',
                            'type': 'dast',
                            'original_id': finding.get('id', self.generate_id(finding))
                        },
                        'description': self._build_description(classification, finding),
                        'finding_type': self._determine_finding_type(vuln_type, finding),
                        'security_category': self._map_category(vuln_type, finding),
                        'severity': self._determine_severity(finding),
                        'evidence': self._build_evidence(finding),
                        'remediation': self._get_remediation(classification),
                        'references': self._get_references(classification.get('ref', {}))
                    }
                    
                    # Add metadata
                    normalized['metadata'] = {
                        'cwe_ids': cwe_ids,
                        'tags': self._generate_tags(finding, vuln_type),
                        'raw_level': finding.get('level', 0)
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

    def _build_description(self, classification: Dict[str, Any], finding: Dict[str, Any]) -> str:
        """Build comprehensive description from classification and finding info.
        
        Args:
            classification: Vulnerability classification info
            finding: Individual finding instance
            
        Returns:
            Combined description string
        """
        desc_parts = []
        
        # Add classification description
        if classification.get('desc'):
            desc_parts.append(classification['desc'])
            
        # Add specific finding info
        if finding.get('info'):
            desc_parts.append(f"\nSpecific Issue: {finding['info']}")
            
        # Add request details if available
        if finding.get('http_request'):
            desc_parts.append(f"\nRequest Details:\n{finding['http_request']}")
            
        return '\n\n'.join(desc_parts)

    def _build_evidence(self, finding: Dict[str, Any]) -> Dict[str, Any]:
        """Build evidence dictionary from finding data.
        
        Args:
            finding: Wapiti finding dictionary
            
        Returns:
            Evidence dictionary
        """
        return {
            'url': finding.get('path', '/'),
            'method': finding.get('method', 'GET'),
            'parameter': finding.get('parameter', ''),
            'request': finding.get('http_request', ''),
            'reproduction': [
                f"URL: {finding.get('path', '/')}",
                f"Method: {finding.get('method', 'GET')}",
                f"Parameter: {finding.get('parameter', 'N/A')}",
                f"Level: {finding.get('level', 'N/A')}",
                f"Curl command: {finding.get('curl_command', 'N/A')}"
            ]
        }

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
            
        return {
            'level': base_severity.capitalize(),
            'score': float(level),  # Use Wapiti's level as score
            'justification': f"Based on Wapiti's severity level {level}"
        }

    def _get_remediation(self, classification: Dict[str, Any]) -> List[str]:
        """Get remediation steps from classification.
        
        Args:
            classification: Vulnerability classification info
            
        Returns:
            List of remediation steps
        """
        if not classification.get('sol'):
            return ['Review and fix according to security best practices']
            
        # Split solution into steps
        steps = []
        for step in classification['sol'].split('. '):
            step = step.strip()
            if step:
                steps.append(step)
                
        return steps

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

    def _extract_cwe_ids(self, refs: Dict[str, str]) -> List[str]:
        """Extract CWE IDs from reference titles.
        
        Args:
            refs: Dictionary of reference title to URL
            
        Returns:
            List of CWE IDs
        """
        cwe_ids = []
        cwe_pattern = r'CWE-(\d+)'
        
        for title in refs.keys():
            match = re.search(cwe_pattern, title)
            if match:
                cwe_ids.append(match.group(1))
                
        return cwe_ids

    def _generate_tags(self, finding: Dict[str, Any], vuln_type: str) -> List[str]:
        """Generate normalized tags from finding data.
        
        Args:
            finding: Wapiti finding dictionary
            vuln_type: Type of vulnerability
            
        Returns:
            List of tag strings
        """
        tags = [
            f"method:{finding.get('method', 'GET').lower()}",
            f"level:{finding.get('level', 0)}",
            f"type:{vuln_type.lower().replace(' ', '_')}"
        ]
        
        # Add parameter if present
        if finding.get('parameter'):
            tags.append(f"parameter:{finding['parameter']}")
            
        return tags 