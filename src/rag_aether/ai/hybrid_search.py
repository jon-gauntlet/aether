"""Hybrid search implementation combining dense and sparse retrieval."""

from typing import List, Dict, Any, Optional, Tuple
from sentence_transformers import SentenceTransformer
from rank_bm25 import BM25Okapi
import numpy as np
import logging
from dataclasses import dataclass

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
    """Hybrid retriever combining dense and sparse retrieval methods."""

    def __init__(
        self,
        encoder_model: str = "BAAI/bge-large-en-v1.5",
        sparse_weight: float = 0.3,
        k_dense: int = 10,
        k_sparse: int = 10,
        nlist: int = 100,
        nprobe: int = 10,
    ):
        """Initialize the hybrid retriever.
        
        Args:
            encoder_model: Name of the sentence transformer model to use
            sparse_weight: Weight given to sparse (BM25) results vs dense results
            k_dense: Number of results to retrieve from dense search
            k_sparse: Number of results to retrieve from sparse search
            nlist: Number of clusters for FAISS index
            nprobe: Number of clusters to probe during search
        """
        self.encoder = SentenceTransformer(encoder_model)
        self.sparse_weight = sparse_weight
        self.k_dense = k_dense 
        self.k_sparse = k_sparse
        self.nlist = nlist
        self.nprobe = nprobe
        
        self.documents = []
        self.embeddings = None
        self.bm25 = None
        self.index = None

    @with_performance_monitoring
    def index_documents(self, documents: List[str]) -> None:
        """Index a list of documents for search.
        
        Args:
            documents: List of document texts to index
        """
        with performance_section("encode_documents"):
            embeddings = self.encoder.encode(documents, convert_to_tensor=True)
            self.embeddings = embeddings.cpu().numpy()
            
        with performance_section("create_bm25"):
            tokenized_docs = [doc.split() for doc in documents]
            self.bm25 = BM25Okapi(tokenized_docs)
            
        self.documents = documents

    @with_performance_monitoring
    def search(self, query: str, k: int = 10) -> List[SearchResult]:
        """Search for documents matching the query.
        
        Args:
            query: Query text to search for
            k: Number of results to return
            
        Returns:
            List of SearchResult objects
        """
        if not self.documents:
            raise SearchError("No documents have been indexed")
            
        dense_results = self._dense_search(query, k=self.k_dense)
        sparse_results = self._sparse_search(query, k=self.k_sparse)
        
        # Combine and normalize scores
        combined_scores = {}
        max_dense = max(r[1] for r in dense_results) if dense_results else 1
        max_sparse = max(r[1] for r in sparse_results) if sparse_results else 1
        
        for idx, score in dense_results:
            combined_scores[idx] = (1 - self.sparse_weight) * (score / max_dense)
            
        for idx, score in sparse_results:
            idx_score = self.sparse_weight * (score / max_sparse)
            if idx in combined_scores:
                combined_scores[idx] += idx_score
            else:
                combined_scores[idx] = idx_score
                
        # Sort by score and convert to SearchResults
        results = []
        for idx, score in sorted(combined_scores.items(), key=lambda x: x[1], reverse=True)[:k]:
            results.append(SearchResult(
                text=self.documents[idx],
                score=score
            ))
            
        return results

    def _dense_search(self, query: str, k: int) -> List[Tuple[int, float]]:
        """Perform dense retrieval using sentence embeddings."""
        query_embedding = self.encoder.encode(query, convert_to_tensor=True)
        query_embedding = query_embedding.cpu().numpy()
        
        # Calculate cosine similarities
        similarities = np.dot(self.embeddings, query_embedding)
        indices = np.argsort(similarities)[-k:][::-1]
        
        return [(idx, similarities[idx]) for idx in indices]

    def _sparse_search(self, query: str, k: int) -> List[Tuple[int, float]]:
        """Perform sparse retrieval using BM25."""
        tokenized_query = query.split()
        scores = self.bm25.get_scores(tokenized_query)
        indices = np.argsort(scores)[-k:][::-1]
        
        return [(idx, scores[idx]) for idx in indices] 

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