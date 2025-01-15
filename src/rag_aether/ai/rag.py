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
        
    async def _cleanup(self):
        """Cleanup resources on shutdown."""
        logger.info("Cleaning up RAG system resources...")
        if self.conversation_listener:
            self.conversation_listener.unsubscribe()
        logger.info("Cleanup complete")

    @with_retries(max_attempts=3)
    async def initialize_from_firebase(self):
        """Initialize the vector store from Firebase data."""
        logger.info("Initializing from Firebase...")
        
        # Get initial conversations
        docs = await self.firebase.get_conversations()
        logger.info(f"Initializing vector store with {len(docs)} documents")
        
        # Create vector store
        for doc in docs:
            await self.ingest_text(doc.page_content, doc.metadata)
            
        logger.info("Vector store initialization complete")
        
        # Set up real-time updates
        async def on_conversation_update(doc):
            await self.ingest_text(doc.page_content, doc.metadata)
        
        self.conversation_listener = await self.firebase.watch_conversations(on_conversation_update)
        logger.info("Firebase initialization and real-time updates configured")

    async def ingest_text(self, text: str, metadata: Dict[str, Any]):
        """Add text to the vector store."""
        embedding = self.embeddings.encode([text])[0]
        embedding_normalized = embedding / np.linalg.norm(embedding)
        
        # Add to both indices
        self.index_l2.add(np.array([embedding], dtype=np.float32))
        self.index_ip.add(np.array([embedding_normalized], dtype=np.float32))
        
        self.texts.append(text)
        self.metadatas.append(metadata)

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

    async def retrieve_with_fusion(
        self, 
        query: str, 
        k: int = 3,
        relevant_ids: Optional[List[str]] = None
    ) -> Tuple[List[str], List[Dict[str, Any]], RetrievalMetrics]:
        """Enhanced retrieval using dense embeddings and contrastive learning."""
        start_time = time.time()
        
        # Expand query
        expanded_queries = await self._expand_query(query)
        
        # Get embeddings for all queries
        all_scores = {}
        all_candidates = set()
        
        for expanded_query in expanded_queries:
            # Preprocess and encode query
            processed_query = self._preprocess_query(expanded_query)
            query_embedding = self.embeddings.encode([processed_query])[0]
            query_normalized = query_embedding / np.linalg.norm(query_embedding)
            
            # Search with cosine similarity
            D, I = self.index.search(
                query_normalized.reshape(1, -1).astype('float32'), 
                k * 2
            )
            
            # Add candidates
            candidates = I[0].tolist()
            all_candidates.update(candidates)
            
            # Calculate semantic similarity
            candidate_texts = [self.texts[i] for i in candidates]
            sim_scores = self._semantic_similarity(expanded_query, candidate_texts)
            
            # Update scores (take max across expanded queries)
            for i, doc_id in enumerate(candidates):
                all_scores[doc_id] = max(
                    all_scores.get(doc_id, 0.0),
                    sim_scores[i]
                )
        
        # Convert to lists for ranking
        candidate_list = list(all_candidates)
        score_list = [all_scores[doc_id] for doc_id in candidate_list]
        
        # Sort by similarity score
        sorted_indices = np.argsort(score_list)[-k:][::-1]
        
        # Get final results
        fused_ids = [candidate_list[i] for i in sorted_indices]
        texts = [self.texts[i] for i in fused_ids]
        metadata = [self.metadatas[i] for i in fused_ids]
        
        # Calculate metrics if we have relevant IDs
        retrieval_time = (time.time() - start_time) * 1000
        metrics = RetrievalMetrics(
            mrr=mean_reciprocal_rank(relevant_ids or [], [str(i) for i in fused_ids]),
            ndcg=normalized_dcg(relevant_ids or [], [str(i) for i in fused_ids]),
            recall_at_k={
                k: recall_at_k(relevant_ids or [], [str(i) for i in fused_ids], k)
                for k in [1, 3, 5, 10]
            },
            latency_ms=retrieval_time,
            num_results=len(texts)
        )
        
        return texts, metadata, metrics

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