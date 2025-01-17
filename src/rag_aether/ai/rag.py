"""RAG (Retrieval-Augmented Generation) implementation."""

from typing import List, Dict, Any, Optional, Tuple
from sentence_transformers import SentenceTransformer
import numpy as np
import faiss
from dataclasses import dataclass, field
import time
import asyncio

@dataclass
class Document:
    """Document class for storing text and metadata."""
    text: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    embedding: Optional[np.ndarray] = None

class BaseRAG:
    """Base RAG implementation."""
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """Initialize RAG with a sentence transformer model."""
        self.embedding_model = SentenceTransformer(model_name)
        self.dimension = getattr(self.embedding_model, "dimension", 768)  # Use model's dimension or default to 768
        self.index = faiss.IndexFlatL2(self.dimension)
        self.documents: List[Document] = []
        self.metadata: List[Dict[str, Any]] = []
        
    async def _encode_texts_batch(self, texts: List[str], batch_size: int = 32) -> np.ndarray:
        """Encode texts in batches asynchronously."""
        # Run encoding in a thread pool since it's CPU-bound
        loop = asyncio.get_event_loop()
        
        if len(texts) == 1:
            # Single text encoding
            embeddings = await loop.run_in_executor(
                None, 
                lambda: self.embedding_model.encode(
                    texts[0], 
                    convert_to_numpy=True,
                    normalize_embeddings=True
                )
            )
            return embeddings.reshape(1, -1)
        else:
            # Batch encoding
            embeddings = await loop.run_in_executor(
                None, 
                lambda: self.embedding_model.encode(
                    texts, 
                    batch_size=batch_size, 
                    convert_to_numpy=True,
                    normalize_embeddings=True
                )
            )
            return embeddings
        
    async def ingest_text(self, text: str, metadata: Optional[Dict[str, Any]] = None) -> None:
        """Ingest a single text document asynchronously."""
        embedding = await self._encode_texts_batch([text])  # Already properly shaped
        doc = Document(text=text, metadata=metadata or {}, embedding=embedding[0])
        self.documents.append(doc)
        self.metadata.append(metadata or {})
        self.index.add(embedding)  # embedding is already 2D
        
    async def retrieve_with_fusion(
        self, 
        query: str, 
        k: int = 5, 
        metadata_filters: Optional[Dict[str, Any]] = None
    ) -> Tuple[List[str], List[Dict[str, Any]], Dict[str, Any]]:
        """Retrieve similar documents with metadata filtering and metrics."""
        start_time = time.time()
        
        # Encode query
        query_embedding = await self._encode_texts_batch([query])  # Already properly shaped
        
        # Search index
        D, I = self.index.search(query_embedding, k * 2)  # Get extra results for filtering
        
        # Filter and format results
        texts = []
        metadata = []
        similarity_scores = []
        
        for dist, idx in zip(D[0], I[0]):
            if len(texts) >= k:
                break
                
            doc = self.documents[idx]
            meta = doc.metadata
            
            # Apply metadata filters
            if metadata_filters:
                matches = True
                for key, value in metadata_filters.items():
                    if isinstance(value, dict):  # Range filter
                        doc_value = meta.get(key)
                        if not (value["min"] <= doc_value <= value["max"]):
                            matches = False
                            break
                    elif meta.get(key) != value:
                        matches = False
                        break
                        
                if not matches:
                    continue
            
            texts.append(doc.text)
            metadata.append(meta)
            similarity_scores.append(1.0 / (1.0 + dist))  # Convert distance to similarity score
            
        metrics = {
            "retrieval_time_ms": int((time.time() - start_time) * 1000),
            "num_results": len(texts),
            "similarity_scores": similarity_scores
        }
        
        return texts, metadata, metrics 