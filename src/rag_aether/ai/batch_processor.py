from typing import List, Dict, Any, Generator, Optional
import asyncio
from concurrent.futures import ThreadPoolExecutor
import logging
from dataclasses import dataclass
import psutil
import time

from .rag_system import RAGSystem

@dataclass
class BatchStats:
    total_docs: int
    processed_docs: int
    failed_docs: int
    start_time: float
    avg_processing_time: float
    memory_usage: float
    docs_per_minute: float

class BatchProcessor:
    def __init__(
        self,
        rag_system: RAGSystem,
        batch_size: int = 100,
        max_workers: int = 4,
        memory_threshold: float = 0.85,
        max_retries: int = 3,
        memory_pause_time: float = 1.0
    ):
        """Initialize the batch processor.
        
        Args:
            rag_system: The RAG system instance to use for processing
            batch_size: Number of documents to process in each batch
            max_workers: Maximum number of concurrent workers
            memory_threshold: Memory usage threshold (0-1) to trigger cleanup
            max_retries: Maximum number of retries for failed documents
            memory_pause_time: Time to pause when memory threshold is exceeded
        """
        self.rag = rag_system
        self.batch_size = batch_size
        self.max_workers = max_workers
        self.memory_threshold = memory_threshold
        self.max_retries = max_retries
        self.memory_pause_time = memory_pause_time
        self.executor = ThreadPoolExecutor(max_workers=max_workers)
        self.stats = BatchStats(0, 0, 0, 0.0, 0.0, 0.0, 0.0)
        self.logger = logging.getLogger(__name__)

    def _check_memory(self) -> bool:
        """Check if memory usage is below threshold."""
        memory = psutil.Process().memory_percent() / 100
        self.stats.memory_usage = memory
        return memory < self.memory_threshold

    def _update_stats(self, start_time: float, processed: int) -> None:
        """Update batch processing statistics."""
        elapsed = time.time() - start_time
        if elapsed > 0:
            self.stats.docs_per_minute = (processed / elapsed) * 60
        self.stats.avg_processing_time = elapsed / processed if processed > 0 else 0

    async def _process_doc(self, doc: Dict[str, Any], retries: int = 0) -> bool:
        """Process a single document with retry logic."""
        try:
            await self.rag.ingest_text(doc["text"], doc.get("metadata", {}))
            return True
        except Exception as e:
            self.logger.error(f"Failed to process document: {e}")
            if retries < self.max_retries:
                await asyncio.sleep(2 ** retries)  # Exponential backoff
                return await self._process_doc(doc, retries + 1)
            return False

    async def _process_batch(self, batch: List[Dict[str, Any]]) -> None:
        """Process a batch of documents concurrently."""
        while not self._check_memory():
            self.logger.warning("High memory usage detected, waiting for cleanup...")
            await asyncio.sleep(self.memory_pause_time)

        tasks = [self._process_doc(doc) for doc in batch]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        successful = sum(1 for r in results if r is True)
        self.stats.processed_docs += successful
        self.stats.failed_docs += len(batch) - successful

    async def process_documents(
        self, 
        documents: List[Dict[str, Any]], 
        callback: Optional[callable] = None
    ) -> BatchStats:
        """Process a list of documents in batches.
        
        Args:
            documents: List of documents to process
            callback: Optional callback function to report progress
            
        Returns:
            BatchStats object with processing statistics
        """
        self.stats = BatchStats(
            total_docs=len(documents),
            processed_docs=0,
            failed_docs=0,
            start_time=time.time(),
            avg_processing_time=0.0,
            memory_usage=0.0,
            docs_per_minute=0.0
        )

        for i in range(0, len(documents), self.batch_size):
            batch = documents[i:i + self.batch_size]
            await self._process_batch(batch)
            self._update_stats(self.stats.start_time, self.stats.processed_docs)
            
            if callback:
                callback(self.stats)

        return self.stats

    async def process_stream(
        self,
        document_stream: Generator[Dict[str, Any], None, None],
        callback: Optional[callable] = None
    ) -> BatchStats:
        """Process a stream of documents in batches.
        
        Args:
            document_stream: Generator yielding documents
            callback: Optional callback function to report progress
            
        Returns:
            BatchStats object with processing statistics
        """
        self.stats = BatchStats(
            total_docs=0,
            processed_docs=0,
            failed_docs=0,
            start_time=time.time(),
            avg_processing_time=0.0,
            memory_usage=0.0,
            docs_per_minute=0.0
        )

        batch = []
        for doc in document_stream:
            self.stats.total_docs += 1
            batch.append(doc)
            
            if len(batch) >= self.batch_size:
                await self._process_batch(batch)
                self._update_stats(self.stats.start_time, self.stats.processed_docs)
                
                if callback:
                    callback(self.stats)
                batch = []

        # Process remaining documents
        if batch:
            await self._process_batch(batch)
            self._update_stats(self.stats.start_time, self.stats.processed_docs)
            if callback:
                callback(self.stats)

        return self.stats 