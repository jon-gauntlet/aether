"""Hybrid search module combining semantic and lexical search."""

from typing import List, Dict, Any, Optional
import numpy as np
from sentence_transformers import SentenceTransformer
import torch
import logging
from ..core.errors import SearchError

logger = logging.getLogger(__name__)

class HybridRetriever:
    def __init__(self, 
                 model_name: str = "BAAI/bge-small-en",
                 sparse_weight: float = 0.5,
                 use_gpu: bool = True):
        """Initialize hybrid retriever.
        
        Args:
            model_name: Name of the embedding model
            sparse_weight: Weight for sparse retrieval (0-1)
            use_gpu: Whether to use GPU for embeddings
        """
        if not 0 <= sparse_weight <= 1:
            raise ValueError("sparse_weight must be between 0 and 1")
            
        self.sparse_weight = sparse_weight
        self.dense_weight = 1 - sparse_weight
        
        # Initialize embedding model
        try:
            device = "cuda" if use_gpu and torch.cuda.is_available() else "cpu"
            self.encoder = SentenceTransformer(model_name).to(device)
        except RuntimeError as e:
            if "out of memory" in str(e):
                logger.warning(f"CUDA out of memory, falling back to CPU for {model_name}")
                self.encoder = SentenceTransformer(model_name).to("cpu")
            else:
                raise SearchError(f"Failed to initialize encoder: {str(e)}")
                
        self.documents = []
        self.document_embeddings = []
        
    def add_documents(self, documents: List[Dict[str, Any]]):
        """Add documents to the retriever.
        
        Args:
            documents: List of documents to add
        """
        try:
            if not documents:
                return
                
            # Extract text content
            texts = [doc.get("content", "") for doc in documents]
            
            # Generate embeddings
            embeddings = self.encoder.encode(
                texts,
                convert_to_tensor=True,
                show_progress_bar=False
            )
            
            self.documents.extend(documents)
            self.document_embeddings.extend(embeddings)
            
        except Exception as e:
            raise SearchError(f"Failed to add documents: {str(e)}")
            
    def search(self, query: str, k: int = 3) -> List[Dict[str, Any]]:
        """Search for relevant documents.
        
        Args:
            query: Search query
            k: Number of results to return
            
        Returns:
            List of relevant documents with scores
        """
        try:
            if not self.documents:
                return []
                
            # Generate query embedding
            query_embedding = self.encoder.encode(
                query,
                convert_to_tensor=True,
                show_progress_bar=False
            )
            
            # Dense search
            dense_scores = torch.nn.functional.cosine_similarity(
                query_embedding.unsqueeze(0),
                torch.stack(self.document_embeddings),
                dim=1
            )
            
            # Sparse search (TF-IDF like)
            sparse_scores = self._sparse_search(query)
            
            # Combine scores
            combined_scores = (
                self.dense_weight * dense_scores +
                self.sparse_weight * torch.tensor(sparse_scores)
            )
            
            # Get top k results
            top_k = torch.topk(combined_scores, min(k, len(combined_scores)))
            
            results = []
            for score, idx in zip(top_k.values, top_k.indices):
                doc = self.documents[idx]
                results.append({
                    "document": doc,
                    "score": score.item()
                })
                
            return results
            
        except Exception as e:
            raise SearchError(f"Failed to search: {str(e)}")
            
    def _sparse_search(self, query: str) -> np.ndarray:
        """Perform sparse search using simple term matching.
        
        Args:
            query: Search query
            
        Returns:
            Array of sparse scores
        """
        query_terms = set(query.lower().split())
        scores = []
        
        for doc in self.documents:
            content = doc.get("content", "").lower()
            doc_terms = set(content.split())
            
            # Simple term overlap score
            overlap = len(query_terms & doc_terms)
            max_terms = max(len(query_terms), len(doc_terms))
            score = overlap / max_terms if max_terms > 0 else 0
            
            scores.append(score)
            
        return np.array(scores) 