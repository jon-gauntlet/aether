import json
import os
import re
from typing import Dict, List, Optional

class RailsCategorizer:
    CATEGORIES = {
        "sessions": {
            "name": "Sessions",
            "patterns": [
                r"session.*hijack", r"session.*fixation", r"cookie.*theft",
                r"session.*expir", r"session.*timeout", r"session.*storage"
            ]
        },
        "csrf": {
            "name": "Cross-Site Request Forgery (CSRF)",
            "patterns": [
                r"csrf", r"cross.?site.?request.?forgery", r"forgery.?protection",
                r"csrf.?token", r"authenticity.?token"
            ]
        },
        "redirection_files": {
            "name": "Redirection and Files",
            "patterns": [
                r"redirect.*", r"open.?redirect", r"file.?upload", r"file.?download",
                r"directory.?traversal", r"path.?traversal", r"arbitrary.?file"
            ]
        },
        "user_management": {
            "name": "User Management",
            "patterns": [
                r"brute.?force", r"password", r"authentication", r"captcha",
                r"privilege.?escalation", r"authorization", r"access.?control"
            ]
        },
        "injection": {
            "name": "Injection",
            "patterns": [
                r"sql.?injection", r"xss", r"cross.?site.?scripting",
                r"command.?injection", r"code.?injection", r"header.?injection",
                r"css.?injection", r"html.?injection", r"template.?injection"
            ]
        },
        "unsafe_query": {
            "name": "Unsafe Query Generation",
            "patterns": [
                r"unsafe.?query", r"raw.?sql", r"dynamic.?query",
                r"query.?generation", r"sql.?generation"
            ]
        },
        "http_security": {
            "name": "HTTP Security Headers",
            "patterns": [
                r"security.?header", r"hsts", r"csp", r"content.?security.?policy",
                r"x.?frame.?options", r"cors", r"cross.?origin"
            ]
        },
        "intranet_admin": {
            "name": "Intranet and Admin Security",
            "patterns": [
                r"admin.*interface", r"administration", r"internal.?network",
                r"intranet", r"privileged.?access"
            ]
        },
        "environmental": {
            "name": "Environmental Security",
            "patterns": [
                r"config.*", r"environment.*variable", r"credential.*",
                r"secret.*", r"key.*exposure", r"api.?key"
            ]
        },
        "dependency": {
            "name": "Dependency Management and CVEs",
            "patterns": [
                r"dependency", r"cve", r"vulnerable.?package",
                r"outdated.?gem", r"version.?vulnerability"
            ]
        }
    }

    def __init__(self):
        self.compiled_patterns = self._compile_patterns()

    def _compile_patterns(self) -> Dict[str, List[re.Pattern]]:
        """Compile all regex patterns for performance."""
        compiled = {}
        for category, data in self.CATEGORIES.items():
            compiled[category] = [re.compile(p, re.IGNORECASE) for p in data["patterns"]]
        return compiled

    def categorize_finding(self, finding: Dict) -> str:
        """Determine the Rails security category for a finding."""
        text = f"{finding.get('title', '')} {finding.get('description', '')}"
        
        # Check each category's patterns
        for category, patterns in self.compiled_patterns.items():
            for pattern in patterns:
                if pattern.search(text):
                    return self.CATEGORIES[category]["name"]
        
        # Default to Injection if no clear match (most common category)
        return "Injection"

    def process_findings(self, input_file: str, output_file: str):
        """Process all findings and add Rails security categories."""
        # Read findings
        with open(input_file, 'r') as f:
            findings = json.load(f)

        # Add categories only for SAST and DAST findings
        for finding in findings:
            # Skip if already has a rails_security_category or is an LLM finding
            if finding.get('rails_security_category') or finding.get('source') == 'claude-3.5-sonnet':
                continue
                
            # Only process SAST and DAST findings
            if finding.get('source') in ['sast', 'dast']:
                finding['rails_security_category'] = self.categorize_finding(finding)

        # Write categorized findings
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        with open(output_file, 'w') as f:
            json.dump(findings, f, indent=2)

def main():
    categorizer = RailsCategorizer()
    input_file = "/home/jon/security-assessment/data/risk_scored_findings/risk_scored_findings.json"
    output_file = "/home/jon/security-assessment/data/categorized_findings/categorized_findings.json"
    categorizer.process_findings(input_file, output_file)

if __name__ == "__main__":
    main() 