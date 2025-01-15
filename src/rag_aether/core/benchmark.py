"""Benchmark suite for RAG system performance."""
import asyncio
import time
import json
from typing import List, Dict, Any, Optional, Callable, Awaitable
from dataclasses import dataclass, field
from datetime import datetime
import numpy as np
from pathlib import Path
import cProfile
import pstats
import io
from rag_aether.core.logging import get_logger
from rag_aether.core.performance import monitor, performance_section

logger = get_logger("benchmark")

@dataclass
class BenchmarkResult:
    """Results from a benchmark run."""
    name: str
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_ms: Optional[float] = None
    metrics: Dict[str, Any] = field(default_factory=dict)
    profile_stats: Optional[str] = None

class BenchmarkSuite:
    """Benchmark suite for measuring system performance."""
    
    def __init__(self, output_dir: Optional[Path] = None):
        self.output_dir = output_dir or Path("benchmark_results")
        self.output_dir.mkdir(exist_ok=True)
        self.results: List[BenchmarkResult] = []
        
    async def run_benchmark(
        self,
        name: str,
        func: Callable[..., Awaitable[Any]],
        args: tuple = (),
        kwargs: Dict[str, Any] = None,
        iterations: int = 1,
        profile: bool = False
    ) -> BenchmarkResult:
        """Run a benchmark with profiling."""
        kwargs = kwargs or {}
        
        # Create benchmark result
        result = BenchmarkResult(
            name=name,
            start_time=datetime.now()
        )
        
        # Collect durations
        durations = []
        
        # Enable profiling if requested
        profiler = cProfile.Profile() if profile else None
        
        try:
            for i in range(iterations):
                # Run with profiling if enabled
                if profile:
                    profiler.enable()
                
                start_time = time.time()
                await func(*args, **kwargs)
                duration = (time.time() - start_time) * 1000
                durations.append(duration)
                
                if profile:
                    profiler.disable()
                
                logger.info(
                    f"Benchmark iteration {i+1}/{iterations} completed",
                    extra={
                        "benchmark": name,
                        "duration_ms": duration
                    }
                )
            
            # Calculate metrics
            result.metrics = {
                "iterations": iterations,
                "avg_duration_ms": np.mean(durations),
                "min_duration_ms": np.min(durations),
                "max_duration_ms": np.max(durations),
                "std_duration_ms": np.std(durations),
                "p50_duration_ms": np.percentile(durations, 50),
                "p95_duration_ms": np.percentile(durations, 95),
                "p99_duration_ms": np.percentile(durations, 99)
            }
            
            # Add component stats
            for component in ["embedding", "faiss_index", "retrieval"]:
                stats = monitor.get_component_stats(component)
                if stats:
                    result.metrics[f"{component}_stats"] = stats
            
            # Get profile stats if enabled
            if profile and profiler:
                s = io.StringIO()
                ps = pstats.Stats(profiler, stream=s).sort_stats("cumulative")
                ps.print_stats()
                result.profile_stats = s.getvalue()
            
            result.end_time = datetime.now()
            result.duration_ms = sum(durations)
            
            # Save results
            self.results.append(result)
            self._save_result(result)
            
            return result
            
        except Exception as e:
            logger.error(
                f"Benchmark failed: {str(e)}",
                extra={
                    "benchmark": name,
                    "error": str(e)
                }
            )
            raise
    
    def _save_result(self, result: BenchmarkResult) -> None:
        """Save benchmark result to file."""
        result_dict = {
            "name": result.name,
            "start_time": result.start_time.isoformat(),
            "end_time": result.end_time.isoformat() if result.end_time else None,
            "duration_ms": result.duration_ms,
            "metrics": result.metrics
        }
        
        # Save main results
        result_file = self.output_dir / f"{result.name}_{result.start_time.strftime('%Y%m%d_%H%M%S')}.json"
        with open(result_file, "w") as f:
            json.dump(result_dict, f, indent=2)
            
        # Save profile stats if available
        if result.profile_stats:
            profile_file = self.output_dir / f"{result.name}_{result.start_time.strftime('%Y%m%d_%H%M%S')}_profile.txt"
            with open(profile_file, "w") as f:
                f.write(result.profile_stats)
                
        logger.info(
            f"Benchmark results saved",
            extra={
                "benchmark": result.name,
                "result_file": str(result_file)
            }
        )
    
    def get_summary(self) -> Dict[str, Any]:
        """Get summary of all benchmark results."""
        summary = {}
        for result in self.results:
            summary[result.name] = {
                "avg_duration_ms": result.metrics.get("avg_duration_ms"),
                "p95_duration_ms": result.metrics.get("p95_duration_ms"),
                "iterations": result.metrics.get("iterations"),
                "component_stats": {
                    k: v for k, v in result.metrics.items()
                    if k.endswith("_stats")
                }
            }
        return summary

# Standard benchmark scenarios
async def embedding_benchmark(rag, texts: List[str], iterations: int = 10) -> BenchmarkResult:
    """Benchmark embedding generation."""
    async def _benchmark():
        with performance_section("embedding_benchmark", "embedding"):
            await rag._encode_texts_batch(texts)
    
    suite = BenchmarkSuite()
    return await suite.run_benchmark(
        name="embedding_generation",
        func=_benchmark,
        iterations=iterations,
        profile=True
    )

async def retrieval_benchmark(
    rag,
    query: str,
    k: int = 5,
    iterations: int = 10
) -> BenchmarkResult:
    """Benchmark retrieval performance."""
    async def _benchmark():
        with performance_section("retrieval_benchmark", "retrieval"):
            await rag.retrieve_with_fusion(query, k)
    
    suite = BenchmarkSuite()
    return await suite.run_benchmark(
        name="retrieval_performance",
        func=_benchmark,
        iterations=iterations,
        profile=True
    )

async def ingestion_benchmark(
    rag,
    texts: List[str],
    metadata: Optional[List[Dict[str, Any]]] = None,
    iterations: int = 5
) -> BenchmarkResult:
    """Benchmark text ingestion."""
    if metadata is None:
        metadata = [{}] * len(texts)
    
    async def _benchmark():
        with performance_section("ingestion_benchmark", "ingestion"):
            for text, meta in zip(texts, metadata):
                await rag.ingest_text(text, meta)
    
    suite = BenchmarkSuite()
    return await suite.run_benchmark(
        name="text_ingestion",
        func=_benchmark,
        iterations=iterations,
        profile=True
    )

async def run_standard_benchmarks(
    rag,
    sample_texts: List[str],
    sample_query: str,
    iterations: int = 5
) -> Dict[str, BenchmarkResult]:
    """Run standard benchmark suite."""
    logger.info("Starting standard benchmark suite")
    
    results = {}
    
    # Run embedding benchmark
    results["embedding"] = await embedding_benchmark(
        rag,
        sample_texts[:10],  # Use subset for embedding benchmark
        iterations=iterations
    )
    
    # Run ingestion benchmark
    results["ingestion"] = await ingestion_benchmark(
        rag,
        sample_texts,
        iterations=iterations
    )
    
    # Run retrieval benchmark
    results["retrieval"] = await retrieval_benchmark(
        rag,
        sample_query,
        iterations=iterations
    )
    
    logger.info(
        "Benchmark suite completed",
        extra={
            "num_benchmarks": len(results),
            "total_iterations": iterations * len(results)
        }
    )
    
    return results 