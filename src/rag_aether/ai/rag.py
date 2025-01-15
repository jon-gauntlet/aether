"""RAG system implementation."""
from typing import List, Optional, Dict, Any, Tuple
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
import torch
from sentence_transformers import CrossEncoder

# Set up logging and performance monitoring
setup_logging()
logger = get_logger("rag_system")
monitor.start_memory_tracking()

# Load environment from the project root
env_path = Path(__file__).parents[3] / '.env'
logger.info("Loading environment", extra={"env_path": str(env_path)})
load_dotenv(env_path)

class BaseRAG:
    """Base RAG system implementation."""
    
    def __init__(self, model_name: str = "BAAI/bge-large-en-v1.5"):
        self.model_name = model_name
        self.logger = logger.with_context(model=model_name)
        
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
            
        self.index = None
        self.metadata = []
        self.batch_processor = BatchProcessor()
        self.initialize_index()
        self.logger.info("BaseRAG initialized successfully")

    @with_performance_monitoring(operation="initialize_index", component="faiss_index")
    def initialize_index(self):
        """Initialize FAISS index."""
        try:
            dimension = self.embedding_model.get_sentence_embedding_dimension()
            self.index = faiss.IndexIDMap(faiss.IndexFlatIP(dimension))
            self.logger.info(
                "Index initialized",
                extra={"dimension": dimension}
            )
        except Exception as e:
            raise IndexError(
                f"Failed to initialize index: {str(e)}",
                operation="initialize_index",
                component="faiss_index"
            )

    @with_performance_monitoring(operation="encode_texts", component="embedding")
    @with_error_handling(operation="_encode_texts_batch", component="embedding")
    async def _encode_texts_batch(self, texts: List[str]) -> np.ndarray:
        """Encode a batch of texts to embeddings with caching."""
        cache_key = str(hash(tuple(texts)))
        cached = self.batch_processor.get_cached(cache_key)
        
        if cached is not None:
            self.logger.debug(
                "Using cached embeddings",
                extra={"num_texts": len(texts)}
            )
            return cached
            
        try:
            with performance_section("model_encode", "embedding"):
                embeddings = self.embedding_model.encode(texts)
                embeddings = embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)
                
            self.batch_processor.cache_result(cache_key, embeddings)
            
            self.logger.info(
                "Generated embeddings",
                extra={
                    "num_texts": len(texts),
                    "embedding_dim": embeddings.shape[1]
                }
            )
            return embeddings
            
        except Exception as e:
            raise EmbeddingError(
                f"Failed to generate embeddings: {str(e)}",
                operation="_encode_texts_batch",
                component="embedding_model",
                details={"num_texts": len(texts)}
            )

    @with_performance_monitoring(operation="ingest", component="ingestion")
    @with_error_handling(operation="ingest_text", component="ingestion")
    async def ingest_text(self, text: str, metadata: Dict[str, Any] = None) -> None:
        """Ingest a single text with metadata."""
        if metadata is None:
            metadata = {}
            
        try:
            # Get embedding
            with performance_section("get_embedding", "embedding"):
                embedding = (await self._encode_texts_batch([text]))[0]
            
            # Add to index
            with performance_section("add_to_index", "faiss_index"):
                doc_id = len(self.metadata)
                self.metadata.append(metadata)
                self.index.add_with_ids(
                    embedding.reshape(1, -1),
                    np.array([doc_id], dtype=np.int64)
                )
            
            self.logger.info(
                "Text ingested successfully",
                extra={
                    "doc_id": doc_id,
                    "metadata": metadata
                }
            )
            
        except Exception as e:
            if isinstance(e, RAGError):
                raise
            raise MetadataError(
                f"Failed to ingest text: {str(e)}",
                operation="ingest_text",
                component="ingestion",
                details={"metadata": metadata}
            )

    @with_performance_monitoring(operation="retrieve", component="retrieval")
    @with_error_handling(operation="retrieve_with_fusion", component="retrieval")
    async def retrieve_with_fusion(
        self,
        query: str,
        k: int = 5,
        relevant_ids: Optional[List[int]] = None,
        metadata_filters: Optional[Dict[str, Any]] = None
    ) -> Tuple[List[str], List[Dict[str, Any]], Dict[str, float]]:
        """Retrieve relevant texts with metadata filtering."""
        try:
            # Get query embedding
            with performance_section("query_embedding", "embedding"):
                query_embedding = (await self._encode_texts_batch([query]))[0]
            
            # Search index
            with performance_section("faiss_search", "faiss_index"):
                scores, doc_ids = self.index.search(
                    query_embedding.reshape(1, -1),
                    k
                )
            
            # Apply metadata filters
            with performance_section("filter_results", "retrieval"):
                filtered_results = []
                for score, doc_id in zip(scores[0], doc_ids[0]):
                    if doc_id == -1:  # FAISS padding
                        continue
                        
                    metadata = self.metadata[doc_id]
                    if self._matches_filters(metadata, metadata_filters):
                        filtered_results.append((score, doc_id))
                
                # Sort by score
                filtered_results.sort(reverse=True)
            
            # Prepare response
            texts = []
            metadata_list = []
            metrics = {
                "similarity_scores": [],
                "num_results": len(filtered_results)
            }
            
            for score, doc_id in filtered_results:
                texts.append(self.texts[doc_id])
                metadata_list.append(self.metadata[doc_id])
                metrics["similarity_scores"].append(float(score))
            
            self.logger.info(
                "Retrieval successful",
                extra={
                    "num_results": len(filtered_results),
                    "max_score": max(metrics["similarity_scores"]) if metrics["similarity_scores"] else 0
                }
            )
            
            return texts, metadata_list, metrics
            
        except Exception as e:
            if isinstance(e, RAGError):
                raise
            raise RetrievalError(
                f"Failed to retrieve results: {str(e)}",
                operation="retrieve_with_fusion",
                component="retrieval",
                details={
                    "query": query,
                    "k": k,
                    "metadata_filters": metadata_filters
                }
            )

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