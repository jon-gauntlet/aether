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
        
        # Extract scan metadata
        scan_info = content.get('scan_info', {})
        
        # Process each warning
        for warning in content.get('warnings', []):
            try:
                self.check_required_fields(warning)
                
                # Create normalized finding
                finding = {
                    'id': f"BRAKEMAN-{warning.get('fingerprint', '')[:8]}",
                    'title': warning.get('warning_type'),
                    'source': {
                        'tool': 'brakeman',
                        'type': 'sast',
                        'original_id': warning.get('fingerprint')
                    },
                    'description': warning.get('message'),
                    'finding_type': 'vulnerable_code',
                    'security_category': self._map_category(warning.get('warning_type')),
                    'severity': self._determine_severity(warning),
                    'evidence': {
                        'file': warning.get('file'),
                        'line': warning.get('line'),
                        'code': warning.get('code'),
                        'reproduction': [
                            f"Location: {warning.get('file')}:{warning.get('line')}",
                            f"Vulnerable code: {warning.get('code')}",
                            f"User input: {warning.get('user_input')}"
                        ]
                    },
                    'metadata': {
                        'confidence': warning.get('confidence'),
                        'cwe_id': warning.get('cwe_id', []),
                        'check_name': warning.get('check_name')
                    }
                }
                
                # Add remediation based on warning type
                finding['remediation'] = self._get_remediation(warning.get('warning_type'))
                
                # Preserve source-specific fields
                finding = self.preserve_source_data(finding, warning)
                
                # Validate against schema
                self.validate_finding(finding)
                
                normalized_findings.append(finding)
                
            except Exception as e:
                self.logger.error(f"Failed to process warning: {e}")
                if not self.config.get('skip_on_error', False):
                    raise
        
        return normalized_findings

    def _determine_severity(self, warning: Dict[str, Any]) -> Dict[str, Any]:
        """Determine severity based on warning type and confidence.
        
        Args:
            warning: Raw warning dictionary
            
        Returns:
            Normalized severity dictionary
        """
        # High severity warning types
        high_severity_types = {
            'SQL Injection',
            'Command Injection',
            'Remote Code Execution',
            'Mass Assignment',
            'Authentication'
        }
        
        # Medium severity warning types
        medium_severity_types = {
            'Cross-Site Scripting',
            'Path Traversal',
            'Format Validation',
            'Session Setting'
        }
        
        warning_type = warning.get('warning_type', '')
        confidence = warning.get('confidence', '').lower()
        
        # Determine base severity from warning type
        if warning_type in high_severity_types:
            base_severity = 'high'
        elif warning_type in medium_severity_types:
            base_severity = 'medium'
        else:
            base_severity = 'low'
            
        # Adjust based on confidence
        if confidence == 'high' and base_severity != 'high':
            base_severity = self._increase_severity(base_severity)
        elif confidence == 'low' and base_severity != 'low':
            base_severity = self._decrease_severity(base_severity)
            
        return self.normalize_severity(base_severity)

    def _map_category(self, warning_type: Optional[str]) -> str:
        """Map Brakeman warning type to normalized security category.
        
        Args:
            warning_type: Brakeman warning type string
            
        Returns:
            Normalized security category string
        """
        category_map = {
            'SQL Injection': '6. Injection',
            'Command Injection': '6. Injection',
            'Cross-Site Scripting': '6. Injection',
            'Mass Assignment': '5. User Management',
            'Authentication': '2. Authentication',
            'Session Setting': '3. Session Management',
            'Path Traversal': '6. Injection',
            'Format Validation': '7. Input Validation',
            'Remote Code Execution': '6. Injection'
        }
        
        return category_map.get(warning_type, '10. Other')

    def _get_remediation(self, warning_type: Optional[str]) -> List[str]:
        """Get remediation steps based on warning type.
        
        Args:
            warning_type: Brakeman warning type string
            
        Returns:
            List of remediation step strings
        """
        remediation_map = {
            'SQL Injection': [
                'Use parameterized queries or prepared statements',
                'Apply proper input validation and sanitization',
                'Use ORM methods instead of raw SQL when possible'
            ],
            'Command Injection': [
                'Avoid using system commands with user input',
                'Use built-in library functions instead of shell commands',
                'If shell commands are necessary, strictly validate and escape all inputs'
            ],
            'Cross-Site Scripting': [
                'Use Rails built-in HTML escaping helpers',
                'Avoid using html_safe or raw without proper sanitization',
                'Implement Content Security Policy (CSP) headers'
            ],
            'Mass Assignment': [
                'Use strong_parameters to explicitly permit attributes',
                'Avoid using permit! which bypasses attribute filtering',
                'Regularly audit permitted attributes'
            ]
        }
        
        return remediation_map.get(warning_type, ['Review and fix according to Rails security best practices'])

    def _increase_severity(self, current: str) -> str:
        """Increase severity level by one step.
        
        Args:
            current: Current severity level
            
        Returns:
            Increased severity level
        """
        severity_order = ['low', 'medium', 'high', 'critical']
        try:
            current_idx = severity_order.index(current)
            if current_idx < len(severity_order) - 1:
                return severity_order[current_idx + 1]
        except ValueError:
            pass
        return current

    def _decrease_severity(self, current: str) -> str:
        """Decrease severity level by one step.
        
        Args:
            current: Current severity level
            
        Returns:
            Decreased severity level
        """
        severity_order = ['low', 'medium', 'high', 'critical']
        try:
            current_idx = severity_order.index(current)
            if current_idx > 0:
                return severity_order[current_idx - 1]
        except ValueError:
            pass
        return current 