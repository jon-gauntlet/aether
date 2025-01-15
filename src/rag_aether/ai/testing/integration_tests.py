"""Integration test suite for RAG system components."""
import pytest
import asyncio
from typing import Dict, Any, List
import numpy as np
from pathlib import Path
import tempfile
import shutil
import json
import time

from ..hybrid_search import HybridSearcher
from ..query_expansion import QueryExpander
from ..quality_system import QualitySystem
from ..caching_system import QueryCache, EmbeddingCache
from ..performance_system import PerformanceMonitor

class RAGIntegrationTests:
    """Integration tests for RAG system components."""
    
    def __init__(self, base_dir: str = None):
        """Initialize test suite.
        
        Args:
            base_dir: Base directory for test data
        """
        self.base_dir = Path(base_dir or tempfile.mkdtemp())
        self.base_dir.mkdir(parents=True, exist_ok=True)
        
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
        self.monitor = PerformanceMonitor()
        
    async def setup(self):
        """Set up test data and indices."""
        # Create test documents
        self.documents = [
            "Machine learning is a subset of artificial intelligence.",
            "Neural networks are inspired by biological neurons.",
            "Deep learning models require large amounts of data.",
            "Transformers have revolutionized natural language processing.",
            "Reinforcement learning involves agents and environments."
        ]
        
        self.metadata = [
            {"type": "definition", "topic": "ml"},
            {"type": "concept", "topic": "neural_networks"},
            {"type": "concept", "topic": "deep_learning"},
            {"type": "technology", "topic": "nlp"},
            {"type": "concept", "topic": "rl"}
        ]
        
        # Index documents
        await self.searcher.index_documents(self.documents, self.metadata)
        
    async def teardown(self):
        """Clean up test data."""
        if self.base_dir:
            shutil.rmtree(self.base_dir)
            
    async def test_end_to_end_search(self):
        """Test end-to-end search flow."""
        # 1. Query expansion
        query = "How do neural networks work?"
        expanded = await self.expander.expand_query(query)
        
        # 2. Search with variations
        all_results = []
        for variation in expanded.variations:
            results = await self.searcher.search(
                variation,
                filters={"type": "concept"}
            )
            all_results.extend(results)
            
        # 3. Quality evaluation
        for result in all_results[:3]:  # Top 3 results
            quality = await self.quality.evaluate_response(
                query=query,
                response=result.content
            )
            assert quality["relevance"] >= 0.5
            assert quality["coherence"] >= 0.5
            
        # 4. Cache verification
        cached_results = await self.searcher.query_cache.get_results(
            query=query,
            filters={"type": "concept"}
        )
        assert cached_results is not None
        
    async def test_component_interaction(self):
        """Test interaction between components."""
        # 1. Performance monitoring
        with self.monitor.measure("search_flow"):
            # 2. Query expansion
            query = "What is deep learning?"
            expanded = await self.expander.expand_query(query)
            
            # 3. Search
            results = await self.searcher.search(query)
            
            # 4. Quality check
            quality = await self.quality.evaluate_response(
                query=query,
                response=results[0].content
            )
            
        # 5. Verify metrics
        metrics = self.monitor.get_metrics("search_flow")
        assert len(metrics) > 0
        assert metrics[0].latency > 0
        
    async def test_cache_coordination(self):
        """Test cache coordination between components."""
        query = "Explain machine learning"
        
        # 1. First run - cold start
        start = time.time()
        expanded1 = await self.expander.expand_query(query)
        results1 = await self.searcher.search(expanded1.variations[0])
        cold_time = time.time() - start
        
        # 2. Second run - should use cache
        start = time.time()
        expanded2 = await self.expander.expand_query(query)
        results2 = await self.searcher.search(expanded2.variations[0])
        warm_time = time.time() - start
        
        # 3. Verify cache effectiveness
        assert warm_time < cold_time
        assert expanded1.variations == expanded2.variations
        assert results1[0].content == results2[0].content
        
    async def test_error_handling(self):
        """Test error handling and recovery."""
        # 1. Invalid query
        with pytest.raises(Exception):
            await self.searcher.search("")
            
        # 2. Recovery after error
        results = await self.searcher.search("valid query")
        assert len(results) > 0
        
        # 3. Cache state after error
        assert self.searcher.query_cache is not None
        assert self.searcher.embedding_cache is not None
        
    async def test_concurrent_operations(self):
        """Test concurrent component operations."""
        queries = [
            "What is machine learning?",
            "How do neural networks work?",
            "Explain deep learning",
            "What is reinforcement learning?"
        ]
        
        async def process_query(query: str):
            expanded = await self.expander.expand_query(query)
            results = await self.searcher.search(expanded.variations[0])
            quality = await self.quality.evaluate_response(
                query=query,
                response=results[0].content
            )
            return {
                "query": query,
                "results": results,
                "quality": quality
            }
            
        # Run queries concurrently
        tasks = [process_query(q) for q in queries]
        results = await asyncio.gather(*tasks)
        
        assert len(results) == len(queries)
        assert all(r["quality"]["relevance"] >= 0.5 for r in results)
        
    async def test_system_stability(self):
        """Test system stability under load."""
        # 1. Generate load
        async def generate_load(duration: float = 5.0):
            start = time.time()
            count = 0
            errors = 0
            
            while time.time() - start < duration:
                try:
                    query = f"test query {count}"
                    await self.searcher.search(query)
                    count += 1
                except Exception:
                    errors += 1
                    
            return count, errors
            
        # 2. Run load test
        operations, errors = await generate_load()
        
        # 3. Verify stability
        assert operations > 0
        assert errors == 0
        
        # 4. Check component health
        assert self.searcher.index is not None
        assert self.expander.model is not None
        assert self.quality.model is not None
        
    async def test_data_consistency(self):
        """Test data consistency across components."""
        # 1. Add new document
        new_doc = "Transfer learning helps with limited data."
        new_metadata = {"type": "concept", "topic": "transfer_learning"}
        
        await self.searcher.index_documents(
            [new_doc],
            [new_metadata]
        )
        
        # 2. Verify through different components
        results = await self.searcher.search(
            "transfer learning",
            filters={"topic": "transfer_learning"}
        )
        assert len(results) > 0
        assert results[0].content == new_doc
        
        # 3. Check metadata preservation
        assert results[0].metadata == new_metadata
        
    async def run_all_tests(self):
        """Run all integration tests."""
        await self.setup()
        
        try:
            await self.test_end_to_end_search()
            await self.test_component_interaction()
            await self.test_cache_coordination()
            await self.test_error_handling()
            await self.test_concurrent_operations()
            await self.test_system_stability()
            await self.test_data_consistency()
        finally:
            await self.teardown() 