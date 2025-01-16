"""Minimal RAG system implementation for MVP."""
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
from sentence_transformers import SentenceTransformer, util
import faiss
from dataclasses import dataclass
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mvp_rag")

@dataclass
class Document:
    """Simple document representation."""
    text: str
    metadata: Optional[Dict[str, Any]] = None

class MVPRagSystem:
    """Minimal RAG system implementation focused on core functionality."""
    
    def __init__(
        self,
        model_name: str = "BAAI/bge-large-en-v1.5",
        index_path: Optional[str] = None
    ):
        """Initialize MVP RAG system."""
        self.model_name = model_name
        logger.info(f"Initializing MVP RAG with model: {model_name}")
        
        # Initialize embedding model
        try:
            self.embedding_model = SentenceTransformer(model_name)
            logger.info("Embedding model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {str(e)}")
            raise
        
        # Initialize FAISS index
        self.dimension = self.embedding_model.get_sentence_embedding_dimension()
        self.index = faiss.IndexFlatL2(self.dimension)
        
        # Store documents and their metadata
        self.documents: List[Document] = []
        
        # Load existing index if provided
        if index_path:
            self.load_index(index_path)
    
    def _encode_text(self, text: str) -> np.ndarray:
        """Encode text to embedding vector."""
        try:
            embedding = self.embedding_model.encode(text, convert_to_numpy=True)
            return embedding.reshape(1, -1)
        except Exception as e:
            logger.error(f"Failed to encode text: {str(e)}")
            raise
    
    def add_document(self, text: str, metadata: Optional[Dict[str, Any]] = None) -> None:
        """Add a document to the RAG system."""
        try:
            # Create document
            doc = Document(text=text, metadata=metadata)
            
            # Get embedding
            embedding = self._encode_text(text)
            
            # Add to index
            self.index.add(embedding)
            
            # Store document
            self.documents.append(doc)
            
            logger.info(f"Added document successfully. Total documents: {len(self.documents)}")
        except Exception as e:
            logger.error(f"Failed to add document: {str(e)}")
            raise
    
    def search(
        self,
        query: str,
        k: int = 5,
        threshold: float = 0.5
    ) -> List[Tuple[Document, float]]:
        """Search for relevant documents."""
        try:
            # Encode query
            query_embedding = self._encode_text(query)
            
            # Search index
            distances, indices = self.index.search(query_embedding, k)
            
            # Get results
            results = []
            for dist, idx in zip(distances[0], indices[0]):
                if idx < len(self.documents):  # Ensure valid index
                    # Convert L2 distance to similarity score (0-1)
                    similarity = 1 / (1 + dist)
                    if similarity >= threshold:
                        results.append((self.documents[idx], similarity))
            
            # Sort by similarity
            results.sort(key=lambda x: x[1], reverse=True)
            
            logger.info(f"Found {len(results)} relevant documents")
            return results
        except Exception as e:
            logger.error(f"Search failed: {str(e)}")
            raise
    
    def save_index(self, path: str) -> None:
        """Save the FAISS index and documents."""
        try:
            # Create directory if it doesn't exist
            save_path = Path(path)
            save_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Save FAISS index
            faiss.write_index(self.index, str(save_path))
            logger.info(f"Saved index to {path}")
        except Exception as e:
            logger.error(f"Failed to save index: {str(e)}")
            raise
    
    def load_index(self, path: str) -> None:
        """Load a saved FAISS index."""
        try:
            self.index = faiss.read_index(path)
            logger.info(f"Loaded index from {path}")
        except Exception as e:
            logger.error(f"Failed to load index: {str(e)}")
            raise 