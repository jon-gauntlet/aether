#!/usr/bin/env python3
"""Main ETL runner for security findings normalization."""

import argparse
import glob
import importlib
import json
import logging
import os
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import yaml

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('etl-process.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)


def load_config() -> Dict[str, Any]:
    """Load parser configurations from YAML."""
    config_path = Path(__file__).parent / 'config' / 'parser_configs.yaml'
    try:
        with open(config_path) as f:
            return yaml.safe_load(f)
    except Exception as e:
        logger.error(f"Failed to load config: {e}")
        raise


def get_parser_class(config: Dict[str, Any]) -> Any:
    """Dynamically import and return parser class.
    
    Args:
        config: Parser configuration dictionary
        
    Returns:
        Parser class
    """
    try:
        module_path = config['parser_module']
        class_name = config['parser_class']
        
        # Import relative to scripts.etl package
        module = importlib.import_module(f"scripts.etl.{module_path}")
        return getattr(module, class_name)
    except Exception as e:
        logger.error(f"Failed to load parser class: {e}")
        raise


def process_file(file_path: Path, parser_config: Dict[str, Any], 
                global_config: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], List[str]]:
    """Process a single findings file.
    
    Args:
        file_path: Path to findings file
        parser_config: Configuration for this parser
        global_config: Global configuration settings
        
    Returns:
        Tuple of (normalized findings list, error messages list)
    """
    errors = []
    findings = []
    
    try:
        # Initialize parser
        parser_class = get_parser_class(parser_config)
        parser = parser_class(
            config=parser_config,
            schema_path=global_config['schema_path']
        )
        
        # Load and parse file
        content = parser.load_file(file_path)
        findings = parser.parse(content)
        
        logger.info(f"Successfully processed {file_path}: {len(findings)} findings")
        
    except Exception as e:
        error_msg = f"Error processing {file_path}: {str(e)}"
        logger.error(error_msg)
        errors.append(error_msg)
        
        if not global_config.get('error_handling', {}).get('skip_on_error', False):
            raise
            
    return findings, errors


def save_findings(findings: List[Dict[str, Any]], output_dir: Path,
                 source_type: str, tool_name: str) -> None:
    """Save normalized findings to output directory.
    
    Args:
        findings: List of normalized findings
        output_dir: Base output directory
        source_type: Type of source (sast/dast/llm)
        tool_name: Name of the tool
    """
    # Create output directory structure
    tool_dir = output_dir / source_type / tool_name
    tool_dir.mkdir(parents=True, exist_ok=True)
    
    # Save findings
    output_file = tool_dir / 'normalized_findings.json'
    with open(output_file, 'w') as f:
        json.dump(findings, f, indent=2)
        
    logger.info(f"Saved {len(findings)} findings to {output_file}")


def main(args: Optional[argparse.Namespace] = None) -> int:
    """Main ETL process.
    
    Args:
        args: Parsed command line arguments
        
    Returns:
        Exit code (0 for success, non-zero for error)
    """
    if args is None:
        parser = argparse.ArgumentParser(description='Security findings ETL pipeline')
        parser.add_argument('--sources', nargs='+', choices=['sast', 'dast', 'llm'],
                          help='Source types to process (default: all)')
        parser.add_argument('--dry-run', action='store_true',
                          help='Validate and test without saving output')
        parser.add_argument('--log-level', choices=['DEBUG', 'INFO', 'WARNING', 'ERROR'],
                          default='INFO', help='Logging level')
        args = parser.parse_args()

    # Set log level
    logging.getLogger().setLevel(getattr(logging, args.log_level))

    try:
        # Load configuration
        config = load_config()
        global_config = config['global']
        
        # Determine which sources to process
        sources = args.sources if args.sources else ['sast', 'dast', 'llm']
        
        all_findings = []
        all_errors = []
        
        # Process each source type
        for source_type in sources:
            if source_type not in config:
                logger.warning(f"No configuration found for source type: {source_type}")
                continue
                
            # Process each tool for this source type
            for tool_name, tool_config in config[source_type].items():
                logger.info(f"Processing {tool_name} ({source_type})...")
                
                # Find matching files
                file_pattern = tool_config['file_pattern']
                matching_files = glob.glob(file_pattern, recursive=True)
                
                if not matching_files:
                    logger.warning(f"No files found matching pattern: {file_pattern}")
                    continue
                
                # Process files in parallel
                with ThreadPoolExecutor(max_workers=global_config['max_workers']) as executor:
                    future_to_file = {
                        executor.submit(process_file, Path(f), tool_config, global_config): f
                        for f in matching_files
                    }
                    
                    # Collect results
                    source_findings = []
                    for future in future_to_file:
                        findings, errors = future.result()
                        source_findings.extend(findings)
                        all_errors.extend(errors)
                
                if not args.dry_run:
                    # Save normalized findings
                    save_findings(
                        findings=source_findings,
                        output_dir=Path(global_config['output_dir']),
                        source_type=source_type,
                        tool_name=tool_name
                    )
                    
                all_findings.extend(source_findings)
        
        # Report results
        logger.info(f"\nETL Process Complete:")
        logger.info(f"Total findings processed: {len(all_findings)}")
        logger.info(f"Total errors encountered: {len(all_errors)}")
        
        if all_errors:
            logger.warning("Errors encountered during processing:")
            for error in all_errors:
                logger.warning(f"  - {error}")
        
        return 1 if all_errors else 0
        
    except Exception as e:
        logger.error(f"ETL process failed: {e}", exc_info=True)
        return 1


if __name__ == '__main__':
    sys.exit(main()) 