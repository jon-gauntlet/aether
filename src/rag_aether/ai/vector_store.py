"""Vector store client for Supabase."""
import asyncio
from typing import List, Dict, Any, Optional
import logging
from supabase import create_client, Client
from .ml_client import MLClient
from ..config import load_credentials, SIMILARITY_THRESHOLD
import faiss
import numpy as np
from datetime import datetime, UTC
from uuid import uuid4

logger = logging.getLogger(__name__)

class VectorStore:
    """Vector store for document embeddings."""
    
    def __init__(self, dimension: int = 1536):
        """Initialize vector store.
        
        Args:
            dimension: Dimension of vectors (1536 for OpenAI ada-002)
        """
        self.dimension = dimension
        self.index = faiss.IndexFlatL2(dimension)
        self.documents = []
        self.document_vectors = None
        self.metadata = []
        creds = load_credentials()
        self.supabase = create_client(creds.supabase_url, creds.supabase_key)
        self.ml_client = MLClient()
        
    async def add_documents(
        self,
        texts: List[str],
        embeddings: np.ndarray,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Add documents with pre-computed embeddings.
        
        Args:
            texts: List of document texts
            embeddings: Document embeddings
            metadata: Optional metadata for the documents
            
        Returns:
            bool: True if successful
        """
        try:
            if not texts or embeddings.size == 0:
                return False
                
            embeddings_array = np.array(embeddings).astype('float32')
            if len(texts) != embeddings_array.shape[0]:
                raise ValueError("Number of texts must match number of embeddings")
                
            if metadata and len(metadata) != len(texts):
                raise ValueError("Number of metadata entries must match number of texts")
                
            # Add to FAISS index
            self.index.add(embeddings_array)
            
            # Store documents
            for i, text in enumerate(texts):
                doc_metadata = metadata[i] if metadata else {}
                doc_metadata.update({
                    "document_id": str(uuid4()),
                    "timestamp": datetime.now(UTC).isoformat(),
                    "index": len(self.documents)
                })
                self.documents.append(text)
                self.metadata.append(doc_metadata)
                
            return True
            
        except Exception as e:
            logger.error(f"Error adding documents: {e}")
            return False
        
    async def add_texts(
        self,
        texts: List[str],
        metadata: Optional[List[Dict[str, Any]]] = None,
        batch_size: int = 100
    ) -> List[str]:
        """Add texts to the vector store.
        
        Args:
            texts: List of texts to add
            metadata: Optional list of metadata dicts for each text
            batch_size: Number of texts to process in each batch
            
        Returns:
            List of document IDs
        """
        if metadata is None:
            metadata = [{} for _ in texts]
            
        # Create embeddings in batches
        embeddings = await self.ml_client.create_embeddings_batch(
            texts,
            batch_size=batch_size
        )
        
        # Insert documents in batches
        doc_ids = []
        for i in range(0, len(texts), batch_size):
            batch_texts = texts[i:i + batch_size]
            batch_embeddings = embeddings[i:i + batch_size]
            batch_metadata = metadata[i:i + batch_size]
            
            # Add to FAISS index
            self.index.add(np.array(batch_embeddings))
            
            # Store documents
            for text, meta in zip(batch_texts, batch_metadata):
                doc_metadata = meta.copy()
                doc_metadata.update({
                    "document_id": str(uuid4()),
                    "timestamp": datetime.now(UTC).isoformat(),
                    "index": len(self.documents)
                })
                self.documents.append(text)
                self.metadata.append(doc_metadata)
            
            # Insert to Supabase
            try:
                documents = [
                    {
                        'content': text,
                        'embedding': embedding,
                        'metadata': meta
                    }
                    for text, embedding, meta in zip(
                        batch_texts,
                        batch_embeddings,
                        batch_metadata
                    )
                ]
                
                result = self.supabase.table('embeddings').insert(
                    documents
                ).execute()
                
                # Extract document IDs
                batch_ids = [
                    str(doc['id'])
                    for doc in result.data
                ]
                doc_ids.extend(batch_ids)
                
            except Exception as e:
                logger.error(f"Failed to insert documents: {e}")
                raise
                
        return doc_ids
        
    async def search(
        self,
        query_embedding: np.ndarray,
        k: int = 5,
        min_score: float = 0.0
    ) -> List[Dict[str, Any]]:
        """Search for similar documents.
        
        Args:
            query_embedding: Query vector
            k: Number of results to return
            min_score: Minimum similarity score threshold
            
        Returns:
            List of documents with similarity scores
        """
        if not self.documents:
            return []
            
        query_vector = query_embedding.reshape(1, -1)
        distances, indices = self.index.search(query_vector, min(k, len(self.documents)))
        
        results = []
        for distance, idx in zip(distances[0], indices[0]):
            if idx != -1:  # Valid index
                score = float(1.0 / (1.0 + distance))  # Convert distance to similarity score
                if score >= min_score:
                    result = {
                        "document_id": self.metadata[idx]["document_id"],
                        "score": score,
                        "metadata": self.metadata[idx],
                        "content": self.documents[idx]
                    }
                    results.append(result)
                    
        return sorted(results, key=lambda x: x["score"], reverse=True)
            
    async def delete_texts(
        self,
        doc_ids: List[str]
    ) -> None:
        """Delete documents from the vector store.
        
        Args:
            doc_ids: List of document IDs to delete
        """
        try:
            self.supabase.table('embeddings').delete().in_('id', doc_ids).execute()
        except Exception as e:
            logger.error(f"Failed to delete documents: {e}")
            raise 