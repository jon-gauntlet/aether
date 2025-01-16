"""Streamlined RAG system with hybrid search."""
from typing import List, Dict, Optional, Union, Any
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
from dataclasses import dataclass
from ..data.firebase_adapter import FirebaseAdapter, Document
from fastapi import FastAPI, HTTPException
import re
from rank_bm25 import BM25Okapi
from .query_expansion import expand_query, get_flow_context, QueryProcessor
from ..core.errors import RAGError
from ..core.performance import with_performance_monitoring, performance_section
import logging
from ..data.chat_message import ChatMessage
from ..data.document_chunk import DocumentChunk
from ..data.system_health import SystemHealth
from ..data.metrics_tracker import MetricsTracker
from ..data.quality_system import QualitySystem
from ..data.query_cache import QueryCache
from ..data.event_types import EVENT_INGESTION

logger = logging.getLogger(__name__)

class RAGSystem:
    """RAG system with hybrid search."""
    
    def __init__(
        self,
        model_name: str = "all-mpnet-base-v2",
        index_path: Optional[str] = None,
        cache_dir: Optional[str] = None,
        config: Optional[Dict[str, Any]] = None,
        use_production_features: bool = False
    ):
        self.model_name = model_name
        self.index_path = index_path
        self.cache_dir = cache_dir
        self.config = config or {}
        self.use_production = use_production_features
        self.firebase = FirebaseAdapter(use_mock=not use_production_features)
        self.health = SystemHealth()
        self.metrics = MetricsTracker()
        self.quality = QualitySystem()
        self.cache = QueryCache(max_size=1000)

    @with_error_handling
    @with_health_check
    @with_performance_monitoring
    async def ingest_message(
        self,
        message: ChatMessage,
        context: Optional[Dict[str, Any]] = None
    ) -> None:
        """Ingest a chat message into the system.
        
        Args:
            message: The chat message to ingest
            context: Optional context about the message
        """
        # Extract text and metadata
        text = message.content
        metadata = {
            "timestamp": message.timestamp,
            "author": message.author,
            "channel": message.channel_id,
            "thread": message.thread_id,
            "type": "chat_message"
        }
        if context:
            metadata.update(context)

        # Process and index the message
        doc = DocumentChunk(text=text, metadata=metadata)
        await self.ingest_documents([doc])

        # Track metrics
        self.metrics.log_ingestion(len(text))

        # Notify if using production features
        if self.use_production:
            await self._publish_event(
                EVENT_INGESTION,
                {"message_id": message.id, "status": "success"},
                metadata
            )

    @with_performance_monitoring
    def _load_conversations(self) -> None:
        """Load conversations and prepare indices."""
        try:
            with performance_section("load_conversations"):
                docs = self.firebase.get_conversations()
                self.add_documents(docs)
                logger.info(f"Loaded {len(docs)} conversations")
                
                # Prepare BM25
                self.tokenized_docs = [self._tokenize(doc.page_content) for doc in docs]
                self.bm25 = BM25Okapi(self.tokenized_docs)
        except Exception as e:
            logger.error(f"Failed to load conversations: {e}")
            raise RAGError(f"Failed to load conversations: {e}")
    
    def _tokenize(self, text: str) -> List[str]:
        """Simple tokenization."""
        return re.findall(r'\w+', text.lower())
    
    @with_performance_monitoring
    def add_documents(self, docs: List[Document]) -> None:
        """Add documents to both semantic and keyword indices."""
        try:
            with performance_section("add_documents"):
                texts = [doc.page_content for doc in docs]
                
                # Create embeddings
                embeddings = self.model.encode(texts, convert_to_tensor=True)
                embeddings = embeddings.cpu().numpy()
                
                # Add to FAISS
                self.index.add(embeddings)
                
                # Store documents
                self.documents.extend(docs)
                
                # Update BM25
                self.tokenized_docs.extend([self._tokenize(doc.page_content) for doc in docs])
                self.bm25 = BM25Okapi(self.tokenized_docs)
                
                logger.info(f"Added {len(docs)} documents to indices")
        except Exception as e:
            logger.error(f"Failed to add documents: {e}")
            raise RAGError(f"Failed to add documents: {e}")
    
    @with_performance_monitoring
    def search(self, query: str, k: int = 3) -> List[Document]:
        """Hybrid search combining semantic and keyword matching."""
        try:
            with performance_section("hybrid_search"):
                # Check cache
                cache_key = f"{query}:{k}"
                if self.use_cache and cache_key in self._query_cache:
                    logger.debug("Returning cached results")
                    return self._query_cache[cache_key]
                
                # Process and expand query
                expanded = self.query_processor.process(query)
                flow_context = get_flow_context(query)
                logger.debug(f"Expanded query: {expanded.expanded}")
                    
                # Semantic search
                with performance_section("semantic_search"):
                    query_embedding = self.model.encode([expanded.expanded])[0]
                    query_embedding = query_embedding.reshape(1, -1)
                    semantic_scores, indices = self.index.search(query_embedding, k)
                
                # Keyword search with expanded query
                with performance_section("keyword_search"):
                    tokenized_query = self._tokenize(expanded.expanded)
                    bm25_scores = self.bm25.get_scores(tokenized_query)
                
                # Combine scores with context boost
                results = []
                seen_indices = set()
                
                # Add semantic results
                for score, idx in zip(semantic_scores[0], indices[0]):
                    if idx < len(self.documents):
                        doc = self.documents[idx]
                        
                        # Apply context-based boost
                        boost = 1.0
                        if doc.metadata.get('flow_state') and flow_context['flow_terms']:
                            boost *= 1.2
                        if 'performance' in doc.metadata.get('title', '').lower() and flow_context['performance_terms']:
                            boost *= 1.1
                        
                        doc.metadata['semantic_score'] = float(score)
                        doc.metadata['bm25_score'] = float(bm25_scores[idx])
                        doc.metadata['search_score'] = float(score * boost)
                        doc.metadata['context_boost'] = boost
                        doc.metadata['query_expansion'] = expanded.metadata
                        results.append(doc)
                        seen_indices.add(idx)
                
                # Add high-scoring BM25 results not in semantic results
                bm25_indices = np.argsort(bm25_scores)[::-1][:k]
                for idx in bm25_indices:
                    if idx not in seen_indices and len(results) < k * 2:
                        doc = self.documents[idx]
                        doc.metadata['semantic_score'] = None
                        doc.metadata['bm25_score'] = float(bm25_scores[idx])
                        doc.metadata['search_score'] = float(bm25_scores[idx])
                        doc.metadata['context_boost'] = 1.0
                        doc.metadata['query_expansion'] = expanded.metadata
                        results.append(doc)
                
                # Sort by boosted score
                results.sort(key=lambda x: x.metadata['search_score'])
                
                # Cache results
                if self.use_cache:
                    self._query_cache[cache_key] = results[:k]
                    
                return results[:k]
                
        except Exception as e:
            logger.error(f"Search failed: {e}")
            raise RAGError(f"Search operation failed: {e}")
    
    @with_performance_monitoring
    def query(
        self, 
        question: str, 
        k: int = 3,
        include_metadata: bool = True
    ) -> Union[str, Dict[str, any]]:
        """Get answer using hybrid search."""
        try:
            with performance_section("query"):
                # Get relevant documents
                docs = self.search(question, k=k)
                
                if not include_metadata:
                    # Simple string response
                    contexts = [doc.page_content for doc in docs]
                    return "\n\n".join(contexts)
                    
                # Process query for context
                expanded = self.query_processor.process(question)
                flow_context = get_flow_context(question)
                
                # Full response with metadata
                response = {
                    "query": question,
                    "expanded_query": expanded.expanded,
                    "flow_context": flow_context,
                    "query_metadata": expanded.metadata,
                    "results": []
                }
                
                for doc in docs:
                    result = {
                        "content": doc.page_content,
                        "metadata": doc.metadata,
                        "title": doc.metadata.get('title', 'Untitled'),
                        "participants": doc.metadata.get('participants', []),
                        "flow_state": doc.metadata.get('flow_state', None),
                        "search_score": doc.metadata.get('search_score', None),
                        "semantic_score": doc.metadata.get('semantic_score', None),
                        "bm25_score": doc.metadata.get('bm25_score', None),
                        "context_boost": doc.metadata.get('context_boost', 1.0),
                        "query_expansion": doc.metadata.get('query_expansion', None)
                    }
                    response["results"].append(result)
                    
                return response
                
        except Exception as e:
            logger.error(f"Query failed: {e}")
            raise RAGError(f"Query operation failed: {e}")

# FastAPI integration
app = FastAPI()

@app.post("/search")
async def search_endpoint(query: str, k: int = 3):
    """API endpoint for search."""
    try:
        rag = RAGSystem(use_mock=True)  # Configure as needed
        results = rag.query(query, k=k, include_metadata=True)
        return results
    except RAGError as e:
        logger.error(f"Search endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in search endpoint: {e}")
        raise HTTPException(status_code=500, detail="Internal server error") 