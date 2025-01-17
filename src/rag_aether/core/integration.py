"""Integration system for RAG components."""

from typing import Dict, Any, List, AsyncIterator, Optional
from dataclasses import dataclass
import logging
import asyncio
from datetime import datetime

from ..ai.rag_system import RAGSystem, Message, Document
from .errors import IntegrationError

logger = logging.getLogger(__name__)

@dataclass
class SystemHealth:
    """System health status."""
    status: str
    version: str
    uptime: float
    components: Dict[str, bool]
    last_check: datetime
    error_count: int
    warning_count: int

class IntegrationSystem:
    """System for integrating RAG components."""
    
    def __init__(self, rag: RAGSystem):
        """Initialize integration system.
        
        Args:
            rag: RAG system instance
        """
        self.rag = rag
        self.start_time = datetime.now()
        self.error_count = 0
        self.warning_count = 0
        
    async def process_message(self, message: Message) -> AsyncIterator[Dict[str, Any]]:
        """Process a message and stream responses.
        
        Args:
            message: Message to process
            
        Yields:
            Response chunks
        """
        try:
            # Ingest message
            await self.rag.ingest_message(message)
            
            # Get context
            context = await self.rag.retrieve(message.content)
            
            # Generate and stream response
            response = await self.rag.generate_response(message.content, context)
            
            # Split response into chunks and stream
            chunks = response.split()  # TODO: Implement proper chunking
            for i, chunk in enumerate(chunks):
                yield {
                    "chunk": chunk,
                    "index": i,
                    "total": len(chunks),
                    "metadata": {
                        "timestamp": datetime.now().isoformat(),
                        "message_id": id(message)
                    }
                }
                await asyncio.sleep(0.1)  # Simulate streaming delay
                
        except Exception as e:
            self.error_count += 1
            logger.error(f"Failed to process message: {e}")
            raise IntegrationError(f"Failed to process message: {e}")
            
    async def process_document(self, document: Document) -> Dict[str, Any]:
        """Process a document.
        
        Args:
            document: Document to process
            
        Returns:
            Processing results
        """
        try:
            await self.rag.ingest_document(document)
            return {
                "status": "success",
                "document_id": id(document),
                "timestamp": datetime.now().isoformat(),
                "metadata": document.metadata
            }
        except Exception as e:
            self.error_count += 1
            logger.error(f"Failed to process document: {e}")
            raise IntegrationError(f"Failed to process document: {e}")
            
    async def get_health(self) -> SystemHealth:
        """Get system health status.
        
        Returns:
            System health status
        """
        try:
            components = {
                "rag": bool(self.rag),
                "query_expander": bool(self.rag.query_expander),
                "cache": bool(self.rag.cache)
            }
            
            return SystemHealth(
                status="healthy" if all(components.values()) else "degraded",
                version="0.1.0",  # TODO: Get from package
                uptime=(datetime.now() - self.start_time).total_seconds(),
                components=components,
                last_check=datetime.now(),
                error_count=self.error_count,
                warning_count=self.warning_count
            )
        except Exception as e:
            self.error_count += 1
            logger.error(f"Failed to get health status: {e}")
            raise IntegrationError(f"Failed to get health status: {e}")
            
    async def __aiter__(self) -> AsyncIterator[Dict[str, Any]]:
        """Async iterator for streaming system events.
        
        Yields:
            System events
        """
        while True:
            try:
                health = await self.get_health()
                yield {
                    "type": "health",
                    "data": {
                        "status": health.status,
                        "error_count": health.error_count,
                        "warning_count": health.warning_count,
                        "uptime": health.uptime
                    },
                    "timestamp": datetime.now().isoformat()
                }
                await asyncio.sleep(60)  # Health check interval
                
            except Exception as e:
                self.error_count += 1
                logger.error(f"Error in system event stream: {e}")
                await asyncio.sleep(5)  # Back off on error 