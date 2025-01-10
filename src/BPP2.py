import json
import logging

def read_json(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return json.load(file)
    except Exception as e:
        logging.error(f"Error reading JSON from {file_path}: {e}")
        raise

def write_json(data, file_path):
    try:
        with open(file_path, 'w', encoding='utf-8') as file:
            json.dump(data, file, indent=4)
        logging.info(f"Data successfully written to {file_path}")
    except Exception as e:
        logging.error(f"Error writing JSON to {file_path}: {e}")
        raise