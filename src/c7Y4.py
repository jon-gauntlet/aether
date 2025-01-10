import os
import logging
from jsonschema import validate, ValidationError
from json_utils import read_json
from logging_setup import setup_logging

def validate_findings(config):
    try:
        schema_path = os.path.join(config['paths']['schemas_dir'], 'findings-schema.json')
        schema = read_json(schema_path)

        for category in ['dast', 'sast', 'code-llm']:
            file_path = os.path.join(config['paths']['output_dir'], f'{category}-findings.json')
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
    except Exception as e:
        logging.error("Error during validation: %s", str(e))
        raise

def main():
    setup_logging()
    config = load_config()
    validate_findings(config)

if __name__ == "__main__":
    main()