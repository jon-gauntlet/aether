from pathlib import Path
import logging
import yaml
from jsonschema import validate, ValidationError
from json_utils import read_json, write_json
from markdown_utils import extract_finding_details
from logging_setup import setup_logging
import json
from verify_extraction import verify_dast_extraction

def load_config():
    config_path = Path('/home/jon/security-assessment/config/config.yml')
    try:
        with config_path.open('r') as file:
            return yaml.safe_load(file)
    except Exception as e:
        logging.error(f"Failed to load config: {e}")
        raise

def extract_findings(config):
    findings = {'dast': [], 'sast': [], 'code-llm': []}
    
    def process_data(data, category, file_path):
        initial_count = len(findings[category])
        if isinstance(data, list):
            findings[category].extend(data)
        elif isinstance(data, dict):
            findings[category].append(data)
        else:
            logging.warning(f"Unexpected data type in {category}: {type(data)}")
        logging.info(f"Extracted {len(findings[category]) - initial_count} findings from {file_path}")

    for category in ['dast', 'sast']:
        category_path = Path(config['paths']['findings_dir']) / category
        for file_path in category_path.rglob('*.json'):
            try:
                data = read_json(file_path)
                process_data(data, category, file_path)
            except Exception as e:
                logging.error(f"Error processing {file_path}: {e}")

    # Handle code-llm findings separately
    code_llm_path = Path(config['paths']['findings_dir']) / 'code-llm'
    for file_path in code_llm_path.rglob('*.md'):
        try:
            findings['code-llm'].extend(extract_finding_details(file_path, 'code-llm'))
        except Exception as e:
            logging.error(f"Error processing {file_path}: {e}")

    for category, items in findings.items():
        logging.info(f"Extracted {len(items)} findings for {category}.")
    return findings

def transform_findings(findings):
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
            else:
                logging.warning(f"Unexpected item format in {category}: {type(item)}")
    for category, items in transformed_findings.items():
        logging.info(f"Transformed {len(items)} findings for {category}.")
    return transformed_findings

def enrich_findings(findings):
    for category, items in findings.items():
        for finding in items:
            if category == 'code-llm' and 'solution' not in finding:
                finding['solution'] = "Generated solution based on description."
    for category, items in findings.items():
        logging.info(f"Enriched {len(items)} findings for {category}.")
    return findings

def load_findings(config, findings):
    output_dir = Path(config['paths']['output_dir'])
    for category in ['dast', 'sast', 'code-llm']:
        output_path = output_dir / f'{category}-findings.json'
        write_json(findings[category], output_path)
        logging.info(f"Loaded {len(findings[category])} findings for {category}.")

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

def count_dast_findings(config):
    dast_path = Path(config['paths']['findings_dir']) / 'dast'
    total_findings = 0
    for file_path in dast_path.rglob('*.json'):
        try:
            with open(file_path, 'r') as file:
                data = json.load(file)
                if isinstance(data, list):
                    total_findings += len(data)
                elif isinstance(data, dict):
                    total_findings += 1
        except Exception as e:
            logging.error(f"Error reading {file_path}: {e}")
    logging.info(f"Total DAST findings in source files: {total_findings}")
    return total_findings

def main():
    setup_logging()
    logging.info("Starting ETL process...")
    config = load_config()

    try:
        logging.info("Extracting findings...")
        findings = extract_findings(config)

        # Validate DAST extraction
        verify_dast_extraction(config, findings)

        logging.info("Transforming findings...")
        transformed_findings = transform_findings(findings)

        logging.info("Enriching findings...")
        enriched_findings = enrich_findings(transformed_findings)

        logging.info("Loading findings...")
        load_findings(config, enriched_findings)

        logging.info("Managing intermediate files...")
        manage_intermediate_files(config)

        logging.info("Validating findings...")
        validate_findings(config)

        logging.info("ETL process completed successfully.")
    except Exception as e:
        logging.error(f"Error in ETL process: {e}")

if __name__ == "__main__":
    main()