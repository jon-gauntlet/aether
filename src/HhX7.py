from pathlib import Path
import logging
import yaml
from jsonschema import validate, ValidationError
from json_utils import read_json, write_json
from logging_setup import setup_logging

def load_config():
    config_path = Path('/home/jon/security-assessment/config/config.yml')
    try:
        with config_path.open('r') as file:
            return yaml.safe_load(file)
    except Exception as e:
        logging.error(f"Failed to load config: {e}")
        raise

def process_files_in_directory(directory, process_function):
    for file_path in directory.rglob('*.json'):
        try:
            data = read_json(file_path)
            if data:
                process_function(data, file_path)
            else:
                logging.warning(f"No data found in {file_path}")
        except Exception as e:
            logging.error(f"Error processing {file_path}: {e}")

def extract_findings(config):
    findings = {'dast': [], 'sast': [], 'code-llm': []}
    def process_file(data, file_path):
        category = file_path.parent.name
        findings[category].extend(data)
        logging.debug(f"Extracted data from {file_path}: {data[:1] if data else 'No data'}")

    findings_dir = Path(config['paths']['findings_dir'])
    process_files_in_directory(findings_dir, process_file)
    for category, items in findings.items():
        logging.info(f"Extracted {len(items)} findings for {category}. Sample: {items[:1] if items else 'No data'}")
    return findings

def transform_findings(findings):
    transformed_findings = {'dast': [], 'sast': [], 'code-llm': []}
    for category, items in findings.items():
        for item in items:
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
        logging.info(f"Transformed {len(items)} findings for {category}. Sample: {items[:1] if items else 'No data'}")
    return transformed_findings

def enrich_findings(findings):
    for category, items in findings.items():
        for finding in items:
            if category == 'code-llm' and 'solution' not in finding:
                finding['solution'] = "Generated solution based on description."
    for category, items in findings.items():
        logging.info(f"Enriched {len(items)} findings for {category}. Sample: {items[:1] if items else 'No data'}")
    return findings

def load_findings(config, findings):
    output_dir = Path(config['paths']['output_dir'])
    for category in ['dast', 'sast', 'code-llm']:
        output_path = output_dir / f'{category}-findings.json'
        write_json(findings[category], output_path)
        logging.info(f"Loaded {len(findings[category])} findings for {category}. Sample: {findings[category][:1] if findings[category] else 'No data'}")

def validate_findings(config):
    schema_path = Path(config['paths']['schemas_dir']) / 'findings-schema.json'
    schema = read_json(schema_path)

    output_dir = Path(config['paths']['output_dir'])
    for category in ['dast', 'sast', 'code-llm']:
        file_path = output_dir / f'{category}-findings.json'
        findings = read_json(file_path)

        if not findings:
            logging.warning(f"No findings found in {file_path}.")
            continue

        for index, finding in enumerate(findings):
            try:
                validate(instance=finding, schema=schema)
            except ValidationError as e:
                logging.error(f"Validation error in {category} finding {index}: {e.message}")

    logging.info("Validation complete.")

def main():
    setup_logging()
    config = load_config()

    try:
        findings = extract_findings(config)
        extracted_path = Path(config['paths']['output_dir']) / 'extracted-findings.json'
        write_json(findings, extracted_path)

        transformed_findings = transform_findings(findings)
        transformed_path = Path(config['paths']['output_dir']) / 'transformed-findings.json'
        write_json(transformed_findings, transformed_path)

        enriched_findings = enrich_findings(transformed_findings)
        enriched_path = Path(config['paths']['output_dir']) / 'enriched-findings.json'
        write_json(enriched_findings, enriched_path)

        load_findings(config, enriched_findings)
        validate_findings(config)

        logging.info("ETL process completed successfully.")
    except Exception as e:
        logging.error(f"Error in ETL process: {e}")

if __name__ == "__main__":
    main()