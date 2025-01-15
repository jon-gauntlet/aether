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
        self.metadata_store = {}
        
    def add_metadata(self, doc_id: str, metadata: Dict[str, Any]):
        self.metadata_store[doc_id] = metadata
        
    def filter_by_metadata(
        self,
        doc_ids: List[int],
        metadata_filters: Optional[Dict[str, Any]] = None
    ) -> List[int]:
        if not metadata_filters:
            return doc_ids
            
        filtered_ids = []
        for doc_id in doc_ids:
            metadata = self.metadata_store.get(str(doc_id), {})
            if all(metadata.get(k) == v for k, v in metadata_filters.items()):
                filtered_ids.append(doc_id)
        return filtered_ids
        
    def get_related_docs(self, doc_id: str) -> List[str]:
        """Get related document IDs based on metadata."""
        metadata = self.metadata_store.get(str(doc_id), {})
        related = []
        
        # Find docs with same channel
        channel_id = metadata.get("channel_id")
        if channel_id:
            for other_id, other_meta in self.metadata_store.items():
                if other_id != str(doc_id) and other_meta.get("channel_id") == channel_id:
                    related.append(other_id)
                    
        return related

class BatchProcessor:
    def __init__(self):
        self.cache = {}
        
    def get_cached(self, key: str) -> Optional[np.ndarray]:
        return self.cache.get(key)
        
    def cache_result(self, key: str, value: np.ndarray):
        self.cache[key] = value

class ChatMessage:
    def __init__(self, content: str, channel_id: str, user_id: str, timestamp: float):
        self.content = content
        self.channel_id = channel_id
        self.user_id = user_id
        self.timestamp = timestamp
        self.thread_id = None
        self.reactions = []
        
    def to_metadata(self) -> Dict[str, Any]:
        """Convert chat message to metadata for RAG."""
        return {
            "type": "chat_message",
            "channel_id": self.channel_id,
            "user_id": self.user_id,
            "timestamp": self.timestamp,
            "thread_id": self.thread_id,
            "reactions": self.reactions,
            "text": self.content  # Add content to metadata for easier access
        }
        
    @classmethod
    def from_metadata(cls, content: str, metadata: Dict[str, Any]) -> 'ChatMessage':
        """Create ChatMessage from content and metadata."""
        msg = cls(
            content=content,
            channel_id=metadata["channel_id"],
            user_id=metadata["user_id"],
            timestamp=metadata["timestamp"]
        )
        msg.thread_id = metadata.get("thread_id")
        msg.reactions = metadata.get("reactions", [])
        return msg

class PersonaConfig:
    def __init__(
        self,
        name: str,
        style: str,
        expertise: List[str],
        communication_preferences: Dict[str, Any]
    ):
        self.name = name
        self.style = style
        self.expertise = expertise
        self.communication_preferences = communication_preferences
        
    def to_system_prompt(self) -> str:
        """Generate system prompt for this persona."""
        return f"""You are {self.name}, an AI assistant with expertise in {', '.join(self.expertise)}.
Communication style: {self.style}
Preferences: {json.dumps(self.communication_preferences, indent=2)}

Use the following context from chat messages to answer questions while maintaining your persona.
If you cannot answer based on the context, say so while staying in character."""

class BaseRAG:
    def __init__(self, model_name: str = "BAAI/bge-large-en-v1.5"):
        self.model_name = model_name
        self.embedding_model = SentenceTransformer(model_name)
        self.index = None
        self.metadata = []
        self.batch_processor = BatchProcessor()
        self.initialize_index()

    def initialize_index(self):
        dimension = self.embedding_model.get_sentence_embedding_dimension()
        self.index = faiss.IndexIDMap(faiss.IndexFlatIP(dimension))

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

class ChatRAG(BaseRAG):
    def __init__(self, model_name: str = "BAAI/bge-large-en-v1.5"):
        super().__init__(model_name)
        self.chat_messages: List[ChatMessage] = []
        self.personas: Dict[str, PersonaConfig] = {}

    async def retrieve_with_fusion(
        self,
        query: str,
        k: int = 5,
        relevant_ids: Optional[List[int]] = None,
        metadata_filters: Optional[Dict[str, Any]] = None
    ) -> Tuple[List[str], List[Dict[str, Any]], Dict[str, float]]:
        """Enhanced retrieval with chat-specific fusion logic"""
        # Get base retrieval results
        texts, metadata, metrics = await super().retrieve_with_fusion(
            query, k, relevant_ids, metadata_filters
        )
        
        # Apply chat-specific enhancements
        # TODO: Add chat-specific ranking adjustments
        
        return texts, metadata, metrics

    async def ingest_chat_message(self, message: ChatMessage) -> None:
        """Ingest a chat message with metadata."""
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

class RAGSystem(ChatRAG):
    def __init__(
        self,
        model_name: str = "BAAI/bge-large-en-v1.5",
        persona: Optional[PersonaConfig] = None,
        firebase_adapter: Optional[FirebaseAdapter] = None,
    ):
        super().__init__(model_name)
        self.persona = persona or PersonaConfig(
            name="Assistant",
            role="AI assistant",
            description="A helpful AI assistant that provides accurate and relevant information."
        )
        self.firebase_adapter = firebase_adapter or MockFirebaseAdapter()
        self.context_enhancer = ContextEnhancer()
        self.metrics = MetricsTracker()
        
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