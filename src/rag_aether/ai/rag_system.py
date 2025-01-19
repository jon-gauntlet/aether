"""RAG system implementation."""
from typing import Dict, Any, List, Optional, Tuple
import asyncio
import logging
from datetime import datetime
import faiss
import numpy as np
from openai import AsyncOpenAI
from redis import asyncio as aioredis
from rag_aether.ai.vector_store import VectorStore
from rag_aether.ai.query_expansion import QueryExpander
from rag_aether.core.monitoring import monitor
from rag_aether.core.performance import with_performance_monitoring, performance_section
from rag_aether.config import MODEL_CONFIG

logger = logging.getLogger(__name__)

class RAGSystem:
    """Enhanced RAG system with efficient batch processing."""
    
    def __init__(self, redis_url: Optional[str] = None):
        """Initialize the RAG system.
        
        Args:
            redis_url: Optional Redis URL for caching. If not provided, caching is disabled.
        """
        self.logger = logging.getLogger(__name__)
        self.documents = []
        self.vector_store = VectorStore()
        self.client = AsyncOpenAI()
        self.redis = aioredis.from_url(redis_url) if redis_url else None
        self.query_expander = QueryExpander()
        
    @with_performance_monitoring
    async def ingest_text(
        self, 
        text: str, 
        metadata: Optional[Dict[str, Any]] = None,
        batch_size: Optional[int] = None
    ) -> bool:
        """Ingest text into the RAG system with efficient batch processing.
        
        Args:
            text: The text to ingest
            metadata: Optional metadata about the text
            batch_size: Size of batches for processing
            
        Returns:
            bool: True if ingestion was successful
        """
        try:
            if batch_size is None:
                batch_size = MODEL_CONFIG["embedding"]["batch_size"]
                
            # Split text into chunks for batch processing
            with performance_section("split_text"):
                chunks = self._split_text(text, batch_size)
            
            # Process chunks in parallel
            tasks = []
            for i, chunk in enumerate(chunks):
                chunk_metadata = {
                    **(metadata or {}),
                    "chunk_index": i,
                    "timestamp": datetime.now().isoformat()
                }
                tasks.append(self._process_chunk(chunk, chunk_metadata))
                
            # Wait for all chunks to be processed
            with performance_section("process_chunks"):
                results = await asyncio.gather(*tasks)
                
            return all(results)  # Return True only if all chunks succeeded
            
        except Exception as e:
            self.logger.error(f"Ingestion failed: {e}")
            return False
            
    @with_performance_monitoring
    async def query(
        self,
        query: str,
        max_results: int = 5,
        min_score: float = 0.0
    ) -> List[Dict[str, Any]]:
        """Query the RAG system.
        
        Args:
            query: Query text
            max_results: Maximum number of results to return
            min_score: Minimum similarity score threshold
            
        Returns:
            List of relevant documents with scores
        """
        try:
            # Try cache first
            if self.redis:
                cache_key = f"query:{query}"
                cached = await self.redis.get(cache_key)
                if cached:
                    monitor.record_cache_hit()
                    return cached
            
            # Expand query
            with performance_section("expand_query"):
                expanded = await self.query_expander.expand_query(query)
                expanded_queries = expanded["expanded_queries"]
            
            # Get embeddings for all expanded queries
            with performance_section("get_embeddings"):
                embeddings = await self._get_embeddings(expanded_queries)
                
            # Search vector store with all expanded queries
            with performance_section("vector_search"):
                all_results = []
                for emb in embeddings:
                    results = await self.vector_store.search(
                        emb,
                        k=max_results,
                        min_score=min_score
                    )
                    all_results.extend(results)
                    
                # Deduplicate and sort results
                seen = set()
                unique_results = []
                for result in sorted(all_results, key=lambda x: x["score"], reverse=True):
                    doc_id = result["document_id"]
                    if doc_id not in seen:
                        seen.add(doc_id)
                        unique_results.append(result)
                        if len(unique_results) >= max_results:
                            break
                
            # Cache results
            if self.redis:
                await self.redis.setex(
                    f"query:{query}",
                    3600,  # 1 hour TTL
                    unique_results
                )
                
            return unique_results
            
        except Exception as e:
            self.logger.error(f"Query failed: {e}")
            raise
            
    async def _process_chunk(
        self,
        chunk: str,
        metadata: Dict[str, Any]
    ) -> bool:
        """Process a single text chunk.
        
        Args:
            chunk: Text chunk
            metadata: Chunk metadata
            
        Returns:
            bool: True if processing was successful
        """
        try:
            # Get embeddings
            embeddings = await self._get_embeddings([chunk])
            
            # Add to vector store
            await self.vector_store.add_documents(
                [chunk],
                embeddings[0],
                metadata
            )
            
            return True
            
        except Exception as e:
            self.logger.error(f"Chunk processing failed: {e}")
            return False
            
    async def _get_embeddings(
        self,
        texts: List[str],
        retries: int = 3
    ) -> np.ndarray:
        """Get embeddings for texts with retries.
        
        Args:
            texts: List of texts
            retries: Number of retries on failure
            
        Returns:
            Array of embeddings
            
        Raises:
            Exception: If embedding generation fails after retries
        """
        for attempt in range(retries):
            try:
                with performance_section("create_embeddings"):
                    response = await self.client.embeddings.create(
                        model=MODEL_CONFIG["embedding"]["model"],
                        input=texts
                    )
                    return np.array([e.embedding for e in response.data])
                    
            except Exception as e:
                if attempt == retries - 1:
                    raise
                self.logger.warning(f"Embedding attempt {attempt + 1} failed: {e}")
                await asyncio.sleep(1)  # Wait before retry
                
    def _split_text(self, text: str, chunk_size: int) -> List[str]:
        """Split text into chunks.
        
        Args:
            text: Text to split
            chunk_size: Maximum chunk size
            
        Returns:
            List of text chunks
        """
        # Simple splitting by sentences for now
        # TODO: Implement more sophisticated chunking
        sentences = text.split(". ")
        chunks = []
        current_chunk = []
        current_size = 0
        
        for sentence in sentences:
            sentence_size = len(sentence.split())
            if current_size + sentence_size > chunk_size:
                chunks.append(". ".join(current_chunk) + ".")
                current_chunk = [sentence]
                current_size = sentence_size
            else:
                current_chunk.append(sentence)
                current_size += sentence_size
                
        if current_chunk:
            chunks.append(". ".join(current_chunk) + ".")
            
        return chunks 