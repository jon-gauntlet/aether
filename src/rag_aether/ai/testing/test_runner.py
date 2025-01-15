"""Test runner for integrating all RAG system test suites."""
import pytest
import asyncio
import logging
from pathlib import Path
from typing import List, Dict, Any
import json
import time

from .e2e_tests import E2ETests
from .deployment_tests import DeploymentTests
from .react_component_tests import ReactComponentTests
from .rag_feature_tests import RAGFeatureTests
from ..performance_system import PerformanceMonitor
from ..quality_system import QualitySystem

class TestRunner:
    """Integrated test runner for all RAG system test suites."""
    
    def __init__(self, 
                 stage: str = "dev",
                 aws_region: str = "us-west-2",
                 log_path: str = None):
        """Initialize test runner.
        
        Args:
            stage: Deployment stage
            aws_region: AWS region
            log_path: Path for test logs
        """
        self.stage = stage
        self.region = aws_region
        self.log_path = Path(log_path or "test_logs")
        self.log_path.mkdir(parents=True, exist_ok=True)
        
        # Initialize test suites
        self.e2e = E2ETests()
        self.deployment = DeploymentTests(aws_region=aws_region, stage=stage)
        self.react = ReactComponentTests()
        self.rag = RAGFeatureTests()
        
        # Monitoring
        self.monitor = PerformanceMonitor()
        self.quality = QualitySystem()
        
        # Configure logging
        self.setup_logging()
        
    def setup_logging(self):
        """Set up logging configuration."""
        log_file = self.log_path / f"test_run_{int(time.time())}.log"
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler()
            ]
        )
        
        self.logger = logging.getLogger(__name__)
        
    async def setup(self):
        """Set up test environment."""
        self.logger.info("Setting up test environment")
        
        # Initialize all test suites
        await asyncio.gather(
            self.e2e.setup(),
            self.react.setup(),
            self.rag.setup()
        )
        
        self.logger.info("Test environment ready")
        
    async def teardown(self):
        """Clean up test environment."""
        self.logger.info("Cleaning up test environment")
        
        await asyncio.gather(
            self.e2e.teardown(),
            self.react.teardown(),
            self.rag.teardown()
        )
        
        self.logger.info("Cleanup complete")
        
    async def run_e2e_tests(self):
        """Run end-to-end tests."""
        self.logger.info("Running E2E tests")
        
        try:
            await self.e2e.test_chat_interaction()
            await self.e2e.test_context_preservation()
            await self.e2e.test_error_handling()
            await self.e2e.test_performance_metrics()
            self.logger.info("E2E tests passed")
            return True
        except Exception as e:
            self.logger.error(f"E2E tests failed: {str(e)}")
            return False
            
    async def run_deployment_tests(self):
        """Run deployment tests."""
        self.logger.info("Running deployment tests")
        
        try:
            await self.deployment.test_infrastructure()
            await self.deployment.test_api_endpoints()
            await self.deployment.test_logging()
            await self.deployment.test_performance()
            self.logger.info("Deployment tests passed")
            return True
        except Exception as e:
            self.logger.error(f"Deployment tests failed: {str(e)}")
            return False
            
    async def run_react_tests(self):
        """Run React component tests."""
        self.logger.info("Running React component tests")
        
        try:
            await self.react.test_chat_input()
            await self.react.test_message_display()
            await self.react.test_code_block()
            await self.react.test_error_components()
            await self.react.test_theme_switching()
            self.logger.info("React component tests passed")
            return True
        except Exception as e:
            self.logger.error(f"React component tests failed: {str(e)}")
            return False
            
    async def run_rag_tests(self):
        """Run RAG feature tests."""
        self.logger.info("Running RAG feature tests")
        
        try:
            await self.rag.test_context_preservation()
            await self.rag.test_query_expansion()
            await self.rag.test_response_quality()
            await self.rag.test_hybrid_search()
            self.logger.info("RAG feature tests passed")
            return True
        except Exception as e:
            self.logger.error(f"RAG feature tests failed: {str(e)}")
            return False
            
    async def run_all_tests(self) -> Dict[str, bool]:
        """Run all test suites.
        
        Returns:
            Dict with test suite results
        """
        self.logger.info("Starting full test run")
        
        await self.setup()
        
        try:
            results = {
                'e2e': await self.run_e2e_tests(),
                'deployment': await self.run_deployment_tests(),
                'react': await self.run_react_tests(),
                'rag': await self.run_rag_tests()
            }
            
            # Generate test report
            self.generate_report(results)
            
            return results
            
        finally:
            await self.teardown()
            
    def generate_report(self, results: Dict[str, bool]):
        """Generate test run report.
        
        Args:
            results: Test suite results
        """
        report_path = self.log_path / f"test_report_{int(time.time())}.json"
        
        report = {
            'timestamp': time.time(),
            'stage': self.stage,
            'results': results,
            'metrics': {
                'performance': self.monitor.get_summary_metrics(),
                'quality': self.quality.get_summary_metrics()
            }
        }
        
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
            
        self.logger.info(f"Test report generated: {report_path}")
        
# Test fixtures
@pytest.fixture
async def test_runner():
    """Create test runner instance."""
    runner = TestRunner()
    await runner.setup()
    yield runner
    await runner.teardown()
    
# Test cases
@pytest.mark.asyncio
async def test_full_suite(test_runner):
    """Run full test suite."""
    results = await test_runner.run_all_tests()
    assert all(results.values()), "Some tests failed" 