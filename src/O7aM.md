# Finding Normalization Technical Implementation

## Schema Definition

All findings are normalized to follow this schema:

```json
{
  "id": "string",
  "title": "string",
  "source": {
    "tool": "string",
    "type": "sast|dast|llm",
    "original_id": "string"
  },
  "description": "string",
  "finding_type": "string",
  "security_category": "string",
  "severity": {
    "level": "Critical|High|Medium|Low|Info",
    "score": "float",
    "justification": "string"
  },
  "evidence": {
    "url": "string?",
    "method": "string?",
    "parameter": "string?",
    "file": "string?",
    "line": "number?",
    "code": "string?",
    "reproduction": ["string"]
  },
  "remediation": ["string"],
  "references": [{
    "title": "string",
    "url": "string"
  }],
  "metadata": {
    "cwe_ids": ["string"],
    "tags": ["string"]
  }
}
```

## OWASP Risk Scoring Implementation

Risk scores are calculated using:

1. Impact Factors:
   - Technical Impact (0.0-10.0)
   - Business Impact (0.0-10.0)

2. Likelihood Factors:
   - Threat Agent Factors (0.0-10.0)
   - Vulnerability Factors (0.0-10.0)

Final score is calculated as: `(Impact + Likelihood) / 2`

Severity levels are mapped as:
- Critical: 9.0-10.0
- High: 7.0-8.9
- Medium: 5.0-6.9
- Low: 3.0-4.9
- Info: 1.0-2.9

## Rails Security Categories

Categories are assigned using pattern matching against:
1. Finding title
2. Finding description
3. CWE mappings
4. Tool-specific metadata

Category mapping rules:
```python
RAILS_CATEGORIES = {
    "1. Sessions": ["session management", "session security"],
    "2. CSRF": ["csrf", "cross site request forgery"],
    "3. Redirection": ["redirection", "file upload"],
    "4. User Management": ["authentication", "authorization"],
    "5. Injection": ["sql injection", "command injection"],
    "6. XSS": ["xss", "cross site scripting"],
    "7. Security Headers": ["security headers", "csp"],
    "8. Admin Security": ["admin interface", "internal"],
    "9. Environmental": ["environment", "credentials"],
    "10. Dependencies": ["dependency", "cve"]
}
```

## Processing Pipeline

1. Schema Normalization:
   - Input: Raw tool findings
   - Process: Map to common schema
   - Output: `data/normalized_findings/*.json`

2. Risk Scoring:
   - Input: Normalized findings
   - Process: Apply OWASP scoring
   - Output: `data/risk_scored_findings/*.json`

3. Category Assignment:
   - Input: Risk-scored findings
   - Process: Apply Rails categories
   - Output: `data/categorized_findings/*.json`

## Quality Assurance

Each stage includes validation:
1. Schema validation using JSON Schema
2. Risk score range checks (0.0-10.0)
3. Category presence verification
4. Required field completeness checks

## Error Handling

The pipeline implements graceful error handling:
1. Invalid findings are quarantined
2. Processing continues on non-critical errors
3. Detailed error logs are generated
4. Manual review queue for edge cases 