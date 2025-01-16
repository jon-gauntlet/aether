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
    text: str
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
            
        # Extract text and tokenize
        texts = [doc.text for doc in documents]
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
        min_score: float = 0.5
    ) -> List[Tuple[Document, float]]:
        """Search for documents matching the query.
        
        Args:
            query: Search query
            k: Number of results to return
            min_score: Minimum score threshold
            
        Returns:
            List of (document, score) tuples
        """
        if not self.documents:
            raise SearchError("No documents have been indexed")
            
        if k < 1:
            raise ValueError("k must be >= 1")
            
        # Get dense scores
        query_embedding = self.model.encode([query])[0]
        dense_scores, dense_indices = self.index.search(
            query_embedding.reshape(1, -1),
            k
        )
        dense_scores = dense_scores[0]
        dense_indices = dense_indices[0]
        
        # Get sparse scores
        query_tokens = self.tokenizer.tokenize(query)
        sparse_scores = self.bm25.get_scores(query_tokens)
        
        # Normalize scores
        dense_scores = self._normalize_scores(dense_scores)
        sparse_scores = self._normalize_scores(sparse_scores)
        
        # Combine scores
        final_scores = {}
        for idx, (dense_score, sparse_score) in enumerate(zip(dense_scores, sparse_scores)):
            score = (self.dense_weight * dense_score +
                    self.sparse_weight * sparse_score)
            if score >= min_score:
                final_scores[idx] = score
                
        # Sort and return top k
        sorted_indices = sorted(final_scores.items(),
                              key=lambda x: x[1],
                              reverse=True)[:k]
                              
        results = []
        for idx, score in sorted_indices:
            results.append((self.documents[idx], score))
            
        return results

    def _normalize_scores(self, scores: np.ndarray) -> np.ndarray:
        """Normalize scores to [0,1] range."""
        if len(scores) == 0:
            return scores
        min_score = np.min(scores)
        max_score = np.max(scores)
        if max_score == min_score:
            return np.ones_like(scores)
        return (scores - min_score) / (max_score - min_score)

class HybridSearcher:
    """Hybrid search combining dense and sparse retrieval."""
    def __init__(self, model_name: str = "sentence-transformers/all-mpnet-base-v2"):
        self.model = SentenceTransformer(model_name)
        self.bm25: Optional[BM25Okapi] = None
        self.documents: List[str] = []
        self.dense_embeddings: Optional[np.ndarray] = None

    @with_performance_monitoring
    def index_documents(self, documents: List[str]) -> None:
        """Index documents for both dense and sparse retrieval."""
        try:
            with performance_section("document_indexing"):
                # BM25 indexing
                tokenized_docs = [doc.lower().split() for doc in documents]
                self.bm25 = BM25Okapi(tokenized_docs)
                
                # Dense embedding indexing
                self.dense_embeddings = self.model.encode(
                    documents,
                    convert_to_tensor=True,
                    show_progress_bar=False
                ).cpu().numpy()
                
                self.documents = documents
                
                logger.info(f"Indexed {len(documents)} documents")
        except Exception as e:
            logger.error(f"Error indexing documents: {e}")
            raise SearchError(f"Failed to index documents: {e}")

    @with_performance_monitoring
    def search(self, query: str, k: int = 5, alpha: float = 0.5) -> List[SearchResult]:
        """Perform hybrid search combining dense and sparse scores."""
        try:
            with performance_section("hybrid_search"):
                if not self.bm25 or self.dense_embeddings is None:
                    raise SearchError("No documents indexed")
                
                # BM25 scoring
                tokenized_query = query.lower().split()
                sparse_scores = np.array(self.bm25.get_scores(tokenized_query))
                
                # Dense scoring
                query_embedding = self.model.encode(
                    query,
                    convert_to_tensor=True,
                    show_progress_bar=False
                ).cpu().numpy()
                
                dense_scores = np.dot(self.dense_embeddings, query_embedding)
                
                # Normalize scores
                sparse_scores = (sparse_scores - sparse_scores.min()) / (sparse_scores.max() - sparse_scores.min() + 1e-6)
                dense_scores = (dense_scores - dense_scores.min()) / (dense_scores.max() - dense_scores.min() + 1e-6)
                
                # Combine scores
                hybrid_scores = alpha * sparse_scores + (1 - alpha) * dense_scores
                
                # Get top k results
                top_k_indices = np.argsort(hybrid_scores)[-k:][::-1]
                
                results = []
                for idx in top_k_indices:
                    results.append(SearchResult(
                        text=self.documents[idx],
                        score=float(hybrid_scores[idx]),
                        metadata={
                            "sparse_score": float(sparse_scores[idx]),
                            "dense_score": float(dense_scores[idx])
                        }
                    ))
                
                return results
        except Exception as e:
            logger.error(f"Error performing hybrid search: {e}")
            raise SearchError(f"Failed to perform search: {e}") 