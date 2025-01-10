#!/usr/bin/env python3

import json
import os
import logging
from pathlib import Path
from typing import Dict, List, Any, Tuple
from dataclasses import dataclass
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ThreatLevel(Enum):
    """OWASP threat levels with associated scores"""
    HIGH = 9
    MEDIUM = 6
    LOW = 3

@dataclass
class ThreatAgentFactors:
    """OWASP threat agent factors"""
    skill_levels = {
        'NO_TECHNICAL_SKILLS': 1,
        'SOME_TECHNICAL_SKILLS': 3,
        'ADVANCED_COMPUTER_USER': 5,
        'NETWORK_PROGRAMMING_SKILLS': 6,
        'SECURITY_PENETRATION_SKILLS': 9
    }
    
    motive_levels = {
        'LOW_OR_NO_REWARD': 1,
        'POSSIBLE_REWARD': 4,
        'HIGH_REWARD': 9
    }
    
    opportunity_levels = {
        'FULL_ACCESS_REQUIRED': 0,
        'SPECIAL_ACCESS_REQUIRED': 4,
        'SOME_ACCESS_REQUIRED': 7,
        'NO_ACCESS_REQUIRED': 9
    }
    
    size_levels = {
        'DEVELOPERS': 2,
        'SYSTEM_ADMINS': 2,
        'INTRANET_USERS': 4,
        'PARTNERS': 5,
        'AUTHENTICATED_USERS': 6,
        'ANONYMOUS_USERS': 9
    }

@dataclass
class VulnerabilityFactors:
    """OWASP vulnerability factors"""
    ease_of_discovery = {
        'PRACTICALLY_IMPOSSIBLE': 1,
        'DIFFICULT': 3,
        'EASY': 7,
        'AUTOMATED_TOOLS': 9
    }
    
    ease_of_exploit = {
        'THEORETICAL': 1,
        'DIFFICULT': 3,
        'EASY': 5,
        'AUTOMATED_TOOLS': 9
    }
    
    awareness = {
        'UNKNOWN': 1,
        'HIDDEN': 4,
        'OBVIOUS': 6,
        'PUBLIC_KNOWLEDGE': 9
    }
    
    intrusion_detection = {
        'ACTIVE_DETECTION': 1,
        'LOGGED_AND_REVIEWED': 3,
        'LOGGED_WITHOUT_REVIEW': 8,
        'NOT_LOGGED': 9
    }

@dataclass
class TechnicalImpact:
    """OWASP technical impact factors"""
    confidentiality = {
        'MINIMAL_NON_SENSITIVE': 2,
        'MINIMAL_CRITICAL': 6,
        'EXTENSIVE_NON_SENSITIVE': 6,
        'EXTENSIVE_CRITICAL': 7,
        'ALL_DATA': 9
    }
    
    integrity = {
        'MINIMAL_SLIGHTLY_CORRUPT': 1,
        'MINIMAL_SERIOUSLY_CORRUPT': 3,
        'EXTENSIVE_SLIGHTLY_CORRUPT': 5,
        'EXTENSIVE_SERIOUSLY_CORRUPT': 7,
        'ALL_DATA_CORRUPT': 9
    }
    
    availability = {
        'MINIMAL_SECONDARY_SERVICES': 1,
        'MINIMAL_PRIMARY_SERVICES': 5,
        'EXTENSIVE_SECONDARY_SERVICES': 5,
        'EXTENSIVE_PRIMARY_SERVICES': 7,
        'ALL_SERVICES': 9
    }
    
    accountability = {
        'FULLY_TRACEABLE': 1,
        'POSSIBLY_TRACEABLE': 7,
        'COMPLETELY_ANONYMOUS': 9
    }

@dataclass
class BusinessImpact:
    """OWASP business impact factors"""
    financial_damage = {
        'LESS_THAN_COST_TO_FIX': 1,
        'MINOR_EFFECT': 3,
        'SIGNIFICANT_EFFECT': 7,
        'BANKRUPTCY': 9
    }
    
    reputation_damage = {
        'MINIMAL_DAMAGE': 1,
        'LOSS_OF_ACCOUNTS': 4,
        'LOSS_OF_GOODWILL': 5,
        'BRAND_DAMAGE': 9
    }
    
    non_compliance = {
        'MINOR_VIOLATION': 2,
        'CLEAR_VIOLATION': 5,
        'HIGH_PROFILE_VIOLATION': 7
    }
    
    privacy_violation = {
        'ONE_INDIVIDUAL': 3,
        'HUNDREDS_OF_PEOPLE': 5,
        'THOUSANDS_OF_PEOPLE': 7,
        'MILLIONS_OF_PEOPLE': 9
    }

