# scripts/data-processing/validation/validate_findings.py
import json
import os
from jsonschema import validate, ValidationError
import yaml

def load_config():
    with open('/home/jon/security-assessment/config/config.yml', 'r') as file:
        return yaml.safe_load(file)

def load_json(file_path):
    with open(file_path, 'r', encoding='utf-8-sig') as file:
        return json.load(file)

def validate_data(file_path, schema):
    data = load_json(file_path)
    errors = []
    for index, item in enumerate(data):
        try:
            validate(instance=item, schema=schema)
        except ValidationError as e:
            errors.append((index, e.message))
    return errors

def main():
    config = load_config()
    schema_path = os.path.join(config['paths']['schemas_dir'], 'findings-schema.jsonc')  # Use .jsonc if supported
    schema = load_json(schema_path)

    for category in ['dast', 'sast', 'code-llm']:
        file_path = os.path.join(config['paths']['output_dir'], f'{category}-findings.json')
        if os.path.exists(file_path):
            print(f"Validating {category} findings...")
            errors = validate_data(file_path, schema)
            if errors:
                print(f"Validation errors in {category}-findings.json:")
                for index, error in errors:
                    print(f"  Entry {index}: {error}")
            else:
                print(f"{category}-findings.json is valid.")
        else:
            print(f"{category}-findings.json does not exist.")

if __name__ == "__main__":
    main()