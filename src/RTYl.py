import os
import yaml
from logging_setup import setup_logging
import logging
from json_utils import read_json, write_json

def load_config():
    with open('/home/jon/security-assessment/config/config.yml', 'r') as file:
        return yaml.safe_load(file)

def extract_findings(config):
    try:
        findings = {'dast': [], 'sast': [], 'code-llm': []}
        for category in findings.keys():
            category_path = os.path.join(config['paths']['findings_dir'], category)
            for root, _, files in os.walk(category_path):
                for file in files:
                    if file.endswith('.json'):
                        file_path = os.path.join(root, file)
                        data = read_json(file_path)
                        findings[category].append(data)
        logging.info("Extracted findings: %s", findings)
        return findings
    except Exception as e:
        logging.error("Error during extraction: %s", str(e))
        raise

def main():
    setup_logging()
    config = load_config()
    try:
        findings = extract_findings(config)
        output_path = os.path.join(config['paths']['output_dir'], 'extracted-findings.json')
        write_json(findings, output_path)
        logging.info("Extraction complete.")
    except Exception as e:
        logging.error("Error in main extraction: %s", str(e))

if __name__ == "__main__":
    main()