# scripts/data-processing/etl/run_etl.py
import subprocess
import logging
import yaml
import os

def load_config():
    with open('/home/jon/security-assessment/config/config.yml', 'r') as file:
        return yaml.safe_load(file)

def setup_logging():
    log_file = '/home/jon/security-assessment/logs/etl-process.log'
    logging.basicConfig(
        filename=log_file,
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )

def run_script(script_name, config):
    script_path = os.path.join(config['paths']['scripts_dir'], script_name)
    try:
        subprocess.run(['python', script_path], check=True)
    except subprocess.CalledProcessError as e:
        logging.error(f"Error running {script_name}: {e}")

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

if __name__ == "__main__":
    main()