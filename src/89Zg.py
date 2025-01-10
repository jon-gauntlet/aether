from pathlib import Path
import subprocess
import logging
import yaml
from logging_setup import setup_logging

def load_config():
    config_path = Path('/home/jon/security-assessment/config/config.yml')
    try:
        with config_path.open('r') as file:
            return yaml.safe_load(file)
    except Exception as e:
        logging.error(f"Error loading config: {e}")
        raise

def run_script(script_name):
    try:
        script_path = Path(__file__).parent / script_name
        subprocess.run(['python', str(script_path.resolve())], check=True)
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
            file_path = Path(config['paths']['output_dir']) / file
            if file_path.exists():
                file_path.unlink()
                logging.info(f"Removed intermediate file: {file_path}")
    except Exception as e:
        logging.error(f"Error during cleanup: {e}")

def main():
    setup_logging()
    config = load_config()
    scripts = [
        'extract_findings.py',
        'transform_findings.py',
        'enrich_findings.py',
        'load_findings.py',
        'validate_findings.py'
    ]

    for script in scripts:
        run_script(script)

    cleanup_intermediate_files(config)

    logging.info("ETL process completed successfully.")

if __name__ == "__main__":
    main()