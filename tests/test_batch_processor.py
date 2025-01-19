import pytest
import asyncio
from unittest.mock import Mock, patch
import time
from typing import List, Dict, Any

from src.rag_aether.ai.batch_processor import BatchProcessor, BatchStats
from src.rag_aether.ai.rag_system import RAGSystem

@pytest.fixture
def mock_rag_system():
    rag = Mock(spec=RAGSystem)
    async def mock_ingest_text(text: str, metadata: Dict[str, Any] = None):
        await asyncio.sleep(0.001)  # Simulate processing time
        return True
    rag.ingest_text = mock_ingest_text
    return rag

@pytest.fixture
def batch_processor(mock_rag_system):
    return BatchProcessor(
        rag_system=mock_rag_system,
        batch_size=10,  # Smaller batch size for memory test
        max_workers=4,
        memory_threshold=0.85,
        memory_pause_time=0.2  # Shorter pause for testing
    )

def generate_test_docs(count: int) -> List[Dict[str, Any]]:
    return [
        {
            "text": f"Test document {i}",
            "metadata": {"id": i, "source": "test"}
        }
        for i in range(count)
    ]

@pytest.mark.asyncio
async def test_batch_processing_speed(batch_processor):
    """Test that batch processing meets the 1000 docs/min requirement."""
    # Generate 1000 test documents
    docs = generate_test_docs(1000)
    
    # Process documents and measure time
    start_time = time.time()
    stats = await batch_processor.process_documents(docs)
    elapsed_time = time.time() - start_time
    
    # Verify processing speed
    docs_per_minute = (stats.processed_docs / elapsed_time) * 60
    assert docs_per_minute >= 1000, f"Processing speed {docs_per_minute:.2f} docs/min below requirement"
    
    # Verify all documents were processed
    assert stats.processed_docs == 1000
    assert stats.failed_docs == 0

@pytest.mark.asyncio
async def test_memory_optimization(batch_processor):
    """Test that memory usage remains stable during processing."""
    docs = generate_test_docs(2000)
    memory_samples = []
    
    def callback(stats: BatchStats):
        memory_samples.append(stats.memory_usage)
    
    stats = await batch_processor.process_documents(docs, callback=callback)
    
    # Calculate memory stability
    memory_variance = max(memory_samples) - min(memory_samples)
    assert memory_variance < 0.2, f"Memory usage variance {memory_variance:.2f} exceeds threshold"
    
    # Verify processing completed successfully
    assert stats.processed_docs == 2000
    assert stats.failed_docs == 0

@pytest.mark.asyncio
async def test_streaming_processing(batch_processor):
    """Test processing documents as a stream."""
    def doc_stream():
        for i in range(500):
            yield {
                "text": f"Streaming document {i}",
                "metadata": {"id": i, "source": "stream"}
            }
    
    stats = await batch_processor.process_stream(doc_stream())
    
    assert stats.total_docs == 500
    assert stats.processed_docs == 500
    assert stats.failed_docs == 0
    assert stats.docs_per_minute >= 1000

@pytest.mark.asyncio
async def test_error_handling(batch_processor, mock_rag_system):
    """Test handling of processing errors and retries."""
    # Mock RAG system to fail every 10th document
    fail_count = 0
    async def mock_ingest_with_errors(text: str, metadata: Dict[str, Any] = None):
        nonlocal fail_count
        fail_count += 1
        if fail_count % 10 == 0:
            raise Exception("Simulated error")
        await asyncio.sleep(0.001)
        return True
    
    mock_rag_system.ingest_text = mock_ingest_with_errors
    
    docs = generate_test_docs(100)
    stats = await batch_processor.process_documents(docs)
    
    # With retries, we should still process most documents
    assert stats.processed_docs >= 90
    assert stats.failed_docs <= 10

@pytest.mark.asyncio
async def test_memory_threshold(batch_processor):
    """Test that processing pauses when memory threshold is reached."""
    with patch('psutil.Process') as mock_process:
        # Return high memory usage for first 50 checks, then normal usage
        memory_values = [0.90] * 50 + [0.50] * 50
        mock_process.return_value.memory_percent.side_effect = [x * 100 for x in memory_values]
        
        # Process enough documents to trigger multiple memory checks
        docs = generate_test_docs(100)
        
        # Measure processing time
        start_time = time.time()
        stats = await batch_processor.process_documents(docs)
        elapsed_time = time.time() - start_time
        
        # With 10 batches of 10 docs each, and first 5 batches causing 0.2s pauses,
        # total pause time should be at least 1 second (5 * 0.2s)
        min_expected_time = 0.2 * 5  # 5 pauses of 0.2 seconds each
        assert elapsed_time >= min_expected_time, f"Processing time {elapsed_time:.2f}s too short"
        
        # Verify memory stats and processing completion
        assert stats.memory_usage >= 0.5  # Should be the last memory value
        assert stats.processed_docs == 100  # All documents should be processed
        assert mock_process.return_value.memory_percent.call_count >= 10  # Memory was checked multiple times 