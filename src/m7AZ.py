"""Main ETL pipeline script."""

import glob
import json
import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml

from scripts.etl.parsers.dast.burpsuite_parser import BurpSuiteParser
from scripts.etl.parsers.dast.nikto_parser import NiktoParser
from scripts.etl.parsers.dast.wapiti_parser import WapitiParser
from scripts.etl.parsers.dast.zap_parser import ZAPParser
from scripts.etl.parsers.sast.bearer_parser import BearerParser
from scripts.etl.parsers.sast.brakeman_parser import BrakemanParser
from scripts.etl.parsers.sast.snyk_parser import SnykParser

def setup_logging(level: str = 'INFO') -> None:
    """Set up logging configuration."""
    numeric_level = getattr(logging, level.upper(), None)
    if not isinstance(numeric_level, int):
        raise ValueError(f'Invalid log level: {level}')
        
    logging.basicConfig(
        level=numeric_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

def load_config(config_path: str) -> Dict[str, Any]:
    """Load parser configurations from YAML file.
    
    Args:
        config_path: Path to config YAML file
        
    Returns:
        Configuration dictionary
    """
    with open(config_path) as f:
        return yaml.safe_load(f)

def load_schema(schema_path: str) -> Dict[str, Any]:
    """Load normalized finding schema from JSON file.
    
    Args:
        schema_path: Path to schema JSON file
        
    Returns:
        Schema dictionary
    """
    with open(schema_path) as f:
        return json.load(f)

def process_file(
    file_path: str,
    parser: Any,
    dry_run: bool = False,
    logger: Optional[logging.Logger] = None
) -> List[Dict[str, Any]]:
    """Process a single findings file.
    
    Args:
        file_path: Path to findings file
        parser: Parser instance to use
        dry_run: Whether to skip writing output
        logger: Logger instance
        
    Returns:
        List of normalized findings
    """
    if logger is None:
        logger = logging.getLogger(__name__)
        
    logger.info(f"Processing {file_path}")
    
    try:
        with open(file_path, 'r') as f:
            content = json.load(f)
            
        findings = parser.parse(content)
        logger.info(f"Found {len(findings)} findings in {file_path}")
        
        if not dry_run:
            # TODO: Write normalized findings to output
            pass
            
        return findings
        
    except Exception as e:
        logger.error(f"Failed to process {file_path}: {e}")
        if not parser.config.get('skip_on_error', False):
            raise
            
    return []

def main(dry_run: bool = False, log_level: str = 'INFO') -> None:
    """Main entry point.
    
    Args:
        dry_run: Whether to skip writing output
        log_level: Logging level to use
    """
    setup_logging(log_level)
    logger = logging.getLogger('main')
    
    # Set up paths
    base_dir = Path(__file__).parent.parent.parent
    findings_dir = base_dir / 'findings'
    
    # Load config and schema
    config = load_config(str(base_dir / 'scripts' / 'etl' / 'config' / 'parser_configs.yaml'))
    schema = load_schema(str(base_dir / 'data' / 'schemas' / 'normalized_finding.json'))
    
    # Process SAST findings
    logger.info("Processing SAST findings")
    
    # Bearer
    bearer_files = glob.glob(str(findings_dir / 'sast' / 'bearer*.json'))
    bearer_parser = BearerParser(config.get('bearer', {}), schema)
    for file in bearer_files:
        process_file(file, bearer_parser, dry_run, logger)
        
    # Brakeman
    brakeman_files = glob.glob(str(findings_dir / 'sast' / 'brakeman*.json'))
    brakeman_parser = BrakemanParser(config.get('brakeman', {}), schema)
    for file in brakeman_files:
        process_file(file, brakeman_parser, dry_run, logger)
        
    # Snyk (chunked)
    snyk_parser = SnykParser(config.get('snyk', {}), schema)
    snyk_chunks = glob.glob(str(findings_dir / 'sast' / 'snyk-test-chunks' / '*.json'))
    for chunk in snyk_chunks:
        process_file(chunk, snyk_parser, dry_run, logger)
        
    snyk_code_chunks = glob.glob(str(findings_dir / 'sast' / 'snyk-code-test-chunks' / '*.json'))
    for chunk in snyk_code_chunks:
        process_file(chunk, snyk_parser, dry_run, logger)
    
    # Process DAST findings
    logger.info("Processing DAST findings")
    
    # Nikto
    nikto_files = glob.glob(str(findings_dir / 'dast' / 'nikto*.json'))
    nikto_parser = NiktoParser(config.get('nikto', {}), schema)
    for file in nikto_files:
        process_file(file, nikto_parser, dry_run, logger)
        
    # Wapiti
    wapiti_files = glob.glob(str(findings_dir / 'dast' / 'wapiti*.json'))
    wapiti_parser = WapitiParser(config.get('wapiti', {}), schema)
    for file in wapiti_files:
        process_file(file, wapiti_parser, dry_run, logger)
        
    # ZAP
    zap_files = glob.glob(str(findings_dir / 'dast' / 'zaproxy' / '*.json'))
    zap_parser = ZAPParser(config.get('zap', {}), schema)
    for file in zap_files:
        process_file(file, zap_parser, dry_run, logger)
        
    # Burp Suite
    burp_files = glob.glob(str(findings_dir / 'dast' / 'burpsuite*.json'))
    burp_parser = BurpSuiteParser(config.get('burpsuite', {}), schema)
    for file in burp_files:
        process_file(file, burp_parser, dry_run, logger)
        
    logger.info("ETL pipeline completed successfully")

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Run ETL pipeline')
    parser.add_argument('--dry-run', action='store_true', help='Skip writing output')
    parser.add_argument('--log-level', default='INFO', help='Logging level')
    
    args = parser.parse_args()
    main(args.dry_run, args.log_level) 