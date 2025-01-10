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
                        if data:
                            findings[category].extend(data)
                            logging.debug(f"Data from {file_path}: {data[:1] if len(data) > 0 else 'No data'}")
                        else:
                            logging.warning("No data found in %s", file_path)
        # Log the number of findings and a sample
        for category, items in findings.items():
            logging.info(f"Extracted {len(items)} findings for category {category}. Sample: {items[:1] if len(items) > 0 else 'No data'}")
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
        logging.info("Extraction complete. Data written to %s", output_path)
    except Exception as e:
        logging.error("Error in main extraction: %s", str(e))

if __name__ == "__main__":
    main()