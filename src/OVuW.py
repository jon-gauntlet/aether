#!/usr/bin/env python3

import json
import logging
import jsonschema
from pathlib import Path
from typing import Dict, List, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FindingsValidator:
    def __init__(self, findings_file: str, schema_file: str):
        self.findings_file = Path(findings_file)
        self.schema_file = Path(schema_file)
        self.findings = []
        self.schema = None
        self.validation_results = {
            'total_findings': 0,
            'schema_valid_findings': 0,
            'scored_findings': 0,
            'categorized_findings': 0,
            'schema_violations': [],
            'missing_scores': [],
            'missing_categories': [],
            'severity_distribution': {
                'CRITICAL': 0,
                'HIGH': 0,
                'MEDIUM': 0,
                'LOW': 0
            },
            'category_distribution': {},
            'source_distribution': {}
        }

    def load_schema(self) -> None:
        """Load JSON schema for findings validation."""
        try:
            with open(self.schema_file, 'r') as f:
                self.schema = json.load(f)
                logger.info("Loaded findings schema")
        except Exception as e:
            logger.error(f"Error loading schema: {e}")
            raise

    def load_findings(self) -> None:
        """Load findings from JSON file."""
        try:
            with open(self.findings_file, 'r') as f:
                data = json.load(f)
                self.findings = data.get('findings', [])
                self.validation_results['total_findings'] = len(self.findings)
                logger.info(f"Loaded {len(self.findings)} findings")
        except Exception as e:
            logger.error(f"Error loading findings: {e}")
            raise

    def validate_schema(self) -> None:
        """Validate findings against JSON schema."""
        for finding in self.findings:
            try:
                jsonschema.validate(finding, self.schema)
                self.validation_results['schema_valid_findings'] += 1
            except jsonschema.exceptions.ValidationError as e:
                self.validation_results['schema_violations'].append({
                    'title': finding.get('title'),
                    'source': finding.get('source', {}).get('type'),
                    'error': str(e)
                })

    def validate_owasp_scores(self) -> None:
        """Validate OWASP risk scores for all findings."""
        for finding in self.findings:
            risk_factors = finding.get('owasp_risk_factors')
            if not risk_factors:
                self.validation_results['missing_scores'].append({
                    'title': finding.get('title'),
                    'source': finding.get('source', {}).get('type')
                })
                continue

            # Check required score components
            if all(k in risk_factors for k in ['likelihood', 'impact', 'overall_score']):
                self.validation_results['scored_findings'] += 1
                
                # Track severity distribution
                severity = finding.get('severity')
                if severity:
                    self.validation_results['severity_distribution'][severity] = \
                        self.validation_results['severity_distribution'].get(severity, 0) + 1

    def validate_security_categories(self) -> None:
        """Validate Rails security categories for all findings."""
        for finding in self.findings:
            category = finding.get('security_category')
            if not category:
                self.validation_results['missing_categories'].append({
                    'title': finding.get('title'),
                    'source': finding.get('source', {}).get('type')
                })
                continue

            self.validation_results['categorized_findings'] += 1
            
            # Track category distribution
            self.validation_results['category_distribution'][category] = \
                self.validation_results['category_distribution'].get(category, 0) + 1

            # Track source distribution
            source = finding.get('source', {}).get('type')
            if source:
                self.validation_results['source_distribution'][source] = \
                    self.validation_results['source_distribution'].get(source, 0) + 1

    def print_validation_summary(self) -> None:
        """Print summary of validation results."""
        logger.info("\n=== Findings Validation Summary ===")
        logger.info(f"Total findings: {self.validation_results['total_findings']}")
        logger.info(f"Schema-valid findings: {self.validation_results['schema_valid_findings']}")
        logger.info(f"Findings with OWASP scores: {self.validation_results['scored_findings']}")
        logger.info(f"Findings with security categories: {self.validation_results['categorized_findings']}")
        
        logger.info("\nSeverity Distribution:")
        for severity, count in self.validation_results['severity_distribution'].items():
            percentage = (count / self.validation_results['total_findings']) * 100
            logger.info(f"{severity}: {count} ({percentage:.1f}%)")
        
        logger.info("\nCategory Distribution:")
        for category, count in self.validation_results['category_distribution'].items():
            percentage = (count / self.validation_results['total_findings']) * 100
            logger.info(f"{category}: {count} ({percentage:.1f}%)")
        
        logger.info("\nSource Distribution:")
        for source, count in self.validation_results['source_distribution'].items():
            percentage = (count / self.validation_results['total_findings']) * 100
            logger.info(f"{source}: {count} ({percentage:.1f}%)")
        
        if self.validation_results['schema_violations']:
            logger.warning("\nSchema Validation Errors:")
            for violation in self.validation_results['schema_violations']:
                logger.warning(f"- {violation['title']} (Source: {violation['source']})")
                logger.warning(f"  Error: {violation['error']}")
        
        if self.validation_results['missing_scores']:
            logger.warning("\nFindings missing OWASP scores:")
            for finding in self.validation_results['missing_scores']:
                logger.warning(f"- {finding['title']} (Source: {finding['source']})")
        
        if self.validation_results['missing_categories']:
            logger.warning("\nFindings missing security categories:")
            for finding in self.validation_results['missing_categories']:
                logger.warning(f"- {finding['title']} (Source: {finding['source']})")

def main():
    validator = FindingsValidator(
        '/home/jon/security-assessment/data/risk_scored_findings/risk_scored_findings.json',
        '/home/jon/security-assessment/scripts/etl/config/final_schema.json'
    )
    validator.load_schema()
    validator.load_findings()
    validator.validate_schema()
    validator.validate_owasp_scores()
    validator.validate_security_categories()
    validator.print_validation_summary()

if __name__ == "__main__":
    main() 