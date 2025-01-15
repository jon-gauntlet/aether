"""RAG system implementation."""
from typing import List, Optional, Dict, Any, Tuple, Union, AsyncIterator, Callable
import os
import json
import asyncio
import numpy as np
import aiohttp
from sentence_transformers import SentenceTransformer, util
import faiss
from dotenv import load_dotenv
from pathlib import Path
import time
from rag_aether.data.firebase_adapter import FirebaseAdapter
from rag_aether.core.health import SystemHealth, with_retries, with_health_check
from rag_aether.core.metrics import (
    MetricsTracker, QueryMetrics, RetrievalMetrics,
    mean_reciprocal_rank, normalized_dcg, recall_at_k
)
from rag_aether.core.errors import (
    RAGError, EmbeddingError, IndexError, RetrievalError,
    MetadataError, with_error_handling
)
from rag_aether.core.logging import get_logger, setup_logging
from rag_aether.core.performance import (
    with_performance_monitoring, performance_section, monitor
)
from rag_aether.ai.hybrid_search import HybridRetriever
from rag_aether.ai.query_expansion import QueryProcessor
from rag_aether.ai.document_processor import DocumentProcessor, DocumentChunk
import torch
from sentence_transformers import CrossEncoder
from rag_aether.core.cache import QueryCache, EmbeddingCache
from rag_aether.core.index import ShardedIndex
from rag_aether.core.streaming import ResultStreamer
from rag_aether.core.bulk import BulkIngester, BulkRetriever, BulkProgress
from rag_aether.core.rate_limit import RateLimitManager, RateLimitConfig
from rag_aether.core.quality import (
    QualityScorer, SourceAttributor, ResultDiversifier,
    QualityMetrics, SourceAttribution
)
from rag_aether.core.webhooks import (
    WebhookManager, WebhookEvent,
    EVENT_QUERY, EVENT_INGESTION, EVENT_ERROR,
    EVENT_RATE_LIMIT, EVENT_QUALITY
)

# Set up logging and performance monitoring
setup_logging()
logger = get_logger("rag_system")
monitor.start_memory_tracking()

# Load environment from the project root
env_path = Path(__file__).parents[3] / '.env'
logger.info("Loading environment", extra={"env_path": str(env_path)})
load_dotenv(env_path)

