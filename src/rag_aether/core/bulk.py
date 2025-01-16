"""Bulk operations implementation for RAG system."""
from typing import List, Dict, Any, Optional, TypeVar, Generic, Callable, Awaitable, Union
import asyncio
from dataclasses import dataclass
from datetime import datetime
from rag_aether.core.logging import get_logger
from rag_aether.core.errors import BulkOperationError
from rag_aether.core.performance import with_performance_monitoring

logger = get_logger("bulk")

T = TypeVar('T')
U = TypeVar('U')

@dataclass
class BulkConfig:
    """Bulk operation configuration."""
    batch_size: int = 100
    max_concurrent_batches: int = 5
    retry_attempts: int = 3
    retry_delay: float = 1.0
    timeout: float = 30.0

@dataclass
class BulkMetrics:
    """Metrics for bulk operations."""
    total_items: int = 0
    processed_items: int = 0
    failed_items: int = 0
    total_batches: int = 0
    completed_batches: int = 0
    failed_batches: int = 0
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    
    @property
    def success_rate(self) -> float:
        """Calculate success rate."""
        if self.total_items == 0:
            return 0.0
        return (self.processed_items - self.failed_items) / self.total_items
    
    @property
    def duration(self) -> float:
        """Calculate operation duration in seconds."""
        if not self.start_time or not self.end_time:
            return 0.0
        return (self.end_time - self.start_time).total_seconds()

@dataclass
class BulkProgress:
    """Progress information for bulk operations."""
    total: int
    completed: int
    failed: int
    current_batch: int
    total_batches: int
    start_time: datetime
    estimated_completion: Optional[datetime] = None
    
    @property
    def progress_percentage(self) -> float:
        """Calculate progress percentage."""
        if self.total == 0:
            return 0.0
        return (self.completed / self.total) * 100
    
    @property
    def elapsed_time(self) -> float:
        """Calculate elapsed time in seconds."""
        return (datetime.now() - self.start_time).total_seconds()
    
    @property
    def estimated_remaining_time(self) -> float:
        """Estimate remaining time in seconds."""
        if self.completed == 0:
            return 0.0
        rate = self.completed / self.elapsed_time
        remaining_items = self.total - self.completed
        return remaining_items / rate if rate > 0 else 0.0

