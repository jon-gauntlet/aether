"""Verification tests for RAG Aether components."""

import asyncio
import argparse
import time
import logging
from typing import List, Dict, Any
import random
import string
import sys

from .ai.rag_system import RAGSystem
from .ai.batch_processor import BatchProcessor, BatchStats

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def generate_realistic_document(min_words: int = 100, max_words: int = 1000) -> Dict[str, Any]:
    """Generate a realistic test document with variable length."""
    # Generate random words for more realistic memory usage
    word_count = random.randint(min_words, max_words)
    words = []
    for _ in range(word_count):
        word_length = random.randint(4, 12)
        word = ''.join(random.choices(string.ascii_lowercase, k=word_length))
        words.append(word)
    
    text = ' '.join(words)
    
    return {
        "text": text,
        "metadata": {
            "id": str(random.randint(1, 1000000)),
            "source": "verification_test",
            "timestamp": time.time(),
            "word_count": word_count
        }
    }

def generate_test_documents(count: int) -> List[Dict[str, Any]]:
    """Generate a list of test documents."""
    return [generate_realistic_document() for _ in range(count)]

async def run_batch_test(duration_minutes: float = 1.0) -> None:
    """Run a sustained batch processing test.
    
    Args:
        duration_minutes: How long to run the test in minutes
    """
    # Initialize components
    rag = RAGSystem()
    processor = BatchProcessor(
        rag_system=rag,
        batch_size=100,  # Larger batch size for performance
        max_workers=8,   # More workers for parallel processing
        memory_threshold=0.90  # Higher threshold for performance test
    )
    
    # Track overall statistics
    start_time = time.time()
    end_time = start_time + (duration_minutes * 60)
    total_docs = 0
    total_failed = 0
    
    def progress_callback(stats: BatchStats) -> None:
        """Report progress during processing."""
        logger.info(
            f"Progress: {stats.processed_docs}/{stats.total_docs} docs | "
            f"Speed: {stats.docs_per_minute:.0f} docs/min | "
            f"Memory: {stats.memory_usage*100:.1f}% | "
            f"Failed: {stats.failed_docs}"
        )
    
    try:
        # Keep processing batches until time runs out
        while time.time() < end_time:
            # Generate a batch of documents
            docs = generate_test_documents(1000)  # Process 1000 docs per iteration
            
            # Process the batch
            stats = await processor.process_documents(docs, callback=progress_callback)
            
            # Update totals
            total_docs += stats.processed_docs
            total_failed += stats.failed_docs
            
            # Brief pause between batches
            await asyncio.sleep(0.1)
        
        # Calculate final statistics
        total_time = time.time() - start_time
        docs_per_minute = (total_docs / total_time) * 60
        
        # Report results
        logger.info("=" * 80)
        logger.info("Batch Processing Verification Results:")
        logger.info(f"Total documents processed: {total_docs}")
        logger.info(f"Sustained throughput: {docs_per_minute:.0f} docs/min")
        logger.info(f"Failed documents: {total_failed}")
        logger.info(f"Total time: {total_time:.1f} seconds")
        logger.info("=" * 80)
        
        # Verify success criteria
        if docs_per_minute < 1000:
            logger.error("❌ Failed: Throughput below 1000 docs/min requirement")
            sys.exit(1)
        if total_failed / total_docs > 0.05:
            logger.error("❌ Failed: Error rate exceeds 5% threshold")
            sys.exit(1)
            
        logger.info("✅ Success: All performance criteria met!")
        
    except Exception as e:
        logger.error(f"Test failed: {e}")
        raise

async def main() -> None:
    """Main entry point for verification tests."""
    parser = argparse.ArgumentParser(description="RAG Aether verification tests")
    parser.add_argument(
        "--test-batch",
        action="store_true",
        help="Run batch processing performance test"
    )
    parser.add_argument(
        "--duration",
        type=float,
        default=1.0,
        help="Test duration in minutes"
    )
    
    args = parser.parse_args()
    
    if args.test_batch:
        await run_batch_test(args.duration)
    else:
        parser.print_help()

if __name__ == "__main__":
    asyncio.run(main()) 