class CrossEncoderReranker:
    """Cross-encoder for reranking retrieval results."""
    
    def __init__(self, model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"):
        """Initialize cross-encoder model."""
        self.model_name = model_name
        self.model = CrossEncoder(model_name)
        logger.info(f"Initialized cross-encoder reranker with model: {model_name}")
    
    @with_performance_monitoring(operation="rerank", component="cross_encoder")
    def rerank(
        self,
        query: str,
        texts: List[str],
        scores: Optional[List[float]] = None,
        top_k: Optional[int] = None
    ) -> List[Tuple[str, float]]:
        """Rerank texts using cross-encoder scores."""
        try:
            # Prepare text pairs for cross-encoder
            pairs = [[query, text] for text in texts]
            
            # Get cross-encoder scores
            with performance_section("score_calculation", "cross_encoder"):
                cross_scores = self.model.predict(pairs)
            
            # Combine with initial scores if provided
            if scores is not None:
                # Normalize both score distributions
                cross_scores = (cross_scores - cross_scores.min()) / (cross_scores.max() - cross_scores.min())
                norm_scores = (np.array(scores) - min(scores)) / (max(scores) - min(scores))
                
                # Weighted combination (0.7 for cross-encoder, 0.3 for initial scores)
                final_scores = 0.7 * cross_scores + 0.3 * norm_scores
            else:
                final_scores = cross_scores
            
            # Sort by scores
            ranked_results = sorted(
                zip(texts, final_scores),
                key=lambda x: x[1],
                reverse=True
            )
            
            # Return top k if specified
            if top_k is not None:
                ranked_results = ranked_results[:top_k]
            
            return ranked_results
            
        except Exception as e:
            logger.error(f"Reranking failed: {str(e)}")
            raise RetrievalError(
                f"Failed to rerank results: {str(e)}",
                operation="rerank",
                component="cross_encoder"
            )

class BaseRAG:
    """Base RAG system implementation."""
    
    def __init__(
        self,
        model_name: str = "BAAI/bge-large-en-v1.5",
        reranker_model: str = "cross-encoder/ms-marco-MiniLM-L-6-v2",
        dense_weight: float = 0.7,
        use_query_expansion: bool = True,
        use_query_reformulation: bool = True,
        max_query_variations: int = 3,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        merge_chunks: bool = True,
        query_cache_size: int = 1000,
        embedding_cache_size: int = 10000,
        num_shards: int = 2,
        index_type: str = "IVFFlat",
        use_gpu: bool = False,
        stream_chunk_size: int = 5,
        stream_buffer_size: int = 100,
        bulk_batch_size: int = 100,
        max_concurrent_batches: int = 5,
        rate_limit_config: Optional[Dict[str, RateLimitConfig]] = None,
        min_confidence_threshold: float = 0.7,
        min_relevance_threshold: float = 0.6,
        diversity_threshold: float = 0.3,
        max_similarity: float = 0.8,
        webhook_urls: Optional[Dict[str, str]] = None,
        webhook_secret: Optional[str] = None
    ):
        """Initialize RAG system."""
        self.model_name = model_name
        self.logger = logger.with_context(model=model_name)
        
        # Initialize embedding model
        with performance_section("init", "embedding_model"):
            try:
                self.embedding_model = SentenceTransformer(model_name)
            except Exception as e:
                raise EmbeddingError(
                    f"Failed to load embedding model: {str(e)}",
                    operation="init",
                    component="embedding_model",
                    details={"model_name": model_name}
                )
        
        # Initialize cross-encoder reranker
        with performance_section("init", "cross_encoder"):
            try:
                self.reranker = CrossEncoderReranker(reranker_model)
            except Exception as e:
                raise EmbeddingError(
                    f"Failed to load reranker model: {str(e)}",
                    operation="init",
                    component="cross_encoder",
                    details={"model_name": reranker_model}
                )
        
        # Initialize hybrid retriever
        with performance_section("init", "hybrid_retriever"):
            try:
                self.hybrid_retriever = HybridRetriever(dense_weight=dense_weight)
            except Exception as e:
                raise RetrievalError(
                    f"Failed to initialize hybrid retriever: {str(e)}",
                    operation="init",
                    component="hybrid_retriever"
                )
        
        # Initialize query processor
        with performance_section("init", "query_processor"):
            try:
                self.query_processor = QueryProcessor(
                    use_expansion=use_query_expansion,
                    use_reformulation=use_query_reformulation,
                    max_variations=max_query_variations
                )
            except Exception as e:
                raise RAGError(
                    f"Failed to initialize query processor: {str(e)}",
                    operation="init",
                    component="query_processor"
                )
        
        # Initialize document processor
        with performance_section("init", "document_processor"):
            try:
                self.document_processor = DocumentProcessor(
                    chunk_size=chunk_size,
                    chunk_overlap=chunk_overlap
                )
            except Exception as e:
                raise RAGError(
                    f"Failed to initialize document processor: {str(e)}",
                    operation="init",
                    component="document_processor"
                )
        
        self.merge_chunks = merge_chunks
        self.index = None
        self.chunks: List[DocumentChunk] = []
        self.initialize_index()
        self.logger.info("BaseRAG initialized successfully")
        
        # Initialize caches
        with performance_section("init", "cache"):
            try:
                self.query_cache = QueryCache(max_size=query_cache_size)
                self.embedding_cache = EmbeddingCache(max_size=embedding_cache_size)
                logger.info(
                    "Initialized caches",
                    extra={
                        "query_cache_size": query_cache_size,
                        "embedding_cache_size": embedding_cache_size
                    }
                )
            except Exception as e:
                raise RAGError(
                    f"Failed to initialize caches: {str(e)}",
                    operation="init",
                    component="cache"
                )
        
        # Initialize sharded index
        with performance_section("init", "sharded_index"):
            try:
                self.index = ShardedIndex(
                    dimension=384,  # BGE model dimension
                    num_shards=num_shards,
                    index_type=index_type,
                    use_gpu=use_gpu
                )
                logger.info(
                    "Initialized sharded index",
                    extra={
                        "num_shards": num_shards,
                        "index_type": index_type,
                        "use_gpu": use_gpu
                    }
                )
            except Exception as e:
                raise IndexError(
                    f"Failed to initialize sharded index: {str(e)}",
                    operation="init",
                    component="sharded_index"
                )
        
        # Initialize result streamer
        with performance_section("init", "streamer"):
            try:
                self.streamer = ResultStreamer(
                    chunk_size=stream_chunk_size,
                    buffer_size=stream_buffer_size
                )
                logger.info(
                    "Initialized result streamer",
                    extra={
                        "chunk_size": stream_chunk_size,
                        "buffer_size": stream_buffer_size
                    }
                )
            except Exception as e:
                raise RAGError(
                    f"Failed to initialize result streamer: {str(e)}",
                    operation="init",
                    component="streamer"
                )
        
        # Initialize bulk processors
        with performance_section("init", "bulk"):
            try:
                self.bulk_ingester = BulkIngester(
                    rag_system=self,
                    batch_size=bulk_batch_size,
                    max_concurrent_batches=max_concurrent_batches
                )
                self.bulk_retriever = BulkRetriever(
                    rag_system=self,
                    batch_size=bulk_batch_size,
                    max_concurrent_batches=max_concurrent_batches
                )
                logger.info(
                    "Initialized bulk processors",
                    extra={
                        "batch_size": bulk_batch_size,
                        "max_concurrent_batches": max_concurrent_batches
                    }
                )
            except Exception as e:
                raise RAGError(
                    f"Failed to initialize bulk processors: {str(e)}",
                    operation="init",
                    component="bulk"
                )
        
        # Initialize rate limit manager
        with performance_section("init", "rate_limit"):
            try:
                self.rate_limit_manager = RateLimitManager()
                if rate_limit_config:
                    for component, config in rate_limit_config.items():
                        self.rate_limit_manager.get_limiter(component, config)
                logger.info("Initialized rate limit manager")
            except Exception as e:
                raise RAGError(
                    f"Failed to initialize rate limit manager: {str(e)}",
                    operation="init",
                    component="rate_limit"
                )
        
        # Initialize quality components
        with performance_section("init", "quality"):
            try:
                self.quality_scorer = QualityScorer(
                    min_confidence_threshold=min_confidence_threshold,
                    min_relevance_threshold=min_relevance_threshold
                )
                self.source_attributor = SourceAttributor()
                self.result_diversifier = ResultDiversifier(
                    diversity_threshold=diversity_threshold,
                    max_similarity=max_similarity
                )
                logger.info("Initialized quality components")
            except Exception as e:
                raise RAGError(
                    f"Failed to initialize quality components: {str(e)}",
                    operation="init",
                    component="quality"
                )
        
        # Initialize webhook manager
        with performance_section("init", "webhooks"):
            try:
                self.webhook_manager = WebhookManager()
                
                if webhook_urls:
                    for event_type, url in webhook_urls.items():
                        client = WebhookClient(
                            url=url,
                            secret=webhook_secret
                        )
                        self.webhook_manager.subscribe(event_type, client)
                
                logger.info(
                    "Initialized webhook manager",
                    extra={"webhook_urls": webhook_urls or {}}
                )
            except Exception as e:
                raise RAGError(
                    f"Failed to initialize webhook manager: {str(e)}",
                    operation="init",
                    component="webhooks"
                )
    
    @with_performance_monitoring(operation="ingest", component="ingestion")
    async def ingest_text(
        self,
        text: Union[str, DocumentChunk],
        metadata: Optional[Dict[str, Any]] = None,
        doc_id: Optional[str] = None
    ) -> None:
        """Ingest text into the system with rate limiting."""
        try:
            # Apply rate limit
            await self.rate_limit_manager.get_limiter("ingestion").check_rate_limit()
            
            # Process document if raw text
            if isinstance(text, str):
                chunks = self.document_processor.process_document(
                    text,
                    metadata=metadata,
                    doc_id=doc_id
                )
                
                # Optionally merge chunks
                if self.merge_chunks:
                    chunks = self.document_processor.merge_chunks(chunks)
            else:
                chunks = [text]
            
            # Get embeddings for all chunks
            with performance_section("chunk_embedding", "embedding"):
                chunk_texts = [chunk.text for chunk in chunks]
                embeddings = await self._encode_texts_batch(chunk_texts)
            
            # Add chunks and embeddings to index
            with performance_section("index_update", "sharded_index"):
                chunk_ids = np.array([len(self.chunks) + i for i in range(len(chunks))])
                self.index.add(embeddings, chunk_ids)
                self.chunks.extend(chunks)
            
            # Update hybrid retriever
            with performance_section("hybrid_index", "hybrid"):
                self.hybrid_retriever.index([c.text for c in self.chunks])
            
            self.logger.info(
                "Text ingested successfully",
                extra={
                    "num_chunks": len(chunks),
                    "avg_chunk_size": np.mean([len(c.text) for c in chunks])
                }
            )
            
            # Publish ingestion event
            await self._publish_event(
                event_type=EVENT_INGESTION,
                data={
                    "doc_id": doc_id,
                    "num_chunks": len(chunks),
                    "metadata": metadata
                }
            )
            
        except Exception as e:
            # Publish error event
            await self._publish_event(
                event_type=EVENT_ERROR,
                data={
                    "operation": "ingest",
                    "error": str(e),
                    "doc_id": doc_id
                }
            )
            raise
    
    @track_operation("retrieve", "retrieval")
    async def retrieve_with_fusion(
        self,
        query: str,
        k: int = 5,
        rerank_k: Optional[int] = None,
        metadata_filter: Optional[Dict[str, Any]] = None,
        use_query_processing: bool = True,
        return_contexts: bool = False,
        min_confidence: Optional[float] = None,
        diversify_results: bool = True
    ) -> Dict[str, Any]:
        """Retrieve relevant texts using query with hybrid search, reranking, and quality metrics."""
        try:
            # Apply rate limit
            await self.rate_limit_manager.get_limiter("retrieval").check_rate_limit()
            
            # Check query cache
            cache_key = self.query_cache.get_key(
                query=query,
                k=k,
                metadata_filter=metadata_filter
            )
            cached_results = self.query_cache.get(cache_key)
            if cached_results is not None:
                logger.info("Using cached query results")
                return cached_results
            
            # Process query variations
            if use_query_processing:
                with performance_section("query_processing", "query_processor"):
                    query_variations = self.query_processor.process_query(query)
                    logger.info(
                        "Generated query variations",
                        extra={"num_variations": len(query_variations)}
                    )
            else:
                query_variations = [query]
            
            # Get embeddings for all variations
            with performance_section("query_embedding", "embedding"):
                query_embeddings = await self._encode_texts_batch(query_variations)
            
            # Initialize results container
            all_results = []
            seen_chunks = set()
            
            # Process each query variation
            for q, q_embedding in zip(query_variations, query_embeddings):
                # FAISS search
                initial_k = max(rerank_k or k * 3, k * 2)
                with performance_section("faiss_search", "sharded_index"):
                    D, I = self.index.search(q_embedding.reshape(1, -1), initial_k)
                
                # Prepare dense results for hybrid search
                dense_results = [
                    (int(idx), float(1 / (1 + dist)))
                    for dist, idx in zip(D[0], I[0])
                    if idx != -1
                ]
                
                # Hybrid search
                with performance_section("hybrid_search", "hybrid"):
                    hybrid_results = self.hybrid_retriever.hybrid_search(
                        q,
                        dense_results,
                        k=initial_k
                    )
                
                # Filter and format results
                with performance_section("filter_results", "retrieval"):
                    for idx, score in hybrid_results:
                        if idx < len(self.chunks):
                            chunk = self.chunks[idx]
                            
                            # Skip if we've seen this chunk
                            if chunk.chunk_id in seen_chunks:
                                continue
                            
                            # Apply metadata filter
                            if metadata_filter:
                                if not all(
                                    chunk.metadata.get(k) == v
                                    for k, v in metadata_filter.items()
                                ):
                                    continue
                            
                            seen_chunks.add(chunk.chunk_id)
                            
                            result = {
                                "text": chunk.text,
                                "metadata": chunk.metadata,
                                "score": score,
                                "matched_query": q
                            }
                            
                            if return_contexts:
                                # Add surrounding context
                                context = self._get_chunk_context(chunk)
                                result["context"] = context
                            
                            all_results.append(result)
            
            # Rerank combined results
            with performance_section("rerank", "cross_encoder"):
                if all_results:
                    texts_to_rerank = [r["text"] for r in all_results]
                    initial_scores = [r["score"] for r in all_results]
                    
                    reranked = self.reranker.rerank(
                        query,  # Use original query for reranking
                        texts_to_rerank,
                        scores=initial_scores,
                        top_k=k
                    )
                    
                    # Update results with reranked scores
                    reranked_results = []
                    for text, score in reranked:
                        for result in all_results:
                            if result["text"] == text:
                                result["score"] = float(score)
                                reranked_results.append(result)
                                break
                    
                    all_results = reranked_results[:k]
            
            # Get embeddings for quality metrics
            result_embeddings = None
            if len(all_results) > 0:
                with performance_section("quality_embeddings", "embedding"):
                    texts_to_encode = [r["text"] for r in all_results]
                    result_embeddings = await self._encode_texts_batch(texts_to_encode)
            
            # Calculate quality metrics
            with performance_section("quality_metrics", "quality"):
                quality_metrics = self.quality_scorer.calculate_metrics(
                    query=query,
                    results=all_results,
                    embeddings=result_embeddings
                )
            
            # Filter by confidence if needed
            if min_confidence is not None and quality_metrics.confidence_score < min_confidence:
                logger.warning(
                    "Results filtered due to low confidence",
                    extra={
                        "confidence_score": quality_metrics.confidence_score,
                        "min_confidence": min_confidence
                    }
                )
                all_results = []
            
            # Diversify results if requested
            if diversify_results and len(all_results) > 0:
                with performance_section("diversify", "quality"):
                    all_results = self.result_diversifier.diversify_results(
                        results=all_results,
                        embeddings=result_embeddings,
                        min_results=k
                    )
            
            # Add source attribution
            with performance_section("attribution", "quality"):
                attributions = self.source_attributor.add_attribution(
                    results=all_results,
                    quality_metrics=quality_metrics
                )
            
            # Update results with quality information
            response = {
                "results": all_results,
                "quality_metrics": quality_metrics,
                "attributions": attributions,
                "metadata": {
                    "query_length": len(query),
                    "num_variations": len(query_variations),
                    "num_results": len(all_results),
                    "k": k,
                    "rerank_k": rerank_k,
                    "has_filter": metadata_filter is not None,
                    "confidence_score": quality_metrics.confidence_score,
                    "diversity_score": quality_metrics.diversity_score
                }
            }
            
            # Cache results
            self.query_cache.set(cache_key, response)
            
            # Log metrics
            logger.info(
                "Retrieved and processed results",
                extra={
                    "query_length": len(query),
                    "num_results": len(all_results),
                    "confidence_score": quality_metrics.confidence_score,
                    "diversity_score": quality_metrics.diversity_score
                }
            )
            
            # Publish query event
            await self._publish_event(
                event_type=EVENT_QUERY,
                data={
                    "query": query,
                    "num_results": len(all_results),
                    "quality_metrics": asdict(quality_metrics),
                    "metadata": response["metadata"]
                }
            )
            
            return response
            
        except Exception as e:
            # Publish error event
            await self._publish_event(
                event_type=EVENT_ERROR,
                data={
                    "operation": "retrieve",
                    "error": str(e),
                    "query": query
                }
            )
            raise
    
    def _get_chunk_context(self, chunk: DocumentChunk) -> Dict[str, Any]:
        """Get surrounding context for a chunk."""
        context = {
            "section_title": chunk.section_title,
            "hierarchy_level": chunk.hierarchy_level,
            "chunk_number": chunk.metadata["chunk_number"],
            "total_chunks": chunk.metadata["total_chunks"]
        }
        
        # Get previous chunk if available
        if chunk.prev_chunk_id is not None:
            for c in self.chunks:
                if c.chunk_id == chunk.prev_chunk_id:
                    context["prev_chunk"] = {
                        "text": c.text,
                        "section_title": c.section_title
                    }
                    break
        
        # Get next chunk if available
        if chunk.next_chunk_id is not None:
            for c in self.chunks:
                if c.chunk_id == chunk.next_chunk_id:
                    context["next_chunk"] = {
                        "text": c.text,
                        "section_title": c.section_title
                    }
                    break
        
        return context

    @with_performance_monitoring(operation="encode_texts", component="embedding")
    @with_error_handling(operation="_encode_texts_batch", component="embedding")
    async def _encode_texts_batch(self, texts: List[str]) -> np.ndarray:
        """Encode a batch of texts to embeddings with caching and rate limiting."""
        try:
            # Apply rate limit
            await self.rate_limit_manager.get_limiter("embedding").check_rate_limit()
            
            # Check cache for each text
            embeddings = []
            texts_to_encode = []
            text_indices = []
            
            for i, text in enumerate(texts):
                cache_key = self.embedding_cache.get_key(text)
                cached_embedding = self.embedding_cache.get(cache_key)
                
                if cached_embedding is not None:
                    embeddings.append(cached_embedding)
                else:
                    texts_to_encode.append(text)
                    text_indices.append(i)
            
            # Encode missing texts
            if texts_to_encode:
                with performance_section("model_encode", "embedding"):
                    new_embeddings = self.embedding_model.encode(texts_to_encode)
                    new_embeddings = new_embeddings / np.linalg.norm(new_embeddings, axis=1, keepdims=True)
                    
                    # Cache new embeddings
                    for text, embedding in zip(texts_to_encode, new_embeddings):
                        cache_key = self.embedding_cache.get_key(text)
                        self.embedding_cache.set(cache_key, embedding)
                    
                    # Insert new embeddings in correct positions
                    for idx, embedding in zip(text_indices, new_embeddings):
                        embeddings.insert(idx, embedding)
            
            # Publish rate limit event if delayed
            if self.rate_limit_manager:
                limiter = self.rate_limit_manager.get_limiter("embedding")
                metrics = limiter.get_metrics()
                
                if metrics["delayed_requests"] > 0:
                    await self._publish_event(
                        event_type=EVENT_RATE_LIMIT,
                        data={
                            "component": "embedding",
                            "metrics": metrics
                        }
                    )
            
            return np.array(embeddings)
            
        except Exception as e:
            # Publish error event
            await self._publish_event(
                event_type=EVENT_ERROR,
                data={
                    "operation": "encode_texts",
                    "error": str(e)
                }
            )
            raise

    def _matches_filters(self, metadata: Dict[str, Any], filters: Optional[Dict[str, Any]] = None) -> bool:
        """Check if metadata matches the given filters."""
        if not filters:
            return True
            
        for key, value in filters.items():
            if key not in metadata:
                return False
                
            if isinstance(value, dict):
                # Handle range filters
                if "min" in value and metadata[key] < value["min"]:
                    return False
                if "max" in value and metadata[key] > value["max"]:
                    return False
            elif metadata[key] != value:
                return False
                
        return True

    async def _encode_texts_batch(self, texts: List[str]) -> np.ndarray:
        """Encode a batch of texts to embeddings with caching"""
        cache_key = str(hash(tuple(texts)))
        cached = self.batch_processor.get_cached(cache_key)
        if cached is not None:
            return cached
            
        embeddings = self.embedding_model.encode(texts)
        embeddings = embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)
        self.batch_processor.cache_result(cache_key, embeddings)
        return embeddings

    async def ingest_text(self, text: str, metadata: Dict[str, Any] = None) -> None:
        """Ingest a single text with metadata"""
        if metadata is None:
            metadata = {}
            
        # Get embedding
        embedding = (await self._encode_texts_batch([text]))[0]
        
        # Add to index
        doc_id = len(self.metadata)
        self.metadata.append(metadata)
        self.index.add_with_ids(
            embedding.reshape(1, -1),
            np.array([doc_id], dtype=np.int64)
        )
        
        # Log ingestion
        logger.info(f"Ingested document {doc_id} with metadata: {metadata}")

    async def retrieve_with_fusion(
        self, 
        query: str, 
        k: int = 5,
        relevant_ids: Optional[List[int]] = None,
        metadata_filters: Optional[Dict[str, Any]] = None
    ) -> Tuple[List[str], List[Dict[str, Any]], Dict[str, float]]:
        """
        Retrieve documents using reciprocal rank fusion.
        
        Args:
            query: The search query
            k: Number of results to return
            relevant_ids: Optional list of document IDs to restrict search to
            metadata_filters: Optional filters to apply on metadata
            
        Returns:
            Tuple of (texts, metadata, metrics)
        """
        start_time = time.time()
        
        # Get query embedding
        query_embedding = self.embedding_model.encode(query)
        query_embedding = query_embedding / np.linalg.norm(query_embedding)
        
        # Search index
        D, I = self.index.search(query_embedding.reshape(1, -1), k * 2)  # Get more results for filtering
        
        # Filter by metadata if needed
        if metadata_filters:
            filtered_indices = []
            filtered_distances = []
            for idx, (doc_id, distance) in enumerate(zip(I[0], D[0])):
                if doc_id >= len(self.metadata):
                    continue
                    
                doc_metadata = self.metadata[doc_id]
                matches_filters = True
                
                for key, value in metadata_filters.items():
                    if isinstance(value, dict) and "min" in value and "max" in value:
                        # Handle range filters
                        field_value = doc_metadata.get(key)
                        if field_value is None or not (value["min"] <= field_value <= value["max"]):
                            matches_filters = False
                            break
                    else:
                        # Handle exact match filters
                        if doc_metadata.get(key) != value:
                            matches_filters = False
                            break
                
                if matches_filters:
                    filtered_indices.append(doc_id)
                    filtered_distances.append(distance)
                    
                    if len(filtered_indices) >= k:
                        break
                        
            if filtered_indices:
                I = np.array([filtered_indices])
                D = np.array([filtered_distances])
            else:
                I = np.array([[]])
                D = np.array([[]])
        
        # Get texts and metadata
        texts = []
        metadata_list = []
        for doc_id in I[0]:
            if doc_id < len(self.metadata):
                metadata_list.append(self.metadata[doc_id])
                texts.append(metadata_list[-1].get("text", ""))
        
        # Calculate metrics
        end_time = time.time()
        metrics = {
            "retrieval_time_ms": (end_time - start_time) * 1000,
            "num_results": len(texts),
            "similarity_scores": D[0].tolist() if len(D) > 0 else []
        }
        
        return texts, metadata_list, metrics

    def _find_node_by_embedding(self, node: SummaryNode, target_embedding: np.ndarray) -> Optional[SummaryNode]:
        """Find node with matching embedding."""
        if node.embedding is not None and np.allclose(node.embedding, target_embedding):
            return node
            
        for child in node.children:
            result = self._find_node_by_embedding(child, target_embedding)
            if result:
                return result
                
        return None

    def _preprocess_query(self, query: str) -> str:
        """Preprocess query for better matching."""
        # Add query instruction prefix for bge model
        return f"Represent this sentence for searching relevant passages: {query}"

    def _semantic_similarity(self, query: str, texts: List[str]) -> np.ndarray:
        """Calculate semantic similarity between query and texts."""
        # Encode query and texts
        query_embedding = self.embedding_model.encode([self._preprocess_query(query)])[0]
        text_embeddings = self.embedding_model.encode(texts)
        
        # Normalize embeddings
        query_embedding = query_embedding / np.linalg.norm(query_embedding)
        text_embeddings = text_embeddings / np.linalg.norm(text_embeddings, axis=1, keepdims=True)
        
        # Calculate cosine similarity
        similarities = np.dot(text_embeddings, query_embedding)
        
        return similarities

    def _bi_encoder_rerank(self, query: str, texts: List[str], top_k: int) -> Tuple[List[int], np.ndarray]:
        """Rerank texts using bi-encoder model."""
        # Get query and text embeddings
        query_embedding = self.embedding_model.encode([query], convert_to_tensor=True, normalize_embeddings=True)
        text_embeddings = self.embedding_model.encode(texts, convert_to_tensor=True, normalize_embeddings=True)
        
        # Calculate similarity scores
        scores = util.pytorch_cos_sim(query_embedding, text_embeddings)[0]
        scores = scores.cpu().numpy()
        
        # Get top-k indices
        top_indices = np.argsort(scores)[-top_k:][::-1]
        return top_indices.tolist(), scores

    def _reciprocal_rank_fusion(
        self, 
        rankings: List[List[int]], 
        scores: Optional[List[np.ndarray]] = None,
        k: int = 60
    ) -> List[int]:
        """Enhanced Reciprocal Rank Fusion with technical focus."""
        score_by_id = {}
        
        # Calculate RRF scores with technical weighting
        for i, ranking in enumerate(rankings):
            ranking_scores = scores[i] if scores is not None else None
            
            # Calculate rank weights (sharper decay for technical queries)
            rank_weights = np.exp(-np.arange(len(ranking)) / 3)  # Sharper decay
            
            for rank, doc_id in enumerate(ranking):
                # Base RRF score with rank weight
                rrf_score = rank_weights[rank] / (k + rank + 1)
                
                # Weight by similarity score if available
                if ranking_scores is not None:
                    # Apply sigmoid with higher slope for more distinction
                    sim_weight = 1 / (1 + np.exp(-8 * (ranking_scores[rank] - 0.6)))  # Higher threshold
                    rrf_score *= (1 + 1.5 * sim_weight)  # Increased weight for high scores
                    
                score_by_id[doc_id] = score_by_id.get(doc_id, 0.0) + rrf_score
        
        # Sort by score
        sorted_ids = sorted(score_by_id.keys(), key=lambda x: score_by_id[x], reverse=True)
        return sorted_ids

    async def _expand_query(self, query: str) -> List[str]:
        """Expand query using Claude with technical focus."""
        try:
            prompt = f"""Given the technical search query below, generate 2-3 alternative phrasings that would help find relevant technical information. Focus on:
1. Technical terminology and synonyms
2. Related technical concepts
3. More specific technical details

Format as a comma-separated list. Keep each alternative concise and focused on technical aspects.
            
Query: {query}

Alternative phrasings:"""
            
            expanded, _ = await self._call_claude_api("", prompt)
            expansions = [q.strip() for q in expanded.split(",") if q.strip()]
            
            # Ensure we have the original query and at least one expansion
            if not expansions:
                return [query]
            
            # Preprocess expansions
            processed_expansions = [self._preprocess_query(q) for q in expansions]
            # Remove duplicates while preserving order
            seen = {query}
            unique_expansions = []
            for q in processed_expansions:
                if q not in seen:
                    seen.add(q)
                    unique_expansions.append(q)
            
            return [query] + unique_expansions[:2]  # Limit to 2 unique expansions
        except Exception as e:
            logger.warning(f"Query expansion failed: {str(e)}")
            return [query]

    def _cross_encoder_rerank(self, query: str, texts: List[str], top_k: int) -> Tuple[List[int], np.ndarray]:
        """Rerank texts using cross-encoder model."""
        # Create input pairs for cross-encoder
        pairs = [[query, text] for text in texts]
        
        # Get cross-encoder scores
        scores = self.cross_encoder.predict(pairs)
        
        # Get top-k indices
        top_indices = np.argsort(scores)[-top_k:][::-1]
        return top_indices.tolist(), scores

    async def _semantic_similarity_batch(
        self,
        query: str,
        texts: List[str]
    ) -> np.ndarray:
        """Calculate semantic similarity with batched processing."""
        # Get query embedding
        query_embedding = (await self._encode_texts_batch([self._preprocess_query(query)]))[0]
        
        # Get text embeddings in batches
        text_embeddings = await self._encode_texts_batch(texts)
        
        # Normalize
        query_embedding = query_embedding / np.linalg.norm(query_embedding)
        text_embeddings = text_embeddings / np.linalg.norm(text_embeddings, axis=1, keepdims=True)
        
        return np.dot(text_embeddings, query_embedding)
        
    async def retrieve_with_fusion(
        self,
        query: str,
        k: int = 3,
        relevant_ids: Optional[List[str]] = None,
        metadata_filters: Optional[Dict[str, Any]] = None
    ) -> Tuple[List[str], List[Dict[str, Any]], Dict[str, float]]:
        """Enhanced retrieval with batched processing and caching."""
        start_time = time.time()
        
        # Check query cache
        cache_key = f"query_{hash(query)}_{k}_{hash(str(metadata_filters))}"
        cached = self.batch_processor.get_cached(cache_key)
        if cached is not None:
            logger.info("Query cache hit")
            return cached
            
        # Get initial results
        texts, metadata, metrics = await super().retrieve_with_fusion(query, k * 2, relevant_ids)
        
        # Process related documents in batches
        doc_ids = [str(i) for i in range(len(texts))]
        if metadata_filters:
            filtered_ids = self.context_enhancer.filter_by_metadata(doc_ids, metadata_filters)
            filtered_indices = [i for i, doc_id in enumerate(doc_ids) if doc_id in filtered_ids]
            texts = [texts[i] for i in filtered_indices]
            metadata = [metadata[i] for i in filtered_indices]
            doc_ids = [doc_ids[i] for i in filtered_indices]
            
        # Get related docs
        all_related = set()
        for doc_id in doc_ids[:k]:
            related = self.context_enhancer.get_related_docs(doc_id)
            all_related.update(related)
            
        if all_related:
            related_texts = [self.texts[int(i)] for i in all_related]
            related_metadata = [self.metadatas[int(i)] for i in all_related]
            
            # Score related docs in batches
            related_scores = await self._semantic_similarity_batch(query, related_texts)
            
            for i, score in enumerate(related_scores):
                if score > 0.7:
                    texts.append(related_texts[i])
                    metadata.append(related_metadata[i])
                    
        # Truncate results
        texts = texts[:k]
        metadata = metadata[:k]
        
        # Update metrics
        retrieval_time = (time.time() - start_time) * 1000
        metrics = {
            "retrieval_time_ms": retrieval_time,
            "num_results": len(texts),
            "similarity_scores": metrics.get("similarity_scores", [])
        }
        
        # Cache results
        result = (texts, metadata, metrics)
        self.batch_processor.cache_result(cache_key, result)
        
        return result

    @with_retries(max_attempts=3, delay=1)
    async def _call_claude_api(self, context: str, query: str) -> Tuple[str, int]:
        """Call Claude API with persona-aware prompting."""
        logger.info(f"Using API key: {self.api_key[:10]}...")
        async with aiohttp.ClientSession() as session:
            headers = {
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            }
            logger.info(f"Request headers: {headers}")
            async with session.post(
                "https://api.anthropic.com/v1/messages",
                headers=headers,
                json={
                    "model": self.model_name,
                    "max_tokens": 1000,
                    "temperature": 0,
                    "system": self.persona.to_system_prompt(),
                    "messages": [
                        {
                            "role": "user",
                            "content": f"Context from chat messages:\n{context}\n\nQuestion: {query}"
                        }
                    ]
                }
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise RuntimeError(f"Claude API error: {error_text}")
                    
                result = await response.json()
                answer = result["content"][0]["text"]
                num_tokens = len(answer.split())  # Approximate token count
                return answer, num_tokens

    async def query(
        self,
        query: str,
        max_results: int = 5,
        relevant_ids: Optional[List[int]] = None,
        metadata_filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Query the RAG system with metadata filtering."""
        try:
            # Get relevant texts
            texts, metadata, retrieval_metrics = await self.retrieve_with_fusion(
                query, max_results, relevant_ids, metadata_filters
            )
            
            # Log query metrics
            self.metrics.log_query(
                query=query,
                results=texts,
                time_ms=retrieval_metrics["retrieval_time_ms"]
            )
            
            # Return results
            return {
                "query": query,
                "results": texts,
                "metadata": metadata,
                "metrics": {
                    "retrieval_time_ms": retrieval_metrics["retrieval_time_ms"],
                    "num_results": len(texts),
                    "similarity_scores": retrieval_metrics.get("similarity_scores", [])
                }
            }
            
        except Exception as e:
            self.metrics.log_error(e)
            raise

    async def ingest_chat_message(self, message: ChatMessage):
        """Ingest a chat message with its metadata."""
        await self.ingest_text(message.content, message.to_metadata())
        
    async def query_chat_history(
        self,
        query: str,
        channel_ids: Optional[List[str]] = None,
        time_range: Optional[Tuple[float, float]] = None,
        max_results: int = 5
    ) -> Dict[str, Any]:
        """Query chat history with optional channel and time filters."""
        metadata_filters = {}
        if channel_ids:
            metadata_filters["channel_id"] = channel_ids[0]  # For now, just use the first channel
        if time_range:
            metadata_filters["timestamp"] = {
                "min": time_range[0],
                "max": time_range[1]
            }
            
        result = await self.query(
            query=query,
            max_results=max_results,
            metadata_filters=metadata_filters
        )
        
        # Convert results back to ChatMessages
        messages = []
        for text, meta in zip(result["results"], result["metadata"]):
            if meta.get("type") == "chat_message":
                messages.append(ChatMessage.from_metadata(
                    content=text,
                    metadata=meta
                ))
                
        # Update response format
        result["chat_messages"] = messages
        return result

    def optimize_index(self) -> None:
        """Optimize the sharded index."""
        try:
            with performance_section("optimize", "sharded_index"):
                self.index.optimize()
                logger.info("Optimized sharded index")
        except Exception as e:
            logger.error(f"Failed to optimize index: {str(e)}")
            raise IndexError(
                f"Index optimization failed: {str(e)}",
                operation="optimize",
                component="sharded_index"
            )
    
    def save_index(self, directory: str) -> None:
        """Save the sharded index to disk."""
        try:
            with performance_section("save", "sharded_index"):
                self.index.save(directory)
                logger.info(f"Saved sharded index to {directory}")
        except Exception as e:
            logger.error(f"Failed to save index: {str(e)}")
            raise IndexError(
                f"Index save failed: {str(e)}",
                operation="save",
                component="sharded_index"
            )
    
    @classmethod
    def load_index(cls, directory: str) -> None:
        """Load the sharded index from disk."""
        try:
            with performance_section("load", "sharded_index"):
                index = ShardedIndex.load(directory)
                logger.info(f"Loaded sharded index from {directory}")
                return index
        except Exception as e:
            logger.error(f"Failed to load index: {str(e)}")
            raise IndexError(
                f"Index load failed: {str(e)}",
                operation="load",
                component="sharded_index"
            )

    async def retrieve_with_fusion_stream(
        self,
        query: str,
        k: int = 5,
        rerank_k: Optional[int] = None,
        metadata_filter: Optional[Dict[str, Any]] = None,
        use_query_processing: bool = True,
        return_contexts: bool = False
    ) -> AsyncIterator[Dict[str, Any]]:
        """Stream retrieval results using query with hybrid search and reranking."""
        try:
            # Get all results first
            results = await self.retrieve_with_fusion(
                query=query,
                k=k,
                rerank_k=rerank_k,
                metadata_filter=metadata_filter,
                use_query_processing=use_query_processing,
                return_contexts=return_contexts
            )
            
            # Stream results
            async for result in self.streamer.stream_results(results):
                yield result
                
        except Exception as e:
            logger.error(f"Failed to stream results: {str(e)}")
            raise RAGError(
                f"Failed to stream results: {str(e)}",
                operation="retrieve_stream",
                component="retrieval"
            )
    
    async def query_stream(
        self,
        query: str,
        max_results: int = 5,
        relevant_ids: Optional[List[int]] = None,
        metadata_filters: Optional[Dict[str, Any]] = None
    ) -> AsyncIterator[Dict[str, Any]]:
        """Stream query results with metadata filtering."""
        try:
            # Get relevant texts with streaming
            async for result in self.retrieve_with_fusion_stream(
                query=query,
                k=max_results,
                metadata_filter=metadata_filters
            ):
                # Add query info to result
                result["query"] = query
                
                # Log metrics for each chunk
                self.metrics.log_query(
                    query=query,
                    results=[result],
                    time_ms=result["streaming_metadata"].get("processed_at", 0)
                )
                
                yield result
                
        except Exception as e:
            self.metrics.log_error(e)
            raise

    async def bulk_ingest(
        self,
        documents: List[Dict[str, Any]],
        progress_callback: Optional[Callable[[BulkProgress], None]] = None
    ) -> BulkProgress:
        """Ingest multiple documents in bulk."""
        try:
            return await self.bulk_ingester.ingest_documents(
                documents,
                progress_callback
            )
        except Exception as e:
            logger.error(f"Bulk ingestion failed: {str(e)}")
            raise RAGError("Bulk ingestion failed") from e
    
    async def bulk_retrieve(
        self,
        queries: List[str],
        k: int = 5,
        metadata_filter: Optional[Dict[str, Any]] = None,
        progress_callback: Optional[Callable[[BulkProgress], None]] = None
    ) -> AsyncIterator[Dict[str, Any]]:
        """Retrieve documents for multiple queries in bulk."""
        try:
            async for result in self.bulk_retriever.retrieve_documents(
                queries,
                k=k,
                metadata_filter=metadata_filter,
                progress_callback=progress_callback
            ):
                yield result
        except Exception as e:
            logger.error(f"Bulk retrieval failed: {str(e)}")
            raise RAGError("Bulk retrieval failed") from e

    async def _publish_event(
        self,
        event_type: str,
        data: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None,
        wait_for_delivery: bool = False
    ) -> None:
        """Publish webhook event."""
        try:
            event = WebhookEvent(
                event_type=event_type,
                timestamp=time.time(),
                data=data,
                metadata=metadata
            )
            
            await self.webhook_manager.publish_event(
                event,
                wait_for_delivery=wait_for_delivery
            )
            
        except Exception as e:
            logger.error(f"Failed to publish event: {str(e)}")

class MetricsTracker:
    def __init__(self):
        self.errors = []
        self.queries = []
        self.retrieval_times = []
        
    def log_error(self, error: Exception):
        self.errors.append(str(error))
        
    def log_query(self, query: str, results: List[str], time_ms: float):
        self.queries.append({
            "query": query,
            "num_results": len(results),
            "time_ms": time_ms
        })
        self.retrieval_times.append(time_ms)
        
    def get_average_retrieval_time(self) -> float:
        if not self.retrieval_times:
            return 0.0
        return sum(self.retrieval_times) / len(self.retrieval_times)

class FirebaseAdapter:
    def __init__(self, use_mock: bool = True):
        self.use_mock = use_mock
        if use_mock:
            print("Using mock Firebase adapter")

class MockFirebaseAdapter(FirebaseAdapter):
    def __init__(self):
        super().__init__(use_mock=True) 