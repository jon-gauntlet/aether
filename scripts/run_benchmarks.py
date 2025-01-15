#!/usr/bin/env python3
"""Script to run RAG system benchmarks."""
import asyncio
import argparse
from pathlib import Path
from typing import List, Dict, Any
import json
import sys

from rag_aether.ai.rag import BaseRAG
from rag_aether.core.benchmark import run_standard_benchmarks
from rag_aether.core.logging import setup_logging, get_logger

# Set up logging
setup_logging()
logger = get_logger("benchmark_runner")

def load_sample_data(data_file: Path) -> Dict[str, Any]:
    """Load sample data for benchmarking."""
    try:
        with open(data_file) as f:
            data = json.load(f)
            return {
                "texts": data.get("texts", []),
                "queries": data.get("queries", []),
                "metadata": data.get("metadata", [])
            }
    except Exception as e:
        logger.error(f"Failed to load sample data: {str(e)}")
        sys.exit(1)

async def main():
    parser = argparse.ArgumentParser(description="Run RAG system benchmarks")
    parser.add_argument(
        "--data-file",
        type=Path,
        help="JSON file containing sample texts and queries",
        required=True
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("benchmark_results"),
        help="Directory to store benchmark results"
    )
    parser.add_argument(
        "--iterations",
        type=int,
        default=5,
        help="Number of iterations for each benchmark"
    )
    parser.add_argument(
        "--model",
        type=str,
        default="BAAI/bge-large-en-v1.5",
        help="Embedding model to use"
    )
    
    args = parser.parse_args()
    
    # Create output directory
    args.output_dir.mkdir(exist_ok=True)
    
    # Load sample data
    logger.info(f"Loading sample data from {args.data_file}")
    data = load_sample_data(args.data_file)
    
    if not data["texts"] or not data["queries"]:
        logger.error("Sample data must contain texts and queries")
        sys.exit(1)
    
    # Initialize RAG system
    logger.info(f"Initializing RAG system with model {args.model}")
    rag = BaseRAG(model_name=args.model)
    
    # Run benchmarks
    logger.info(
        "Starting benchmark suite",
        extra={
            "iterations": args.iterations,
            "num_texts": len(data["texts"]),
            "num_queries": len(data["queries"])
        }
    )
    
    results = await run_standard_benchmarks(
        rag=rag,
        sample_texts=data["texts"],
        sample_query=data["queries"][0],  # Use first query
        iterations=args.iterations
    )
    
    # Save summary
    summary_file = args.output_dir / "benchmark_summary.json"
    summary = {
        "config": {
            "model": args.model,
            "iterations": args.iterations,
            "num_texts": len(data["texts"]),
            "num_queries": len(data["queries"])
        },
        "results": {
            name: {
                "avg_duration_ms": result.metrics["avg_duration_ms"],
                "p95_duration_ms": result.metrics["p95_duration_ms"],
                "component_stats": {
                    k: v for k, v in result.metrics.items()
                    if k.endswith("_stats")
                }
            }
            for name, result in results.items()
        }
    }
    
    with open(summary_file, "w") as f:
        json.dump(summary, f, indent=2)
    
    logger.info(
        "Benchmark suite completed",
        extra={
            "summary_file": str(summary_file)
        }
    )
    
    # Print summary
    print("\nBenchmark Summary:")
    print("=================")
    for name, result in results.items():
        print(f"\n{name.upper()}:")
        print(f"  Average Duration: {result.metrics['avg_duration_ms']:.2f}ms")
        print(f"  P95 Duration: {result.metrics['p95_duration_ms']:.2f}ms")
        
        for component, stats in result.metrics.items():
            if component.endswith("_stats"):
                print(f"\n  {component.replace('_stats', '').upper()} Stats:")
                for metric, value in stats.items():
                    print(f"    {metric}: {value}")

if __name__ == "__main__":
    asyncio.run(main()) 