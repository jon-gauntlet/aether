#!/usr/bin/env python3

import json
import os
import logging
from pathlib import Path
from typing import Dict, List, Any
from dataclasses import dataclass
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ImpactLevel(Enum):
    CRITICAL = 9
    HIGH = 7
    MEDIUM = 5
    LOW = 3
    INFO = 1

@dataclass
class BusinessContext:
    data_sensitivity: str = "HIGH"  # PII, Child welfare data
    operational_impact: str = "CRITICAL"  # Affects child placement
    compliance_requirements: List[str] = None
    technical_considerations: List[str] = None

    def __post_init__(self):
        self.compliance_requirements = [
            "HIPAA",
            "State child welfare regulations",
            "Background check requirements"
        ]
        self.technical_considerations = [
            "Multi-tenant architecture",
            "Government system integrations",
            "Mobile access",
            "Document management"
        ]

class RiskScorer:
    def __init__(self, findings_dir: str, output_dir: str):
        self.findings_dir = Path(findings_dir)
        self.output_dir = Path(output_dir)
        self.business_context = BusinessContext()
        self.integrated_findings = []
        
    def load_findings(self) -> None:
        """Load all normalized findings from JSON files."""
        for file_path in self.findings_dir.glob("*.json"):
            try:
                with open(file_path, 'r') as f:
                    findings = json.load(f)
                    if isinstance(findings, list):
                        self.integrated_findings.extend(findings)
                    else:
                        self.integrated_findings.append(findings)
                logger.info(f"Loaded findings from {file_path}")
            except Exception as e:
                logger.error(f"Error loading {file_path}: {e}")

    def adjust_severity_for_context(self, finding: Dict[str, Any]) -> Dict[str, Any]:
        """Adjust finding severity based on business context."""
        base_severity = finding.get('severity', 'LOW').upper()
        
        # Increase severity for findings related to PII or sensitive data
        if any(term in finding.get('description', '').upper() for term in 
               ['PII', 'PERSONAL', 'SENSITIVE', 'CHILD', 'MINOR']):
            severity_levels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
            current_idx = severity_levels.index(base_severity)
            if current_idx < len(severity_levels) - 1:
                finding['severity'] = severity_levels[current_idx + 1]
                finding['severity_adjustment_reason'] = "Increased due to PII/sensitive data impact"

        # Adjust for compliance impact
        if any(req.lower() in finding.get('description', '').lower() 
               for req in self.business_context.compliance_requirements):
            if base_severity != 'CRITICAL':
                finding['severity'] = 'HIGH'
                finding['severity_adjustment_reason'] = "Increased due to compliance requirements"

        return finding

    def calculate_risk_score(self, finding: Dict[str, Any]) -> float:
        """Calculate OWASP risk score."""
        severity_map = {
            'CRITICAL': 9.0,
            'HIGH': 7.0,
            'MEDIUM': 5.0,
            'LOW': 3.0,
            'INFO': 1.0
        }
        
        base_score = severity_map.get(finding.get('severity', 'LOW').upper(), 3.0)
        
        # Impact multipliers
        impact_multipliers = {
            'data_exposure': 1.5,  # Sensitive data exposure
            'service_disruption': 1.3,  # Service availability impact
            'compliance_violation': 1.4  # Regulatory compliance impact
        }
        
        final_score = base_score
        
        # Apply multipliers based on finding characteristics
        desc = finding.get('description', '').lower()
        if any(term in desc for term in ['pii', 'personal', 'sensitive']):
            final_score *= impact_multipliers['data_exposure']
        if any(term in desc for term in ['availability', 'downtime', 'disruption']):
            final_score *= impact_multipliers['service_disruption']
        if any(term in desc for term in ['hipaa', 'compliance', 'regulation']):
            final_score *= impact_multipliers['compliance_violation']
            
        return min(10.0, final_score)  # Cap at 10.0

    def process_findings(self) -> None:
        """Process and score all findings."""
        for finding in self.integrated_findings:
            finding = self.adjust_severity_for_context(finding)
            finding['risk_score'] = self.calculate_risk_score(finding)
            
        # Sort findings by risk score
        self.integrated_findings.sort(key=lambda x: x.get('risk_score', 0), reverse=True)

    def save_scored_findings(self) -> None:
        """Save processed findings to output directory."""
        output_file = self.output_dir / 'risk_scored_findings.json'
        os.makedirs(self.output_dir, exist_ok=True)
        
        with open(output_file, 'w') as f:
            json.dump({
                'business_context': {
                    'data_sensitivity': self.business_context.data_sensitivity,
                    'operational_impact': self.business_context.operational_impact,
                    'compliance_requirements': self.business_context.compliance_requirements,
                    'technical_considerations': self.business_context.technical_considerations
                },
                'findings': self.integrated_findings
            }, f, indent=2)
        
        logger.info(f"Saved risk-scored findings to {output_file}")

def main():
    findings_dir = "/home/jon/security-assessment/data/normalized_findings"
    output_dir = "/home/jon/security-assessment/data/risk_scored_findings"
    
    scorer = RiskScorer(findings_dir, output_dir)
    scorer.load_findings()
    scorer.process_findings()
    scorer.save_scored_findings()
    
    logger.info("Risk scoring complete!")

if __name__ == "__main__":
    main() 