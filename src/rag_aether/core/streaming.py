"""Streaming response handling for RAG system."""
from typing import AsyncIterator, List, Dict, Any, Optional, TypeVar, Generic
import asyncio
from dataclasses import dataclass
from rag_aether.core.logging import get_logger
from rag_aether.core.performance import with_performance_monitoring, performance_section
from rag_aether.core.errors import RAGError

logger = get_logger("streaming")

T = TypeVar('T')

@dataclass
class StreamChunk(Generic[T]):
    """A chunk of streaming data with metadata."""
    data: T
    metadata: Dict[str, Any]
    chunk_index: int
    total_chunks: Optional[int] = None
    is_last: bool = False

class StreamBuffer(Generic[T]):
    """Buffer for managing streaming data."""
    
    def __init__(
        self,
        max_size: int = 100,
        chunk_timeout: float = 5.0
    ):
        """Initialize stream buffer."""
        self.max_size = max_size
        self.chunk_timeout = chunk_timeout
        self.buffer: asyncio.Queue[StreamChunk[T]] = asyncio.Queue(maxsize=max_size)
        self.closed = False
        logger.info(
            "Initialized stream buffer",
            extra={
                "max_size": max_size,
                "chunk_timeout": chunk_timeout
            }
        )
    
    async def add_chunk(self, chunk: StreamChunk[T]) -> None:
        """Add chunk to buffer."""
        if self.closed:
            raise RAGError(
                "Cannot add chunk to closed buffer",
                operation="add_chunk",
                component="stream_buffer"
            )
        
        try:
            await asyncio.wait_for(
                self.buffer.put(chunk),
                timeout=self.chunk_timeout
            )
        except asyncio.TimeoutError:
            logger.error("Timeout adding chunk to buffer")
            raise RAGError(
                "Timeout adding chunk to buffer",
                operation="add_chunk",
                component="stream_buffer"
            )
    
    async def get_chunk(self) -> Optional[StreamChunk[T]]:
        """Get chunk from buffer."""
        if self.closed and self.buffer.empty():
            return None
            
        try:
            chunk = await asyncio.wait_for(
                self.buffer.get(),
                timeout=self.chunk_timeout
            )
            self.buffer.task_done()
            return chunk
        except asyncio.TimeoutError:
            logger.error("Timeout getting chunk from buffer")
            return None
    
    def close(self) -> None:
        """Close the buffer."""
        self.closed = True

class StreamProcessor(Generic[T]):
    """Process and transform streaming data."""
    
    def __init__(
        self,
        buffer: StreamBuffer[T],
        batch_size: Optional[int] = None,
        process_fn: Optional[callable] = None
    ):
        """Initialize stream processor."""
        self.buffer = buffer
        self.batch_size = batch_size
        self.process_fn = process_fn or (lambda x: x)
        logger.info(
            "Initialized stream processor",
            extra={"batch_size": batch_size}
        )
    
    @with_performance_monitoring(operation="process", component="stream_processor")
    async def process_stream(self) -> AsyncIterator[StreamChunk[T]]:
        """Process streaming data."""
        try:
            batch: List[StreamChunk[T]] = []
            
            while True:
                chunk = await self.buffer.get_chunk()
                if chunk is None:
                    # Process remaining batch
                    if batch:
                        async for processed in self._process_batch(batch):
                            yield processed
                    break
                
                if self.batch_size:
                    batch.append(chunk)
                    if len(batch) >= self.batch_size or chunk.is_last:
                        async for processed in self._process_batch(batch):
                            yield processed
                        batch = []
                else:
                    # Process individual chunks
                    with performance_section("process_chunk", "stream_processor"):
                        processed = self.process_fn(chunk)
                        if processed:
                            yield processed
                
                if chunk.is_last:
                    break
                    
        except Exception as e:
            logger.error(f"Stream processing failed: {str(e)}")
            raise RAGError(
                f"Stream processing failed: {str(e)}",
                operation="process_stream",
                component="stream_processor"
            )
    
    async def _process_batch(
        self,
        batch: List[StreamChunk[T]]
    ) -> AsyncIterator[StreamChunk[T]]:
        """Process a batch of chunks."""
        with performance_section("process_batch", "stream_processor"):
            try:
                processed = self.process_fn(batch)
                if isinstance(processed, list):
                    for item in processed:
                        yield item
                else:
                    yield processed
            except Exception as e:
                logger.error(f"Batch processing failed: {str(e)}")
                raise RAGError(
                    f"Batch processing failed: {str(e)}",
                    operation="process_batch",
                    component="stream_processor"
                )

class ResultStreamer:
    """Stream search results with processing."""
    
    def __init__(
        self,
        chunk_size: int = 5,
        buffer_size: int = 100,
        chunk_timeout: float = 5.0
    ):
        """Initialize result streamer."""
        self.chunk_size = chunk_size
        self.buffer = StreamBuffer[Dict[str, Any]](
            max_size=buffer_size,
            chunk_timeout=chunk_timeout
        )
        self.processor = StreamProcessor[Dict[str, Any]](
            buffer=self.buffer,
            batch_size=chunk_size,
            process_fn=self._process_results
        )
        logger.info(
            "Initialized result streamer",
            extra={
                "chunk_size": chunk_size,
                "buffer_size": buffer_size
            }
        )
    
    def _process_results(
        self,
        chunk: StreamChunk[Dict[str, Any]]
    ) -> StreamChunk[Dict[str, Any]]:
        """Process search results."""
        # Add processing timestamp
        if isinstance(chunk, list):
            # Process batch
            for c in chunk:
                c.metadata["processed_at"] = asyncio.get_event_loop().time()
            return chunk
        else:
            # Process single chunk
            chunk.metadata["processed_at"] = asyncio.get_event_loop().time()
            return chunk
    
    @with_performance_monitoring(operation="stream", component="result_streamer")
    async def stream_results(
        self,
        results: List[Dict[str, Any]]
    ) -> AsyncIterator[Dict[str, Any]]:
        """Stream search results."""
        try:
            # Add results to buffer in chunks
            total_chunks = (len(results) + self.chunk_size - 1) // self.chunk_size
            
            for i in range(0, len(results), self.chunk_size):
                chunk_results = results[i:i + self.chunk_size]
                is_last = i + self.chunk_size >= len(results)
                
                await self.buffer.add_chunk(StreamChunk(
                    data=chunk_results,
                    metadata={
                        "chunk_size": len(chunk_results),
                        "start_index": i
                    },
                    chunk_index=i // self.chunk_size,
                    total_chunks=total_chunks,
                    is_last=is_last
                ))
            
            # Process and yield results
            async for chunk in self.processor.process_stream():
                for result in chunk.data:
                    yield {
                        **result,
                        "streaming_metadata": chunk.metadata
                    }
            
        except Exception as e:
            logger.error(f"Result streaming failed: {str(e)}")
            raise RAGError(
                f"Result streaming failed: {str(e)}",
                operation="stream_results",
                component="result_streamer"
            )
        finally:
            self.buffer.close() 