# scripts/data-processing/load_findings.py
import json
import os
import yaml

def load_config():
    with open('/home/jon/security-assessment/config/config.yml', 'r') as file:
        return yaml.safe_load(file)

def load_findings(config):
    input_path = os.path.join(config['paths']['output_dir'], 'enriched-findings.json')
    with open(input_path, 'r', encoding='utf-8') as f:
        findings = json.load(f)

    for category in ['dast', 'sast', 'code-llm']:
        category_findings = [f for f in findings if f['testing_category'] == category]
        output_path = os.path.join(config['paths']['output_dir'], f'{category}-findings.json')
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(category_findings, f, indent=4)
    print("Loading complete.")

if __name__ == "__main__":
    main()