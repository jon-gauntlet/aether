# scripts/data-processing/etl/transform_findings.py
import json
import os
import yaml
import logging

def load_config():
    with open('/home/jon/security-assessment/config/config.yml', 'r') as file:
        return yaml.safe_load(file)

def transform_findings(config):
    input_path = os.path.join(config['paths']['output_dir'], 'extracted-findings.json')
    with open(input_path, 'r', encoding='utf-8') as f:
        findings = json.load(f)

    # Log the structure of the extracted data
    logging.info("Extracted Data Structure: %s", json.dumps(findings, indent=2))

    transformed_findings = {'dast': [], 'sast': [], 'code-llm': []}
    for category, items in findings.items():
        for item in items:
            # Assuming item is a list, iterate over its elements
            for sub_item in item:
                transformed = {
                    "title": sub_item.get("title", "Untitled"),
                    "description": sub_item.get("description", "No description available"),
                    "solution": sub_item.get("solution", "No solution available"),
                    "testing_category": category,
                    "tool": sub_item.get("tool", "unknown"),
                    "location": sub_item.get("location", "unknown"),
                    "likelihood": sub_item.get("likelihood", "unknown"),
                    "impact": sub_item.get("impact", "unknown"),
                    "references": sub_item.get("references", {})
                }
                transformed_findings[category].append(transformed)

    output_path = os.path.join(config['paths']['output_dir'], 'transformed-findings.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(transformed_findings, f, indent=4)
    logging.info("Transformation complete.")

def main():
    config = load_config()
    transform_findings(config)

if __name__ == "__main__":
    main()