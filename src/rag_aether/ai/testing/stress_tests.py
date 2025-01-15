"""Stress test framework for RAG system."""
import asyncio
import time
import numpy as np
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
import psutil
import logging
from pathlib import Path
import random
import threading
from concurrent.futures import ThreadPoolExecutor

from ..performance_system import PerformanceMonitor
from ..hybrid_search import HybridSearcher
from ..query_expansion import QueryExpander
from ..quality_system import QualitySystem
from .performance_tests import PerformanceResult

@dataclass
class StressTestConfig:
    """Stress test configuration."""
    duration_seconds: int = 300
    ramp_up_seconds: int = 30
    max_concurrent_users: int = 100
    requests_per_second: float = 10.0
    error_threshold: float = 0.01
    latency_threshold: float = 2.0
    memory_threshold_gb: float = 8.0

@dataclass
class StressTestResult:
    """Stress test result."""
    duration: float
    total_requests: int
    successful_requests: int
    failed_requests: int
    avg_latency: float
    p95_latency: float
    p99_latency: float
    max_latency: float
    avg_memory_gb: float
    max_memory_gb: float
    avg_cpu_percent: float
    error_rate: float
    metadata: Dict[str, Any]

class RAGStressTests:
    """Stress tests for RAG system."""
    
    def __init__(
        self,
        config: Optional[StressTestConfig] = None,
        monitor: Optional[PerformanceMonitor] = None
    ):
        """Initialize stress tests.
        
        Args:
            config: Stress test configuration
            monitor: Performance monitor instance
        """
        self.config = config or StressTestConfig()
        self.monitor = monitor or PerformanceMonitor()
        
        # Initialize components
        self.searcher = HybridSearcher(
            cache_embeddings=True,
            cache_results=True
        )
        self.expander = QueryExpander(
            cache_variations=True,
            cache_embeddings=True
        )
        self.quality = QualitySystem()
        
        self.logger = logging.getLogger("stress_tests")
        
        # Test state
        self.is_running = False
        self.start_time = 0
        self.latencies = []
        self.errors = []
        self.memory_samples = []
        self.cpu_samples = []
        
    async def setup_test_data(self, num_documents: int = 10000):
        """Set up test data.
        
        Args:
            num_documents: Number of test documents
        """
        # Generate test documents
        self.documents = [
            f"Document {i} containing test content for stress testing."
            for i in range(num_documents)
        ]
        
        self.metadata = [
            {
                "id": str(i),
                "type": "test",
                "length": len(self.documents[i])
            }
            for i in range(num_documents)
        ]
        
        # Index documents
        await self.searcher.index_documents(self.documents, self.metadata)
        
    def _generate_random_query(self) -> str:
        """Generate a random test query."""
        templates = [
            "what is {}",
            "how to {}",
            "explain {}",
            "describe {}",
            "compare {} and {}",
            "analyze {}"
        ]
        topics = [
            "machine learning",
            "data science",
            "artificial intelligence",
            "neural networks",
            "deep learning",
            "natural language processing"
        ]
        template = random.choice(templates)
        topics_needed = template.count("{}")
        selected_topics = random.sample(topics, topics_needed)
        return template.format(*selected_topics)
        
    async def _process_query(self, query: str) -> Tuple[bool, float]:
        """Process a single query end-to-end.
        
        Args:
            query: Query string
            
        Returns:
            Tuple of (success, latency)
        """
        start = time.time()
        try:
            # 1. Query expansion
            expanded = await self.expander.expand_query(query)
            if not expanded.variations:
                return False, time.time() - start
                
            # 2. Search
            results = await self.searcher.search(
                expanded.variations[0]
            )
            if not results:
                return False, time.time() - start
                
            # 3. Quality evaluation
            quality = await self.quality.evaluate_response(
                query=query,
                response=results[0].content
            )
            success = all(v >= 0.5 for v in quality.values())
            return success, time.time() - start
            
        except Exception as e:
            self.logger.error(f"Query processing error: {e}")
            return False, time.time() - start
            
    async def _resource_monitor(self):
        """Monitor system resources during test."""
        while self.is_running:
            try:
                resources = self.monitor.get_resource_usage()
                memory_gb = resources.memory_percent * psutil.virtual_memory().total / (1024**3)
                self.memory_samples.append(memory_gb)
                self.cpu_samples.append(resources.cpu_percent)
            except Exception as e:
                self.logger.error(f"Resource monitoring error: {e}")
            await asyncio.sleep(1)
            
    async def _load_generator(self):
        """Generate load according to test configuration."""
        current_users = 0
        request_interval = 1.0 / self.config.requests_per_second
        
        while self.is_running:
            elapsed = time.time() - self.start_time
            
            # Ramp up phase
            if elapsed < self.config.ramp_up_seconds:
                target_users = int(
                    (elapsed / self.config.ramp_up_seconds) *
                    self.config.max_concurrent_users
                )
            else:
                target_users = self.config.max_concurrent_users
                
            # Adjust concurrent users
            while current_users < target_users:
                asyncio.create_task(self._user_session())
                current_users += 1
                
            await asyncio.sleep(request_interval)
            
    async def _user_session(self):
        """Simulate a user session."""
        while self.is_running:
            query = self._generate_random_query()
            success, latency = await self._process_query(query)
            
            self.latencies.append(latency)
            if not success:
                self.errors.append(time.time())
                
            # Random think time between requests
            think_time = random.uniform(0.5, 3.0)
            await asyncio.sleep(think_time)
            
    async def run_stress_test(self) -> StressTestResult:
        """Run stress test.
        
        Returns:
            Stress test results
        """
        # Initialize test
        self.is_running = True
        self.start_time = time.time()
        self.latencies = []
        self.errors = []
        self.memory_samples = []
        self.cpu_samples = []
        
        # Start monitoring and load generation
        monitor_task = asyncio.create_task(self._resource_monitor())
        load_task = asyncio.create_task(self._load_generator())
        
        # Run for configured duration
        await asyncio.sleep(self.config.duration_seconds)
        
        # Stop test
        self.is_running = False
        await asyncio.gather(monitor_task, load_task)
        
        # Calculate results
        duration = time.time() - self.start_time
        total_requests = len(self.latencies)
        failed_requests = len(self.errors)
        successful_requests = total_requests - failed_requests
        
        if total_requests > 0:
            latencies = np.array(self.latencies)
            avg_latency = np.mean(latencies)
            p95_latency = np.percentile(latencies, 95)
            p99_latency = np.percentile(latencies, 99)
            max_latency = np.max(latencies)
            error_rate = failed_requests / total_requests
        else:
            avg_latency = p95_latency = p99_latency = max_latency = error_rate = 0
            
        if self.memory_samples:
            avg_memory_gb = np.mean(self.memory_samples)
            max_memory_gb = np.max(self.memory_samples)
        else:
            avg_memory_gb = max_memory_gb = 0
            
        if self.cpu_samples:
            avg_cpu_percent = np.mean(self.cpu_samples)
        else:
            avg_cpu_percent = 0
            
        return StressTestResult(
            duration=duration,
            total_requests=total_requests,
            successful_requests=successful_requests,
            failed_requests=failed_requests,
            avg_latency=avg_latency,
            p95_latency=p95_latency,
            p99_latency=p99_latency,
            max_latency=max_latency,
            avg_memory_gb=avg_memory_gb,
            max_memory_gb=max_memory_gb,
            avg_cpu_percent=avg_cpu_percent,
            error_rate=error_rate,
            metadata={
                "config": self.config.__dict__,
                "expansion_cache_hits": self.expander.variation_cache.stats.hits,
                "expansion_cache_misses": self.expander.variation_cache.stats.misses,
                "search_cache_hits": self.searcher.query_cache.stats.hits,
                "search_cache_misses": self.searcher.query_cache.stats.misses
            }
        )
        
    def assert_stress_test(self, result: StressTestResult):
        """Assert stress test results meet requirements.
        
        Args:
            result: Stress test result
        """
        # Check error rate
        assert result.error_rate <= self.config.error_threshold, (
            f"Error rate {result.error_rate:.1%} exceeds threshold "
            f"{self.config.error_threshold:.1%}"
        )
        
        # Check latency
        assert result.p95_latency <= self.config.latency_threshold, (
            f"P95 latency {result.p95_latency:.3f}s exceeds threshold "
            f"{self.config.latency_threshold:.3f}s"
        )
        
        # Check memory usage
        assert result.max_memory_gb <= self.config.memory_threshold_gb, (
            f"Max memory usage {result.max_memory_gb:.1f}GB exceeds threshold "
            f"{self.config.memory_threshold_gb:.1f}GB"
        )
        
    async def run_load_test(
        self,
        duration_seconds: int = 3600,
        requests_per_second: float = 1.0
    ) -> StressTestResult:
        """Run extended load test.
        
        Args:
            duration_seconds: Test duration in seconds
            requests_per_second: Target request rate
            
        Returns:
            Load test results
        """
        config = StressTestConfig(
            duration_seconds=duration_seconds,
            ramp_up_seconds=60,
            max_concurrent_users=int(requests_per_second * 2),
            requests_per_second=requests_per_second,
            error_threshold=0.001,
            latency_threshold=1.0,
            memory_threshold_gb=4.0
        )
        
        self.config = config
        return await self.run_stress_test() 