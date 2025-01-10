# scripts/data-processing/enrich_findings.py
import json
import os
import yaml

def load_config():
    with open('/home/jon/security-assessment/config/config.yml', 'r') as file:
        return yaml.safe_load(file)

def enrich_findings(config):
    input_path = os.path.join(config['paths']['output_dir'], 'transformed-findings.json')
    with open(input_path, 'r', encoding='utf-8') as f:
        findings = json.load(f)

    for finding in findings:
        if finding['testing_category'] == 'code-llm' and 'solution' not in finding:
            finding['solution'] = "Generated solution based on description."

    output_path = os.path.join(config['paths']['output_dir'], 'enriched-findings.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(findings, f, indent=4)
    print("Enrichment complete.")

if __name__ == "__main__":
    main()