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
from rag_aether.ai.query_expansion import QueryExpander, QueryExpansionError
from rag_aether.core.monitoring import monitor
from rag_aether.core.performance import with_performance_monitoring, performance_section
from rag_aether.config import MODEL_CONFIG
from dotenv import load_dotenv
from ..core.monitoring import RAGMonitor
import os

logger = logging.getLogger(__name__)

class RAGSystem:
    """Production-ready RAG system with OpenAI integration."""
    
    def __init__(self, use_mock: bool = False):  # Default to real mode
        """Initialize RAG system with OpenAI integration."""
        load_dotenv()
        self.use_mock = use_mock
        self.monitor = RAGMonitor()
        
        # Initialize OpenAI client
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OpenAI API key required for RAG system")
        self.client = AsyncOpenAI(api_key=api_key)
        
        # Initialize components
        self.vector_store = VectorStore(use_mock=use_mock)
        self.query_expander = QueryExpander()
        
        logger.info(f"RAG system initialized in {'mock' if use_mock else 'production'} mode")
        self.monitor.record_system_ready()

    async def get_embedding(self, text: str) -> List[float]:
        """Get embeddings from OpenAI with mock fallback."""
        try:
            if self.use_mock:
                np.random.seed(len(text))
                return list(np.random.uniform(-1, 1, 1536))
            
            response = await self.client.embeddings.create(
                model="text-embedding-ada-002",
                input=text
            )
            return response.data[0].embedding
            
        except Exception as e:
            logger.error(f"Error getting embedding: {e}")
            if not self.use_mock:
                logger.warning("Falling back to mock embeddings")
                np.random.seed(len(text))
                return list(np.random.uniform(-1, 1, 1536))
            raise

    async def generate_answer(self, question: str, context: List[str]) -> str:
        """Generate an answer using OpenAI completion."""
        if self.use_mock:
            return "Based on the available information, I can help answer your question..."
            
        try:
            # Prepare prompt with context
            prompt = f"""Based on the following context, answer the question. Include relevant quotes from the context to support your answer.

Context:
{' '.join(context)}

Question: {question}

Answer:"""

            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that answers questions based on provided context."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Error generating answer: {e}")
            return f"I encountered an error while generating the answer: {str(e)}"

    async def ingest_text(self, text: str, metadata: Optional[Dict[str, Any]] = None, batch_size: int = 1000) -> bool:
        """Ingest text into the vector store."""
        try:
            # Split text into chunks
            chunks = [text[i:i+batch_size] for i in range(0, len(text), batch_size)]
            
            # Get embeddings for chunks
            embeddings = []
            for chunk in chunks:
                embedding = await self.get_embedding(chunk)
                embeddings.append(embedding)
            
            # Store in vector store
            await self.vector_store.add_documents(chunks, embeddings, metadata)
            return True
            
        except Exception as e:
            logger.error(f"Error ingesting text: {e}")
            return False

    async def query(self, question: str, max_results: int = 3) -> Dict[str, Any]:
        """Query the RAG system with real-time answer generation."""
        try:
            # Expand query
            expanded = await self.query_expander.expand_query(question)
            
            # Get embedding for query
            query_embedding = await self.get_embedding(expanded)
            
            # Search vector store
            results = await self.vector_store.search(query_embedding, max_results=max_results)
            
            # Generate answer from context
            context_texts = [r.text for r in results]
            answer = await self.generate_answer(question, context_texts)
            
            # Format response for UI
            response = {
                "answer": answer,
                "sources": [
                    {
                        "text": result.text,
                        "score": result.score,
                        "metadata": result.metadata
                    }
                    for result in results
                ],
                "expanded_query": expanded,
                "is_mock": self.use_mock
            }
            
            self.monitor.record_query_success()
            return response
            
        except Exception as e:
            logger.error(f"Error processing query: {e}")
            self.monitor.record_query_failure()
            return {
                "error": str(e),
                "is_mock": self.use_mock
            }

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
                try:
                    expanded = await self.query_expander.expand_query(query)
                    expanded_queries = expanded["expanded_queries"]
                except QueryExpansionError as e:
                    raise e
            
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