class BulkProcessor(Generic[T, U]):
    """Generic bulk processor for batch operations."""
    
    def __init__(
        self,
        config: Optional[BulkConfig] = None,
        name: str = "default"
    ):
        """Initialize bulk processor."""
        self.config = config or BulkConfig()
        self.name = name
        self.metrics = BulkMetrics()
        self.semaphore = asyncio.Semaphore(self.config.max_concurrent_batches)
        logger.info(
            f"Initialized bulk processor: {name}",
            extra={"config": vars(self.config)}
        )
        
    async def _process_batch(
        self,
        batch: List[T],
        processor: Callable[[List[T]], Awaitable[List[U]]],
        batch_number: int
    ) -> List[U]:
        """Process a single batch with retries."""
        for attempt in range(self.config.retry_attempts):
            try:
                async with self.semaphore:
                    results = await asyncio.wait_for(
                        processor(batch),
                        timeout=self.config.timeout
                    )
                    self.metrics.completed_batches += 1
                    self.metrics.processed_items += len(batch)
                    return results
                    
            except asyncio.TimeoutError:
                logger.warning(
                    f"Batch {batch_number} timed out (attempt {attempt + 1})",
                    extra={
                        "batch_size": len(batch),
                        "attempt": attempt + 1
                    }
                )
                
            except Exception as e:
                logger.error(
                    f"Batch {batch_number} failed: {str(e)}",
                    extra={
                        "batch_size": len(batch),
                        "attempt": attempt + 1,
                        "error": str(e)
                    }
                )
                
            if attempt < self.config.retry_attempts - 1:
                await asyncio.sleep(
                    self.config.retry_delay * (attempt + 1)
                )
                
        self.metrics.failed_batches += 1
        self.metrics.failed_items += len(batch)
        raise BulkOperationError(
            f"Batch {batch_number} failed after {self.config.retry_attempts} attempts",
            operation="process_batch",
            component="bulk",
            batch_number=batch_number,
            batch_size=len(batch)
        )
        
    @with_performance_monitoring(operation="process", component="bulk")
    async def process_items(
        self,
        items: List[T],
        processor: Callable[[List[T]], Awaitable[List[U]]]
    ) -> List[U]:
        """Process items in batches."""
        if not items:
            return []
            
        self.metrics = BulkMetrics()
        self.metrics.start_time = datetime.now()
        self.metrics.total_items = len(items)
        
        # Create batches
        batches = [
            items[i:i + self.config.batch_size]
            for i in range(0, len(items), self.config.batch_size)
        ]
        self.metrics.total_batches = len(batches)
        
        try:
            # Process batches concurrently
            tasks = [
                self._process_batch(batch, processor, i)
                for i, batch in enumerate(batches)
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Handle results
            processed_results: List[U] = []
            for batch_results in results:
                if isinstance(batch_results, Exception):
                    logger.error(f"Batch failed: {str(batch_results)}")
                else:
                    processed_results.extend(batch_results)
                    
            self.metrics.end_time = datetime.now()
            
            # Log completion
            logger.info(
                f"Bulk operation completed: {self.name}",
                extra={
                    "total_items": self.metrics.total_items,
                    "processed_items": self.metrics.processed_items,
                    "failed_items": self.metrics.failed_items,
                    "success_rate": self.metrics.success_rate,
                    "duration": self.metrics.duration
                }
            )
            
            return processed_results
            
        except Exception as e:
            logger.error(f"Bulk operation failed: {str(e)}")
            raise BulkOperationError(
                f"Bulk operation failed: {str(e)}",
                operation="process_items",
                component="bulk"
            )
            
    def get_metrics(self) -> Dict[str, Any]:
        """Get processor metrics."""
        return {
            "name": self.name,
            "total_items": self.metrics.total_items,
            "processed_items": self.metrics.processed_items,
            "failed_items": self.metrics.failed_items,
            "total_batches": self.metrics.total_batches,
            "completed_batches": self.metrics.completed_batches,
            "failed_batches": self.metrics.failed_batches,
            "success_rate": self.metrics.success_rate,
            "duration": self.metrics.duration
        }

class BulkManager:
    """Manage multiple bulk processors."""
    
    def __init__(self):
        """Initialize bulk manager."""
        self.processors: Dict[str, BulkProcessor] = {}
        logger.info("Initialized bulk manager")
        
    def get_processor(
        self,
        name: str,
        config: Optional[BulkConfig] = None
    ) -> BulkProcessor:
        """Get or create bulk processor."""
        if name not in self.processors:
            self.processors[name] = BulkProcessor(
                config=config,
                name=name
            )
        return self.processors[name]
        
    def get_all_metrics(self) -> Dict[str, Dict[str, Any]]:
        """Get metrics for all processors."""
        return {
            name: processor.get_metrics()
            for name, processor in self.processors.items()
        }

class BulkIngester:
    """Bulk ingestion processor for documents."""
    
    def __init__(
        self,
        config: Optional[BulkConfig] = None,
        quality_threshold: float = 0.7
    ):
        """Initialize bulk ingester."""
        self.processor = BulkProcessor(config=config, name="ingester")
        self.quality_threshold = quality_threshold
        logger.info(
            "Initialized bulk ingester",
            extra={"quality_threshold": quality_threshold}
        )
        
    async def ingest_documents(
        self,
        documents: List[Dict[str, Any]],
        processor: Callable[[List[Dict[str, Any]]], Awaitable[List[bool]]]
    ) -> List[bool]:
        """Ingest documents in bulk."""
        return await self.processor.process_items(documents, processor)
    
    def get_progress(self) -> BulkProgress:
        """Get ingestion progress."""
        metrics = self.processor.metrics
        return BulkProgress(
            total=metrics.total_items,
            completed=metrics.processed_items,
            failed=metrics.failed_items,
            current_batch=metrics.completed_batches,
            total_batches=metrics.total_batches,
            start_time=metrics.start_time or datetime.now()
        )

class BulkRetriever:
    """Bulk retrieval processor for queries."""
    
    def __init__(
        self,
        config: Optional[BulkConfig] = None,
        min_relevance: float = 0.5,
        max_results: int = 10
    ):
        """Initialize bulk retriever."""
        self.processor = BulkProcessor(config=config, name="retriever")
        self.min_relevance = min_relevance
        self.max_results = max_results
        logger.info(
            "Initialized bulk retriever",
            extra={
                "min_relevance": min_relevance,
                "max_results": max_results
            }
        )
        
    async def retrieve_documents(
        self,
        queries: List[str],
        retriever: Callable[[List[str]], Awaitable[List[List[Dict[str, Any]]]]]
    ) -> List[List[Dict[str, Any]]]:
        """Retrieve documents for queries in bulk."""
        return await self.processor.process_items(queries, retriever)
    
    def get_progress(self) -> BulkProgress:
        """Get retrieval progress."""
        metrics = self.processor.metrics
        return BulkProgress(
            total=metrics.total_items,
            completed=metrics.processed_items,
            failed=metrics.failed_items,
            current_batch=metrics.completed_batches,
            total_batches=metrics.total_batches,
            start_time=metrics.start_time or datetime.now()
        ) 