# scripts/data-processing/etl/transform_findings.py
import json
import os
import yaml
import logging

def load_config():
    with open('/home/jon/security-assessment/config/config.yml', 'r') as file:
        return yaml.safe_load(file)

def transform_findings(config):
    try:
        input_path = os.path.join(config['paths']['output_dir'], 'extracted-findings.json')
        with open(input_path, 'r', encoding='utf-8') as f:
            findings = json.load(f)

        # Log the structure of the extracted data
        logging.info("Extracted Data Structure: %s", json.dumps(findings, indent=2))

        transformed_findings = {'dast': [], 'sast': [], 'code-llm': []}
        for category, items in findings.items():
            for item in items:
                # Check if item is a dictionary
                if isinstance(item, dict):
                    transformed = {
                        "title": item.get("title", "Untitled"),
                        "description": item.get("description", "No description available"),
                        "solution": item.get("solution", "No solution available"),
                        "testing_category": category,
                        "tool": item.get("tool", "unknown"),
                        "location": item.get("location", "unknown"),
                        "likelihood": item.get("likelihood", "unknown"),
                        "impact": item.get("impact", "unknown"),
                        "references": item.get("references", {})
                    }
                    transformed_findings[category].append(transformed)
                else:
                    logging.warning("Unexpected data format: %s", item)

        output_path = os.path.join(config['paths']['output_dir'], 'transformed-findings.json')
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(transformed_findings, f, indent=4)
        logging.info("Transformation complete.")
    except Exception as e:
        logging.error("Error during transformation: %s", str(e))
        raise

def main():
    config = load_config()
    transform_findings(config)

if __name__ == "__main__":
    main()