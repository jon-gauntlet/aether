"""Parser for Snyk SAST findings."""

from typing import Any, Dict, List, Optional
import re

from ..base_parser import BaseParser


class SnykParser(BaseParser):
    """Parser for Snyk static analysis findings."""

    def parse(self, content: Any) -> List[Dict[str, Any]]:
        """Parse Snyk JSON output into normalized findings.
        
        Args:
            content: Parsed JSON content from Snyk output
            
        Returns:
            List of normalized finding dictionaries
        """
        normalized_findings = []
        
        # Handle array input
        if isinstance(content, list):
            if content and isinstance(content[0], dict):
                content = content[0]
            else:
                return []
        
        # Process each vulnerability
        for vuln in content.get('vulnerabilities', []):
            try:
                # Create normalized finding
                normalized = {
                    'id': f"SNYK-{vuln.get('id', self.generate_id(vuln))}",
                    'title': vuln.get('title', ''),
                    'source': {
                        'tool': 'snyk',
                        'type': 'sast',
                        'original_id': vuln.get('id')
                    },
                    'description': self._clean_html(vuln.get('description', '')),
                    'finding_type': self._determine_finding_type(vuln),
                    'security_category': self._map_category(vuln),
                    'severity': self._determine_severity(vuln),
                    'evidence': self._build_evidence(vuln),
                    'remediation': [
                        self._clean_html(vuln.get('remediation', {}).get('advice', ''))
                    ],
                    'references': self._get_references(vuln)
                }
                
                # Add metadata
                normalized['metadata'] = {
                    'cwe_ids': self._extract_cwe_ids(vuln),
                    'package': vuln.get('package', ''),
                    'version': vuln.get('version', ''),
                    'fixed_in': vuln.get('fixedIn', ''),
                    'language': vuln.get('language', ''),
                    'tags': self._generate_tags(vuln)
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

    def _clean_html(self, text: str) -> str:
        """Clean HTML tags from text.
        
        Args:
            text: Text containing HTML tags
            
        Returns:
            Cleaned text
        """
        if not text:
            return ''
            
        # Replace common HTML tags with newlines
        text = text.replace('<p>', '\n').replace('</p>', '\n')
        text = text.replace('<br>', '\n').replace('<br/>', '\n')
        text = text.replace('<ul>', '\n').replace('</ul>', '\n')
        text = text.replace('<li>', '- ').replace('</li>', '\n')
        
        # Remove any remaining HTML tags
        text = re.sub(r'<[^>]+>', '', text)
        
        # Clean up whitespace
        text = '\n'.join(line.strip() for line in text.split('\n') if line.strip())
        
        return text

    def _build_evidence(self, vuln: Dict[str, Any]) -> Dict[str, Any]:
        """Build evidence dictionary from vulnerability data.
        
        Args:
            vuln: Snyk vulnerability dictionary
            
        Returns:
            Evidence dictionary
        """
        evidence = {
            'reproduction': self._get_reproduction_steps(vuln)
        }
        
        # Add file location if available
        if vuln.get('from'):
            evidence['file'] = vuln['from'][0]
            
        # Add code snippets if available
        if vuln.get('patches'):
            for patch in vuln['patches']:
                if patch.get('diff'):
                    evidence['code'] = patch['diff']
                    break
                    
        return evidence

    def _determine_finding_type(self, vuln: Dict[str, Any]) -> str:
        """Map Snyk vulnerability to finding type.
        
        Args:
            vuln: Snyk vulnerability dictionary
            
        Returns:
            Normalized finding type
        """
        name = vuln.get('title', '').lower()
        desc = vuln.get('description', '').lower()
        
        if any(x in name or x in desc for x in ['xss', 'injection', 'csrf', 'command', 'traversal', 'upload']):
            return 'vulnerable_code'
        elif any(x in name or x in desc for x in ['default', 'sample', 'backup', 'debug', 'test']):
            return 'insecure_defaults'
        elif any(x in name or x in desc for x in ['config', 'header', 'setting', 'policy', 'ssl', 'tls', 'hsts']):
            return 'misconfiguration'
        elif any(x in name or x in desc for x in ['disclosure', 'information', 'version', 'error', 'stack trace']):
            return 'information_disclosure'
            
        return 'other'

    def _map_category(self, vuln: Dict[str, Any]) -> str:
        """Map Snyk vulnerability to security category.
        
        Args:
            vuln: Snyk vulnerability dictionary
            
        Returns:
            Normalized security category
        """
        name = vuln.get('title', '').lower()
        desc = vuln.get('description', '').lower()
        
        if 'xss' in name or 'cross site scripting' in name:
            return '7. XSS'
        elif any(x in name or x in desc for x in ['sql', 'command', 'code', 'injection', 'traversal']):
            return '6. Injection'
        elif any(x in name or x in desc for x in ['auth', 'login', 'password', 'credential']):
            return '2. Authentication'
        elif any(x in name or x in desc for x in ['session', 'cookie', 'token']):
            return '3. Session Management'
        elif any(x in name or x in desc for x in ['csrf', 'forgery']):
            return '4. CSRF'
        elif any(x in name or x in desc for x in ['disclosure', 'information', 'version', 'error']):
            return '5. Information Disclosure'
        elif any(x in name or x in desc for x in ['header', 'security policy', 'csp', 'hsts', 'ssl', 'tls']):
            return '8. Security Headers'
            
        return '10. Other'

    def _determine_severity(self, vuln: Dict[str, Any]) -> Dict[str, Any]:
        """Determine severity based on vulnerability severity.
        
        Args:
            vuln: Snyk vulnerability dictionary
            
        Returns:
            Normalized severity dictionary
        """
        # Map Snyk severity levels
        severity_map = {
            'critical': 'critical',
            'high': 'high',
            'medium': 'medium',
            'low': 'low'
        }
        
        base_severity = severity_map.get(vuln.get('severity', '').lower(), 'info')
            
        return {
            'level': base_severity.capitalize(),
            'score': self._severity_to_score(base_severity),
            'justification': f"Based on Snyk severity {vuln.get('severity', '')}"
        }

    def _severity_to_score(self, severity: str) -> float:
        """Convert severity level to numeric score.
        
        Args:
            severity: Severity level string
            
        Returns:
            Numeric severity score
        """
        return {
            'critical': 9.0,
            'high': 7.0,
            'medium': 5.0,
            'low': 3.0,
            'info': 1.0
        }.get(severity.lower(), 1.0)

    def _extract_cwe_ids(self, vuln: Dict[str, Any]) -> List[str]:
        """Extract CWE IDs from vulnerability data.
        
        Args:
            vuln: Snyk vulnerability dictionary
            
        Returns:
            List of CWE IDs
        """
        cwe_ids = []
        
        # Extract from identifiers
        if vuln.get('identifiers', {}).get('CWE', []):
            cwe_ids.extend(vuln['identifiers']['CWE'])
            
        # Extract from references
        if vuln.get('references', []):
            for ref in vuln['references']:
                if 'cwe.mitre.org' in ref.get('url', ''):
                    cwe_match = re.search(r'CWE-(\d+)', ref['url'])
                    if cwe_match:
                        cwe_ids.append(f"CWE-{cwe_match.group(1)}")
                        
        return list(set(cwe_ids))  # Remove duplicates

    def _get_references(self, vuln: Dict[str, Any]) -> List[Dict[str, str]]:
        """Extract references from vulnerability.
        
        Args:
            vuln: Snyk vulnerability dictionary
            
        Returns:
            List of reference dictionaries
        """
        references = []
        
        # Add references from references array
        if vuln.get('references', []):
            for ref in vuln['references']:
                references.append({
                    'title': ref.get('title', ''),
                    'url': ref.get('url', '')
                })
        
        # Add CWE references
        for cwe_id in self._extract_cwe_ids(vuln):
            if cwe_id.startswith('CWE-'):
                cwe_num = cwe_id[4:]
                references.append({
                    'title': f"CWE-{cwe_num}",
                    'url': f"https://cwe.mitre.org/data/definitions/{cwe_num}.html"
                })
            
        return references

    def _get_reproduction_steps(self, vuln: Dict[str, Any]) -> List[str]:
        """Get reproduction steps from vulnerability data.
        
        Args:
            vuln: Snyk vulnerability dictionary
            
        Returns:
            List of reproduction steps
        """
        steps = []
        
        # Add vulnerability info
        steps.extend([
            f"Title: {vuln.get('title')}",
            f"Severity: {vuln.get('severity', 'Unknown')}",
            f"Package: {vuln.get('package', 'Unknown')}"
        ])
        
        # Add version info
        if vuln.get('version'):
            steps.append(f"Vulnerable Version: {vuln['version']}")
        if vuln.get('fixedIn'):
            steps.append(f"Fixed in Version: {vuln['fixedIn']}")
            
        # Add file path if available
        if vuln.get('from'):
            steps.append(f"File: {vuln['from'][0]}")
            
        # Add exploit info if available
        if vuln.get('exploit'):
            steps.append("\nExploit Details:")
            steps.append(self._clean_html(vuln['exploit']))
        
        return steps

    def _generate_tags(self, vuln: Dict[str, Any]) -> List[str]:
        """Generate normalized tags from vulnerability data.
        
        Args:
            vuln: Snyk vulnerability dictionary
            
        Returns:
            List of tag strings
        """
        tags = [
            f"severity:{vuln.get('severity', '').lower()}",
            f"package:{vuln.get('package', '').lower()}"
        ]
        
        # Add language tag if available
        if vuln.get('language'):
            tags.append(f"language:{vuln['language'].lower()}")
            
        # Add CWE tags
        for cwe_id in self._extract_cwe_ids(vuln):
            tags.append(f"cwe:{cwe_id}")
            
        return tags 