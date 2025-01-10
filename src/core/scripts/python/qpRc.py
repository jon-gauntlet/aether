"""Parser for Brakeman SAST findings."""

from typing import Any, Dict, List, Optional

from ..base_parser import BaseParser


class BrakemanParser(BaseParser):
    """Parser for Brakeman static analysis findings."""

    source_tool = 'brakeman'

    def parse(self, content: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse Brakeman JSON output into normalized findings.
        
        Args:
            content: Parsed JSON content from Brakeman output
            
        Returns:
            List of normalized finding dictionaries
        """
        normalized_findings = []
        
        # Get scan info for metadata
        scan_info = content.get('scan_info', {})
        
        # Process each warning
        for warning in content.get('warnings', []):
            try:
                # Create normalized finding
                normalized = {
                    'id': f"BRAKEMAN-{warning.get('fingerprint', self.generate_id(warning))}",
                    'title': f"{warning.get('warning_type')}: {warning.get('message', '')}",
                    'source': {
                        'tool': 'brakeman',
                        'type': 'sast',
                        'original_id': warning.get('fingerprint', str(warning.get('warning_code')))
                    },
                    'description': self._build_description(warning),
                    'finding_type': self._determine_finding_type(warning),
                    'security_category': self._map_category(warning),
                    'severity': self._determine_severity(warning),
                    'evidence': self._build_evidence(warning),
                    'remediation': self._get_remediation(warning),
                    'references': self._get_references(warning)
                }
                
                # Add metadata
                normalized['metadata'] = {
                    'confidence': warning.get('confidence'),
                    'cwe_ids': warning.get('cwe_id', []),
                    'warning_code': warning.get('warning_code'),
                    'check_name': warning.get('check_name'),
                    'rails_version': scan_info.get('rails_version'),
                    'ruby_version': scan_info.get('ruby_version'),
                    'brakeman_version': scan_info.get('brakeman_version'),
                    'tags': self._generate_tags(warning)
                }
                
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

    def _build_description(self, warning: Dict[str, Any]) -> str:
        """Build comprehensive description from warning info.
        
        Args:
            warning: Brakeman warning dictionary
            
        Returns:
            Combined description string
        """
        desc_parts = []
        
        # Add main message
        if warning.get('message'):
            desc_parts.append(warning['message'])
            
        # Add location info
        location = warning.get('location', {})
        if location:
            loc_str = f"Location: {location.get('type', 'unknown')} in "
            if location.get('class'):
                loc_str += f"class {location['class']}"
            if location.get('method'):
                loc_str += f", method {location['method']}"
            desc_parts.append(loc_str)
            
        # Add code sample if available
        if warning.get('code'):
            desc_parts.append(f"\nVulnerable Code:\n{warning['code']}")
            
        # Add user input info if available
        if warning.get('user_input'):
            desc_parts.append(f"\nUser Input: {warning['user_input']}")
            
        return '\n\n'.join(desc_parts)

    def _build_evidence(self, warning: Dict[str, Any]) -> Dict[str, Any]:
        """Build evidence dictionary from warning data.
        
        Args:
            warning: Brakeman warning dictionary
            
        Returns:
            Evidence dictionary
        """
        evidence = {
            'file': warning.get('file'),
            'line': warning.get('line'),
            'code': warning.get('code'),
            'reproduction': [
                f"File: {warning.get('file')}",
                f"Line: {warning.get('line')}",
                f"Warning Type: {warning.get('warning_type')}",
                f"Confidence: {warning.get('confidence')}"
            ]
        }
        
        # Add location details
        location = warning.get('location', {})
        if location:
            evidence['location'] = location
            evidence['reproduction'].append(
                f"Location: {location.get('type', 'unknown')} in {location.get('class', 'unknown')}"
                + (f", method {location['method']}" if location.get('method') else "")
            )
        
        # Add user input if available
        if warning.get('user_input'):
            evidence['user_input'] = warning['user_input']
            evidence['reproduction'].append(f"User Input: {warning['user_input']}")
            
        return evidence

    def _determine_finding_type(self, warning: Dict[str, Any]) -> str:
        """Map Brakeman warning to finding type.
        
        Args:
            warning: Brakeman warning dictionary
            
        Returns:
            Normalized finding type
        """
        warning_type = warning.get('warning_type', '').lower()
        check_name = warning.get('check_name', '').lower()
        
        if any(x in warning_type or x in check_name for x in ['sql', 'command', 'injection', 'xss', 'execute']):
            return 'vulnerable_code'
        elif any(x in warning_type or x in check_name for x in ['csrf', 'forgery']):
            return 'vulnerable_code'
        elif any(x in warning_type or x in check_name for x in ['mass assignment', 'permit', 'attribute']):
            return 'vulnerable_code'
        elif any(x in warning_type or x in check_name for x in ['default', 'weak', 'hardcoded']):
            return 'insecure_defaults'
        elif any(x in warning_type or x in check_name for x in ['config', 'setting', 'header']):
            return 'misconfiguration'
        elif any(x in warning_type or x in check_name for x in ['disclosure', 'information', 'fingerprint']):
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
        check_name = warning.get('check_name', '').lower()
        
        if any(x in warning_type or x in check_name for x in ['sql', 'command', 'injection', 'execute']):
            return '6. Injection'
        elif 'xss' in warning_type or 'cross site scripting' in warning_type:
            return '7. XSS'
        elif any(x in warning_type or x in check_name for x in ['csrf', 'forgery']):
            return '4. CSRF'
        elif any(x in warning_type or x in check_name for x in ['session', 'cookie']):
            return '3. Session Management'
        elif any(x in warning_type or x in check_name for x in ['auth', 'password']):
            return '2. Authentication'
        elif any(x in warning_type or x in check_name for x in ['mass assignment', 'permit', 'attribute']):
            return '1. Access Control'
        elif any(x in warning_type or x in check_name for x in ['validation', 'sanitize']):
            return '7. Input Validation'
        elif any(x in warning_type or x in check_name for x in ['disclosure', 'information', 'fingerprint']):
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
        check_name = warning.get('check_name', '').lower()
        confidence = warning.get('confidence', '').lower()
        
        # High severity warning types
        high_severity = {
            'sql injection',
            'command injection',
            'remote code execution',
            'mass assignment',
            'authentication',
            'session manipulation',
            'execute'
        }
        
        # Medium severity warning types
        medium_severity = {
            'cross-site scripting',
            'csrf',
            'file access',
            'format validation',
            'information disclosure',
            'xss'
        }
        
        # Determine base severity
        if any(x in warning_type or x in check_name for x in high_severity):
            base_severity = 'high'
        elif any(x in warning_type or x in check_name for x in medium_severity):
            base_severity = 'medium'
        else:
            base_severity = 'low'
            
        # Adjust based on confidence
        if confidence == 'high' and base_severity != 'high':
            base_severity = self._increase_severity(base_severity)
        elif confidence == 'low' and base_severity != 'low':
            base_severity = self._decrease_severity(base_severity)
            
        return {
            'level': base_severity.capitalize(),
            'score': self._severity_to_score(base_severity),
            'justification': f"Based on warning type '{warning.get('warning_type')}' and confidence level '{confidence}'"
        }

    def _severity_to_score(self, severity: str) -> float:
        """Convert severity level to numeric score.
        
        Args:
            severity: Severity level string
            
        Returns:
            Numeric severity score
        """
        return {
            'high': 8.0,
            'medium': 5.0,
            'low': 2.0
        }.get(severity.lower(), 1.0)

    def _get_remediation(self, warning: Dict[str, Any]) -> List[str]:
        """Get remediation steps based on warning type.
        
        Args:
            warning: Brakeman warning dictionary
            
        Returns:
            List of remediation steps
        """
        warning_type = warning.get('warning_type', '').lower()
        check_name = warning.get('check_name', '').lower()
        
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
            if key in warning_type or key in check_name:
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
        references = []
        
        # Add warning link if available
        if warning.get('link'):
            references.append({
                'title': f"Brakeman: {warning.get('warning_type')}",
                'url': warning['link']
            })
        
        # Add Rails security guide reference
        references.append({
            'title': 'Ruby on Rails Security Guide',
            'url': 'https://guides.rubyonrails.org/security.html'
        })
        
        # Add CWE references
        for cwe_id in warning.get('cwe_id', []):
            references.append({
                'title': f'CWE-{cwe_id}',
                'url': f'https://cwe.mitre.org/data/definitions/{cwe_id}.html'
            })
            
        return references

    def _generate_tags(self, warning: Dict[str, Any]) -> List[str]:
        """Generate normalized tags from warning data.
        
        Args:
            warning: Brakeman warning dictionary
            
        Returns:
            List of tag strings
        """
        tags = [
            warning.get('warning_type', '').lower().replace(' ', '_'),
            f"confidence-{warning.get('confidence', '').lower()}",
            f"check-{warning.get('check_name', '').lower()}"
        ]
        
        # Add location type if available
        location = warning.get('location', {})
        if location and location.get('type'):
            tags.append(f"location-{location['type'].lower()}")
            
        return tags 