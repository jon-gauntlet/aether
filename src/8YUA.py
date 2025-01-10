# scripts/data_processing/validation/validate-findings.py
import json
import os
from jsonschema import validate, ValidationError
import yaml
import logging

def load_config():
    with open('/home/jon/security-assessment/config/config.yml', 'r') as file:
        return yaml.safe_load(file)

def load_json(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8-sig') as file:
            return json.load(file)
    except Exception as e:
        logging.error("Error loading JSON from %s: %s", file_path, str(e))
        raise

def validate_data(file_path, schema):
    try:
        data = load_json(file_path)
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

def main():
    config = load_config()
    try:
        schema_path = os.path.join(config['paths']['schemas_dir'], 'findings-schema.jsonc')  # Use .jsonc if supported
        schema = load_json(schema_path)

        for category in ['dast', 'sast', 'code-llm']:
            file_path = os.path.join(config['paths']['output_dir'], f'{category}-findings.json')
            if os.path.exists(file_path):
                logging.info(f"Validating {category} findings...")
                errors = validate_data(file_path, schema)
                if errors:
                    logging.error(f"Validation errors in {category}-findings.json:")
                    for index, error in errors:
                        logging.error(f"  Entry {index}: {error}")
                else:
                    logging.info(f"{category}-findings.json is valid.")
            else:
                logging.warning(f"{category}-findings.json does not exist.")
    except Exception as e:
        logging.error("Error in main validation: %s", str(e))

if __name__ == "__main__":
    main()