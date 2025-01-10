#!/usr/bin/env python3

import json
import os
import logging
from pathlib import Path
from typing import Dict, List, Any
from collections import defaultdict

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FindingsSummarizer:
    def __init__(self, scored_findings_path: str, output_dir: str):
        self.scored_findings_path = Path(scored_findings_path)
        self.output_dir = Path(output_dir)
        self.findings = []
        self.rails_categories = {
            'sql_injection': 'SQL Injection',
            'xss': 'Cross-Site Scripting',
            'csrf': 'Cross-Site Request Forgery',
            'authentication': 'Authentication',
            'authorization': 'Authorization',
            'session_management': 'Session Management',
            'mass_assignment': 'Mass Assignment',
            'file_upload': 'File Upload',
            'http_headers': 'HTTP Headers',
            'routing': 'Routing',
            'dependencies': 'Dependencies',
            'configuration': 'Configuration'
        }
        
    def load_findings(self) -> None:
        """Load risk-scored findings."""
        try:
            with open(self.scored_findings_path, 'r') as f:
                data = json.load(f)
                self.findings = data.get('findings', [])
            logger.info(f"Loaded {len(self.findings)} scored findings")
        except Exception as e:
            logger.error(f"Error loading findings: {e}")
            
    def categorize_findings(self) -> Dict[str, List[Dict[str, Any]]]:
        """Categorize findings by Rails security category."""
        categorized = defaultdict(list)
        
        for finding in self.findings:
            desc = finding.get('description', '').lower()
            
            # Determine Rails category
            category = 'other'
            for key, name in self.rails_categories.items():
                if key in desc or name.lower() in desc:
                    category = key
                    break
                    
            categorized[category].append(finding)
            
        return dict(categorized)
        
    def generate_summary(self) -> Dict[str, Any]:
        """Generate a comprehensive summary of findings."""
        categorized = self.categorize_findings()
        
        summary = {
            'overview': {
                'total_findings': len(self.findings),
                'critical_findings': len([f for f in self.findings if f.get('severity') == 'CRITICAL']),
                'high_findings': len([f for f in self.findings if f.get('severity') == 'HIGH']),
                'medium_findings': len([f for f in self.findings if f.get('severity') == 'MEDIUM']),
                'low_findings': len([f for f in self.findings if f.get('severity') == 'LOW'])
            },
            'by_category': {},
            'top_risks': [],
            'prevention_strategies': defaultdict(set)
        }
        
        # Process each category
        for category, findings in categorized.items():
            category_name = self.rails_categories.get(category, 'Other')
            category_summary = {
                'name': category_name,
                'count': len(findings),
                'findings': []
            }
            
            for finding in findings:
                risk_factors = finding.get('owasp_risk_factors', {})
                finding_summary = {
                    'title': finding.get('title'),
                    'severity': finding.get('severity'),
                    'risk_score': risk_factors.get('overall_score'),
                    'description': finding.get('description'),
                    'impact_factors': risk_factors.get('impact', {}).get('factors', []),
                    'likelihood_factors': risk_factors.get('likelihood', {}).get('factors', []),
                    'remediation': finding.get('remediation'),
                    'prevention': finding.get('prevention_tips', [
                        'Implement input validation',
                        'Follow Rails security best practices',
                        'Regular security updates'
                    ]),
                    'detection': finding.get('detection_methods', [
                        'Monitor application logs',
                        'Implement security monitoring',
                        'Regular security scans'
                    ])
                }
                category_summary['findings'].append(finding_summary)
                
                # Add to top risks if critical or high
                if finding.get('severity') in ['CRITICAL', 'HIGH']:
                    summary['top_risks'].append(finding_summary)
                
                # Collect prevention strategies
                for tip in finding_summary['prevention']:
                    summary['prevention_strategies'][category].add(tip)
            
            summary['by_category'][category] = category_summary
        
        # Convert prevention strategies sets to lists
        summary['prevention_strategies'] = {
            k: list(v) for k, v in summary['prevention_strategies'].items()
        }
        
        return summary
        
    def save_summary(self, summary: Dict[str, Any]) -> None:
        """Save the findings summary."""
        output_file = self.output_dir / 'findings_summary.json'
        os.makedirs(self.output_dir, exist_ok=True)
        
        with open(output_file, 'w') as f:
            json.dump(summary, f, indent=2)
            
        logger.info(f"Saved findings summary to {output_file}")
        
    def generate_markdown_report(self, summary: Dict[str, Any]) -> None:
        """Generate a markdown report from the summary."""
        report_lines = []
        
        # Overview Section
        report_lines.append("# Security Assessment Findings Summary\n")
        report_lines.append("## Overview\n")
        report_lines.append(f"- Total Findings: {summary['overview']['total_findings']}")
        report_lines.append(f"- Critical Findings: {summary['overview']['critical_findings']}")
        report_lines.append(f"- High Risk Findings: {summary['overview']['high_findings']}")
        report_lines.append(f"- Medium Risk Findings: {summary['overview']['medium_findings']}")
        report_lines.append(f"- Low Risk Findings: {summary['overview']['low_findings']}\n")
        
        # Top Risks Section
        report_lines.append("## Top Risks\n")
        for risk in sorted(summary['top_risks'], 
                         key=lambda x: (x['severity'], x['risk_score']), 
                         reverse=True):
            report_lines.append(f"### {risk['title']} ({risk['severity']})\n")
            report_lines.append(f"**Risk Score:** {risk['risk_score']:.1f}\n")
            report_lines.append(f"**Description:** {risk['description']}\n")
            report_lines.append("**Impact Factors:**")
            for factor in risk['impact_factors']:
                report_lines.append(f"- {factor}")
            report_lines.append("\n**Likelihood Factors:**")
            for factor in risk['likelihood_factors']:
                report_lines.append(f"- {factor}")
            report_lines.append("\n**Remediation:**")
            report_lines.append(str(risk['remediation']))
            report_lines.append("\n**Prevention:**")
            for tip in risk['prevention']:
                report_lines.append(f"- {tip}")
            report_lines.append("\n**Detection Methods:**")
            for method in risk['detection']:
                report_lines.append(f"- {method}")
            report_lines.append("\n")
        
        # Findings by Category
        report_lines.append("## Findings by Category\n")
        for category, data in summary['by_category'].items():
            report_lines.append(f"### {data['name']}\n")
            report_lines.append(f"Total findings in category: {data['count']}\n")
            report_lines.append("#### Key Prevention Strategies")
            for strategy in summary['prevention_strategies'].get(category, []):
                report_lines.append(f"- {strategy}")
            report_lines.append("\n")
            
            # List findings in category
            for finding in sorted(data['findings'], 
                               key=lambda x: (x['severity'], x['risk_score']), 
                               reverse=True):
                report_lines.append(f"#### {finding['title']} ({finding['severity']})\n")
                report_lines.append(f"**Risk Score:** {finding['risk_score']:.1f}\n")
                report_lines.append(f"**Description:** {finding['description']}\n")
                report_lines.append("**Remediation:**")
                report_lines.append(str(finding['remediation']))
                report_lines.append("\n")
        
        # Write report to file
        report_file = self.output_dir / 'findings_report.md'
        with open(report_file, 'w') as f:
            f.write('\n'.join(report_lines))
            
        logger.info(f"Generated markdown report at {report_file}")

def main():
    findings_path = "/home/jon/security-assessment/data/risk_scored_findings/risk_scored_findings.json"
    output_dir = "/home/jon/security-assessment/data/risk_scored_findings"
    
    summarizer = FindingsSummarizer(findings_path, output_dir)
    summarizer.load_findings()
    summary = summarizer.generate_summary()
    summarizer.save_summary(summary)
    summarizer.generate_markdown_report(summary)
    
    logger.info("Findings summary and report generation complete!")

if __name__ == "__main__":
    main() 