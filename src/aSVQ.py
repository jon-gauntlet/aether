import os
import yaml
from logging_setup import setup_logging
import logging
from json_utils import read_json, write_json

def load_config():
    with open('/home/jon/security-assessment/config/config.yml', 'r') as file:
        return yaml.safe_load(file)

def enrich_findings(config):
    try:
        input_path = os.path.join(config['paths']['output_dir'], 'transformed-findings.json')
        findings = read_json(input_path)

        if not findings:
            logging.warning("No findings to enrich.")
            return

        for category, items in findings.items():
            for finding in items:
                if category == 'code-llm' and 'solution' not in finding:
                    finding['solution'] = "Generated solution based on description."

        for category, items in findings.items():
            logging.info(f"Enriched {len(items)} findings for category {category}. Sample: {items[:1] if len(items) > 0 else 'No data'}")

        output_path = os.path.join(config['paths']['output_dir'], 'enriched-findings.json')
        write_json(findings, output_path)
        logging.info("Enrichment complete. Data written to %s", output_path)
    except Exception as e:
        logging.error("Error during enrichment: %s", str(e))
        raise

def main():
    setup_logging()
    config = load_config()
    enrich_findings(config)

if __name__ == "__main__":
    main()