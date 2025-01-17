"""Hybrid search module combining semantic and lexical search."""

from typing import List, Dict, Any, Optional, Tuple
from sentence_transformers import SentenceTransformer
from rank_bm25 import BM25Okapi
import numpy as np
import logging
from dataclasses import dataclass
import faiss
from transformers import AutoTokenizer
from ..data.document import Document

from rag_aether.core.errors import SearchError
from rag_aether.core.performance import with_performance_monitoring, performance_section

logger = logging.getLogger(__name__)

@dataclass
class SearchResult:
    """A search result with metadata."""
    content: str
    score: float
    metadata: Optional[Dict[str, Any]] = None

class HybridRetriever:
    """Hybrid search system combining dense and sparse retrieval."""

    def __init__(
        self,
        model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
        dense_weight: float = 0.7,
        use_gpu: bool = False
    ):
        if not 0 <= dense_weight <= 1:
            raise ValueError("dense_weight must be between 0 and 1")
            
        self.model = SentenceTransformer(model_name)
        self.dense_weight = dense_weight
        self.sparse_weight = 1 - dense_weight
        
        # Initialize indices
        self.index = faiss.IndexFlatL2(self.model.get_sentence_embedding_dimension())
        self.documents: List[Document] = []
        self.doc_embeddings = None
        
        # BM25 for sparse search
        self.tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")
        self.bm25 = None
        self.tokenized_docs = []

    @with_performance_monitoring
    def index_documents(self, documents: List[Document]) -> None:
        """Index a list of documents.
        
        Args:
            documents: List of Document objects to index
        """
        if not documents:
            return
            
        # Extract content and tokenize
        texts = [doc.content for doc in documents]
        tokenized = [self.tokenizer.tokenize(text) for text in texts]
        
        # Update BM25
        self.tokenized_docs.extend(tokenized)
        self.bm25 = BM25Okapi(self.tokenized_docs)
        
        # Get dense embeddings
        embeddings = self.model.encode(texts)
        
        if self.doc_embeddings is None:
            self.doc_embeddings = embeddings
        else:
            self.doc_embeddings = np.vstack([self.doc_embeddings, embeddings])
            
        # Add to FAISS index
        self.index.add(embeddings)
        self.documents.extend(documents)

    @with_performance_monitoring
    def search(
        self,
        query: str,
        k: int = 5,
        min_score: float = 0.0
    ) -> List[SearchResult]:
        """Search for documents matching the query.
        
        Args:
            query: Search query
            k: Number of results to return
            min_score: Minimum score threshold
            
        Returns:
            List of SearchResult objects
        """
        if k <= 0:
            raise ValueError("k must be positive")
            
        if not self.documents:
            return []
            
        # Get dense and sparse scores
        dense_scores = self._dense_search(query)
        sparse_scores = self._sparse_search(query)
        
        # Combine scores
        results = []
        for i, (doc, dense_score) in enumerate(dense_scores):
            sparse_score = sparse_scores[i][1] if i < len(sparse_scores) else 0
            combined_score = (
                self.dense_weight * dense_score +
                self.sparse_weight * sparse_score
            )
            
            if combined_score >= min_score:
                results.append(SearchResult(
                    content=doc.content,
                    score=combined_score,
                    metadata=doc.metadata
                ))
                
        # Sort by score and return top k
        results.sort(key=lambda x: x.score, reverse=True)
        return results[:k]

    @with_performance_monitoring
    def _dense_search(self, query: str) -> List[Tuple[Document, float]]:
        """Perform dense retrieval using FAISS."""
        query_embedding = self.model.encode([query])[0]
        
        # Search FAISS index
        D, I = self.index.search(
            np.array([query_embedding]).reshape(1, -1),
            len(self.documents)
        )
        
        # Convert distances to similarities
        max_dist = np.max(D[0]) if len(D[0]) > 0 else 1.0
        scores = 1 - (D[0] / max_dist) if max_dist > 0 else D[0]
        
        return [(self.documents[i], float(score)) for i, score in zip(I[0], scores)]

    @with_performance_monitoring
    def _sparse_search(self, query: str) -> List[Tuple[Document, float]]:
        """Perform sparse retrieval using BM25."""
        if not self.bm25:
            return []
            
        # Tokenize query
        query_tokens = self.tokenizer.tokenize(query)
        
        # Get BM25 scores
        scores = self.bm25.get_scores(query_tokens)
        
        # Normalize scores to [0,1]
        min_score = np.min(scores) if len(scores) > 0 else 0.0
        max_score = np.max(scores) if len(scores) > 0 else 1.0
        score_range = max_score - min_score
        
        if score_range > 0:
            scores = (scores - min_score) / score_range
        else:
            scores = np.zeros_like(scores)
        
        # Create results with normalized scores
        results = []
        for i, score in enumerate(scores):
            results.append((self.documents[i], float(score)))
            
        # Sort by score
        results.sort(key=lambda x: x[1], reverse=True)
        return results 