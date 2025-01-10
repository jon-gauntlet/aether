"""Parser for Brakeman SAST findings."""

from typing import Any, Dict, List, Optional

from ..base_parser import BaseParser


class BrakemanParser(BaseParser):
    """Parser for Brakeman static analysis findings."""

    def parse(self, content: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse Brakeman JSON output into normalized findings.
        
        Args:
            content: Parsed JSON content from Brakeman output
            
        Returns:
            List of normalized finding dictionaries
        """
        normalized_findings = []
        
        # Process each warning
        for warning in content.get('warnings', []):
            try:
                self.check_required_fields(warning)
                
                # Create normalized finding
                normalized = {
                    'id': f"BRAKEMAN-{self.generate_id(warning)}",
                    'title': warning.get('warning_type'),
                    'source': {
                        'tool': 'brakeman',
                        'type': 'sast',
                        'original_id': str(warning.get('warning_code'))
                    },
                    'description': warning.get('message', ''),
                    'finding_type': self._determine_finding_type(warning),
                    'security_category': self._map_category(warning),
                    'severity': self._determine_severity(warning),
                    'evidence': {
                        'file': warning.get('file'),
                        'line': warning.get('line'),
                        'code': warning.get('code'),
                        'reproduction': [
                            f"Location: {warning.get('file')}:{warning.get('line')}",
                            f"Warning Type: {warning.get('warning_type')}",
                            f"Confidence: {warning.get('confidence')}"
                        ]
                    },
                    'remediation': self._get_remediation(warning),
                    'references': self._get_references(warning)
                }
                
                # Add metadata
                normalized['metadata'] = {
                    'confidence': warning.get('confidence'),
                    'cwe_id': self._get_cwe(warning),
                    'tags': [
                        warning.get('warning_type'),
                        f"confidence-{warning.get('confidence', '').lower()}"
                    ]
                }
                
                # Add user input info if available
                if warning.get('user_input'):
                    normalized['evidence']['user_input'] = warning['user_input']
                    normalized['evidence']['reproduction'].append(
                        f"User Input: {warning['user_input']}"
                    )
                
                # Preserve source-specific fields
                normalized = self.preserve_source_data(normalized, warning)
                
                # Validate against schema
                self.validate_finding(normalized)
                
                normalized_findings.append(normalized)
                
            except Exception as e:
                self.logger.error(f"Failed to process warning: {e}")
                if not self.config.get('skip_on_error', False):
                    raise
        
        return normalized_findings

    def _determine_finding_type(self, warning: Dict[str, Any]) -> str:
        """Map Brakeman warning to finding type.
        
        Args:
            warning: Brakeman warning dictionary
            
        Returns:
            Normalized finding type
        """
        warning_type = warning.get('warning_type', '').lower()
        
        if any(x in warning_type for x in ['sql', 'command', 'injection', 'xss']):
            return 'vulnerable_code'
        elif any(x in warning_type for x in ['csrf', 'forgery']):
            return 'vulnerable_code'
        elif any(x in warning_type for x in ['mass assignment', 'attribute']):
            return 'vulnerable_code'
        elif any(x in warning_type for x in ['default', 'weak', 'hardcoded']):
            return 'insecure_defaults'
        elif any(x in warning_type for x in ['config', 'setting']):
            return 'misconfiguration'
        elif any(x in warning_type for x in ['disclosure', 'information']):
            return 'information_disclosure'
            
        return 'other'

    def _map_category(self, warning: Dict[str, Any]) -> str:
        """Map Brakeman warning to security category.
        
        Args:
            warning: Brakeman warning dictionary
            
        Returns:
            Normalized security category
        """
        warning_type = warning.get('warning_type', '').lower()
        
        if any(x in warning_type for x in ['sql', 'command', 'injection', 'xss']):
            return '6. Injection'
        elif any(x in warning_type for x in ['csrf', 'forgery']):
            return '4. CSRF'
        elif any(x in warning_type for x in ['session', 'cookie']):
            return '3. Session Management'
        elif any(x in warning_type for x in ['auth', 'password']):
            return '2. Authentication'
        elif any(x in warning_type for x in ['mass assignment', 'attribute']):
            return '3. Access Control'
        elif any(x in warning_type for x in ['validation', 'sanitize']):
            return '7. Input Validation'
        elif any(x in warning_type for x in ['disclosure', 'information']):
            return '5. Information Disclosure'
            
        return '10. Other'

    def _determine_severity(self, warning: Dict[str, Any]) -> Dict[str, Any]:
        """Determine severity based on warning type and confidence.
        
        Args:
            warning: Brakeman warning dictionary
            
        Returns:
            Normalized severity dictionary
        """
        warning_type = warning.get('warning_type', '').lower()
        confidence = warning.get('confidence', '').lower()
        
        # High severity warning types
        high_severity = {
            'sql injection',
            'command injection',
            'remote code execution',
            'mass assignment',
            'authentication',
            'session manipulation'
        }
        
        # Medium severity warning types
        medium_severity = {
            'cross-site scripting',
            'csrf',
            'file access',
            'format validation',
            'information disclosure'
        }
        
        # Determine base severity
        if any(x in warning_type for x in high_severity):
            base_severity = 'high'
        elif any(x in warning_type for x in medium_severity):
            base_severity = 'medium'
        else:
            base_severity = 'low'
            
        # Adjust based on confidence
        if confidence == 'high' and base_severity != 'high':
            base_severity = self._increase_severity(base_severity)
        elif confidence == 'low' and base_severity != 'low':
            base_severity = self._decrease_severity(base_severity)
            
        return self.normalize_severity(base_severity)

    def _get_remediation(self, warning: Dict[str, Any]) -> List[str]:
        """Get remediation steps based on warning type.
        
        Args:
            warning: Brakeman warning dictionary
            
        Returns:
            List of remediation steps
        """
        warning_type = warning.get('warning_type', '').lower()
        
        # Common remediation steps by warning type
        remediation_map = {
            'sql injection': [
                'Use parameterized queries or ActiveRecord methods',
                'Avoid string interpolation in SQL queries',
                'Validate and sanitize user input'
            ],
            'command injection': [
                'Use built-in Ruby methods instead of shell commands',
                'If shell commands are necessary, use escape mechanisms',
                'Validate and sanitize user input'
            ],
            'cross-site scripting': [
                'Use Rails built-in XSS protection mechanisms',
                'Use content_tag and other safe helpers',
                'Sanitize user input before display'
            ],
            'csrf': [
                'Ensure protect_from_forgery is enabled',
                'Include CSRF tokens in forms',
                'Use Rails CSRF protection mechanisms'
            ],
            'mass assignment': [
                'Use strong_parameters to whitelist attributes',
                'Define explicit attr_accessible/attr_protected',
                'Review model attributes for sensitive fields'
            ]
        }
        
        # Get specific remediation steps if available
        for key, steps in remediation_map.items():
            if key in warning_type:
                return steps
                
        # Fallback to generic remediation
        return ['Review and fix according to Rails security best practices']

    def _get_references(self, warning: Dict[str, Any]) -> List[Dict[str, str]]:
        """Get references based on warning type.
        
        Args:
            warning: Brakeman warning dictionary
            
        Returns:
            List of reference dictionaries
        """
        warning_type = warning.get('warning_type', '')
        references = []
        
        # Add Rails security guide reference
        references.append({
            'title': 'Ruby on Rails Security Guide',
            'url': 'https://guides.rubyonrails.org/security.html'
        })
        
        # Add OWASP references based on warning type
        if 'SQL' in warning_type:
            references.append({
                'title': 'OWASP SQL Injection',
                'url': 'https://owasp.org/www-community/attacks/SQL_Injection'
            })
        elif 'XSS' in warning_type:
            references.append({
                'title': 'OWASP Cross Site Scripting',
                'url': 'https://owasp.org/www-community/attacks/xss/'
            })
        elif 'CSRF' in warning_type:
            references.append({
                'title': 'OWASP Cross-Site Request Forgery',
                'url': 'https://owasp.org/www-community/attacks/csrf'
            })
            
        return references

    def _get_cwe(self, warning: Dict[str, Any]) -> List[str]:
        """Get CWE IDs based on warning type.
        
        Args:
            warning: Brakeman warning dictionary
            
        Returns:
            List of CWE IDs
        """
        warning_type = warning.get('warning_type', '').lower()
        
        # Map warning types to CWE IDs
        cwe_map = {
            'sql injection': ['89'],
            'command injection': ['77'],
            'cross-site scripting': ['79'],
            'csrf': ['352'],
            'mass assignment': ['915'],
            'file access': ['22'],
            'authentication': ['287'],
            'session manipulation': ['384'],
            'information disclosure': ['200']
        }
        
        # Get CWE IDs for this warning type
        for key, cwe_ids in cwe_map.items():
            if key in warning_type:
                return cwe_ids
                
        return []

    def _increase_severity(self, current: str) -> str:
        """Increase severity level by one step."""
        severity_order = ['low', 'medium', 'high', 'critical']
        try:
            current_idx = severity_order.index(current)
            if current_idx < len(severity_order) - 1:
                return severity_order[current_idx + 1]
        except ValueError:
            pass
        return current

    def _decrease_severity(self, current: str) -> str:
        """Decrease severity level by one step."""
        severity_order = ['low', 'medium', 'high', 'critical']
        try:
            current_idx = severity_order.index(current)
            if current_idx > 0:
                return severity_order[current_idx - 1]
        except ValueError:
            pass
        return current 