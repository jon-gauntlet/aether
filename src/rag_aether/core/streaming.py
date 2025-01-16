"""Streaming implementation for real-time results."""
from typing import Dict, Any, List, AsyncIterator, Optional
import asyncio
from collections import deque
from dataclasses import dataclass, asdict
from rag_aether.core.logging import get_logger
from rag_aether.core.errors import StreamingError
from rag_aether.core.performance import with_performance_monitoring, performance_section

logger = get_logger("streaming")

@dataclass
class StreamingMetadata:
    """Metadata for streaming results."""
    chunk_number: int
    total_chunks: int
    processed_at: float
    is_last: bool
    processing_time: float

class ResultStreamer:
    """Stream search results in real-time."""
    
    def __init__(
        self,
        chunk_size: int = 5,
        buffer_size: int = 100,
        min_chunk_delay: float = 0.05,
        max_chunk_delay: float = 0.5
    ):
        """Initialize result streamer."""
        self.chunk_size = chunk_size
        self.buffer_size = buffer_size
        self.min_chunk_delay = min_chunk_delay
        self.max_chunk_delay = max_chunk_delay
        self.buffer = deque(maxlen=buffer_size)
        logger.info(
            "Initialized result streamer",
            extra={
                "chunk_size": chunk_size,
                "buffer_size": buffer_size
            }
        )
        
    @with_performance_monitoring(operation="stream", component="streaming")
    async def stream_results(
        self,
        results: Dict[str, Any],
        chunk_size: Optional[int] = None,
        adaptive_chunking: bool = True
    ) -> AsyncIterator[Dict[str, Any]]:
        """Stream results in chunks."""
        try:
            # Get result items
            items = results.get("results", [])
            if not items:
                return
                
            # Use provided chunk size or default
            chunk_size = chunk_size or self.chunk_size
            
            # Calculate chunks
            total_items = len(items)
            num_chunks = (total_items + chunk_size - 1) // chunk_size
            
            # Stream chunks
            start_time = asyncio.get_event_loop().time()
            
            for i in range(0, total_items, chunk_size):
                chunk_start = asyncio.get_event_loop().time()
                
                # Get chunk items
                chunk = items[i:i + chunk_size]
                
                # Create chunk result
                chunk_result = {
                    "results": chunk,
                    "streaming_metadata": StreamingMetadata(
                        chunk_number=i // chunk_size + 1,
                        total_chunks=num_chunks,
                        processed_at=chunk_start,
                        is_last=i + chunk_size >= total_items,
                        processing_time=chunk_start - start_time
                    ).__dict__
                }
                
                # Add any additional result data
                for key, value in results.items():
                    if key != "results":
                        chunk_result[key] = value
                
                # Add to buffer
                self.buffer.append(chunk_result)
                
                # Calculate adaptive delay if enabled
                if adaptive_chunking:
                    # Adjust delay based on chunk processing time
                    processing_time = asyncio.get_event_loop().time() - chunk_start
                    delay = min(
                        self.max_chunk_delay,
                        max(
                            self.min_chunk_delay,
                            processing_time * 0.5
                        )
                    )
                else:
                    delay = self.min_chunk_delay
                
                # Add delay between chunks
                if not chunk_result["streaming_metadata"]["is_last"]:
                    await asyncio.sleep(delay)
                
                yield chunk_result
                
            logger.debug(
                "Streamed results",
                extra={
                    "total_items": total_items,
                    "num_chunks": num_chunks,
                    "processing_time": asyncio.get_event_loop().time() - start_time
                }
            )
            
        except Exception as e:
            raise StreamingError(
                f"Failed to stream results: {str(e)}",
                operation="stream",
                component="streaming"
            )
    
    @with_performance_monitoring(operation="buffer", component="streaming")
    def get_buffered_results(self) -> List[Dict[str, Any]]:
        """Get all results currently in buffer."""
        return list(self.buffer)
        
    def clear_buffer(self) -> None:
        """Clear the result buffer."""
        self.buffer.clear()
        
    def get_buffer_size(self) -> int:
        """Get current buffer size."""
        return len(self.buffer)
        
    def is_buffer_full(self) -> bool:
        """Check if buffer is full."""
        return len(self.buffer) >= self.buffer_size 