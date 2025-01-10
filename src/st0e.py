import os
from jsonschema import validate, ValidationError
import yaml
import logging
from json_utils import read_json

def load_config():
    with open('/home/jon/security-assessment/config/config.yml', 'r') as file:
        return yaml.safe_load(file)

def validate_data(file_path, schema):
    try:
        data = read_json(file_path)
        errors = []
        for index, item in enumerate(data):
            try:
                validate(instance=item, schema=schema)
            except ValidationError as e:
                errors.append((index, e.message))
        return errors
    except Exception as e:
        logging.error("Error during validation: %s", str(e))
        raise

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