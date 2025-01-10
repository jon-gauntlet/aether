import subprocess
import yaml
import os
import sys
import logging

from logging_setup import setup_logging

def load_config():
    with open('/home/jon/security-assessment/config/config.yml', 'r') as file:
        return yaml.safe_load(file)

def run_script(script_name, config):
    script_path = os.path.join(config['paths']['scripts_dir'], script_name)
    try:
        result = subprocess.run(['python', script_path], check=True, capture_output=True, text=True)
        logging.info(result.stdout)
    except subprocess.CalledProcessError as e:
        logging.error(f"Error running {script_name}: {e}")
        logging.error(f"Standard Output: {e.stdout}")
        logging.error(f"Standard Error: {e.stderr}")
        print(f"Error in {script_name}. Check /home/jon/security-assessment/logs/etl-process.log for more info")
        sys.exit(1)

def cleanup_intermediate_files(config):
    staging_dir = config['paths']['output_dir']
    intermediate_files = [
        'enriched-findings.json',
        'extracted-findings.json',
        'transformed-findings.json'
    ]
    for file in intermediate_files:
        file_path = os.path.join(staging_dir, file)
        if os.path.exists(file_path):
            os.remove(file_path)
            logging.info(f"Removed intermediate file: {file}")

def main():
    setup_logging()
    logging.info("Starting ETL process...")
    config = load_config()

    # Extract
    logging.info("Starting extraction...")
    run_script('extract_findings.py', config)

    # Transform
    logging.info("Starting transformation...")
    run_script('transform_findings.py', config)

    # Enrich
    logging.info("Starting enrichment...")
    run_script('enrich_findings.py', config)

    # Load
    logging.info("Starting loading...")
    run_script('load_findings.py', config)

    # Cleanup
    cleanup_intermediate_files(config)

    logging.info("ETL process completed successfully.")
    print("ETL process completed successfully. No errors were encountered.")

if __name__ == "__main__":
    main()