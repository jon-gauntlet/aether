#!/usr/bin/env python3
"""Script to run all tests in the project."""

import asyncio
import sys
from pathlib import Path
import logging
import json
from datetime import datetime
import pytest
import tempfile

# Add project root to Python path
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

from src.rag_aether.ai.testing.test_runner import test_runner, test_full_suite

async def main():
    """Run all tests and generate report."""
    # Configure logging
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_dir = project_root / "logs" / "tests"
    log_dir.mkdir(parents=True, exist_ok=True)
    log_file = log_dir / f"test_run_{timestamp}.log"
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler()
        ]
    )
    
    logger = logging.getLogger(__name__)
    logger.info("Starting full test suite")
    
    try:
        # Create temporary directory for test logs
        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            
            # Initialize test runner
            async with test_runner(tmp_path) as runner:
                # Run all tests
                await test_full_suite(runner)
                
            logger.info("All tests completed successfully")
            return 0
        
    except Exception as e:
        logger.error(f"Error running tests: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(asyncio.run(main())) 