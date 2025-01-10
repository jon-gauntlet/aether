"""Parser for OWASP ZAP DAST findings."""

from typing import Any, Dict, List, Optional

from ..base_parser import BaseParser


class ZAPParser(BaseParser):
    """Parser for OWASP ZAP dynamic analysis findings."""

    def parse(self, content: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse ZAP JSON output into normalized findings.
        
        Args:
            content: Parsed JSON content from ZAP output
            
        Returns:
            List of normalized finding dictionaries
        """
        normalized_findings = []
        
        # Process each site
        for site in content.get('site', []):
            alerts = site.get('alerts', [])
            
            # Process each alert
            for alert in alerts:
                try:
                    self.check_required_fields(alert)
                    
                    # Create normalized finding
                    normalized = {
                        'id': f"ZAP-{self.generate_id(alert)}",
                        'title': alert.get('alert'),
                        'source': {
                            'tool': 'zap',
                            'type': 'dast',
                            'original_id': str(alert.get('pluginid'))
                        },
                        'description': alert.get('desc', ''),
                        'finding_type': self._determine_finding_type(alert),
                        'security_category': self._map_category(alert),
                        'severity': self._determine_severity(alert),
                        'evidence': self._build_evidence(alert),
                        'remediation': self._parse_solution(alert.get('solution', '')),
                        'references': self._extract_references(alert)
                    }
                    
                    # Add metadata
                    normalized['metadata'] = {
                        'confidence': alert.get('confidence'),
                        'cwe_id': [str(alert.get('cweid'))] if alert.get('cweid') else [],
                        'wasc_id': [str(alert.get('wascid'))] if alert.get('wascid') else [],
                        'tags': [
                            alert.get('alert'),
                            f"risk-{alert.get('risk', '').lower()}",
                            f"confidence-{alert.get('confidence', '').lower()}"
                        ]
                    }
                    
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

    def _determine_finding_type(self, alert: Dict[str, Any]) -> str:
        """Map ZAP alert to finding type.
        
        Args:
            alert: ZAP alert dictionary
            
        Returns:
            Normalized finding type
        """
        # Extract key information
        name = alert.get('alert', '').lower()
        
        # Vulnerability patterns
        code_patterns = {'injection', 'xss', 'traversal', 'overflow', 'execution'}
        config_patterns = {'header', 'configuration', 'policy', 'setting'}
        info_patterns = {'disclosure', 'information', 'enumeration'}
        
        # Check patterns
        if any(pattern in name for pattern in code_patterns):
            return 'vulnerable_code'
        elif any(pattern in name for pattern in config_patterns):
            return 'misconfiguration'
        elif any(pattern in name for pattern in info_patterns):
            return 'information_disclosure'
            
        return 'other'

    def _map_category(self, alert: Dict[str, Any]) -> str:
        """Map ZAP alert to security category.
        
        Args:
            alert: ZAP alert dictionary
            
        Returns:
            Normalized security category
        """
        # Map common CWE IDs to categories
        cwe_category_map = {
            '79': '6. Injection',  # XSS
            '89': '6. Injection',  # SQL Injection
            '200': '5. Information Disclosure',  # Information Disclosure
            '525': '5. Information Disclosure',  # Information Exposure
            '284': '3. Access Control',  # Improper Access Control
            '287': '2. Authentication',  # Improper Authentication
            '522': '8. Security Headers',  # Insufficient Entropy
            '611': '8. Security Headers',  # Improper Restriction
            '693': '7. Protection Mechanism',  # Protection Mechanism Failure
        }
        
        # Try mapping by CWE ID first
        cwe_id = str(alert.get('cweid'))
        if cwe_id in cwe_category_map:
            return cwe_category_map[cwe_id]
            
        # Fall back to name-based mapping
        name = alert.get('alert', '').lower()
        
        if any(x in name for x in ['xss', 'sql', 'injection', 'traversal', 'xxe']):
            return '6. Injection'
        elif any(x in name for x in ['auth', 'password', 'credential']):
            return '2. Authentication'
        elif any(x in name for x in ['session', 'cookie']):
            return '3. Session Management'
        elif 'csrf' in name:
            return '4. CSRF'
        elif any(x in name for x in ['disclosure', 'information']):
            return '5. Information Disclosure'
        elif any(x in name for x in ['header', 'security policy', 'csp']):
            return '8. Security Headers'
            
        return '10. Other'

    def _determine_severity(self, alert: Dict[str, Any]) -> Dict[str, Any]:
        """Determine severity based on ZAP risk and confidence levels.
        
        Args:
            alert: ZAP alert dictionary
            
        Returns:
            Normalized severity dictionary
        """
        # Get base severity from risk level
        risk = alert.get('risk', '').lower()
        confidence = alert.get('confidence', '').lower()
        
        # Map risk to base severity
        if risk == 'high':
            base_severity = 'high'
        elif risk == 'medium':
            base_severity = 'medium'
        elif risk == 'low':
            base_severity = 'low'
        else:
            base_severity = 'info'
            
        # Adjust based on confidence
        if confidence == 'high' and base_severity != 'high':
            base_severity = self._increase_severity(base_severity)
        elif confidence == 'low' and base_severity != 'low':
            base_severity = self._decrease_severity(base_severity)
            
        return self.normalize_severity(base_severity)

    def _build_evidence(self, alert: Dict[str, Any]) -> Dict[str, Any]:
        """Build evidence dictionary from alert data.
        
        Args:
            alert: ZAP alert dictionary
            
        Returns:
            Evidence dictionary
        """
        instances = alert.get('instances', [])
        
        evidence = {
            'reproduction': [
                f"Alert: {alert.get('alert')}",
                f"Risk Level: {alert.get('risk')}",
                f"Confidence: {alert.get('confidence')}"
            ]
        }
        
        if instances:
            # Add details from the first instance
            instance = instances[0]
            evidence.update({
                'request': instance.get('method', '') + ' ' + instance.get('uri', ''),
                'response': instance.get('evidence', '')
            })
            
            # Add parameter info if available
            if instance.get('param'):
                evidence['reproduction'].append(f"Parameter: {instance['param']}")
                
        # Add any attack strings
        if alert.get('attack'):
            evidence['reproduction'].append(f"Attack: {alert['attack']}")
            
        return evidence

    def _parse_solution(self, solution: str) -> List[str]:
        """Parse solution text into list of remediation steps.
        
        Args:
            solution: Solution text from ZAP
            
        Returns:
            List of remediation steps
        """
        if not solution:
            return []
            
        # Split on common delimiters
        steps = []
        for line in solution.split('\n'):
            line = line.strip()
            if line:
                # Split on bullet points
                if line.startswith('* '):
                    steps.extend(s.strip() for s in line[2:].split('* '))
                # Split on numbered lists
                elif any(line.startswith(f"{i}.") for i in range(1, 10)):
                    steps.append(line[2:].strip())
                # Split on periods for plain text
                else:
                    steps.extend(s.strip() for s in line.split('. '))
                    
        return [s for s in steps if s]

    def _extract_references(self, alert: Dict[str, Any]) -> List[Dict[str, str]]:
        """Extract references from alert.
        
        Args:
            alert: ZAP alert dictionary
            
        Returns:
            List of reference dictionaries
        """
        references = []
        
        # Add direct references
        if alert.get('reference'):
            for ref in alert['reference'].split('\n'):
                ref = ref.strip()
                if ref:
                    references.append({
                        'title': ref.split(':', 1)[0] if ':' in ref else ref,
                        'url': ref
                    })
                    
        # Add CWE reference if available
        if alert.get('cweid'):
            references.append({
                'title': f"CWE-{alert['cweid']}",
                'url': f"https://cwe.mitre.org/data/definitions/{alert['cweid']}.html"
            })
            
        # Add WASC reference if available
        if alert.get('wascid'):
            references.append({
                'title': f"WASC-{alert['wascid']}",
                'url': f"http://projects.webappsec.org/w/page/{alert['wascid']}"
            })
            
        return references

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