class RiskScorer:
    def __init__(self, findings_dir: str, output_dir: str):
        self.findings_dir = Path(findings_dir)
        self.output_dir = Path(output_dir)
        self.threat_agent = ThreatAgentFactors()
        self.vulnerability = VulnerabilityFactors()
        self.technical_impact = TechnicalImpact()
        self.business_impact = BusinessImpact()
        self.integrated_findings = []
        
    def calculate_likelihood(self, finding: Dict[str, Any]) -> Tuple[float, List[str]]:
        """Calculate likelihood score based on OWASP threat agent and vulnerability factors."""
        factors = []
        scores = []
        
        desc = finding.get('description', '').lower()
        
        # Threat Agent Factors
        
        # Skill Level
        if any(term in desc for term in ['complex', 'sophisticated', 'advanced']):
            scores.append(self.threat_agent.skill_levels['SECURITY_PENETRATION_SKILLS'])
            factors.append('Advanced technical skills required')
        elif any(term in desc for term in ['programming', 'coding', 'development']):
            scores.append(self.threat_agent.skill_levels['NETWORK_PROGRAMMING_SKILLS'])
            factors.append('Programming skills required')
        else:
            scores.append(self.threat_agent.skill_levels['ADVANCED_COMPUTER_USER'])
            factors.append('Advanced computer knowledge required')
            
        # Motive
        if any(term in desc for term in ['pii', 'sensitive', 'financial', 'child', 'welfare']):
            scores.append(self.threat_agent.motive_levels['HIGH_REWARD'])
            factors.append('High reward potential')
        else:
            scores.append(self.threat_agent.motive_levels['POSSIBLE_REWARD'])
            factors.append('Moderate reward potential')
            
        # Opportunity
        if 'authenticated' in desc or 'login' in desc:
            scores.append(self.threat_agent.opportunity_levels['SOME_ACCESS_REQUIRED'])
            factors.append('Authentication required')
        else:
            scores.append(self.threat_agent.opportunity_levels['NO_ACCESS_REQUIRED'])
            factors.append('No special access required')
            
        # Size
        if 'internal' in desc or 'admin' in desc:
            scores.append(self.threat_agent.size_levels['SYSTEM_ADMINS'])
            factors.append('Limited to system administrators')
        elif 'authenticated' in desc:
            scores.append(self.threat_agent.size_levels['AUTHENTICATED_USERS'])
            factors.append('Limited to authenticated users')
        else:
            scores.append(self.threat_agent.size_levels['ANONYMOUS_USERS'])
            factors.append('Accessible to anonymous users')
            
        # Vulnerability Factors
        
        # Ease of Discovery
        if finding.get('tool_name', '').lower() in ['zap', 'nikto', 'wapiti', 'snyk']:
            scores.append(self.vulnerability.ease_of_discovery['AUTOMATED_TOOLS'])
            factors.append('Discoverable by automated tools')
        elif 'obvious' in desc or 'common' in desc:
            scores.append(self.vulnerability.ease_of_discovery['EASY'])
            factors.append('Easy to discover')
        else:
            scores.append(self.vulnerability.ease_of_discovery['DIFFICULT'])
            factors.append('Difficult to discover')
            
        # Ease of Exploit
        if finding.get('proof_of_concept') or 'exploit' in desc:
            scores.append(self.vulnerability.ease_of_exploit['EASY'])
            factors.append('Easy to exploit')
        elif finding.get('finding_type') == 'dependency':
            scores.append(self.vulnerability.ease_of_exploit['AUTOMATED_TOOLS'])
            factors.append('Known exploit likely available')
        else:
            scores.append(self.vulnerability.ease_of_exploit['DIFFICULT'])
            factors.append('Difficult to exploit')
            
        # Awareness
        if 'cve' in desc or finding.get('cve_id'):
            scores.append(self.vulnerability.awareness['PUBLIC_KNOWLEDGE'])
            factors.append('Public CVE exists')
        elif 'common' in desc or 'known' in desc:
            scores.append(self.vulnerability.awareness['OBVIOUS'])
            factors.append('Known vulnerability type')
        else:
            scores.append(self.vulnerability.awareness['HIDDEN'])
            factors.append('Limited awareness')
            
        # Intrusion Detection
        if 'logging' in desc or 'monitored' in desc:
            scores.append(self.vulnerability.intrusion_detection['LOGGED_AND_REVIEWED'])
            factors.append('Activity is logged and reviewed')
        else:
            scores.append(self.vulnerability.intrusion_detection['LOGGED_WITHOUT_REVIEW'])
            factors.append('Activity may be logged but not actively reviewed')
            
        return sum(scores) / len(scores), factors

    def calculate_impact(self, finding: Dict[str, Any]) -> Tuple[float, List[str]]:
        """Calculate impact score based on OWASP technical and business impact factors."""
        factors = []
        scores = []
        
        desc = finding.get('description', '').lower()
        
        # Technical Impact
        
        # Loss of Confidentiality
        if any(term in desc for term in ['pii', 'child', 'welfare', 'sensitive']):
            scores.append(self.technical_impact.confidentiality['EXTENSIVE_CRITICAL'])
            factors.append('Critical data exposure')
        elif 'data' in desc or 'information' in desc:
            scores.append(self.technical_impact.confidentiality['MINIMAL_CRITICAL'])
            factors.append('Limited data exposure')
        else:
            scores.append(self.technical_impact.confidentiality['MINIMAL_NON_SENSITIVE'])
            factors.append('Minimal data exposure')
            
        # Loss of Integrity
        if 'modify' in desc or 'alter' in desc:
            scores.append(self.technical_impact.integrity['EXTENSIVE_SERIOUSLY_CORRUPT'])
            factors.append('Data integrity seriously compromised')
        elif 'change' in desc:
            scores.append(self.technical_impact.integrity['MINIMAL_SERIOUSLY_CORRUPT'])
            factors.append('Limited data integrity impact')
        else:
            scores.append(self.technical_impact.integrity['MINIMAL_SLIGHTLY_CORRUPT'])
            factors.append('Minimal integrity impact')
            
        # Loss of Availability
        if 'denial of service' in desc or 'crash' in desc:
            scores.append(self.technical_impact.availability['EXTENSIVE_PRIMARY_SERVICES'])
            factors.append('Major service disruption')
        elif 'performance' in desc or 'slow' in desc:
            scores.append(self.technical_impact.availability['MINIMAL_PRIMARY_SERVICES'])
            factors.append('Minor service impact')
        else:
            scores.append(self.technical_impact.availability['MINIMAL_SECONDARY_SERVICES'])
            factors.append('Minimal availability impact')
            
        # Loss of Accountability
        if 'log' in desc or 'audit' in desc:
            scores.append(self.technical_impact.accountability['POSSIBLY_TRACEABLE'])
            factors.append('Actions may be traceable')
        else:
            scores.append(self.technical_impact.accountability['COMPLETELY_ANONYMOUS'])
            factors.append('Actions not traceable')
            
        # Business Impact
        
        # Financial Damage
        if 'hipaa' in desc or 'compliance' in desc:
            scores.append(self.business_impact.financial_damage['SIGNIFICANT_EFFECT'])
            factors.append('Significant compliance costs')
        else:
            scores.append(self.business_impact.financial_damage['MINOR_EFFECT'])
            factors.append('Minor financial impact')
            
        # Reputation Damage
        if any(term in desc for term in ['child', 'welfare', 'sensitive', 'pii']):
            scores.append(self.business_impact.reputation_damage['BRAND_DAMAGE'])
            factors.append('Major reputational damage due to child welfare data')
        else:
            scores.append(self.business_impact.reputation_damage['LOSS_OF_GOODWILL'])
            factors.append('Loss of goodwill')
            
        # Non-Compliance
        if 'hipaa' in desc or 'compliance' in desc:
            scores.append(self.business_impact.non_compliance['HIGH_PROFILE_VIOLATION'])
            factors.append('HIPAA violation')
        else:
            scores.append(self.business_impact.non_compliance['CLEAR_VIOLATION'])
            factors.append('Compliance concerns')
            
        # Privacy Violation
        if any(term in desc for term in ['database', 'all users', 'system-wide']):
            scores.append(self.business_impact.privacy_violation['THOUSANDS_OF_PEOPLE'])
            factors.append('Widespread privacy violation')
        else:
            scores.append(self.business_impact.privacy_violation['HUNDREDS_OF_PEOPLE'])
            factors.append('Limited privacy violation')
            
        return sum(scores) / len(scores), factors

    def calculate_risk_score(self, finding: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate risk score using OWASP methodology with Binti context."""
        # Get base likelihood and impact scores
        likelihood, likelihood_factors = self.calculate_likelihood(finding)
        impact, impact_factors = self.calculate_impact(finding)
        
        # Adjust likelihood based on Binti context
        desc = finding.get('description', '').lower()
        
        # Threat Agent Factors adjustment
        if any(term in desc for term in ['pii', 'child', 'foster', 'case', 'welfare']):
            likelihood *= 1.3  # Higher motivation due to sensitive data
            likelihood_factors.append('Increased motivation due to child welfare data')
            
        if 'api' in desc or 'integration' in desc:
            likelihood *= 1.2  # External attack surface
            likelihood_factors.append('External API exposure')
            
        # Vulnerability Factors adjustment
        if finding.get('finding_type') == 'dependency':
            likelihood *= 1.2  # Known CVEs are more likely to be exploited
            likelihood_factors.append('Known dependency vulnerability')
            
        # Impact adjustments based on Binti context
        if any(term in desc for term in ['hipaa', 'compliance', 'regulatory']):
            impact *= 1.4  # HIPAA compliance critical for Binti
            impact_factors.append('HIPAA compliance impact')
            
        if 'database' in desc or 'data' in desc:
            impact *= 1.3  # Child welfare data is highly sensitive
            impact_factors.append('Sensitive child welfare data impact')
            
        # Rails application context adjustments
        category = finding.get('security_category', '')
        if category.startswith('1. Sessions'):
            impact *= 1.3  # Session security critical for case worker access
            impact_factors.append('Case worker session security')
        elif category.startswith('5. User Management'):
            impact *= 1.2  # User management affects case worker access
            impact_factors.append('Case worker access control')
        elif category.startswith('6. Injection'):
            likelihood *= 1.3  # Rails apps commonly targeted for injection
            likelihood_factors.append('Common Rails attack vector')
            
        # Calculate final risk score (0-10 scale)
        risk_score = (likelihood * impact) / 10
        
        # Ensure score is between 0 and 10
        risk_score = min(max(risk_score, 0), 10)
        
        # Map to OWASP severity levels
        if risk_score >= 6:
            severity = 'CRITICAL'
        elif risk_score >= 4:
            severity = 'HIGH'
        elif risk_score >= 2:
            severity = 'MEDIUM'
        else:
            severity = 'LOW'
            
        return {
            'risk_score': risk_score,
            'severity': severity,
            'likelihood': likelihood,
            'impact': impact,
            'likelihood_factors': likelihood_factors,
            'impact_factors': impact_factors,
            'owasp_risk_factors': {
                'likelihood': {
                    'score': likelihood,
                    'factors': likelihood_factors
                },
                'impact': {
                    'score': impact, 
                    'factors': impact_factors
                },
                'overall_score': risk_score
            }
        }

    def process_findings(self) -> None:
        """Process and score all findings."""
        for finding in self.integrated_findings:
            finding = self.calculate_risk_score(finding)
            
        # Sort findings by risk score
        self.integrated_findings.sort(
            key=lambda x: x.get('owasp_risk_factors', {}).get('overall_score', 0), 
            reverse=True
        )

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

    def save_scored_findings(self) -> None:
        """Save processed findings to output directory."""
        output_file = self.output_dir / 'risk_scored_findings.json'
        os.makedirs(self.output_dir, exist_ok=True)
        
        with open(output_file, 'w') as f:
            json.dump({
                'methodology': 'OWASP Risk Rating Methodology',
                'methodology_reference': 'https://owasp.org/www-community/OWASP_Risk_Rating_Methodology',
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