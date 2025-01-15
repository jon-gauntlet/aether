from typing import List, Optional, Dict, Any, Tuple
import os
import json
import logging
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
import torch
from sentence_transformers import CrossEncoder

# Load environment from the project root
env_path = Path(__file__).parents[3] / '.env'
logger = logging.getLogger("rag_system")
logger.info(f"Loading environment from: {env_path}")
load_dotenv(env_path)
logger.info(f"ANTHROPIC_API_KEY: {os.getenv('ANTHROPIC_API_KEY')[:10]}...")

class SummaryNode:
    def __init__(self, text: str, level: int = 0):
        self.text = text
        self.level = level
        self.summary = ""
        self.children = []
        self.embedding = None
        self.metadata = {}

class HierarchicalStore:
    def __init__(self, embeddings_model):
        self.root = SummaryNode("root", level=0)
        self.embeddings = embeddings_model
        self.index_by_level = {}  # FAISS index for each level
        
    async def add_document(self, text: str, metadata: Dict[str, Any], chunk_size: int = 512):
        """Add document with hierarchical chunking and summarization."""
        # Create leaf node
        leaf = SummaryNode(text, level=3)
        leaf.metadata = metadata
        
        # Generate summary
        summary_prompt = f"Summarize the following text concisely while preserving key technical details:\n\n{text}"
        summary, _ = await self._call_claude_api("", summary_prompt)
        leaf.summary = summary
        
        # Create parent summaries
        current = leaf
        for level in reversed(range(3)):  # Create level 2, 1, 0 summaries
            summary_prompt = f"Create a higher-level technical summary of:\n\n{current.summary}"
            parent_summary, _ = await self._call_claude_api("", summary_prompt)
            parent = SummaryNode(parent_summary, level=level)
            parent.children.append(current)
            current = parent
            
        # Add to root
        self.root.children.append(current)
        
        # Update embeddings and indices
        await self._update_embeddings([leaf])
        
    async def _update_embeddings(self, nodes: List[SummaryNode]):
        """Update embeddings for nodes and add to appropriate indices."""
        for node in nodes:
            # Generate embedding
            text_to_embed = self._preprocess_query(node.summary or node.text)
            node.embedding = self.embeddings.encode([text_to_embed])[0]
            
            # Ensure index exists for this level
            if node.level not in self.index_by_level:
                self.index_by_level[node.level] = faiss.IndexFlatIP(self.embeddings.get_sentence_embedding_dimension())
            
            # Add to index
            self.index_by_level[node.level].add(np.array([node.embedding]))
            
            # Recursively update children
            if node.children:
                await self._update_embeddings(node.children)

    async def search(self, query: str, top_k: int = 3) -> List[Tuple[str, Dict[str, Any], float]]:
        """Search using hierarchical navigation."""
        query_embedding = self.embeddings.encode([self._preprocess_query(query)])[0]
        
        results = []
        seen_texts = set()
        
        # Search each level, starting from root
        for level in range(4):  # 0 to 3
            if level not in self.index_by_level:
                continue
                
            # Search at current level
            D, I = self.index_by_level[level].search(
                np.array([query_embedding]), 
                min(top_k, self.index_by_level[level].ntotal)
            )
            
            # Collect unique results
            for score, idx in zip(D[0], I[0]):
                node = self._find_node_by_embedding(self.root, self.index_by_level[level].reconstruct(idx))
                if node and node.text not in seen_texts:
                    seen_texts.add(node.text)
                    results.append((node.text, node.metadata, float(score)))
                    
                    if len(results) >= top_k:
                        break
            
            if len(results) >= top_k:
                break
                
        return results[:top_k]
        
    def _find_node_by_embedding(self, node: SummaryNode, target_embedding: np.ndarray) -> Optional[SummaryNode]:
        """Find node with matching embedding."""
        if node.embedding is not None and np.allclose(node.embedding, target_embedding):
            return node
            
        for child in node.children:
            result = self._find_node_by_embedding(child, target_embedding)
            if result:
                return result
                
        return None

