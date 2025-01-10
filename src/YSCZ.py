import os
import json
import re

def extract_finding_details(file_path, category):
    """Extract details from a Markdown file and return as a dictionary."""
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
        
        # Extract the title (first line)
        title_match = re.search(r'^#\s*(.+)', content, re.MULTILINE)
        title = title_match.group(1) if title_match else "Untitled"

        # Extract the location
        location_match = re.search(r'- Location:\s*(.+)', content)
        location = location_match.group(1) if location_match else "Unknown"

        # Extract the risk details
        risk_match = re.search(r'- Risk:\s*\n\s+- Likelihood:\s*(.+)\n\s+- Impact:\s*(.+)', content)
        likelihood = risk_match.group(1) if risk_match else "Unknown"
        impact = risk_match.group(2) if risk_match else "Unknown"

        # Extract the description
        description_match = re.search(r'- Description:\s*(.+?)(?=\n#|$)', content, re.DOTALL)
        description = description_match.group(1).strip() if description_match else "No description available"

        return {
            "title": title,
            "location": location,
            "likelihood": likelihood,
            "impact": impact,
            "description": description,
            "security_assessment_category": category
        }

def generate_json_from_findings(base_path):
    """Generate JSON data from findings in Markdown files."""
    findings = []
    for root, dirs, files in os.walk(base_path):
        # Exclude the 'exploitability-notes' directory
        dirs[:] = [d for d in dirs if d != 'exploitability-notes']
        category = os.path.basename(root)
        if category == 'code-llm':
            continue  # Skip the base directory itself
        for file in files:
            if file.endswith('.md'):
                file_path = os.path.join(root, file)
                finding = extract_finding_details(file_path, category)
                findings.append(finding)
    return findings

if __name__ == "__main__":
    base_path = '../findings/code-llm'
    findings_data = generate_json_from_findings(base_path)
    json_output = json.dumps(findings_data, indent=4)

    with open('../data/code-llm-findings.json', 'w') as outfile:
        outfile.write(json_output)
