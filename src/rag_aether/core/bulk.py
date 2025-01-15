"""Bulk operations for RAG system."""
from typing import List, Dict, Any, Optional, AsyncIterator, Callable, TypeVar, Generic
import asyncio
from dataclasses import dataclass
from rag_aether.core.logging import get_logger
from rag_aether.core.performance import with_performance_monitoring, performance_section
from rag_aether.core.errors import RAGError

logger = get_logger("bulk_ops")

T = TypeVar('T')
R = TypeVar('R')

@dataclass
class BulkProgress:
    """Progress information for bulk operations."""
    total_items: int
    processed_items: int
    successful_items: int
    failed_items: int
    current_batch: int
    total_batches: int
    errors: List[Dict[str, Any]]
    metrics: Dict[str, Any]

class BulkProcessor(Generic[T, R]):
    """Process items in bulk with batching and progress tracking."""
    
    def __init__(
        self,
        batch_size: int = 100,
        max_concurrent_batches: int = 5,
        max_retries: int = 3,
        retry_delay: float = 1.0
    ):
        """Initialize bulk processor."""
        self.batch_size = batch_size
        self.max_concurrent_batches = max_concurrent_batches
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        self.semaphore = asyncio.Semaphore(max_concurrent_batches)
        logger.info(
            "Initialized bulk processor",
            extra={
                "batch_size": batch_size,
                "max_concurrent_batches": max_concurrent_batches
            }
        )
    
    @with_performance_monitoring(operation="process", component="bulk_processor")
    async def process_items(
        self,
        items: List[T],
        process_fn: Callable[[List[T]], AsyncIterator[R]],
        progress_callback: Optional[Callable[[BulkProgress], None]] = None
    ) -> AsyncIterator[R]:
        """Process items in batches with progress tracking."""
        try:
            total_items = len(items)
            total_batches = (total_items + self.batch_size - 1) // self.batch_size
            progress = BulkProgress(
                total_items=total_items,
                processed_items=0,
                successful_items=0,
                failed_items=0,
                current_batch=0,
                total_batches=total_batches,
                errors=[],
                metrics={
                    "avg_batch_time_ms": 0,
                    "batch_times": []
                }
            )
            
            # Process batches
            batch_tasks = []
            for i in range(0, total_items, self.batch_size):
                batch = items[i:i + self.batch_size]
                task = asyncio.create_task(
                    self._process_batch(
                        batch,
                        process_fn,
                        i // self.batch_size,
                        progress,
                        progress_callback
                    )
                )
                batch_tasks.append(task)
                
                # Limit concurrent batches
                if len(batch_tasks) >= self.max_concurrent_batches:
                    completed, batch_tasks = await asyncio.wait(
                        batch_tasks,
                        return_when=asyncio.FIRST_COMPLETED
                    )
                    for task in completed:
                        async for result in task.result():
                            yield result
            
            # Wait for remaining batches
            if batch_tasks:
                for task in asyncio.as_completed(batch_tasks):
                    async for result in await task:
                        yield result
            
            # Log final progress
            if progress_callback:
                progress_callback(progress)
                
            logger.info(
                "Bulk processing completed",
                extra={
                    "total_items": total_items,
                    "successful": progress.successful_items,
                    "failed": progress.failed_items,
                    "avg_batch_time_ms": progress.metrics["avg_batch_time_ms"]
                }
            )
            
        except Exception as e:
            logger.error(f"Bulk processing failed: {str(e)}")
            raise RAGError(
                f"Bulk processing failed: {str(e)}",
                operation="process_items",
                component="bulk_processor"
            )
    
    async def _process_batch(
        self,
        batch: List[T],
        process_fn: Callable[[List[T]], AsyncIterator[R]],
        batch_index: int,
        progress: BulkProgress,
        progress_callback: Optional[Callable[[BulkProgress], None]]
    ) -> AsyncIterator[R]:
        """Process a single batch with retries."""
        async with self.semaphore:
            start_time = asyncio.get_event_loop().time()
            retry_count = 0
            
            while retry_count <= self.max_retries:
                try:
                    async for result in process_fn(batch):
                        progress.successful_items += 1
                        yield result
                    
                    # Update progress
                    progress.processed_items += len(batch)
                    progress.current_batch = batch_index + 1
                    
                    # Update metrics
                    batch_time = (asyncio.get_event_loop().time() - start_time) * 1000
                    progress.metrics["batch_times"].append(batch_time)
                    progress.metrics["avg_batch_time_ms"] = (
                        sum(progress.metrics["batch_times"]) /
                        len(progress.metrics["batch_times"])
                    )
                    
                    if progress_callback:
                        progress_callback(progress)
                    
                    return
                    
                except Exception as e:
                    retry_count += 1
                    if retry_count <= self.max_retries:
                        logger.warning(
                            f"Batch {batch_index} failed, retrying ({retry_count}/{self.max_retries}): {str(e)}"
                        )
                        await asyncio.sleep(self.retry_delay * retry_count)
                    else:
                        logger.error(f"Batch {batch_index} failed after {self.max_retries} retries")
                        progress.failed_items += len(batch)
                        progress.errors.append({
                            "batch_index": batch_index,
                            "error": str(e),
                            "items": batch
                        })
                        if progress_callback:
                            progress_callback(progress)
                        raise

