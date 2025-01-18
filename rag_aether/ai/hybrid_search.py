"""Hybrid search combining vector and keyword search."""

from typing import Dict, List, Optional, Tuple
import numpy as np
from sentence_transformers import SentenceTransformer
import faiss

from .vector_search import OptimizedVectorSearch
from ..errors import SearchError

class HybridRetriever:
    """Combines vector and keyword search for improved retrieval."""
    
    def __init__(self, 
                 model_name: str = "all-MiniLM-L6-v2",
                 vector_weight: float = 0.7,
                 keyword_weight: float = 0.3,
                 top_k: int = 5):
        """Initialize the hybrid retriever.
        
        Args:
            model_name: Name of the sentence transformer model to use
            vector_weight: Weight for vector similarity scores (0-1)
            keyword_weight: Weight for keyword match scores (0-1)
            top_k: Number of results to return
        """
        if not 0 <= vector_weight <= 1 or not 0 <= keyword_weight <= 1:
            raise ValueError("Weights must be between 0 and 1")
        if abs(vector_weight + keyword_weight - 1.0) > 1e-6:
            raise ValueError("Weights must sum to 1")
            
        self.vector_weight = vector_weight
        self.keyword_weight = keyword_weight
        self.top_k = top_k
        
        self.vector_search = OptimizedVectorSearch(model_name)
        self.documents: List[Dict] = []
        self.document_texts: List[str] = []
        
    def add_documents(self, documents: List[Dict]) -> None:
        """Add documents to the retriever.
        
        Args:
            documents: List of document dictionaries with 'text' and optional metadata
        """
        if not documents:
            return
            
        try:
            # Extract text and store documents
            texts = [doc['text'] for doc in documents]
            self.documents.extend(documents)
            self.document_texts.extend(texts)
            
            # Update vector index
            self.vector_search.add_documents(documents)
            
        except Exception as e:
            raise SearchError(f"Failed to add documents: {e}")
            
    def _compute_keyword_scores(self, query: str) -> np.ndarray:
        """Compute keyword match scores for the query."""
        query_terms = set(query.lower().split())
        scores = []
        
        for doc_text in self.document_texts:
            doc_terms = set(doc_text.lower().split())
            # Use Jaccard similarity for keyword matching
            intersection = len(query_terms & doc_terms)
            union = len(query_terms | doc_terms)
            score = intersection / union if union > 0 else 0
            scores.append(score)
            
        return np.array(scores)
        
    def search(self, query: str, top_k: Optional[int] = None) -> List[Dict]:
        """Search for documents using hybrid approach.
        
        Args:
            query: Search query
            top_k: Optional override for number of results
            
        Returns:
            List of documents with scores
        """
        if not self.documents:
            return []
            
        k = top_k or self.top_k
        
        try:
            # Get vector search results
            vector_results = self.vector_search.search(query, k=len(self.documents))
            vector_scores = np.array([r['score'] for r in vector_results])
            
            # Compute keyword scores
            keyword_scores = self._compute_keyword_scores(query)
            
            # Normalize scores to 0-1 range
            vector_scores = (vector_scores - vector_scores.min()) / (vector_scores.max() - vector_scores.min())
            keyword_scores = (keyword_scores - keyword_scores.min()) / (keyword_scores.max() - keyword_scores.min())
            
            # Combine scores
            combined_scores = (self.vector_weight * vector_scores + 
                             self.keyword_weight * keyword_scores)
            
            # Get top k results
            top_indices = np.argsort(combined_scores)[-k:][::-1]
            
            results = []
            for idx in top_indices:
                doc = self.documents[idx].copy()
                doc['score'] = float(combined_scores[idx])
                results.append(doc)
                
            return results
            
        except Exception as e:
            raise SearchError(f"Search failed: {e}")
            
    def clear(self) -> None:
        """Clear all documents from the retriever."""
        self.documents.clear()
        self.document_texts.clear()
        self.vector_search.clear() 