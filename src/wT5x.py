import os
import yaml
from logging_setup import setup_logging
import logging
from json_utils import read_json, write_json

def load_config():
    with open('/home/jon/security-assessment/config/config.yml', 'r') as file:
        return yaml.safe_load(file)

def transform_findings(config):
    try:
        input_path = os.path.join(config['paths']['output_dir'], 'extracted-findings.json')
        findings = read_json(input_path)

        if not findings:
            logging.warning("No findings to transform.")
            return

        transformed_findings = {'dast': [], 'sast': [], 'code-llm': []}
        for category, items in findings.items():
            for item in items:
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
        for category, items in transformed_findings.items():
            logging.info(f"Transformed {len(items)} findings for category {category}. Sample: {items[:1] if len(items) > 0 else 'No data'}")

        output_path = os.path.join(config['paths']['output_dir'], 'transformed-findings.json')
        write_json(transformed_findings, output_path)
        logging.info("Transformation complete. Data written to %s", output_path)
    except Exception as e:
        logging.error("Error during transformation: %s", str(e))
        raise

def main():
    setup_logging()
    config = load_config()
    transform_findings(config)

if __name__ == "__main__":
    main()