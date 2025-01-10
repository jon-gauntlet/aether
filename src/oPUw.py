# scripts/data-processing/etl/extract_findings.py
import os
import json
import yaml

def load_config():
    with open('/home/jon/security-assessment/config/config.yml', 'r') as file:
        return yaml.safe_load(file)

def extract_findings(config):
    findings = {'dast': [], 'sast': [], 'code-llm': []}
    for category in findings.keys():
        category_path = os.path.join(config['paths']['findings_dir'], category)
        for root, _, files in os.walk(category_path):
            for file in files:
                if file.endswith('.json'):
                    file_path = os.path.join(root, file)
                    with open(file_path, 'r', encoding='utf-8-sig') as f:
                        data = json.load(f)
                        findings[category].append(data)
    return findings

def main():
    config = load_config()
    findings = extract_findings(config)
    output_path = os.path.join(config['paths']['output_dir'], 'extracted-findings.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(findings, f, indent=4)
    print("Extraction complete.")

if __name__ == "__main__":
    main()