# scripts/data-processing/etl/enrich_findings.py
import json
import os
import yaml
from scripts.data_processing.logging_setup import setup_logging

def load_config():
    with open('/home/jon/security-assessment/config/config.yml', 'r') as file:
        return yaml.safe_load(file)

def enrich_findings(config):
    try:
        input_path = os.path.join(config['paths']['output_dir'], 'transformed-findings.json')
        with open(input_path, 'r', encoding='utf-8') as f:
            findings = json.load(f)

        for category, items in findings.items():
            for finding in items:
                if category == 'code-llm' and 'solution' not in finding:
                    finding['solution'] = "Generated solution based on description."

        output_path = os.path.join(config['paths']['output_dir'], 'enriched-findings.json')
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(findings, f, indent=4)
        logging.info("Enrichment complete.")
    except Exception as e:
        logging.error("Error during enrichment: %s", str(e))
        raise

def main():
    setup_logging()
    config = load_config()
    enrich_findings(config)

if __name__ == "__main__":
    main()