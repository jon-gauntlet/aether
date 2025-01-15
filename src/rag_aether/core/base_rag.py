"""Base RAG system implementation."""
from typing import List, Dict, Any, Optional
import numpy as np
from sentence_transformers import SentenceTransformer
import faiss
import os
from rag_aether.core.errors import RAGError, EmbeddingError, IndexError
from rag_aether.core.logging import get_logger
from rag_aether.core.telemetry import track_operation, collector
from rag_aether.core.performance import performance_section

logger = get_logger("rag_system")

class BaseRAG:
    """Base implementation of RAG system."""
    
    def __init__(
        self,
        model_name: str = "BAAI/bge-large-en-v1.5",
        embedding_dim: int = 384
    ):
        """Initialize RAG system."""
        self.model_name = model_name
        self.embedding_dim = embedding_dim
        self.model = None
        self.index = None
        self.texts = []
        self.metadata = []
        
        # Start telemetry collection
        collector.start()
        
        # Initialize health monitoring
        from rag_aether.core.health import monitor, check_embedding_model, check_faiss_index, check_system_resources
        self.health_monitor = monitor
        
        # Add health checks
        self.health_monitor.add_check(
            "embedding_model",
            lambda: check_embedding_model(self)
        )
        self.health_monitor.add_check(
            "faiss_index",
            lambda: check_faiss_index(self)
        )
        self.health_monitor.add_check(
            "system_resources",
            check_system_resources
        )
        
        # Start health monitoring
        self.health_monitor.start()
        
        logger.info(
            "Initializing RAG system",
            extra={
                "model": model_name,
                "embedding_dim": embedding_dim
            }
        )
        
        try:
            self._initialize_model()
            self.initialize_index()
        except Exception as e:
            logger.error(f"Failed to initialize RAG system: {str(e)}")
            raise RAGError("Failed to initialize RAG system") from e
    
    @track_operation("initialize_model", "embedding")
    def _initialize_model(self):
        """Initialize embedding model."""
        try:
            self.model = SentenceTransformer(self.model_name)
            logger.info(
                "Embedding model initialized",
                extra={"model": self.model_name}
            )
        except Exception as e:
            logger.error(f"Failed to initialize embedding model: {str(e)}")
            raise EmbeddingError("Failed to initialize embedding model") from e
    
    @track_operation("initialize_index", "faiss_index")
    def initialize_index(self):
        """Initialize FAISS index."""
        try:
            self.index = faiss.IndexFlatL2(self.embedding_dim)
            logger.info(
                "FAISS index initialized",
                extra={"embedding_dim": self.embedding_dim}
            )
        except Exception as e:
            logger.error(f"Failed to initialize FAISS index: {str(e)}")
            raise IndexError("Failed to initialize FAISS index") from e
    
    @track_operation("encode_texts", "embedding")
    async def _encode_texts_batch(self, texts: List[str]) -> np.ndarray:
        """Encode texts into embeddings."""
        try:
            embeddings = self.model.encode(
                texts,
                convert_to_numpy=True,
                normalize_embeddings=True
            )
            
            collector.add_point(
                operation="encode_texts",
                component="embedding",
                metrics={
                    "num_texts": len(texts),
                    "embedding_dim": embeddings.shape[1]
                }
            )
            
            return embeddings
            
        except Exception as e:
            logger.error(f"Failed to encode texts: {str(e)}")
            raise EmbeddingError("Failed to encode texts") from e
    
    @track_operation("ingest", "ingestion")
    async def ingest_text(
        self,
        text: str,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Ingest text into the system."""
        try:
            # Get embedding
            with performance_section("get_embedding", "embedding"):
                embedding = await self._encode_texts_batch([text])
            
            # Add to index
            with performance_section("add_to_index", "faiss_index"):
                self.index.add(embedding)
                self.texts.append(text)
                self.metadata.append(metadata or {})
            
            collector.add_point(
                operation="ingest",
                component="ingestion",
                metrics={
                    "text_length": len(text),
                    "has_metadata": metadata is not None
                }
            )
            
            logger.info(
                "Text ingested successfully",
                extra={
                    "text_length": len(text),
                    "total_texts": len(self.texts)
                }
            )
            
        except Exception as e:
            logger.error(f"Failed to ingest text: {str(e)}")
            raise RAGError("Failed to ingest text") from e
    
    @track_operation("retrieve", "retrieval")
    async def retrieve_with_fusion(
        self,
        query: str,
        k: int = 5,
        metadata_filter: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Retrieve relevant texts using query."""
        try:
            # Get query embedding
            with performance_section("query_embedding", "embedding"):
                query_embedding = await self._encode_texts_batch([query])
            
            # FAISS search
            with performance_section("faiss_search", "faiss_index"):
                D, I = self.index.search(query_embedding, k)
            
            # Filter and format results
            with performance_section("filter_results", "retrieval"):
                results = []
                for i, (dist, idx) in enumerate(zip(D[0], I[0])):
                    if idx < len(self.texts):
                        text = self.texts[idx]
                        metadata = self.metadata[idx]
                        
                        # Apply metadata filter
                        if metadata_filter:
                            if not all(
                                metadata.get(k) == v
                                for k, v in metadata_filter.items()
                            ):
                                continue
                        
                        results.append({
                            "text": text,
                            "metadata": metadata,
                            "score": float(1 / (1 + dist))
                        })
            
            collector.add_point(
                operation="retrieve",
                component="retrieval",
                metrics={
                    "query_length": len(query),
                    "num_results": len(results),
                    "k": k,
                    "has_filter": metadata_filter is not None
                }
            )
            
            logger.info(
                "Retrieved results successfully",
                extra={
                    "query_length": len(query),
                    "num_results": len(results)
                }
            )
            
            return results
            
        except Exception as e:
            logger.error(f"Failed to retrieve results: {str(e)}")
            raise RAGError("Failed to retrieve results") from e
    
    def get_health_status(self) -> Dict[str, Any]:
        """Get system health status."""
        return self.health_monitor.get_status()
    
    def __del__(self):
        """Cleanup on deletion."""
        collector.stop()
        self.health_monitor.stop() 