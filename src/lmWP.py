# scripts/data-processing/etl/load_findings.py
import json
import os
import yaml
from scripts.data-processing.logging_setup import setup_logging

def load_config():
    with open('/home/jon/security-assessment/config/config.yml', 'r') as file:
        return yaml.safe_load(file)

def load_findings(config):
    try:
        input_path = os.path.join(config['paths']['output_dir'], 'enriched-findings.json')
        with open(input_path, 'r', encoding='utf-8') as f:
            findings = json.load(f)

        for category in ['dast', 'sast', 'code-llm']:
            output_path = os.path.join(config['paths']['output_dir'], f'{category}-findings.json')
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(findings[category], f, indent=4)
        logging.info("Loading complete.")
    except Exception as e:
        logging.error("Error during loading: %s", str(e))
        raise

def main():
    setup_logging()
    config = load_config()
    load_findings(config)

if __name__ == "__main__":
    main()