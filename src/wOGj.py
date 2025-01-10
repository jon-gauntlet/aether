import subprocess
import logging
from logging_setup import setup_logging

def run_script(script_name):
    try:
        subprocess.run(['python', script_name], check=True)
        logging.info(f"{script_name} completed successfully.")
    except subprocess.CalledProcessError as e:
        logging.error(f"Error running {script_name}: {e}")
        raise

def main():
    setup_logging()
    scripts = [
        'scripts/data_processing/etl/extract_findings.py',
        'scripts/data_processing/etl/transform_findings.py',
        'scripts/data_processing/etl/enrich_findings.py',
        'scripts/data_processing/etl/load_findings.py',
        'scripts/data_processing/etl/validate_findings.py'  # Add validation here
    ]

    for script in scripts:
        run_script(script)

    logging.info("ETL process completed successfully.")

if __name__ == "__main__":
    main()