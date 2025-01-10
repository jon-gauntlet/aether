import os
import yaml
from logging_setup import setup_logging
import logging
from json_utils import read_json, write_json

def load_config():
    with open('/home/jon/security-assessment/config/config.yml', 'r') as file:
        return yaml.safe_load(file)

def load_findings(config):
    try:
        input_path = os.path.join(config['paths']['output_dir'], 'enriched-findings.json')
        findings = read_json(input_path)

        for category in ['dast', 'sast', 'code-llm']:
            output_path = os.path.join(config['paths']['output_dir'], f'{category}-findings.json')
            write_json(findings[category], output_path)
            logging.info(f"Loaded {category} findings: {findings[category]}")
            logging.info("Data written to %s", output_path)
    except Exception as e:
        logging.error("Error during loading: %s", str(e))
        raise

def main():
    setup_logging()
    config = load_config()
    load_findings(config)

if __name__ == "__main__":
    main()