import json
import logging
from pathlib import Path

def count_dast_findings(config):
    dast_path = Path(config['paths']['findings_dir']) / 'dast'
    total_findings = 0
    for file_path in dast_path.rglob('*.json'):
        try:
            with open(file_path, 'r') as file:
                data = json.load(file)
                if isinstance(data, list):
                    total_findings += len(data)
                elif isinstance(data, dict):
                    total_findings += 1
        except Exception as e:
            logging.error(f"Error reading {file_path}: {e}")
    logging.info(f"Total DAST findings in source files: {total_findings}")
    return total_findings

def verify_dast_extraction(config, extracted_findings):
    source_count = count_dast_findings(config)
    extracted_count = len(extracted_findings['dast'])
    if extracted_count != source_count:
        logging.warning(f"Discrepancy in DAST findings: expected {source_count}, found {extracted_count}")
    else:
        logging.info(f"DAST findings extraction verified: {extracted_count} findings as expected.")