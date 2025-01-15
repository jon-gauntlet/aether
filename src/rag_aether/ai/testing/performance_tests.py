"""Performance test suite for RAG system."""
import pytest
import asyncio
import time
import numpy as np
from typing import Dict, Any, List, Tuple, Optional
from dataclasses import dataclass
import psutil
import torch
import logging
from pathlib import Path

from ..performance_system import PerformanceMonitor
from ..hybrid_search import HybridSearcher
from ..query_expansion import QueryExpander
from ..quality_system import QualitySystem

@dataclass
class PerformanceResult:
    """Performance test result."""
    operation: str
    latency: float
    throughput: float
    memory_usage: float
    cpu_usage: float
    gpu_usage: Optional[float]
    success_rate: float
    metadata: Dict[str, Any]

class RAGPerformanceTests:
    """Performance tests for RAG system."""
    
    def __init__(
        self,
        monitor: Optional[PerformanceMonitor] = None,
        target_latency: float = 1.0,
        target_throughput: float = 10.0,
        target_memory_gb: float = 4.0,
        target_success_rate: float = 0.99
    ):
        """Initialize performance tests.
        
        Args:
            monitor: Performance monitor instance
            target_latency: Target latency in seconds
            target_throughput: Target throughput in ops/second
            target_memory_gb: Target memory usage in GB
            target_success_rate: Target success rate
        """
        self.monitor = monitor or PerformanceMonitor()
        self.target_latency = target_latency
        self.target_throughput = target_throughput
        self.target_memory_gb = target_memory_gb
        self.target_success_rate = target_success_rate
        
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
        
        self.logger = logging.getLogger("performance_tests")
        
    async def setup_test_data(self, num_documents: int = 1000):
        """Set up test data.
        
        Args:
            num_documents: Number of test documents
        """
        # Generate test documents
        self.documents = [
            f"Document {i} containing test content for performance testing."
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
        
    async def test_search_performance(
        self,
        num_queries: int = 100,
        concurrent: bool = True
    ) -> PerformanceResult:
        """Test search performance.
        
        Args:
            num_queries: Number of test queries
            concurrent: Whether to run queries concurrently
            
        Returns:
            Performance test results
        """
        queries = [
            f"test query {i}" for i in range(num_queries)
        ]
        
        async def search_query(query: str) -> bool:
            try:
                results = await self.searcher.search(query)
                return len(results) > 0
            except Exception as e:
                self.logger.error(f"Search error: {e}")
                return False
                
        with self.monitor.measure("search_performance") as perf:
            start = time.time()
            successes = 0
            
            if concurrent:
                # Run queries concurrently
                tasks = [search_query(q) for q in queries]
                results = await asyncio.gather(*tasks)
                successes = sum(results)
            else:
                # Run queries sequentially
                for query in queries:
                    if await search_query(query):
                        successes += 1
                        
            duration = time.time() - start
            
            # Update performance context
            perf.set_batch_size(num_queries)
            perf.add_metadata({
                "concurrent": concurrent,
                "num_queries": num_queries
            })
            
        # Get resource usage
        resources = self.monitor.get_resource_usage()
        
        return PerformanceResult(
            operation="search",
            latency=duration / num_queries,
            throughput=num_queries / duration,
            memory_usage=resources.memory_percent,
            cpu_usage=resources.cpu_percent,
            gpu_usage=resources.gpu_percent,
            success_rate=successes / num_queries,
            metadata={
                "concurrent": concurrent,
                "num_queries": num_queries,
                "cache_hits": self.searcher.query_cache.stats.hits,
                "cache_misses": self.searcher.query_cache.stats.misses
            }
        )
        
    async def test_expansion_performance(
        self,
        num_queries: int = 100,
        concurrent: bool = True
    ) -> PerformanceResult:
        """Test query expansion performance.
        
        Args:
            num_queries: Number of test queries
            concurrent: Whether to run queries concurrently
            
        Returns:
            Performance test results
        """
        queries = [
            f"test query {i}" for i in range(num_queries)
        ]
        
        async def expand_query(query: str) -> bool:
            try:
                expanded = await self.expander.expand_query(query)
                return len(expanded.variations) > 0
            except Exception as e:
                self.logger.error(f"Expansion error: {e}")
                return False
                
        with self.monitor.measure("expansion_performance") as perf:
            start = time.time()
            successes = 0
            
            if concurrent:
                tasks = [expand_query(q) for q in queries]
                results = await asyncio.gather(*tasks)
                successes = sum(results)
            else:
                for query in queries:
                    if await expand_query(query):
                        successes += 1
                        
            duration = time.time() - start
            
            perf.set_batch_size(num_queries)
            perf.add_metadata({
                "concurrent": concurrent,
                "num_queries": num_queries
            })
            
        resources = self.monitor.get_resource_usage()
        
        return PerformanceResult(
            operation="expansion",
            latency=duration / num_queries,
            throughput=num_queries / duration,
            memory_usage=resources.memory_percent,
            cpu_usage=resources.cpu_percent,
            gpu_usage=resources.gpu_percent,
            success_rate=successes / num_queries,
            metadata={
                "concurrent": concurrent,
                "num_queries": num_queries,
                "cache_hits": self.expander.variation_cache.stats.hits,
                "cache_misses": self.expander.variation_cache.stats.misses
            }
        )
        
    async def test_quality_performance(
        self,
        num_evaluations: int = 100,
        concurrent: bool = True
    ) -> PerformanceResult:
        """Test quality evaluation performance.
        
        Args:
            num_evaluations: Number of test evaluations
            concurrent: Whether to run evaluations concurrently
            
        Returns:
            Performance test results
        """
        pairs = [
            (f"query {i}", f"response {i}")
            for i in range(num_evaluations)
        ]
        
        async def evaluate_quality(query: str, response: str) -> bool:
            try:
                quality = await self.quality.evaluate_response(
                    query=query,
                    response=response
                )
                return all(v >= 0 for v in quality.values())
            except Exception as e:
                self.logger.error(f"Quality evaluation error: {e}")
                return False
                
        with self.monitor.measure("quality_performance") as perf:
            start = time.time()
            successes = 0
            
            if concurrent:
                tasks = [
                    evaluate_quality(q, r)
                    for q, r in pairs
                ]
                results = await asyncio.gather(*tasks)
                successes = sum(results)
            else:
                for query, response in pairs:
                    if await evaluate_quality(query, response):
                        successes += 1
                        
            duration = time.time() - start
            
            perf.set_batch_size(num_evaluations)
            perf.add_metadata({
                "concurrent": concurrent,
                "num_evaluations": num_evaluations
            })
            
        resources = self.monitor.get_resource_usage()
        
        return PerformanceResult(
            operation="quality",
            latency=duration / num_evaluations,
            throughput=num_evaluations / duration,
            memory_usage=resources.memory_percent,
            cpu_usage=resources.cpu_percent,
            gpu_usage=resources.gpu_percent,
            success_rate=successes / num_evaluations,
            metadata={
                "concurrent": concurrent,
                "num_evaluations": num_evaluations
            }
        )
        
    async def test_end_to_end_performance(
        self,
        num_queries: int = 100,
        concurrent: bool = True
    ) -> PerformanceResult:
        """Test end-to-end performance.
        
        Args:
            num_queries: Number of test queries
            concurrent: Whether to run queries concurrently
            
        Returns:
            Performance test results
        """
        queries = [
            f"test query {i}" for i in range(num_queries)
        ]
        
        async def process_query(query: str) -> bool:
            try:
                # 1. Query expansion
                expanded = await self.expander.expand_query(query)
                if not expanded.variations:
                    return False
                    
                # 2. Search
                results = await self.searcher.search(
                    expanded.variations[0]
                )
                if not results:
                    return False
                    
                # 3. Quality evaluation
                quality = await self.quality.evaluate_response(
                    query=query,
                    response=results[0].content
                )
                return all(v >= 0.5 for v in quality.values())
            except Exception as e:
                self.logger.error(f"End-to-end error: {e}")
                return False
                
        with self.monitor.measure("end_to_end_performance") as perf:
            start = time.time()
            successes = 0
            
            if concurrent:
                tasks = [process_query(q) for q in queries]
                results = await asyncio.gather(*tasks)
                successes = sum(results)
            else:
                for query in queries:
                    if await process_query(query):
                        successes += 1
                        
            duration = time.time() - start
            
            perf.set_batch_size(num_queries)
            perf.add_metadata({
                "concurrent": concurrent,
                "num_queries": num_queries
            })
            
        resources = self.monitor.get_resource_usage()
        
        return PerformanceResult(
            operation="end_to_end",
            latency=duration / num_queries,
            throughput=num_queries / duration,
            memory_usage=resources.memory_percent,
            cpu_usage=resources.cpu_percent,
            gpu_usage=resources.gpu_percent,
            success_rate=successes / num_queries,
            metadata={
                "concurrent": concurrent,
                "num_queries": num_queries,
                "expansion_cache_hits": self.expander.variation_cache.stats.hits,
                "search_cache_hits": self.searcher.query_cache.stats.hits
            }
        )
        
    def assert_performance(self, result: PerformanceResult):
        """Assert performance meets targets.
        
        Args:
            result: Performance test result
        """
        # Check latency
        assert result.latency <= self.target_latency, (
            f"Latency {result.latency:.3f}s exceeds target {self.target_latency:.3f}s"
        )
        
        # Check throughput
        assert result.throughput >= self.target_throughput, (
            f"Throughput {result.throughput:.1f} ops/s below target "
            f"{self.target_throughput:.1f} ops/s"
        )
        
        # Check memory usage
        memory_gb = result.memory_usage * psutil.virtual_memory().total / (1024**3)
        assert memory_gb <= self.target_memory_gb, (
            f"Memory usage {memory_gb:.1f}GB exceeds target "
            f"{self.target_memory_gb:.1f}GB"
        )
        
        # Check success rate
        assert result.success_rate >= self.target_success_rate, (
            f"Success rate {result.success_rate:.1%} below target "
            f"{self.target_success_rate:.1%}"
        )
        
    async def run_all_tests(
        self,
        num_documents: int = 1000,
        num_operations: int = 100
    ) -> Dict[str, PerformanceResult]:
        """Run all performance tests.
        
        Args:
            num_documents: Number of test documents
            num_operations: Number of operations per test
            
        Returns:
            Dictionary of test results
        """
        # Setup
        await self.setup_test_data(num_documents)
        
        # Run tests
        results = {
            "search": await self.test_search_performance(num_operations),
            "expansion": await self.test_expansion_performance(num_operations),
            "quality": await self.test_quality_performance(num_operations),
            "end_to_end": await self.test_end_to_end_performance(num_operations)
        }
        
        # Assert performance
        for result in results.values():
            self.assert_performance(result)
            
        return results 