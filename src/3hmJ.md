# Data Normalization Plan

This document outlines the process for normalizing findings data from various sources (code-llm, dast-manual, sast-dependency) into a consistent format for storage in MongoDB. The goal is to facilitate comprehensive analysis and scoring using the OWASP Risk Rating Methodology.

## Required Fields

Each finding should be normalized to include the following fields:

- `finding_id`: A unique identifier for the finding.
- `source`: The origin of the finding (e.g., "skipfish", "manual", "sast").
- `title`: A brief title describing the finding.
- `description`: A detailed description of the finding.
- `severity`: The severity level of the finding (e.g., "low", "medium", "high").
- `recommendations`: Suggested actions to remediate the finding.
- `location`: An object containing:
  - `file`: The file where the issue was found.
  - `line`: The line number of the issue.
- `risk_score`: The calculated risk score based on the OWASP Risk Rating.
- `additional_data`: An object for any extra fields specific to the source.

## Normalization Method

1. **Data Extraction**: Extract raw data from each source. For example, parse HTML reports from Skipfish, JSON outputs from SAST tools, and manual findings from spreadsheets or documents.

2. **Field Mapping**: Map the extracted data to the required fields. Use scripts to automate this process, ensuring consistency across different sources.

3. **Data Transformation**: Convert data types as needed (e.g., strings to integers for line numbers). Ensure all fields are in a format suitable for MongoDB storage.

4. **Validation**: Validate the normalized data to ensure all required fields are present and correctly formatted. Implement checks for missing or malformed data.

5. **Insertion into MongoDB**: Insert the normalized data into a MongoDB collection. Use a script to automate this process, ensuring data integrity and consistency.

## Context and Considerations

- **Application Context**: Consider the specific architecture and use cases of `@codebase[app]`. Ensure that the normalization process captures all relevant details for accurate risk assessment.

- **Business Context**: Align the normalization process with Binti's business goals and risk tolerance. Ensure that the data supports meaningful analysis and decision-making.

- **Scalability**: Design the normalization process to handle large volumes of data efficiently. Consider using batch processing or parallelization for performance optimization.

- **Security**: Ensure that the normalization process does not introduce security vulnerabilities. Implement access controls and data encryption as needed.

## Example Script

Here's a basic example of a Python script to normalize data from a Skipfish report:

```python
from bs4 import BeautifulSoup
import json
import os

def normalize_skipfish_report(html_file):
    with open(html_file, 'r') as file:
        soup = BeautifulSoup(file, 'html.parser')

    findings = []
    for issue in soup.find_all('div', class_='issue'):
        finding = {
            'finding_id': issue.get('id', 'unknown'),
            'source': 'skipfish',
            'title': issue.find('h2').get_text(strip=True),
            'description': issue.find('p').get_text(strip=True),
            'severity': 'medium',  # Example default, adjust based on content
            'recommendations': 'Review and address the issue.',
            'location': {
                'file': 'unknown',  # Extract if available
                'line': 0  # Extract if available
            },
            'risk_score': 0,  # Placeholder for calculated score
            'additional_data': {}
        }
        findings.append(finding)

    return findings

def main():
    html_file = 'app_scan_results/index.html'
    findings = normalize_skipfish_report(html_file)
    json_output = json.dumps(findings, indent=4)

    output_file = os.path.join('..', '..', 'findings', 'dast-manual', 'skipfish_report.json')
    with open(output_file, 'w') as json_file:
        json_file.write(json_output)

if __name__ == '__main__':
    main()
```

