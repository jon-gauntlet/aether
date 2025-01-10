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
    
    # Create a custom logger
    logger = logging.getLogger()
    logger.setLevel(logging.DEBUG)

    # Create handlers
    file_handler = logging.FileHandler(log_file)
    file_handler.setLevel(logging.DEBUG)

    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)

    # Create formatters and add them to handlers
    file_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(file_formatter)

    console_formatter = logging.Formatter('%(message)s')
    console_handler.setFormatter(console_formatter)

    # Add handlers to the logger
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

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