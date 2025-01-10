import json
from pathlib import Path
import logging

def verify_dast_extraction(config):
    source_count = count_dast_findings(config)
    output_path = Path(config['paths']['output_dir']) / 'dast-findings.json'
    try:
        with open(output_path, 'r') as file:
            data = json.load(file)
            output_count = len(data)
            if output_count != source_count:
                logging.warning(f"Discrepancy in DAST findings: expected {source_count}, found {output_count}")
            else:
                logging.info(f"DAST findings extraction verified: {output_count} findings as expected.")
    except Exception as e:
        logging.error(f"Error reading output file {output_path}: {e}")