class BulkIngester:
    """Bulk ingestion of documents with batching."""
    
    def __init__(
        self,
        rag_system: Any,
        batch_size: int = 100,
        max_concurrent_batches: int = 5
    ):
        """Initialize bulk ingester."""
        self.rag = rag_system
        self.processor = BulkProcessor[Dict[str, Any], None](
            batch_size=batch_size,
            max_concurrent_batches=max_concurrent_batches
        )
        logger.info(
            "Initialized bulk ingester",
            extra={
                "batch_size": batch_size,
                "max_concurrent_batches": max_concurrent_batches
            }
        )
    
    @with_performance_monitoring(operation="ingest", component="bulk_ingester")
    async def ingest_documents(
        self,
        documents: List[Dict[str, Any]],
        progress_callback: Optional[Callable[[BulkProgress], None]] = None
    ) -> BulkProgress:
        """Ingest documents in bulk."""
        try:
            async def process_batch(batch: List[Dict[str, Any]]) -> AsyncIterator[None]:
                """Process a batch of documents."""
                for doc in batch:
                    await self.rag.ingest_text(
                        text=doc["text"],
                        metadata=doc.get("metadata"),
                        doc_id=doc.get("id")
                    )
                    yield None
            
            progress = BulkProgress(
                total_items=len(documents),
                processed_items=0,
                successful_items=0,
                failed_items=0,
                current_batch=0,
                total_batches=(len(documents) + self.processor.batch_size - 1) // self.processor.batch_size,
                errors=[],
                metrics={"avg_batch_time_ms": 0, "batch_times": []}
            )
            
            async for _ in self.processor.process_items(
                documents,
                process_batch,
                progress_callback
            ):
                pass
            
            return progress
            
        except Exception as e:
            logger.error(f"Bulk ingestion failed: {str(e)}")
            raise RAGError(
                f"Bulk ingestion failed: {str(e)}",
                operation="ingest_documents",
                component="bulk_ingester"
            )

class BulkRetriever:
    """Bulk retrieval of documents with batching."""
    
    def __init__(
        self,
        rag_system: Any,
        batch_size: int = 50,
        max_concurrent_batches: int = 5
    ):
        """Initialize bulk retriever."""
        self.rag = rag_system
        self.processor = BulkProcessor[str, Dict[str, Any]](
            batch_size=batch_size,
            max_concurrent_batches=max_concurrent_batches
        )
        logger.info(
            "Initialized bulk retriever",
            extra={
                "batch_size": batch_size,
                "max_concurrent_batches": max_concurrent_batches
            }
        )
    
    @with_performance_monitoring(operation="retrieve", component="bulk_retriever")
    async def retrieve_documents(
        self,
        queries: List[str],
        k: int = 5,
        metadata_filter: Optional[Dict[str, Any]] = None,
        progress_callback: Optional[Callable[[BulkProgress], None]] = None
    ) -> AsyncIterator[Dict[str, Any]]:
        """Retrieve documents for multiple queries."""
        try:
            async def process_batch(batch: List[str]) -> AsyncIterator[Dict[str, Any]]:
                """Process a batch of queries."""
                for query in batch:
                    result = await self.rag.retrieve_with_fusion(
                        query=query,
                        k=k,
                        metadata_filter=metadata_filter
                    )
                    yield {
                        "query": query,
                        "results": result
                    }
            
            async for result in self.processor.process_items(
                queries,
                process_batch,
                progress_callback
            ):
                yield result
                
        except Exception as e:
            logger.error(f"Bulk retrieval failed: {str(e)}")
            raise RAGError(
                f"Bulk retrieval failed: {str(e)}",
                operation="retrieve_documents",
                component="bulk_retriever"
            ) 