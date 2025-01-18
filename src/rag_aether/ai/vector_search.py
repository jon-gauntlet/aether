"""Vector search implementation for RAG system."""

import numpy as np
from typing import List, Dict, Any, Optional
import torch
from sentence_transformers import SentenceTransformer, util

class OptimizedVectorSearch:
    """Optimized vector search implementation."""
    
    def __init__(self, model_name: str = "BAAI/bge-small-en"):
        """Initialize vector search.
        
        Args:
            model_name: Name of the embedding model to use
        """
        self.model_name = model_name
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = SentenceTransformer(model_name).to(self.device)
        self.document_embeddings: Optional[torch.Tensor] = None
        self.documents: List[Dict[str, Any]] = []
        
    def add_documents(self, documents: List[Dict[str, Any]]) -> None:
        """Add documents to the search index.
        
        Args:
            documents: List of documents to add
        """
        self.documents.extend(documents)
        texts = [doc["text"] for doc in documents]
        embeddings = self.encode(texts)
        
        if self.document_embeddings is None:
            self.document_embeddings = embeddings
        else:
            self.document_embeddings = torch.cat([
                self.document_embeddings, 
                embeddings
            ])
            
    def encode(self, texts: List[str]) -> torch.Tensor:
        """Encode texts to embeddings.
        
        Args:
            texts: List of texts to encode
            
        Returns:
            Tensor of embeddings
        """
        return self.model.encode(
            texts,
            convert_to_tensor=True,
            device=self.device
        )
        
    def search(self, query: str, k: int = 3) -> List[Dict[str, Any]]:
        """Search for relevant documents.
        
        Args:
            query: Query to search for
            k: Number of results to return
            
        Returns:
            List of relevant documents with scores
        """
        if not self.documents:
            return []
            
        # Get query embedding
        query_embedding = self.encode([query])
        
        # Calculate similarities
        similarities = util.pytorch_cos_sim(
            query_embedding, 
            self.document_embeddings
        )[0]
        
        # Get top k
        top_k = torch.topk(similarities, min(k, len(self.documents)))
        
        results = []
        for score, idx in zip(top_k.values, top_k.indices):
            doc = self.documents[idx]
            results.append({
                "document": doc,
                "score": float(score)
            })
            
        return results 