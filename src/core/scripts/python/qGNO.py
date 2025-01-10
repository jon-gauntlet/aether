import json
import os
import re
from typing import Dict, List, Optional

class RailsCategorizer:
    # Categories based on Rails Security Guide sections
    CATEGORIES = {
        "sessions": {
            "name": "1. Sessions",
            "patterns": [
                r"session.*hijack", r"session.*fixation", r"cookie.*theft",
                r"session.*expir", r"session.*timeout", r"session.*storage",
                r"session.*management", r"httponly.*cookie", r"secure.*cookie",
                r"session.*replay", r"session.*rotation"
            ]
        },
        "sessions_2": {
            "name": "2. Sessions",  # Rails guide has two sessions sections
            "patterns": [
                r"session.*config", r"session.*store", r"encrypted.*cookie",
                r"signed.*cookie", r"secret.*key.*base"
            ]
        },
        "csrf": {
            "name": "3. Cross-Site Request Forgery (CSRF)",
            "patterns": [
                r"csrf", r"cross.?site.?request.?forgery", r"forgery.?protection",
                r"csrf.?token", r"authenticity.?token", r"request.?forgery",
                r"same.?origin", r"cross.?origin"
            ]
        },
        "redirection_files": {
            "name": "4. Redirection and Files",
            "patterns": [
                r"redirect.*", r"open.?redirect", r"file.?upload", r"file.?download",
                r"directory.?traversal", r"path.?traversal", r"arbitrary.?file",
                r"executable.*upload", r"file.*execution", r"send_file",
                r"send_data", r"unsafe.?download"
            ]
        },
        "user_management": {
            "name": "5. User Management",
            "patterns": [
                r"brute.?force", r"password", r"authentication", r"captcha",
                r"privilege.?escalation", r"authorization", r"access.?control",
                r"information.?disclosure", r"sensitive.?data", r"account.*hijack",
                r"credential", r"permission", r"role", r"user.*input"
            ]
        },
        "injection": {
            "name": "6. Injection",
            "patterns": [
                r"sql.?injection", r"command.?injection", r"code.?injection",
                r"header.?injection", r"parameter.?injection", r"mass.?assignment",
                r"unsafe.?query", r"raw.?sql", r"dynamic.?query", r"shell.?command",
                r"eval", r"execute", r"system.?call", r"os.?command"
            ]
        },
        "xss": {
            "name": "7. XSS",
            "patterns": [
                r"xss", r"cross.?site.?scripting", r"script.?injection",
                r"html.?injection", r"dom.?based", r"sanitize", r"escape",
                r"html.?safe", r"raw.?output", r"unsafe.?html"
            ]
        },
        "http_security": {
            "name": "8. HTTP Security Headers",
            "patterns": [
                r"security.?header", r"hsts", r"csp", r"content.?security.?policy",
                r"x.?frame.?options", r"cors", r"cross.?origin", r"http.?header",
                r"strict.?transport", r"feature.?policy", r"referrer.?policy"
            ]
        },
        "intranet_admin": {
            "name": "9. Intranet and Admin Security",
            "patterns": [
                r"admin.*interface", r"administration", r"internal.?network",
                r"intranet", r"privileged.?access", r"admin.*dashboard",
                r"management.?interface", r"backend", r"control.?panel"
            ]
        },
        "environmental": {
            "name": "10. Environmental Security",
            "patterns": [
                r"config.*", r"environment.*variable", r"credential.*",
                r"secret.*", r"key.*exposure", r"api.?key", r"master.?key",
                r"credentials.yml", r"database.yml", r"env.*var", r"secret.*key.*base"
            ]
        },
        "dependency": {
            "name": "11. Dependency Management and CVEs",
            "patterns": [
                r"dependency", r"cve", r"vulnerable.?package",
                r"outdated.?gem", r"version.?vulnerability", r"bundle.*update",
                r"gemfile", r"package.*version", r"library.*version"
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
        """Determine the Rails security category for a finding based on the Rails Security Guide."""
        text = f"{finding.get('title', '')} {finding.get('description', '')}"
        
        # Direct mappings based on common tool outputs
        if finding.get('security_category') == '5. Information Disclosure':
            return "5. User Management"  # Information disclosure is part of user management
        elif finding.get('security_category') == '8. Security Headers':
            return "8. HTTP Security Headers"
        elif finding.get('security_category') == '3. Session Management':
            return "1. Sessions"  # All session management goes under Sessions
        elif finding.get('security_category') == '2. Authentication':
            return "5. User Management"  # Authentication is part of user management
        elif finding.get('security_category') == '10. Other':
            pass  # Will try to categorize based on content
            
        # Check for dependency vulnerabilities first
        if any(term in text.lower() for term in ['cve-', 'vulnerability', 'vulnerable version']):
            return "11. Dependency Management and CVEs"
            
        # Check for session-related findings
        if any(term in text.lower() for term in ['session hijacking', 'session fixation', 'session replay']):
            return "1. Sessions"
            
        # Check each category's patterns
        matches = []
        for category, patterns in self.compiled_patterns.items():
            for pattern in patterns:
                if pattern.search(text):
                    matches.append(self.CATEGORIES[category]["name"])
                    
        if matches:
            # Prioritize more specific categories over general ones
            if "7. XSS" in matches:  # XSS is more specific than general injection
                return "7. XSS"
            if "8. HTTP Security Headers" in matches:  # Headers are specific
                return "8. HTTP Security Headers"
            return matches[0]  # Return first match if no priority rules apply
        
        # Default to Environmental Security if no clear match
        # This aligns with the guide's emphasis on environmental security for unclear cases
        return "10. Environmental Security"

    def process_findings(self, input_file: str, output_file: str):
        """Process all findings and add Rails security categories."""
        # Read findings
        with open(input_file, 'r') as f:
            data = json.load(f)
            findings = data.get('findings', [])

        # Add categories only for SAST and DAST findings
        for finding in findings:
            # Skip if already has a security_category or is an LLM finding
            if finding.get('source', {}).get('type') == 'claude-3.5-sonnet':
                continue
                
            # Only process SAST and DAST findings
            if finding.get('source', {}).get('type') in ['sast', 'dast']:
                finding['security_category'] = self.categorize_finding(finding)
                
                # Ensure finding_type is valid
                if finding.get('finding_type') == 'other':
                    finding['finding_type'] = 'configuration'

        # Write categorized findings
        output_data = {
            "methodology": data.get("methodology", ""),
            "methodology_reference": data.get("methodology_reference", ""),
            "findings": findings
        }
        
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        with open(output_file, 'w') as f:
            json.dump(output_data, f, indent=2)

def main():
    categorizer = RailsCategorizer()
    input_file = "/home/jon/security-assessment/data/risk_scored_findings/risk_scored_findings.json"
    output_file = "/home/jon/security-assessment/data/categorized_findings/categorized_findings.json"
    categorizer.process_findings(input_file, output_file)

if __name__ == "__main__":
    main() 