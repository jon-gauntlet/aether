"""Hybrid search implementation combining BM25 and semantic search with caching."""
from typing import Dict, Any, Optional, List, Tuple
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from rank_bm25 import BM25Okapi
import logging
from dataclasses import dataclass
import asyncio

from .caching_system import QueryCache, EmbeddingCache

@dataclass
class SearchResult:
    """Search result with content and scores."""
    content: str
    bm25_score: float
    semantic_score: float
    combined_score: float
    metadata: Dict[str, Any]

class HybridSearcher:
    """Hybrid search combining BM25 and semantic search."""
    
    def __init__(
        self,
        embedding_model: str = "sentence-transformers/all-mpnet-base-v2",
        bm25_weight: float = 0.3,
        semantic_weight: float = 0.7,
        normalize_scores: bool = True,
        cache_embeddings: bool = True,
        cache_results: bool = True
    ):
        """Initialize hybrid searcher.
        
        Args:
            embedding_model: Model name or path
            bm25_weight: Weight for BM25 scores
            semantic_weight: Weight for semantic scores
            normalize_scores: Whether to normalize scores
            cache_embeddings: Whether to cache embeddings
            cache_results: Whether to cache search results
        """
        self.model = SentenceTransformer(embedding_model)
        self.bm25_weight = bm25_weight
        self.semantic_weight = semantic_weight
        self.normalize_scores = normalize_scores
        
        # Initialize search components
        self.bm25: Optional[BM25Okapi] = None
        self.index: Optional[faiss.IndexFlatIP] = None
        self.documents: List[str] = []
        self.metadata: List[Dict[str, Any]] = []
        
        # Initialize caches if enabled
        self.embedding_cache = EmbeddingCache() if cache_embeddings else None
        self.query_cache = QueryCache() if cache_results else None
        
        self.logger = logging.getLogger("hybrid_search")
        
    async def index_documents(
        self,
        documents: List[str],
        metadata: Optional[List[Dict[str, Any]]] = None
    ):
        """Index documents for search.
        
        Args:
            documents: List of document texts
            metadata: Optional metadata for each document
        """
        self.documents = documents
        self.metadata = metadata or [{} for _ in documents]
        
        # Create BM25 index
        tokenized_docs = [doc.split() for doc in documents]
        self.bm25 = BM25Okapi(tokenized_docs)
        
        # Create FAISS index
        embeddings = []
        for doc in documents:
            if self.embedding_cache:
                cached = await self.embedding_cache.get_embedding(
                    doc,
                    self.model.get_model_name()
                )
                if cached is not None:
                    embeddings.append(cached)
                    continue
                    
            embedding = self.model.encode(doc)
            embeddings.append(embedding)
            
            if self.embedding_cache:
                await self.embedding_cache.cache_embedding(
                    doc,
                    embedding,
                    self.model.get_model_name()
                )
                
        embeddings_array = np.array(embeddings)
        self.index = faiss.IndexFlatIP(embeddings_array.shape[1])
        self.index.add(embeddings_array)
        
    async def search(
        self,
        query: str,
        top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[SearchResult]:
        """Search for documents matching query.
        
        Args:
            query: Search query
            top_k: Number of results to return
            filters: Optional metadata filters
            
        Returns:
            List of search results
        """
        # Check query cache first
        if self.query_cache:
            cached = await self.query_cache.get_results(
                query=query,
                filters=filters,
                limit=top_k
            )
            if cached is not None:
                return [SearchResult(**result) for result in cached]
                
        # Get BM25 scores
        bm25_scores = self.bm25.get_scores(query.split())
        if self.normalize_scores:
            bm25_scores = self._normalize_scores(bm25_scores)
            
        # Get semantic scores
        if self.embedding_cache:
            query_embedding = await self.embedding_cache.get_embedding(
                query,
                self.model.get_model_name()
            )
            if query_embedding is None:
                query_embedding = self.model.encode(query)
                await self.embedding_cache.cache_embedding(
                    query,
                    query_embedding,
                    self.model.get_model_name()
                )
        else:
            query_embedding = self.model.encode(query)
            
        semantic_scores = self.index.search(
            query_embedding.reshape(1, -1),
            len(self.documents)
        )[1][0]
        if self.normalize_scores:
            semantic_scores = self._normalize_scores(semantic_scores)
            
        # Combine scores
        results = []
        for i, (doc, meta) in enumerate(zip(self.documents, self.metadata)):
            # Apply filters
            if filters and not self._matches_filters(meta, filters):
                continue
                
            result = SearchResult(
                content=doc,
                bm25_score=float(bm25_scores[i]),
                semantic_score=float(semantic_scores[i]),
                combined_score=float(
                    self.bm25_weight * bm25_scores[i] +
                    self.semantic_weight * semantic_scores[i]
                ),
                metadata=meta
            )
            results.append(result)
            
        # Sort by combined score
        results.sort(key=lambda x: x.combined_score, reverse=True)
        results = results[:top_k]
        
        # Cache results
        if self.query_cache:
            await self.query_cache.cache_results(
                query=query,
                results=[result.__dict__ for result in results],
                filters=filters,
                limit=top_k
            )
            
        return results
        
    def _normalize_scores(self, scores: np.ndarray) -> np.ndarray:
        """Normalize scores to [0, 1] range."""
        min_score = scores.min()
        max_score = scores.max()
        if max_score == min_score:
            return np.ones_like(scores)
        return (scores - min_score) / (max_score - min_score)
        
    def _matches_filters(
        self,
        metadata: Dict[str, Any],
        filters: Dict[str, Any]
    ) -> bool:
        """Check if metadata matches filters."""
        return all(
            metadata.get(k) == v
            for k, v in filters.items()
        ) 