class ContextEnhancer:
    def __init__(self):
        self.relationship_graph = {}
        self.metadata_index = {}
        
    def add_relationship(self, source_id: str, target_id: str, relationship_type: str):
        """Add a directional relationship between documents."""
        if source_id not in self.relationship_graph:
            self.relationship_graph[source_id] = {}
        self.relationship_graph[source_id][target_id] = relationship_type
        
    def add_metadata(self, doc_id: str, metadata: Dict[str, Any]):
        """Index document metadata for quick lookup."""
        self.metadata_index[doc_id] = {
            "timestamp": metadata.get("timestamp"),
            "author": metadata.get("author"),
            "type": metadata.get("type"),
            "tags": metadata.get("tags", []),
            "references": metadata.get("references", [])
        }
        
        # Add relationships from references
        for ref in metadata.get("references", []):
            self.add_relationship(doc_id, ref, "references")
            
    def get_related_docs(self, doc_id: str, max_depth: int = 2) -> List[str]:
        """Get related document IDs up to max_depth."""
        related = set()
        current_level = {doc_id}
        
        for depth in range(max_depth):
            next_level = set()
            for current_id in current_level:
                if current_id in self.relationship_graph:
                    next_level.update(self.relationship_graph[current_id].keys())
            related.update(next_level)
            current_level = next_level
            
        return list(related - {doc_id})
        
    def filter_by_metadata(
        self,
        docs: List[str],
        filters: Dict[str, Any]
    ) -> List[str]:
        """Filter documents by metadata criteria."""
        filtered = []
        for doc_id in docs:
            metadata = self.metadata_index.get(doc_id, {})
            matches = True
            
            for key, value in filters.items():
                if key == "tags" and value:
                    if not any(tag in metadata.get("tags", []) for tag in value):
                        matches = False
                        break
                elif key == "type" and value:
                    if metadata.get("type") != value:
                        matches = False
                        break
                elif key == "after" and value:
                    if not metadata.get("timestamp") or metadata["timestamp"] < value:
                        matches = False
                        break
                        
            if matches:
                filtered.append(doc_id)
                
        return filtered

class BatchProcessor:
    def __init__(self, batch_size: int = 32):
        self.batch_size = batch_size
        self.cache = {}
        self.last_access = {}
        self.max_cache_size = 1000
        
    async def process_in_batches(
        self,
        items: List[Any],
        process_fn: callable,
        *args,
        **kwargs
    ) -> List[Any]:
        """Process items in batches for better performance."""
        results = []
        for i in range(0, len(items), self.batch_size):
            batch = items[i:i + self.batch_size]
            batch_results = await process_fn(batch, *args, **kwargs)
            results.extend(batch_results)
        return results
        
    def cache_result(self, key: str, value: Any):
        """Cache result with LRU eviction."""
        if len(self.cache) >= self.max_cache_size:
            # Evict least recently used
            lru_key = min(self.last_access.items(), key=lambda x: x[1])[0]
            del self.cache[lru_key]
            del self.last_access[lru_key]
        
        self.cache[key] = value
        self.last_access[key] = time.time()
        
    def get_cached(self, key: str) -> Optional[Any]:
        """Get cached result if available."""
        if key in self.cache:
            self.last_access[key] = time.time()
            return self.cache[key]
        return None

