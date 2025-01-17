"""Test runner for integrating all RAG system test suites."""
import pytest
import asyncio
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
import json
import time
import traceback
from datetime import datetime

from .e2e_tests import E2ETests
from .deployment_tests import DeploymentTests
from .react_component_tests import ReactComponentTests
from .rag_feature_tests import RAGFeatureTests
from ..performance_system import PerformanceMonitor
from ..quality_system import QualitySystem

class TestError(Exception):
    """Custom error for test failures."""
    def __init__(self, message: str, suite: str, error: Optional[Exception] = None):
        self.message = message
        self.suite = suite
        self.error = error
        super().__init__(self.message)

@pytest.fixture
async def test_runner(tmp_path):
    """Create test runner instance with temporary log path."""
    stage = "dev"
    aws_region = "us-west-2"
    log_path = tmp_path / "test_logs"
    log_path.mkdir(parents=True, exist_ok=True)
    
    # Configure logging
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = log_path / f"test_run_{timestamp}.log"
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler()
        ]
    )
    
    logger = logging.getLogger(__name__)
    
    try:
        # Initialize components
        monitor = PerformanceMonitor()
        quality = QualitySystem()
        e2e = E2ETests()
        deployment = DeploymentTests(aws_region=aws_region, stage=stage)
        react = ReactComponentTests()
        rag = RAGFeatureTests()
        
        # Set up test environment
        logger.info("Setting up test environment...")
        await asyncio.gather(
            e2e.setup(),
            react.setup(),
            rag.setup()
        )
        logger.info("Test environment setup complete")
        
        yield {
            'monitor': monitor,
            'quality': quality,
            'e2e': e2e,
            'deployment': deployment,
            'react': react,
            'rag': rag,
            'log_path': log_path,
            'logger': logger
        }
        
    except Exception as e:
        logger.error(f"Error during test setup: {str(e)}")
        logger.error(traceback.format_exc())
        raise
        
    finally:
        # Clean up
        logger.info("Cleaning up test environment...")
        try:
            await asyncio.gather(
                e2e.teardown(),
                react.teardown(),
                rag.teardown()
            )
            logger.info("Test environment cleanup complete")
        except Exception as e:
            logger.error(f"Error during cleanup: {str(e)}")
            logger.error(traceback.format_exc())

async def run_test_suite(suite_name: str, suite_runner, logger) -> Dict[str, Any]:
    """Run a test suite with error handling and reporting.
    
    Args:
        suite_name: Name of the test suite
        suite_runner: Function to run the suite
        logger: Logger instance
        
    Returns:
        Dict containing test results and metadata
    """
    start_time = time.time()
    logger.info(f"Starting {suite_name} test suite")
    
    try:
        results = await suite_runner()
        duration = time.time() - start_time
        
        return {
            'success': True,
            'duration': duration,
            'error': None,
            'results': results
        }
        
    except Exception as e:
        duration = time.time() - start_time
        logger.error(f"Error in {suite_name} suite: {str(e)}")
        logger.error(traceback.format_exc())
        
        return {
            'success': False,
            'duration': duration,
            'error': {
                'type': type(e).__name__,
                'message': str(e),
                'traceback': traceback.format_exc()
            },
            'results': None
        }

@pytest.mark.asyncio
async def test_full_suite(test_runner):
    """Run full test suite with comprehensive reporting."""
    logger = test_runner['logger']
    start_time = time.time()
    
    # Run all test suites
    results = {
        'e2e': await run_test_suite('E2E', test_runner['e2e'].run_all_tests, logger),
        'deployment': await run_test_suite('Deployment', test_runner['deployment'].run_all_tests, logger),
        'react': await run_test_suite('React', test_runner['react'].run_all_tests, logger),
        'rag': await run_test_suite('RAG', test_runner['rag'].run_all_tests, logger)
    }
    
    # Generate detailed report
    total_duration = time.time() - start_time
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_path = test_runner['log_path'] / f"test_report_{timestamp}.json"
    
    report = {
        'timestamp': timestamp,
        'total_duration': total_duration,
        'results': results,
        'metrics': {
            'performance': test_runner['monitor'].get_summary_metrics(),
            'quality': test_runner['quality'].get_summary_metrics()
        },
        'summary': {
            'total_suites': len(results),
            'passed_suites': sum(1 for r in results.values() if r['success']),
            'failed_suites': sum(1 for r in results.values() if not r['success'])
        }
    }
    
    with open(report_path, 'w') as f:
        json.dump(report, f, indent=2)
    
    logger.info(f"Test report generated: {report_path}")
    
    # Check for failures
    failed_suites = [
        suite for suite, result in results.items() 
        if not result['success']
    ]
    
    if failed_suites:
        error_msg = f"Test suites failed: {', '.join(failed_suites)}"
        logger.error(error_msg)
        raise TestError(error_msg, failed_suites[0]) 