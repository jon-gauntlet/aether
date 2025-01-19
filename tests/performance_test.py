"""Performance test for batch processing."""
import asyncio
import time
import sys
from pathlib import Path

# Add src to Python path
src_path = str(Path(__file__).parent.parent)
if src_path not in sys.path:
    sys.path.append(src_path)

from rag_aether.ai.batch_processor import BatchProcessor
from rag_aether.ai.rag_system import RAGSystem

async def test_large_batch():
    """Test processing performance with a large batch of documents."""
    print("\nTesting batch processing performance...")
    print("=" * 50)
    
    # Initialize systems
    rag = RAGSystem()
    processor = BatchProcessor(
        rag_system=rag,
        batch_size=100,
        max_workers=4
    )
    
    # Generate test documents
    print("\nGenerating 10,000 test documents...")
    docs = [
        {
            'text': f'Test document {i} for performance verification.',
            'metadata': {'id': i, 'type': 'test'}
        }
        for i in range(10000)
    ]
    
    # Process documents
    print("\nProcessing documents...")
    start_time = time.time()
    stats = await processor.process_documents(docs)
    total_time = time.time() - start_time
    
    # Print results
    print("\nResults:")
    print(f"Documents processed: {stats.processed_docs:,}")
    print(f"Failed documents: {stats.failed_docs:,}")
    print(f"Processing speed: {stats.docs_per_minute:,.0f} docs/min")
    print(f"Memory usage: {stats.memory_usage*100:.1f}%")
    print(f"Average processing time: {stats.avg_processing_time*1000:.1f}ms per doc")
    print(f"Total time: {total_time:.1f}s")
    print(f"Final batch size: {stats.current_batch_size}")
    print(f"Active workers: {stats.active_workers}")

if __name__ == "__main__":
    asyncio.run(test_large_batch()) 