class RAGSystem:
    def __init__(self, model_name: str = "claude-3-opus-20240229", use_mock: bool = True):
        # Use a stronger bi-encoder model
        self.embeddings = SentenceTransformer("BAAI/bge-large-en-v1.5")
        self.embeddings.to('cpu')
        
        api_key = os.getenv("ANTHROPIC_API_KEY")
        logger.info(f"Using API key in init: {api_key[:10]}...")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable not set")
        if api_key == "your_anthropic_api_key_here":
            raise ValueError("Please set your actual Anthropic API key in .env")
            
        self.api_key = api_key
        self.model_name = model_name
        
        # Initialize FAISS indices
        self.dimension = 1024  # bge-large dimension
        self.index = faiss.IndexFlatIP(self.dimension)  # Inner product for cosine similarity
        
        # Add L2 normalization to make it cosine similarity
        self.index = faiss.IndexIDMap(self.index)
        
        self.texts = []
        self.metadatas = []
        
        self.firebase = FirebaseAdapter(use_mock=use_mock)
        self.health = SystemHealth()
        self.conversation_listener = None
        self.metrics = MetricsTracker()
        self.hierarchical_store = HierarchicalStore(self.embeddings)
        self.context_enhancer = ContextEnhancer()
        self.batch_processor = BatchProcessor()
        
    async def _cleanup(self):
        """Cleanup resources on shutdown."""
        logger.info("Cleaning up RAG system resources...")
        if self.conversation_listener:
            self.conversation_listener.unsubscribe()
        logger.info("Cleanup complete")

    @with_retries(max_attempts=3)
    async def initialize_from_firebase(self):
        """Initialize the vector store and hierarchical store from Firebase data."""
        logger.info("Initializing from Firebase...")
        
        # Get initial conversations
        docs = await self.firebase.get_conversations()
        logger.info(f"Initializing stores with {len(docs)} documents")
        
        # Create stores
        for doc in docs:
            await self.ingest_text(doc.page_content, doc.metadata)
            await self.hierarchical_store.add_document(doc.page_content, doc.metadata)
            
        logger.info("Stores initialization complete")
        
        # Set up real-time updates
        async def on_conversation_update(doc):
            await self.ingest_text(doc.page_content, doc.metadata)
            await self.hierarchical_store.add_document(doc.page_content, doc.metadata)
        
        self.conversation_listener = await self.firebase.watch_conversations(on_conversation_update)
        logger.info("Firebase initialization and real-time updates configured")

    async def _encode_texts_batch(
        self,
        texts: List[str],
        use_cache: bool = True
    ) -> np.ndarray:
        """Encode texts in batches with caching."""
        results = []
        cache_hits = 0
        
        for text in texts:
            if use_cache:
                cache_key = f"emb_{hash(text)}"
                cached = self.batch_processor.get_cached(cache_key)
                if cached is not None:
                    results.append(cached)
                    cache_hits += 1
                    continue
                    
        texts_to_encode = [
            text for text in texts 
            if not use_cache or self.batch_processor.get_cached(f"emb_{hash(text)}") is None
        ]
        
        if texts_to_encode:
            # Process in batches
            embeddings = await self.batch_processor.process_in_batches(
                texts_to_encode,
                lambda batch: self.embeddings.encode(batch)
            )
            
            # Cache new results
            if use_cache:
                for text, emb in zip(texts_to_encode, embeddings):
                    cache_key = f"emb_{hash(text)}"
                    self.batch_processor.cache_result(cache_key, emb)
                    
            results.extend(embeddings)
            
        logger.info(f"Embedding cache hits: {cache_hits}/{len(texts)}")
        return np.array(results)
        
    async def ingest_text(self, text: str, metadata: Dict[str, Any]):
        """Add text to the vector store with batched processing."""
        # Get embedding with caching
        embedding = (await self._encode_texts_batch([text]))[0]
        embedding_normalized = embedding / np.linalg.norm(embedding)
        
        # Add to indices
        self.index.add(np.array([embedding_normalized]))
        
        self.texts.append(text)
        self.metadatas.append(metadata)
        doc_id = str(len(self.texts) - 1)
        self.context_enhancer.add_metadata(doc_id, metadata)
        
    def _preprocess_query(self, query: str) -> str:
        """Preprocess query for better matching."""
        # Add query instruction prefix for bge model
        return f"Represent this sentence for searching relevant passages: {query}"

    def _semantic_similarity(self, query: str, texts: List[str]) -> np.ndarray:
        """Calculate semantic similarity between query and texts."""
        # Encode query and texts
        query_embedding = self.embeddings.encode([self._preprocess_query(query)])[0]
        text_embeddings = self.embeddings.encode(texts)
        
        # Normalize embeddings
        query_embedding = query_embedding / np.linalg.norm(query_embedding)
        text_embeddings = text_embeddings / np.linalg.norm(text_embeddings, axis=1, keepdims=True)
        
        # Calculate cosine similarity
        similarities = np.dot(text_embeddings, query_embedding)
        
        return similarities

    def _bi_encoder_rerank(self, query: str, texts: List[str], top_k: int) -> Tuple[List[int], np.ndarray]:
        """Rerank texts using bi-encoder model."""
        # Get query and text embeddings
        query_embedding = self.embeddings.encode([query], convert_to_tensor=True, normalize_embeddings=True)
        text_embeddings = self.embeddings.encode(texts, convert_to_tensor=True, normalize_embeddings=True)
        
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
    ) -> Tuple[List[str], List[Dict[str, Any]], RetrievalMetrics]:
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
        metrics = RetrievalMetrics(
            mrr=metrics.mrr,
            ndcg=metrics.ndcg,
            recall_at_k=metrics.recall_at_k,
            latency_ms=retrieval_time,
            num_results=len(texts)
        )
        
        # Cache results
        result = (texts, metadata, metrics)
        self.batch_processor.cache_result(cache_key, result)
        
        return result

    @with_retries(max_attempts=3, delay=1)
    async def _call_claude_api(self, context: str, query: str) -> Tuple[str, int]:
        """Call Claude API with retry logic."""
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
                    "system": "You are a helpful assistant. Use the following context to answer the user's question. If you cannot answer based on the context, say so.",
                    "messages": [
                        {
                            "role": "user",
                            "content": f"Context:\n{context}\n\nQuestion: {query}"
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
        max_results: int = 3,
        relevant_ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Query the RAG system using fusion retrieval."""
        try:
            start_time = time.time()
            
            # Get context using fusion retrieval
            texts, metadata, retrieval_metrics = await self.retrieve_with_fusion(
                query, max_results, relevant_ids
            )
            
            # Generate response with Claude
            start_generation = time.time()
            answer, num_tokens = await self._call_claude_api("\n\n".join(texts), query)
            generation_time = (time.time() - start_generation) * 1000
            
            # Track query metrics
            total_time = (time.time() - start_time) * 1000
            query_metrics = QueryMetrics(
                retrieval=retrieval_metrics,
                generation_time_ms=generation_time,
                total_time_ms=total_time,
                num_tokens=num_tokens
            )
            self.metrics.add_query_metrics(query_metrics)
            
            # Get current performance stats
            stats = self.metrics.get_summary_stats()
            
            # Log performance metrics
            logger.info(f"Query completed - Metrics: {json.dumps(stats, indent=2)}")
            
            # Check if we're meeting quality targets
            if stats["quality_score"] < 0.7:  # Target from plan
                logger.warning(
                    f"Quality score {stats['quality_score']:.2f} below target (0.7). "
                    f"MRR: {stats['mrr_avg']:.2f}, NDCG: {stats['ndcg_avg']:.2f}"
                )
            
            if stats["avg_latency_ms"] > 200:  # Target from plan
                logger.warning(
                    f"Average latency {stats['avg_latency_ms']:.0f}ms above target (200ms)"
                )
            
            # Format response with detailed metrics
            return {
                "answer": answer,
                "context": [
                    {
                        "text": text,
                        "metadata": meta,
                        "score": None
                    }
                    for text, meta in zip(texts, metadata)
                ],
                "model": self.model_name,
                "metrics": {
                    "retrieval": {
                        "mrr": retrieval_metrics.mrr,
                        "ndcg": retrieval_metrics.ndcg,
                        "recall_at_k": retrieval_metrics.recall_at_k,
                        "latency_ms": retrieval_metrics.latency_ms,
                        "num_results": retrieval_metrics.num_results
                    },
                    "generation_time_ms": generation_time,
                    "total_time_ms": total_time,
                    "num_tokens": num_tokens,
                    "system_stats": stats
                }
            }
        except Exception as e:
            self.metrics.log_error(e)
            raise

class MetricsTracker:
    def __init__(self):
        self.queries = []
        self.total_queries = 0
        self.total_tokens = 0
        self.total_time = 0
        self.error_count = 0
        self.quality_scores = []
        
    def add_query_metrics(self, metrics: QueryMetrics):
        """Track detailed query metrics with quality scores."""
        self.queries.append(metrics)
        self.total_queries += 1
        self.total_tokens += metrics.num_tokens
        self.total_time += metrics.total_time_ms
        
        # Calculate quality score (0-1)
        quality_score = (
            0.4 * metrics.retrieval.mrr +  # Weight MRR more heavily
            0.3 * metrics.retrieval.ndcg +
            0.3 * (sum(metrics.retrieval.recall_at_k.values()) / len(metrics.retrieval.recall_at_k))
        )
        self.quality_scores.append(quality_score)
        
    def get_summary_stats(self) -> Dict[str, Any]:
        """Get detailed summary statistics."""
        if not self.queries:
            return {
                "total_queries": 0,
                "avg_latency_ms": 0,
                "avg_tokens": 0,
                "error_rate": 0,
                "quality_score": 0
            }
            
        return {
            "total_queries": self.total_queries,
            "avg_latency_ms": self.total_time / self.total_queries,
            "avg_tokens": self.total_tokens / self.total_queries,
            "error_rate": self.error_count / self.total_queries if self.total_queries > 0 else 0,
            "quality_score": sum(self.quality_scores) / len(self.quality_scores),
            "mrr_avg": sum(q.retrieval.mrr for q in self.queries) / len(self.queries),
            "ndcg_avg": sum(q.retrieval.ndcg for q in self.queries) / len(self.queries),
            "recall_at_k_avg": {
                k: sum(q.retrieval.recall_at_k[k] for q in self.queries) / len(self.queries)
                for k in self.queries[0].retrieval.recall_at_k.keys()
            } if self.queries else {}
        }
        
    def log_error(self, error: Exception):
        """Track system errors."""
        self.error_count += 1
        logger.error(f"RAG system error: {str(error)}") 