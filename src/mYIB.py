"""Parser for ZAP DAST findings."""

from typing import Any, Dict, List, Optional
import re

from ..base_parser import BaseParser


class ZAPParser(BaseParser):
    """Parser for ZAP dynamic analysis findings."""

    def parse(self, content: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse ZAP JSON output into normalized findings.
        
        Args:
            content: Parsed JSON content from ZAP output
            
        Returns:
            List of normalized finding dictionaries
        """
        normalized_findings = []
        
        # Get scan info
        scan_info = {
            'program': content.get('@programName', 'ZAP'),
            'version': content.get('@version', 'unknown'),
            'generated': content.get('@generated', 'unknown')
        }
        
        # Process each site
        for site in content.get('site', []):
            # Process each alert
            for alert in site.get('alerts', []):
                try:
                    # Create normalized finding
                    normalized = {
                        'id': f"ZAP-{alert.get('pluginid', self.generate_id(alert))}",
                        'title': alert.get('name', ''),
                        'source': {
                            'tool': 'zap',
                            'type': 'dast',
                            'original_id': alert.get('alertRef', alert.get('pluginid'))
                        },
                        'description': self._clean_html(alert.get('desc', '')),
                        'finding_type': self._determine_finding_type(alert),
                        'security_category': self._map_category(alert),
                        'severity': self._determine_severity(alert),
                        'evidence': self._build_evidence(alert, site),
                        'remediation': [
                            self._clean_html(alert.get('solution', ''))
                        ],
                        'references': self._get_references(alert)
                    }
                    
                    # Add metadata
                    normalized['metadata'] = {
                        'zap_version': scan_info['version'],
                        'scan_date': scan_info['generated'],
                        'plugin_id': alert.get('pluginid'),
                        'alert_ref': alert.get('alertRef'),
                        'cwe_id': alert.get('cweid'),
                        'wasc_id': alert.get('wascid'),
                        'confidence': alert.get('confidence'),
                        'risk_code': alert.get('riskcode'),
                        'source_id': alert.get('sourceid'),
                        'tags': self._generate_tags(alert)
                    }
                    
                    # Add instances if available
                    if alert.get('instances'):
                        normalized['metadata']['instances'] = alert['instances']
                    
                    # Add other info if available
                    if alert.get('otherinfo'):
                        normalized['metadata']['other_info'] = self._clean_html(alert['otherinfo'])
                    
                    # Preserve source-specific fields
                    normalized = self.preserve_source_data(normalized, alert)
                    
                    # Validate against schema
                    self.validate_finding(normalized)
                    
                    normalized_findings.append(normalized)
                    
                except Exception as e:
                    self.logger.error(f"Failed to process alert: {e}")
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

    def _build_evidence(self, alert: Dict[str, Any], site: Dict[str, Any]) -> Dict[str, Any]:
        """Build evidence dictionary from alert data.
        
        Args:
            alert: ZAP alert dictionary
            site: ZAP site dictionary
            
        Returns:
            Evidence dictionary
        """
        evidence = {
            'reproduction': self._get_reproduction_steps(alert, site)
        }
        
        # Add instances details
        if alert.get('instances'):
            instances = []
            for instance in alert['instances']:
                instance_data = {
                    'uri': instance.get('uri'),
                    'method': instance.get('method'),
                    'param': instance.get('param')
                }
                
                # Add attack if available
                if instance.get('attack'):
                    instance_data['attack'] = instance.get('attack')
                    
                # Add evidence if available
                if instance.get('evidence'):
                    instance_data['evidence'] = instance.get('evidence')
                    
                # Add other info if available
                if instance.get('otherinfo'):
                    instance_data['other_info'] = self._clean_html(instance['otherinfo'])
                    
                instances.append(instance_data)
                
            evidence['instances'] = instances
            
            # Use first instance for main evidence fields
            first_instance = alert['instances'][0]
            evidence.update({
                'url': first_instance.get('uri'),
                'method': first_instance.get('method'),
                'parameter': first_instance.get('param'),
                'attack': first_instance.get('attack', ''),
                'proof': first_instance.get('evidence', '')
            })
        
        return evidence

    def _determine_finding_type(self, alert: Dict[str, Any]) -> str:
        """Map ZAP alert to finding type.
        
        Args:
            alert: ZAP alert dictionary
            
        Returns:
            Normalized finding type
        """
        name = alert.get('name', '').lower()
        desc = alert.get('desc', '').lower()
        
        if any(x in name or x in desc for x in ['xss', 'injection', 'csrf', 'command', 'traversal', 'upload']):
            return 'vulnerable_code'
        elif any(x in name or x in desc for x in ['default', 'sample', 'backup', 'debug', 'test']):
            return 'insecure_defaults'
        elif any(x in name or x in desc for x in ['config', 'header', 'setting', 'policy', 'ssl', 'tls', 'hsts']):
            return 'misconfiguration'
        elif any(x in name or x in desc for x in ['disclosure', 'information', 'version', 'error', 'stack trace']):
            return 'information_disclosure'
            
        return 'other'

    def _map_category(self, alert: Dict[str, Any]) -> str:
        """Map ZAP alert to security category.
        
        Args:
            alert: ZAP alert dictionary
            
        Returns:
            Normalized security category
        """
        name = alert.get('name', '').lower()
        desc = alert.get('desc', '').lower()
        
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

    def _determine_severity(self, alert: Dict[str, Any]) -> Dict[str, Any]:
        """Determine severity based on risk code and confidence.
        
        Args:
            alert: ZAP alert dictionary
            
        Returns:
            Normalized severity dictionary
        """
        # ZAP risk codes: 0 (info), 1 (low), 2 (medium), 3 (high)
        risk_code = int(alert.get('riskcode', 0))
        confidence = int(alert.get('confidence', 0))  # 0 (falsePositive), 1 (low), 2 (medium), 3 (high)
        
        # Determine base severity
        if risk_code >= 3:
            base_severity = 'high'
        elif risk_code == 2:
            base_severity = 'medium'
        elif risk_code == 1:
            base_severity = 'low'
        else:
            base_severity = 'info'
            
        # Adjust based on confidence
        if confidence == 3 and base_severity != 'high':  # High confidence
            base_severity = self._increase_severity(base_severity)
        elif confidence <= 1 and base_severity != 'low':  # Low/False Positive confidence
            base_severity = self._decrease_severity(base_severity)
            
        return {
            'level': base_severity.capitalize(),
            'score': self._severity_to_score(base_severity),
            'justification': f"Based on risk code {risk_code} ({alert.get('riskdesc', '')}) and confidence level {confidence}"
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

    def _get_references(self, alert: Dict[str, Any]) -> List[Dict[str, str]]:
        """Extract references from alert.
        
        Args:
            alert: ZAP alert dictionary
            
        Returns:
            List of reference dictionaries
        """
        references = []
        
        # Extract references from reference field
        ref_text = self._clean_html(alert.get('reference', ''))
        
        # Extract URLs using regex
        urls = re.findall(r'https?://[^\s<>"]+', ref_text)
        
        for url in urls:
            # Try to create a descriptive title from the URL
            title = url.split('/')[-1].replace('-', ' ').replace('_', ' ').title()
            if 'owasp' in url.lower():
                title = f"OWASP: {title}"
                
            references.append({
                'title': title,
                'url': url.strip()
            })
            
        # Add CWE reference if available
        if alert.get('cweid') and alert['cweid'] != '-1':
            references.append({
                'title': f"CWE-{alert['cweid']}",
                'url': f"https://cwe.mitre.org/data/definitions/{alert['cweid']}.html"
            })
            
        # Add WASC reference if available
        if alert.get('wascid') and alert['wascid'] != '-1':
            references.append({
                'title': f"WASC-{alert['wascid']}",
                'url': f"http://projects.webappsec.org/w/page/{alert['wascid']}"
            })
            
        return references

    def _get_reproduction_steps(self, alert: Dict[str, Any], site: Dict[str, Any]) -> List[str]:
        """Get reproduction steps from alert instances.
        
        Args:
            alert: ZAP alert dictionary
            site: ZAP site dictionary
            
        Returns:
            List of reproduction steps
        """
        steps = []
        
        # Add alert info
        steps.extend([
            f"Alert: {alert.get('name')}",
            f"Risk Level: {alert.get('riskdesc', 'Unknown')}",
            f"Confidence: {['False Positive', 'Low', 'Medium', 'High'][int(alert.get('confidence', 0))]}"
        ])
        
        # Add site info
        steps.extend([
            f"Target: {site.get('@name', 'unknown')}",
            f"Host: {site.get('@host', 'unknown')}",
            f"Port: {site.get('@port', 'unknown')}",
            f"SSL: {site.get('@ssl', 'false')}"
        ])
        
        # Add instance info if available
        if alert.get('instances'):
            steps.append("\nInstances:")
            for instance in alert['instances']:
                steps.extend([
                    f"\nURL: {instance.get('uri', 'N/A')}",
                    f"Method: {instance.get('method', 'N/A')}"
                ])
                
                if instance.get('param'):
                    steps.append(f"Parameter: {instance['param']}")
                    
                if instance.get('attack'):
                    steps.append(f"Attack: {instance['attack']}")
                    
                if instance.get('evidence'):
                    steps.append(f"Evidence: {instance['evidence']}")
        
        return steps

    def _generate_tags(self, alert: Dict[str, Any]) -> List[str]:
        """Generate normalized tags from alert data.
        
        Args:
            alert: ZAP alert dictionary
            
        Returns:
            List of tag strings
        """
        tags = [
            f"pluginid:{alert.get('pluginid', '')}",
            f"confidence:{alert.get('confidence', '0')}",
            f"risk:{alert.get('riskcode', '0')}"
        ]
        
        # Add CWE tag if available
        if alert.get('cweid') and alert['cweid'] != '-1':
            tags.append(f"cwe:{alert['cweid']}")
            
        # Add WASC tag if available
        if alert.get('wascid') and alert['wascid'] != '-1':
            tags.append(f"wasc:{alert['wascid']}")
            
        return tags 