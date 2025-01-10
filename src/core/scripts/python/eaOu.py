"""Parser for Nikto DAST findings."""

from typing import Any, Dict, List, Optional

from ..base_parser import BaseParser


class NiktoParser(BaseParser):
    """Parser for Nikto dynamic analysis findings."""

    def parse(self, content: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse Nikto JSON output into normalized findings.
        
        Args:
            content: Parsed JSON content from Nikto output
            
        Returns:
            List of normalized finding dictionaries
        """
        normalized_findings = []
        
        # Process each vulnerability
        for vuln in content.get('vulnerabilities', []):
            try:
                self.check_required_fields(vuln)
                
                # Create normalized finding
                normalized = {
                    'id': f"NIKTO-{self.generate_id(vuln)}",
                    'title': vuln.get('title', vuln.get('message', '')),
                    'source': {
                        'tool': 'nikto',
                        'type': 'dast',
                        'original_id': str(vuln.get('id'))
                    },
                    'description': vuln.get('description', vuln.get('message', '')),
                    'finding_type': self._determine_finding_type(vuln),
                    'security_category': self._map_category(vuln),
                    'severity': self._determine_severity(vuln),
                    'evidence': {
                        'request': vuln.get('request'),
                        'response': vuln.get('response'),
                        'reproduction': [
                            f"URL: {vuln.get('uri')}",
                            f"Method: {vuln.get('method', 'GET')}",
                            f"Port: {vuln.get('port', '80')}",
                            f"OSVDB: {vuln.get('osvdb', 'N/A')}"
                        ]
                    },
                    'remediation': self._get_remediation(vuln),
                    'references': self._get_references(vuln)
                }
                
                # Add metadata
                normalized['metadata'] = {
                    'osvdb_id': vuln.get('osvdb'),
                    'cwe_id': self._get_cwe(vuln),
                    'tags': [
                        vuln.get('category', '').lower(),
                        f"port-{vuln.get('port', '80')}"
                    ]
                }
                
                # Preserve source-specific fields
                normalized = self.preserve_source_data(normalized, vuln)
                
                # Validate against schema
                self.validate_finding(normalized)
                
                normalized_findings.append(normalized)
                
            except Exception as e:
                self.logger.error(f"Failed to process vulnerability: {e}")
                if not self.config.get('skip_on_error', False):
                    raise
        
        return normalized_findings

    def _determine_finding_type(self, vuln: Dict[str, Any]) -> str:
        """Map Nikto vulnerability to finding type.
        
        Args:
            vuln: Nikto vulnerability dictionary
            
        Returns:
            Normalized finding type
        """
        message = (vuln.get('message', '') + ' ' + vuln.get('description', '')).lower()
        
        if any(x in message for x in ['injection', 'xss', 'csrf']):
            return 'vulnerable_code'
        elif any(x in message for x in ['default', 'sample', 'backup']):
            return 'insecure_defaults'
        elif any(x in message for x in ['config', 'header', 'setting']):
            return 'misconfiguration'
        elif any(x in message for x in ['disclosure', 'information', 'version']):
            return 'information_disclosure'
            
        return 'other'

    def _map_category(self, vuln: Dict[str, Any]) -> str:
        """Map Nikto vulnerability to security category.
        
        Args:
            vuln: Nikto vulnerability dictionary
            
        Returns:
            Normalized security category
        """
        message = (vuln.get('message', '') + ' ' + vuln.get('description', '')).lower()
        
        if any(x in message for x in ['injection', 'xss', 'csrf']):
            return '6. Injection'
        elif any(x in message for x in ['auth', 'login', 'password']):
            return '2. Authentication'
        elif any(x in message for x in ['session', 'cookie']):
            return '3. Session Management'
        elif any(x in message for x in ['csrf']):
            return '4. CSRF'
        elif any(x in message for x in ['disclosure', 'information', 'version']):
            return '5. Information Disclosure'
        elif any(x in message for x in ['header', 'security policy', 'csp']):
            return '8. Security Headers'
            
        return '10. Other'

    def _determine_severity(self, vuln: Dict[str, Any]) -> Dict[str, Any]:
        """Determine severity based on vulnerability characteristics.
        
        Args:
            vuln: Nikto vulnerability dictionary
            
        Returns:
            Normalized severity dictionary
        """
        message = (vuln.get('message', '') + ' ' + vuln.get('description', '')).lower()
        
        # High severity patterns
        high_severity = [
            'sql injection',
            'remote code execution',
            'command injection',
            'authentication bypass',
            'arbitrary file upload'
        ]
        
        # Medium severity patterns
        medium_severity = [
            'cross-site scripting',
            'information disclosure',
            'directory traversal',
            'default credentials',
            'backup files'
        ]
        
        # Determine base severity
        if any(x in message for x in high_severity):
            base_severity = 'high'
        elif any(x in message for x in medium_severity):
            base_severity = 'medium'
        else:
            base_severity = 'low'
            
        return self.normalize_severity(base_severity)

    def _get_remediation(self, vuln: Dict[str, Any]) -> List[str]:
        """Get remediation steps based on vulnerability type.
        
        Args:
            vuln: Nikto vulnerability dictionary
            
        Returns:
            List of remediation steps
        """
        message = (vuln.get('message', '') + ' ' + vuln.get('description', '')).lower()
        
        # Common remediation steps by vulnerability type
        if 'header' in message:
            return [
                'Configure appropriate security headers',
                'Implement secure header policies',
                'Use secure header defaults'
            ]
        elif 'backup' in message or 'sample' in message:
            return [
                'Remove backup and sample files from production',
                'Implement proper file access controls',
                'Regular security audits of exposed files'
            ]
        elif 'version' in message:
            return [
                'Remove or hide version information',
                'Keep software and dependencies up to date',
                'Implement proper information disclosure controls'
            ]
        elif 'directory' in message:
            return [
                'Disable directory listing',
                'Implement proper access controls',
                'Regular security audits of exposed directories'
            ]
            
        # Fallback to generic remediation
        return ['Review and fix according to web security best practices']

    def _get_references(self, vuln: Dict[str, Any]) -> List[Dict[str, str]]:
        """Get references based on vulnerability type.
        
        Args:
            vuln: Nikto vulnerability dictionary
            
        Returns:
            List of reference dictionaries
        """
        references = []
        
        # Add OSVDB reference if available
        if vuln.get('osvdb'):
            references.append({
                'title': f"OSVDB-{vuln['osvdb']}",
                'url': f"http://osvdb.org/show/osvdb/{vuln['osvdb']}"
            })
            
        # Add OWASP references based on vulnerability type
        message = (vuln.get('message', '') + ' ' + vuln.get('description', '')).lower()
        
        if 'sql injection' in message:
            references.append({
                'title': 'OWASP SQL Injection',
                'url': 'https://owasp.org/www-community/attacks/SQL_Injection'
            })
        elif 'xss' in message:
            references.append({
                'title': 'OWASP Cross Site Scripting',
                'url': 'https://owasp.org/www-community/attacks/xss/'
            })
        elif 'directory' in message:
            references.append({
                'title': 'OWASP Directory Traversal',
                'url': 'https://owasp.org/www-community/attacks/Path_Traversal'
            })
            
        return references

    def _get_cwe(self, vuln: Dict[str, Any]) -> List[str]:
        """Get CWE IDs based on vulnerability type.
        
        Args:
            vuln: Nikto vulnerability dictionary
            
        Returns:
            List of CWE IDs
        """
        message = (vuln.get('message', '') + ' ' + vuln.get('description', '')).lower()
        
        # Map vulnerability types to CWE IDs
        cwe_map = {
            'sql injection': ['89'],
            'cross-site scripting': ['79'],
            'directory traversal': ['22'],
            'information disclosure': ['200'],
            'authentication bypass': ['287'],
            'default password': ['521'],
            'backup file': ['530'],
            'security headers': ['693']
        }
        
        # Get CWE IDs for this vulnerability
        cwe_ids = []
        for vuln_type, ids in cwe_map.items():
            if vuln_type in message:
                cwe_ids.extend(ids)
                
        return list(set(cwe_ids)) 