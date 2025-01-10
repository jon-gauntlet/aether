"""Parser for Bearer SAST findings."""

from typing import Any, Dict, List, Optional

from ..base_parser import BaseParser


class BearerParser(BaseParser):
    """Parser for Bearer static analysis findings."""

    def parse(self, content: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse Bearer JSON output into normalized findings.
        
        Args:
            content: Parsed JSON content from Bearer output
            
        Returns:
            List of normalized finding dictionaries
        """
        normalized_findings = []
        
        # Process each finding
        for finding in content.get('low', []) + content.get('medium', []) + content.get('high', []) + content.get('critical', []):
            try:
                self.check_required_fields(finding)
                
                # Create normalized finding
                normalized = {
                    'id': f"BEARER-{finding.get('id', self.generate_id(finding))}",
                    'title': finding.get('title'),
                    'source': {
                        'tool': 'bearer',
                        'type': 'sast',
                        'original_id': finding.get('id')
                    },
                    'description': finding.get('description', ''),
                    'finding_type': self._determine_finding_type(finding),
                    'security_category': self._map_category(finding),
                    'severity': self._determine_severity(finding),
                    'evidence': {
                        'file': finding.get('full_filename'),
                        'line': finding.get('line_number'),
                        'code': finding.get('code_extract'),
                        'reproduction': [
                            f"Location: {finding.get('full_filename')}:{finding.get('line_number')}",
                            f"Rule: {finding.get('id')}"
                        ]
                    },
                    'remediation': self._parse_remediation(finding.get('description', '')),
                    'references': self._extract_references(finding)
                }
                
                # Add metadata
                normalized['metadata'] = {
                    'cwe_id': self._extract_cwe(finding),
                    'tags': finding.get('tags', []),
                    'categories': finding.get('categories', [])
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

    def _determine_finding_type(self, finding: Dict[str, Any]) -> str:
        """Map Bearer finding to finding type.
        
        Args:
            finding: Bearer finding dictionary
            
        Returns:
            Normalized finding type
        """
        # Check categories and tags
        categories = set(finding.get('categories', []))
        tags = set(finding.get('tags', []))
        
        if 'Security' in categories:
            if any(tag in tags for tag in ['HardcodedPassword', 'WeakPassword', 'DefaultCredentials']):
                return 'insecure_defaults'
            elif any(tag in tags for tag in ['SQLInjection', 'CommandInjection', 'XSS']):
                return 'vulnerable_code'
            elif any(tag in tags for tag in ['Misconfiguration', 'Configuration']):
                return 'misconfiguration'
            elif any(tag in tags for tag in ['Disclosure', 'Exposure']):
                return 'information_disclosure'
                
        return 'other'

    def _map_category(self, finding: Dict[str, Any]) -> str:
        """Map Bearer finding to security category.
        
        Args:
            finding: Bearer finding dictionary
            
        Returns:
            Normalized security category
        """
        # Check tags for category mapping
        tags = set(finding.get('tags', []))
        
        if any(tag in tags for tag in ['SQLInjection', 'CommandInjection', 'XSS', 'XXE']):
            return '6. Injection'
        elif any(tag in tags for tag in ['Authentication', 'Password', 'Credentials']):
            return '2. Authentication'
        elif any(tag in tags for tag in ['Session', 'Cookie']):
            return '3. Session Management'
        elif any(tag in tags for tag in ['CSRF']):
            return '4. CSRF'
        elif any(tag in tags for tag in ['Disclosure', 'Exposure', 'Leak']):
            return '5. Information Disclosure'
        elif any(tag in tags for tag in ['AccessControl', 'Authorization']):
            return '3. Access Control'
        elif any(tag in tags for tag in ['Validation', 'Sanitization']):
            return '7. Input Validation'
            
        return '10. Other'

    def _determine_severity(self, finding: Dict[str, Any]) -> Dict[str, Any]:
        """Determine severity based on Bearer's categorization.
        
        Args:
            finding: Bearer finding dictionary
            
        Returns:
            Normalized severity dictionary
        """
        # Check which severity list the finding is in
        for severity in ['critical', 'high', 'medium', 'low']:
            if finding in finding.get(severity, []):
                return self.normalize_severity(severity)
                
        # Fallback to medium if not found
        return self.normalize_severity('medium')

    def _parse_remediation(self, description: str) -> List[str]:
        """Extract remediation steps from description.
        
        Args:
            description: Finding description text
            
        Returns:
            List of remediation steps
        """
        steps = []
        
        # Look for remediation section
        if '## Remediations' in description:
            remediation_text = description.split('## Remediations')[1].split('##')[0]
            
            # Split into steps
            for line in remediation_text.split('\n'):
                line = line.strip()
                if line.startswith('- '):
                    steps.append(line[2:])
                elif line.startswith('* '):
                    steps.append(line[2:])
                    
        if not steps:
            # Fallback to generic remediation
            steps = ['Review and fix according to security best practices']
            
        return steps

    def _extract_references(self, finding: Dict[str, Any]) -> List[Dict[str, str]]:
        """Extract references from finding.
        
        Args:
            finding: Bearer finding dictionary
            
        Returns:
            List of reference dictionaries
        """
        references = []
        
        # Add documentation URL if available
        if finding.get('documentation_url'):
            references.append({
                'title': 'Bearer Documentation',
                'url': finding['documentation_url']
            })
            
        # Extract references from description
        if finding.get('description'):
            desc = finding['description']
            if '## References' in desc:
                ref_section = desc.split('## References')[1].split('##')[0]
                for line in ref_section.split('\n'):
                    line = line.strip()
                    if line.startswith('- [') or line.startswith('* ['):
                        # Parse markdown link
                        title = line[line.find('[')+1:line.find(']')]
                        url = line[line.find('(')+1:line.find(')')]
                        references.append({
                            'title': title,
                            'url': url
                        })
                        
        return references

    def _extract_cwe(self, finding: Dict[str, Any]) -> List[str]:
        """Extract CWE IDs from finding.
        
        Args:
            finding: Bearer finding dictionary
            
        Returns:
            List of CWE IDs
        """
        cwe_ids = []
        
        # Check description for CWE references
        if finding.get('description'):
            desc = finding['description']
            for line in desc.split('\n'):
                if 'CWE-' in line:
                    # Extract CWE ID
                    cwe = line[line.find('CWE-')+4:].split()[0].strip(':]')
                    if cwe.isdigit():
                        cwe_ids.append(cwe)
                        
        return cwe_ids 