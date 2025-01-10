import json
import logging

def read_json(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return json.load(file)
    except Exception as e:
        logging.error("Error reading JSON from %s: %s", file_path, str(e))
        raise

def write_json(data, file_path):
    try:
        with open(file_path, 'w', encoding='utf-8') as file:
            json.dump(data, file, indent=4)
    except Exception as e:
        logging.error("Error writing JSON to %s: %s", file_path, str(e))
        raise