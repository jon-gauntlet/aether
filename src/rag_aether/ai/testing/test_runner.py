"""Test runner for integrating all RAG system test suites."""
import pytest
import asyncio
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional, Callable, AsyncGenerator
import json
import time
import traceback
from datetime import datetime
import importlib.util
import sys
import os
from contextlib import asynccontextmanager

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

class TestSuite:
    """Base class for test suites."""
    def __init__(self, name: str, path: Path, logger: logging.Logger):
        self.name = name
        self.path = path
        self.logger = logger
        self.tests = []
        
    async def setup(self):
        """Set up test suite."""
        pass
        
    async def teardown(self):
        """Clean up test suite."""
        pass
        
    def discover_tests(self):
        """Discover tests in the suite."""
        if not self.path.exists():
            self.logger.warning(f"Test path does not exist: {self.path}")
            return
            
        seen_files = set()
        for file in self.path.rglob("test_*.py"):
            if file.is_file():
                # Use relative path to deduplicate
                rel_path = file.relative_to(self.path)
                if rel_path not in seen_files:
                    self.logger.info(f"Discovered test file: {file}")
                    self.tests.append(file)
                    seen_files.add(rel_path)
                
    async def run_tests(self) -> Dict[str, Any]:
        """Run all tests in the suite."""
        results = []
        for test_file in self.tests:
            try:
                # Import test module
                spec = importlib.util.spec_from_file_location(
                    test_file.stem, 
                    test_file
                )
                module = importlib.util.module_from_spec(spec)
                sys.modules[test_file.stem] = module
                spec.loader.exec_module(module)
                
                # Run pytest on the module
                pytest_args = [
                    "-v",
                    "--tb=short",
                    "--asyncio-mode=auto",
                    str(test_file)
                ]
                result = pytest.main(pytest_args)
                
                results.append({
                    'file': str(test_file),
                    'success': result == 0,
                    'exit_code': result
                })
                
            except Exception as e:
                self.logger.error(f"Error running tests in {test_file}: {str(e)}")
                self.logger.error(traceback.format_exc())
                results.append({
                    'file': str(test_file),
                    'success': False,
                    'error': {
                        'type': type(e).__name__,
                        'message': str(e),
                        'traceback': traceback.format_exc()
                    }
                })
                
        return {
            'total': len(results),
            'passed': sum(1 for r in results if r['success']),
            'failed': sum(1 for r in results if not r['success']),
            'details': results
        }

@asynccontextmanager
async def test_runner(tmp_path: Path) -> AsyncGenerator[Dict[str, Any], None]:
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
        # Get project root
        project_root = Path(__file__).parent.parent.parent.parent.parent
        
        # Initialize components
        monitor = PerformanceMonitor()
        quality = QualitySystem()
        
        # Initialize test suites
        suites = {
            'unit': TestSuite('Unit Tests', project_root / 'tests', logger),
            'integration': TestSuite('Integration Tests', project_root / 'tests/rag_aether/ai', logger),
            'tools': TestSuite('Tool Tests', project_root / 'tools', logger),
            'scripts': TestSuite('Script Tests', project_root / 'scripts', logger),
            'e2e': E2ETests(),
            'deployment': DeploymentTests(aws_region=aws_region, stage=stage),
            'react': ReactComponentTests(),
            'rag': RAGFeatureTests()
        }
        
        # Discover tests
        for suite in suites.values():
            if hasattr(suite, 'discover_tests'):
                suite.discover_tests()
        
        # Set up test environment
        logger.info("Setting up test environment...")
        setup_tasks = [
            suite.setup() for suite in suites.values()
            if hasattr(suite, 'setup')
        ]
        await asyncio.gather(*setup_tasks)
        logger.info("Test environment setup complete")
        
        yield {
            'monitor': monitor,
            'quality': quality,
            'suites': suites,
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
            cleanup_tasks = [
                suite.teardown() for suite in suites.values()
                if hasattr(suite, 'teardown')
            ]
            await asyncio.gather(*cleanup_tasks)
            logger.info("Test environment cleanup complete")
        except Exception as e:
            logger.error(f"Error during cleanup: {str(e)}")
            logger.error(traceback.format_exc())

async def run_test_suite(suite_name: str, suite_runner: Callable, logger: logging.Logger) -> Dict[str, Any]:
    """Run a test suite with error handling and reporting."""
    start_time = time.time()
    logger.info(f"Starting {suite_name} test suite")
    
    try:
        if asyncio.iscoroutinefunction(suite_runner):
            results = await suite_runner()
        else:
            results = await asyncio.to_thread(suite_runner)
            
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

async def test_full_suite(test_runner: Dict[str, Any]):
    """Run full test suite with comprehensive reporting."""
    logger = test_runner['logger']
    start_time = time.time()
    
    # Run all test suites
    results = {}
    for name, suite in test_runner['suites'].items():
        if hasattr(suite, 'run_tests'):
            results[name] = await run_test_suite(name, suite.run_tests, logger)
        elif hasattr(suite, 'run_all_tests'):
            results[name] = await run_test_suite(name, suite.run_all_tests, logger)
    
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