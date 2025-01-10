"""Parser for Burp Suite DAST findings."""

from typing import Any, Dict, List, Optional
import re

from ..base_parser import BaseParser


class BurpSuiteParser(BaseParser):
    """Parser for Burp Suite dynamic analysis findings."""

    def parse(self, content: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse Burp Suite JSON output into normalized findings.
        
        Args:
            content: Parsed JSON content from Burp Suite output
            
        Returns:
            List of normalized finding dictionaries
        """
        normalized_findings = []
        
        # Process each issue
        for issue in content.get('issues', []):
            try:
                # Create normalized finding
                normalized = {
                    'id': f"BURP-{issue.get('serial_number', self.generate_id(issue))}",
                    'title': issue.get('issue_name', ''),
                    'source': {
                        'tool': 'burpsuite',
                        'type': 'dast',
                        'original_id': issue.get('serial_number')
                    },
                    'description': self._clean_html(issue.get('issue_detail', '')),
                    'finding_type': self._determine_finding_type(issue),
                    'security_category': self._map_category(issue),
                    'severity': self._determine_severity(issue),
                    'evidence': self._build_evidence(issue),
                    'remediation': [
                        self._clean_html(issue.get('remediation_detail', ''))
                    ],
                    'references': self._get_references(issue)
                }
                
                # Add metadata
                normalized['metadata'] = {
                    'confidence': self._map_confidence(issue.get('confidence', '')),
                    'host': issue.get('host', {}).get('ip', ''),
                    'path': issue.get('path', ''),
                    'protocol': issue.get('protocol', ''),
                    'tags': self._generate_tags(issue)
                }
                
                # Preserve source-specific fields
                normalized = self.preserve_source_data(normalized, issue)
                
                # Validate against schema
                self.validate_finding(normalized)
                
                normalized_findings.append(normalized)
                
            except Exception as e:
                self.logger.error(f"Failed to process issue: {e}")
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

    def _build_evidence(self, issue: Dict[str, Any]) -> Dict[str, Any]:
        """Build evidence dictionary from issue data.
        
        Args:
            issue: Burp Suite issue dictionary
            
        Returns:
            Evidence dictionary
        """
        evidence = {
            'reproduction': self._get_reproduction_steps(issue)
        }
        
        # Add request/response details
        if issue.get('request_response', []):
            first_interaction = issue['request_response'][0]
            evidence.update({
                'url': first_interaction.get('url', ''),
                'method': first_interaction.get('request_method', ''),
                'request': first_interaction.get('request_data', ''),
                'response': first_interaction.get('response_data', ''),
                'parameter': first_interaction.get('request_param', '')
            })
        
        return evidence

    def _determine_finding_type(self, issue: Dict[str, Any]) -> str:
        """Map Burp Suite issue to finding type.
        
        Args:
            issue: Burp Suite issue dictionary
            
        Returns:
            Normalized finding type
        """
        name = issue.get('issue_name', '').lower()
        desc = issue.get('issue_detail', '').lower()
        
        if any(x in name or x in desc for x in ['xss', 'injection', 'csrf', 'command', 'traversal', 'upload']):
            return 'vulnerable_code'
        elif any(x in name or x in desc for x in ['default', 'sample', 'backup', 'debug', 'test']):
            return 'insecure_defaults'
        elif any(x in name or x in desc for x in ['config', 'header', 'setting', 'policy', 'ssl', 'tls', 'hsts']):
            return 'misconfiguration'
        elif any(x in name or x in desc for x in ['disclosure', 'information', 'version', 'error', 'stack trace']):
            return 'information_disclosure'
            
        return 'other'

    def _map_category(self, issue: Dict[str, Any]) -> str:
        """Map Burp Suite issue to security category.
        
        Args:
            issue: Burp Suite issue dictionary
            
        Returns:
            Normalized security category
        """
        name = issue.get('issue_name', '').lower()
        desc = issue.get('issue_detail', '').lower()
        
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

    def _determine_severity(self, issue: Dict[str, Any]) -> Dict[str, Any]:
        """Determine severity based on issue severity and confidence.
        
        Args:
            issue: Burp Suite issue dictionary
            
        Returns:
            Normalized severity dictionary
        """
        # Map Burp Suite severity levels
        severity_map = {
            'high': 'high',
            'medium': 'medium',
            'low': 'low',
            'information': 'info'
        }
        
        base_severity = severity_map.get(issue.get('severity', '').lower(), 'info')
        confidence = issue.get('confidence', '').lower()
        
        # Adjust based on confidence
        if confidence == 'certain' and base_severity != 'high':
            base_severity = self._increase_severity(base_severity)
        elif confidence in ['tentative', 'firm'] and base_severity != 'low':
            base_severity = self._decrease_severity(base_severity)
            
        return {
            'level': base_severity.capitalize(),
            'score': self._severity_to_score(base_severity),
            'justification': f"Based on Burp Suite severity {issue.get('severity', '')} and confidence {confidence}"
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

    def _increase_severity(self, current: str) -> str:
        """Increase severity level by one step.
        
        Args:
            current: Current severity level
            
        Returns:
            Increased severity level
        """
        severity_order = ['info', 'low', 'medium', 'high', 'critical']
        try:
            current_idx = severity_order.index(current.lower())
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
        severity_order = ['info', 'low', 'medium', 'high', 'critical']
        try:
            current_idx = severity_order.index(current.lower())
            if current_idx > 0:
                return severity_order[current_idx - 1]
        except ValueError:
            pass
        return current

    def _map_confidence(self, confidence: str) -> str:
        """Map Burp Suite confidence level to normalized confidence.
        
        Args:
            confidence: Burp Suite confidence level
            
        Returns:
            Normalized confidence level
        """
        confidence = confidence.lower()
        if confidence == 'certain':
            return 'High'
        elif confidence == 'firm':
            return 'Medium'
        else:
            return 'Low'

    def _get_references(self, issue: Dict[str, Any]) -> List[Dict[str, str]]:
        """Extract references from issue.
        
        Args:
            issue: Burp Suite issue dictionary
            
        Returns:
            List of reference dictionaries
        """
        references = []
        
        # Extract references from vulnerability classification
        if issue.get('vulnerability_classifications'):
            for ref in issue['vulnerability_classifications']:
                references.append({
                    'title': ref.get('name', ''),
                    'url': ref.get('url', '')
                })
        
        # Add references from remediation detail
        remediation_text = self._clean_html(issue.get('remediation_detail', ''))
        urls = re.findall(r'https?://[^\s<>"]+', remediation_text)
        
        for url in urls:
            # Try to create a descriptive title from the URL
            title = url.split('/')[-1].replace('-', ' ').replace('_', ' ').title()
            if 'owasp' in url.lower():
                title = f"OWASP: {title}"
                
            references.append({
                'title': title,
                'url': url.strip()
            })
            
        return references

    def _get_reproduction_steps(self, issue: Dict[str, Any]) -> List[str]:
        """Get reproduction steps from issue data.
        
        Args:
            issue: Burp Suite issue dictionary
            
        Returns:
            List of reproduction steps
        """
        steps = []
        
        # Add issue info
        steps.extend([
            f"Issue: {issue.get('issue_name')}",
            f"Severity: {issue.get('severity', 'Unknown')}",
            f"Confidence: {issue.get('confidence', 'Unknown')}"
        ])
        
        # Add host info
        if issue.get('host'):
            steps.extend([
                f"Host: {issue['host'].get('ip', 'unknown')}",
                f"Protocol: {issue.get('protocol', 'unknown')}"
            ])
        
        # Add request/response info
        if issue.get('request_response', []):
            steps.append("\nRequest/Response Details:")
            for interaction in issue['request_response']:
                steps.extend([
                    f"\nURL: {interaction.get('url', 'N/A')}",
                    f"Method: {interaction.get('request_method', 'N/A')}"
                ])
                
                if interaction.get('request_param'):
                    steps.append(f"Parameter: {interaction['request_param']}")
                    
                if interaction.get('evidence'):
                    steps.append(f"Evidence: {interaction['evidence']}")
        
        return steps

    def _generate_tags(self, issue: Dict[str, Any]) -> List[str]:
        """Generate normalized tags from issue data.
        
        Args:
            issue: Burp Suite issue dictionary
            
        Returns:
            List of tag strings
        """
        tags = [
            f"severity:{issue.get('severity', '').lower()}",
            f"confidence:{self._map_confidence(issue.get('confidence', '')).lower()}"
        ]
        
        # Add protocol tag if available
        if issue.get('protocol'):
            tags.append(f"protocol:{issue['protocol'].lower()}")
            
        # Add host tag if available
        if issue.get('host', {}).get('ip'):
            tags.append(f"host:{issue['host']['ip']}")
            
        return tags 