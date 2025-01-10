#!/usr/bin/env python3

import json
import os
from pathlib import Path
from typing import Dict, List, Any

class CategoryNormalizer:
    """Normalizes security categories across all findings."""
    
    # Based on Rails Security Guide sections
    RAILS_CATEGORIES = {
        "1. Sessions": ["session management", "session security", "cookie security"],
        "2. Sessions": ["session configuration", "session store"],
        "3. Cross-Site Request Forgery (CSRF)": ["csrf", "cross site request forgery"],
        "4. Redirection and Files": ["redirection", "file upload", "file download"],
        "5. User Management": ["authentication", "authorization", "access control"],
        "6. Injection": ["sql injection", "command injection", "code injection"],
        "7. XSS": ["xss", "cross site scripting"],
        "8. HTTP Security Headers": ["security headers", "csp", "hsts"],
        "9. Intranet and Admin Security": ["admin interface", "internal network"],
        "10. Environmental Security": ["environment variables", "credentials", "secrets"],
        "11. Dependency Management and CVEs": ["dependency", "cve", "vulnerable package"]
    }

    def __init__(self):
        self.findings_dir = Path("/home/jon/security-assessment/data/normalized_findings")
        self.output_dir = Path("/home/jon/security-assessment/data/categorized_findings")
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def normalize_category(self, finding: Dict[str, Any]) -> str:
        """Normalize a finding's security category to match Rails Security Guide."""
        current_category = finding.get('security_category', '').lower()
        description = finding.get('description', '').lower()
        title = finding.get('title', '').lower()

        # Direct mappings for common categories
        if current_category == '5. information disclosure':
            return "5. User Management"  # Information disclosure is part of user management
        elif current_category == '8. security headers':
            return "8. HTTP Security Headers"
        elif current_category == '3. session management':
            return "1. Sessions"  # All session management goes under Sessions
        elif current_category == '2. authentication':
            return "5. User Management"  # Authentication is part of user management

        # Check for dependency vulnerabilities first
        if any(term in description.lower() for term in ['cve-', 'vulnerability', 'vulnerable version']):
            return "11. Dependency Management and CVEs"

        # Check each category's patterns
        for category, patterns in self.RAILS_CATEGORIES.items():
            for pattern in patterns:
                if pattern in description.lower() or pattern in title.lower():
                    return category

        # Default to Environmental Security if no clear match
        return "10. Environmental Security"

    def process_file(self, file_path: Path) -> None:
        """Process a single findings file."""
        print(f"Processing {file_path}")
        
        with open(file_path, 'r') as f:
            data = json.load(f)
            
        # Handle both list and dictionary formats
        if isinstance(data, list):
            findings = data
            output_data = findings
        else:
            findings = data.get('findings', [])
            output_data = {
                "methodology": data.get("methodology", ""),
                "methodology_reference": data.get("methodology_reference", ""),
                "findings": findings
            }

        # Normalize categories
        for finding in findings:
            if finding.get('source', {}).get('type') != 'claude-3.5-sonnet':  # Skip LLM findings
                finding['security_category'] = self.normalize_category(finding)

        # Write normalized findings
        output_path = self.output_dir / file_path.name
        with open(output_path, 'w') as f:
            json.dump(output_data, f, indent=2)
        print(f"Wrote normalized findings to {output_path}")

    def run(self) -> None:
        """Process all findings files."""
        for file_path in self.findings_dir.glob('*.json'):
            self.process_file(file_path)

def main():
    normalizer = CategoryNormalizer()
    normalizer.run()

if __name__ == "__main__":
    main() 