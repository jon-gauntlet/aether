"""Parser for Nikto DAST findings."""

from typing import Any, Dict, List, Optional

from ..base_parser import BaseParser


class NiktoParser(BaseParser):
    """Parser for Nikto dynamic analysis findings."""

    def __init__(self, config: Dict[str, Any], schema: Dict[str, Any]):
        """Initialize parser with config.
        
        Args:
            config: Parser configuration dictionary
            schema: Schema for normalized findings
        """
        # Map required fields to actual field names and remove url since it's optional
        if 'required_fields' in config:
            field_mapping = {
                'message': 'msg',
                'uri': 'url'
            }
            config['required_fields'] = [
                field_mapping.get(field, field)
                for field in config['required_fields']
                if field not in ['uri', 'url']  # Make url optional
            ]
            
        super().__init__(config, schema)

    def parse(self, content: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse Nikto JSON output into normalized findings.
        
        Args:
            content: Parsed JSON content from Nikto output
            
        Returns:
            List of normalized finding dictionaries
        """
        normalized_findings = []
        
        # Construct base URL from host and port
        host = content.get('host', 'localhost')
        port = content.get('port', '80')
        base_url = f"http{'s' if port == '443' else ''}://{host}:{port}"
        
        # Process each vulnerability
        for vuln in content.get('vulnerabilities', []):
            try:
                self.check_required_fields(vuln)
                
                # Create normalized finding
                normalized = {
                    'id': f"NIKTO-{vuln.get('id', self.generate_id(vuln))}",
                    'title': vuln.get('msg', ''),
                    'source': {
                        'tool': 'nikto',
                        'type': 'dast',
                        'original_id': str(vuln.get('id'))
                    },
                    'description': vuln.get('msg', ''),
                    'finding_type': self._determine_finding_type(vuln),
                    'security_category': self._map_category(vuln),
                    'severity': self._determine_severity(vuln),
                    'evidence': {
                        'request': vuln.get('request', ''),  # Default to empty string
                        'response': vuln.get('response', ''),  # Default to empty string
                        'reproduction': [
                            f"URL: {base_url}{vuln.get('url', '/')}",
                            f"Method: {vuln.get('method', 'GET')}",
                            f"Port: {port}",
                            f"ID: {vuln.get('id', 'N/A')}"
                        ]
                    },
                    'remediation': self._get_remediation(vuln),
                    'references': self._get_references(vuln)
                }
                
                # Add metadata
                normalized['metadata'] = {
                    'tags': [
                        f"method:{vuln.get('method', 'GET').lower()}",
                        f"port:{port}",
                        f"host:{host}"
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
        message = vuln.get('msg', '').lower()
        
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
        message = vuln.get('msg', '').lower()
        
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
        message = vuln.get('msg', '').lower()
        
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
        message = vuln.get('msg', '').lower()
        
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
        
        # Add reference if available
        if vuln.get('references'):
            references.append({
                'title': 'Reference',
                'url': vuln['references']
            })
            
        # Add OWASP references based on vulnerability type
        message = vuln.get('msg', '').lower()
        
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