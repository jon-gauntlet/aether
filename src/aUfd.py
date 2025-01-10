import subprocess
import logging
import yaml
import os
from logging_setup import setup_logging

def load_config():
    config_path = '/home/jon/security-assessment/config/config.yml'
    try:
        with open(config_path, 'r') as file:
            return yaml.safe_load(file)
    except Exception as e:
        logging.error(f"Error loading config: {e}")
        raise

def run_script(script_name):
    try:
        subprocess.run(['python', script_name], check=True)
        logging.info(f"{script_name} completed successfully.")
    except subprocess.CalledProcessError as e:
        logging.error(f"Error running {script_name}: {e}")
        raise

def cleanup_intermediate_files(config):
    try:
        intermediate_files = [
            'extracted-findings.json',
            'transformed-findings.json',
            'enriched-findings.json'
        ]
        for file in intermediate_files:
            file_path = os.path.join(config['paths']['output_dir'], file)
            if os.path.exists(file_path):
                os.remove(file_path)
                logging.info(f"Removed intermediate file: {file_path}")
    except Exception as e:
        logging.error(f"Error during cleanup: {e}")

def main():
    setup_logging()
    config = load_config()  # Ensure config is loaded for cleanup
    scripts = [
        'scripts/data_processing/etl/extract_findings.py',
        'scripts/data_processing/etl/transform_findings.py',
        'scripts/data_processing/etl/enrich_findings.py',
        'scripts/data_processing/etl/load_findings.py',
        'scripts/data_processing/etl/validate_findings.py'
    ]

    for script in scripts:
        run_script(script)

    cleanup_intermediate_files(config)  # Cleanup after all scripts have run

    logging.info("ETL process completed successfully.")

if __name__ == "__main__":
    main()