"""Main ETL runner script for security findings."""

import argparse
import json
import logging
import os
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Any, Dict, List, Optional, Type

import yaml

from .parsers.base_parser import BaseParser
from .parsers.dast.nikto_parser import NiktoParser
from .parsers.dast.wapiti_parser import WapitiParser
from .parsers.dast.zap_parser import ZAPParser
from .parsers.llm.claude_parser import ClaudeParser
from .parsers.sast.bearer_parser import BearerParser
from .parsers.sast.brakeman_parser import BrakemanParser


def setup_logging(level: str = 'INFO') -> None:
    """Set up logging configuration.
    
    Args:
        level: Logging level (default: INFO)
    """
    logging.basicConfig(
        level=getattr(logging, level.upper()),
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


def get_parser_class(source_type: str) -> Type[BaseParser]:
    """Get appropriate parser class for source type.
    
    Args:
        source_type: Source type string
        
    Returns:
        Parser class
        
    Raises:
        ValueError: If source type is not supported
    """
    parser_map = {
        'nikto': NiktoParser,
        'wapiti': WapitiParser,
        'zap': ZAPParser,
        'claude': ClaudeParser,
        'bearer': BearerParser,
        'brakeman': BrakemanParser
    }
    
    if source_type not in parser_map:
        raise ValueError(f"Unsupported source type: {source_type}")
        
    return parser_map[source_type]


def process_file(file_path: Path, parser: BaseParser, dry_run: bool = False) -> Optional[List[Dict[str, Any]]]:
    """Process a single findings file.
    
    Args:
        file_path: Path to findings file
        parser: Parser instance to use
        dry_run: Whether to skip saving results
        
    Returns:
        List of normalized findings if dry_run is True, None otherwise
    """
    logger = logging.getLogger('process_file')
    logger.info(f"Processing {file_path}")
    
    try:
        # Load and parse file
        with open(file_path) as f:
            content = json.load(f)
            
        # Parse findings
        findings = parser.parse(content)
        logger.info(f"Found {len(findings)} findings in {file_path}")
        
        if dry_run:
            return findings
            
        # Save normalized findings
        output_path = Path('data/normalized_findings') / f"{file_path.stem}_normalized.json"
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w') as f:
            json.dump(findings, f, indent=2)
            
        logger.info(f"Saved normalized findings to {output_path}")
        
    except Exception as e:
        logger.error(f"Failed to process {file_path}: {e}")
        if not parser.config.get('skip_on_error', False):
            raise
            
    return None


def main() -> None:
    """Main ETL function."""
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Security findings ETL pipeline')
    parser.add_argument('--config', default='scripts/etl/config/parser_configs.yaml',
                      help='Path to parser configs YAML')
    parser.add_argument('--schema', default='data/schemas/normalized_finding.json',
                      help='Path to normalized schema JSON')
    parser.add_argument('--source-types', nargs='+',
                      help='Source types to process (default: all)')
    parser.add_argument('--dry-run', action='store_true',
                      help='Validate and print findings without saving')
    parser.add_argument('--log-level', default='INFO',
                      choices=['DEBUG', 'INFO', 'WARNING', 'ERROR'],
                      help='Logging level')
    args = parser.parse_args()
    
    # Set up logging
    setup_logging(args.log_level)
    logger = logging.getLogger('main')
    
    try:
        # Load configurations
        config = load_config(args.config)
        schema = load_schema(args.schema)
        
        # Get source types to process, excluding 'defaults' section
        available_sources = [k for k in config.keys() if k != 'defaults']
        source_types = args.source_types or available_sources
        
        # Process each source type
        for source_type in source_types:
            logger.info(f"Processing {source_type} findings")
            
            # Skip defaults section
            if source_type == 'defaults':
                continue
                
            # Get parser class and config
            parser_class = get_parser_class(source_type)
            parser_config = config[source_type]
            
            # Create parser instance
            parser = parser_class(parser_config, schema)
            
            # Get files to process
            source_dir = Path(parser_config['source_dir'])
            pattern = parser_config.get('file_pattern', '*.json')
            files = list(source_dir.glob(pattern))
            
            if not files:
                logger.warning(f"No files found matching {pattern} in {source_dir}")
                continue
                
            logger.info(f"Found {len(files)} files to process")
            
            # Process files in parallel
            with ThreadPoolExecutor() as executor:
                futures = []
                for file_path in files:
                    future = executor.submit(process_file, file_path, parser, args.dry_run)
                    futures.append(future)
                    
                # Wait for all files to be processed
                for future in futures:
                    try:
                        findings = future.result()
                        if args.dry_run and findings:
                            print(json.dumps(findings, indent=2))
                    except Exception as e:
                        logger.error(f"Failed to process file: {e}")
                        if not parser_config.get('skip_on_error', False):
                            raise
                            
        logger.info("ETL pipeline completed successfully")
        
    except Exception as e:
        logger.error(f"ETL pipeline failed: {e}")
        raise


if __name__ == '__main__':
    main() 