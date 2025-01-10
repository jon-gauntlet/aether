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
        
        # Track which list each finding came from for severity
        for severity_level in ['low', 'medium', 'high', 'critical', 'warning']:
            for finding in content.get(severity_level, []):
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
                        'severity': self._determine_severity(severity_level),
                        'evidence': {
                            'file': finding.get('filename'),  # Using relative path
                            'line': finding.get('line_number'),
                            'code': finding.get('code_extract'),
                            'reproduction': [
                                f"Location: {finding.get('filename')}:{finding.get('line_number')}",
                                f"Rule: {finding.get('id')}"
                            ]
                        },
                        'remediation': self._parse_remediation(finding.get('description', '')),
                        'references': self._extract_references(finding)
                    }
                    
                    # Add metadata
                    normalized['metadata'] = {
                        'cwe_id': finding.get('cwe_ids', []),
                        'tags': self._generate_tags(finding),
                        'categories': finding.get('category_groups', [])
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
        finding_id = finding.get('id', '').lower()
        
        # Map based on rule ID patterns
        if any(x in finding_id for x in ['password', 'encryption', 'secret']):
            return 'insecure_defaults'
        elif any(x in finding_id for x in ['injection', 'xss', 'csrf']):
            return 'vulnerable_code'
        elif any(x in finding_id for x in ['config', 'setting']):
            return 'misconfiguration'
        elif any(x in finding_id for x in ['leak', 'exposure', 'disclosure']):
            return 'information_disclosure'
            
        return 'other'

    def _map_category(self, finding: Dict[str, Any]) -> str:
        """Map Bearer finding to security category.
        
        Args:
            finding: Bearer finding dictionary
            
        Returns:
            Normalized security category
        """
        # Map based on finding ID and category groups
        finding_id = finding.get('id', '').lower()
        category_groups = set(finding.get('category_groups', []))
        
        if 'PII' in category_groups or 'Personal Data' in category_groups:
            return '5. Information Disclosure'
        elif 'password' in finding_id:
            return '2. Authentication'
        elif 'csrf' in finding_id:
            return '4. CSRF'
        elif 'injection' in finding_id or 'xss' in finding_id:
            return '6. Injection'
        elif 'validation' in finding_id:
            return '7. Input Validation'
            
        return '10. Other'

    def _determine_severity(self, severity_level: str) -> Dict[str, Any]:
        """Determine severity based on Bearer's categorization.
        
        Args:
            severity_level: The severity list the finding came from
            
        Returns:
            Normalized severity dictionary
        """
        # Map warning to medium
        if severity_level == 'warning':
            severity_level = 'medium'
            
        return self.normalize_severity(severity_level)

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
                if line.startswith('- **Do**'):
                    # Clean up the markdown formatting
                    step = line.replace('- **Do**', '').strip()
                    if step:
                        steps.append(step)
                        
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
                    if line.startswith('- ['):
                        # Parse markdown link
                        title = line[line.find('[')+1:line.find(']')]
                        url = line[line.find('(')+1:line.find(')')]
                        references.append({
                            'title': title,
                            'url': url
                        })
                        
        return references

    def _generate_tags(self, finding: Dict[str, Any]) -> List[str]:
        """Generate normalized tags from finding data.
        
        Args:
            finding: Bearer finding dictionary
            
        Returns:
            List of tag strings
        """
        tags = []
        
        # Add category groups as tags
        for group in finding.get('category_groups', []):
            tags.append(f"category:{group.lower()}")
            
        # Add finding ID as tag
        if finding.get('id'):
            tags.append(f"rule:{finding['id']}")
            
        # Add file type if present
        if finding.get('filename'):
            ext = finding['filename'].split('.')[-1]
            tags.append(f"filetype:{ext}")
            
        return tags 