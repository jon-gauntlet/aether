"""Vector-based document retrieval system."""

from typing import Any, Dict, List, Optional, Tuple
import numpy as np
from sentence_transformers import SentenceTransformer
import faiss
import logging
from pathlib import Path
import pickle
import time

from ..errors import SearchError

logger = logging.getLogger(__name__)

class OptimizedVectorSearch:
    """Optimized vector-based document search."""
    
    def __init__(self, 
                 model_name: str = "all-MiniLM-L6-v2",
                 index_path: Optional[str] = None,
                 dimension: Optional[int] = None):
        """Initialize the search system.
        
        Args:
            model_name: Name of the sentence transformer model
            index_path: Optional path to save/load index
            dimension: Optional embedding dimension (inferred if not provided)
        """
        self.model = SentenceTransformer(model_name)
        self.index_path = Path(index_path) if index_path else None
        self.dimension = dimension or self.model.get_sentence_embedding_dimension()
        
        # Initialize FAISS index
        self.index = faiss.IndexFlatIP(self.dimension)  # Inner product index
        self.documents: List[Dict] = []
        
        if self.index_path and self.index_path.exists():
            self._load_index()
            
    def _load_index(self) -> None:
        """Load index and documents from disk."""
        try:
            # Load FAISS index
            index_file = self.index_path.with_suffix('.index')
            if index_file.exists():
                self.index = faiss.read_index(str(index_file))
                
            # Load documents
            docs_file = self.index_path.with_suffix('.docs')
            if docs_file.exists():
                with open(docs_file, 'rb') as f:
                    self.documents = pickle.load(f)
                    
        except Exception as e:
            raise SearchError(f"Failed to load index: {e}")
            
    def _save_index(self) -> None:
        """Save index and documents to disk."""
        if not self.index_path:
            return
            
        try:
            # Save FAISS index
            index_file = self.index_path.with_suffix('.index')
            faiss.write_index(self.index, str(index_file))
            
            # Save documents
            docs_file = self.index_path.with_suffix('.docs')
            with open(docs_file, 'wb') as f:
                pickle.dump(self.documents, f)
                
        except Exception as e:
            raise SearchError(f"Failed to save index: {e}")
            
    def add_documents(self, documents: List[Dict]) -> None:
        """Add documents to the search index.
        
        Args:
            documents: List of document dictionaries with 'text' field
        """
        if not documents:
            return
            
        try:
            # Extract text and compute embeddings
            texts = [doc['text'] for doc in documents]
            embeddings = self.model.encode(texts, convert_to_numpy=True)
            
            # Add to FAISS index
            self.index.add(embeddings)
            
            # Store documents
            self.documents.extend(documents)
            
            # Save updated index
            self._save_index()
            
        except Exception as e:
            raise SearchError(f"Failed to add documents: {e}")
            
    def search(self, 
              query: str,
              k: int = 5,
              threshold: Optional[float] = None) -> List[Dict]:
        """Search for documents similar to query.
        
        Args:
            query: Search query
            k: Number of results to return
            threshold: Optional similarity threshold (0-1)
            
        Returns:
            List of documents with similarity scores
        """
        if not self.documents:
            return []
            
        try:
            # Encode query
            query_embedding = self.model.encode(
                [query],
                convert_to_numpy=True
            )
            
            # Search in FAISS index
            scores, indices = self.index.search(query_embedding, k)
            
            # Process results
            results = []
            for score, idx in zip(scores[0], indices[0]):
                if idx < 0 or idx >= len(self.documents):
                    continue
                    
                if threshold and score < threshold:
                    continue
                    
                doc = self.documents[idx].copy()
                doc['score'] = float(score)
                results.append(doc)
                
            return results
            
        except Exception as e:
            raise SearchError(f"Search failed: {e}")
            
    def batch_search(self,
                    queries: List[str],
                    k: int = 5,
                    threshold: Optional[float] = None) -> List[List[Dict]]:
        """Search for multiple queries in batch.
        
        Args:
            queries: List of search queries
            k: Number of results per query
            threshold: Optional similarity threshold (0-1)
            
        Returns:
            List of result lists, one per query
        """
        if not self.documents or not queries:
            return []
            
        try:
            # Encode queries
            query_embeddings = self.model.encode(
                queries,
                convert_to_numpy=True
            )
            
            # Search in FAISS index
            scores, indices = self.index.search(query_embeddings, k)
            
            # Process results for each query
            all_results = []
            
            for query_scores, query_indices in zip(scores, indices):
                results = []
                
                for score, idx in zip(query_scores, query_indices):
                    if idx < 0 or idx >= len(self.documents):
                        continue
                        
                    if threshold and score < threshold:
                        continue
                        
                    doc = self.documents[idx].copy()
                    doc['score'] = float(score)
                    results.append(doc)
                    
                all_results.append(results)
                
            return all_results
            
        except Exception as e:
            raise SearchError(f"Batch search failed: {e}")
            
    def clear(self) -> None:
        """Clear all documents from the index."""
        try:
            self.index = faiss.IndexFlatIP(self.dimension)
            self.documents.clear()
            self._save_index()
            
        except Exception as e:
            raise SearchError(f"Failed to clear index: {e}")
            
    def optimize_index(self) -> None:
        """Optimize the index for better performance."""
        try:
            if self.index.ntotal == 0:
                return
                
            # Convert to IVF index for faster search
            nlist = min(int(np.sqrt(self.index.ntotal)), 100)
            quantizer = faiss.IndexFlatIP(self.dimension)
            new_index = faiss.IndexIVFFlat(
                quantizer, 
                self.dimension,
                nlist,
                faiss.METRIC_INNER_PRODUCT
            )
            
            # Train and populate new index
            embeddings = self.index.reconstruct_n(0, self.index.ntotal)
            new_index.train(embeddings)
            new_index.add(embeddings)
            
            # Replace old index
            self.index = new_index
            self._save_index()
            
        except Exception as e:
            raise SearchError(f"Failed to optimize index: {e}")
            
    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about the index."""
        return {
            'total_documents': len(self.documents),
            'index_size': self.index.ntotal,
            'dimension': self.dimension,
            'index_type': type(self.index).__name__
        } 