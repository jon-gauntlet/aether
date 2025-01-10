# scripts/data-processing/etl/run_etl.py
import subprocess
import yaml
import os
from scripts.data-processing.logging_setup import setup_logging

def load_config():
    with open('/home/jon/security-assessment/config/config.yml', 'r') as file:
        return yaml.safe_load(file)

def run_script(script_name, config):
    script_path = os.path.join(config['paths']['scripts_dir'], script_name)
    try:
        subprocess.run(['python', script_path], check=True)
    except subprocess.CalledProcessError as e:
        logging.error(f"Error running {script_name}: {e}")
        print(f"Failed: {script_name}")

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

    logging.info("ETL process completed successfully.")
    print("ETL process completed successfully.")

if __name__ == "__main__":
    main()