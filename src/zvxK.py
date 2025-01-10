"""Parser for ZAP DAST findings."""

from typing import Any, Dict, List, Optional

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
                        'description': alert.get('desc', '').replace('<p>', '').replace('</p>', '\n').strip(),
                        'finding_type': self._determine_finding_type(alert),
                        'security_category': self._map_category(alert),
                        'severity': self._determine_severity(alert),
                        'evidence': {
                            'request': '',  # Not available in ZAP output
                            'response': '',  # Not available in ZAP output
                            'reproduction': self._get_reproduction_steps(alert, site)
                        },
                        'remediation': [
                            alert.get('solution', '').replace('<p>', '').replace('</p>', '\n').strip()
                        ],
                        'references': self._get_references(alert)
                    }
                    
                    # Add metadata
                    normalized['metadata'] = {
                        'tags': [
                            f"confidence:{alert.get('confidence', '0')}",
                            f"pluginid:{alert.get('pluginid', '')}",
                            f"cweid:{alert.get('cweid', '')}"
                        ]
                    }
                    
                    # Add instances if available
                    if alert.get('instances'):
                        normalized['metadata']['instances'] = alert['instances']
                    
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
        name = alert.get('name', '').lower()
        desc = alert.get('desc', '').lower()
        
        if any(x in name or x in desc for x in ['xss', 'injection', 'csrf', 'command']):
            return 'vulnerable_code'
        elif any(x in name or x in desc for x in ['default', 'sample', 'backup']):
            return 'insecure_defaults'
        elif any(x in name or x in desc for x in ['config', 'header', 'setting', 'policy']):
            return 'misconfiguration'
        elif any(x in name or x in desc for x in ['disclosure', 'information', 'version']):
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
        
        if any(x in name or x in desc for x in ['xss', 'injection', 'command']):
            return '6. Injection'
        elif any(x in name or x in desc for x in ['auth', 'login', 'password']):
            return '2. Authentication'
        elif any(x in name or x in desc for x in ['session', 'cookie']):
            return '3. Session Management'
        elif any(x in name or x in desc for x in ['csrf']):
            return '4. CSRF'
        elif any(x in name or x in desc for x in ['disclosure', 'information', 'version']):
            return '5. Information Disclosure'
        elif any(x in name or x in desc for x in ['header', 'security policy', 'csp']):
            return '8. Security Headers'
            
        return '10. Other'

    def _determine_severity(self, alert: Dict[str, Any]) -> Dict[str, Any]:
        """Determine severity based on risk code.
        
        Args:
            alert: ZAP alert dictionary
            
        Returns:
            Normalized severity dictionary
        """
        # ZAP risk codes: 0 (info), 1 (low), 2 (medium), 3 (high)
        risk_code = int(alert.get('riskcode', 0))
        
        if risk_code >= 3:
            base_severity = 'high'
        elif risk_code == 2:
            base_severity = 'medium'
        elif risk_code == 1:
            base_severity = 'low'
        else:
            base_severity = 'info'
            
        return self.normalize_severity(base_severity)

    def _get_references(self, alert: Dict[str, Any]) -> List[Dict[str, str]]:
        """Extract references from alert.
        
        Args:
            alert: ZAP alert dictionary
            
        Returns:
            List of reference dictionaries
        """
        references = []
        
        # Extract references from reference field
        ref_text = alert.get('reference', '').replace('<p>', '').replace('</p>', '\n').strip()
        for ref in ref_text.split('\n'):
            if ref.startswith('http'):
                references.append({
                    'title': 'Reference',
                    'url': ref.strip()
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
        
        # Add site info
        steps.append(f"Host: {site.get('@host', 'unknown')}")
        steps.append(f"Port: {site.get('@port', 'unknown')}")
        steps.append(f"SSL: {site.get('@ssl', 'false')}")
        
        # Add instance info if available
        if alert.get('instances'):
            instance = alert['instances'][0]  # Use first instance
            steps.extend([
                f"URL: {instance.get('uri', 'N/A')}",
                f"Method: {instance.get('method', 'N/A')}",
                f"Parameter: {instance.get('param', 'N/A')}"
            ])
            
            # Add attack if available
            if instance.get('attack'):
                steps.append(f"Attack: {instance['attack']}")
                
            # Add evidence if available
            if instance.get('evidence'):
                steps.append(f"Evidence: {instance['evidence']}")
        
        return steps 