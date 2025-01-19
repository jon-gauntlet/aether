"""Vector store client for Supabase."""
import asyncio
from typing import List, Dict, Any, Optional
import logging
from supabase import create_client, Client
from .ml_client import MLClient
from ..config import load_credentials, SIMILARITY_THRESHOLD

logger = logging.getLogger(__name__)

class VectorStore:
    """Vector store for document embeddings."""
    
    def __init__(self):
        """Initialize vector store with Supabase and ML clients."""
        creds = load_credentials()
        self.supabase = create_client(creds.supabase_url, creds.supabase_key)
        self.ml_client = MLClient()
        
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
            
            # Prepare batch insert data
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
            
            # Insert batch
            try:
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
        
    async def similarity_search(
        self,
        query: str,
        k: int = 4,
        threshold: float = SIMILARITY_THRESHOLD,
        metadata_filter: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Search for similar documents.
        
        Args:
            query: Query text
            k: Number of results to return
            threshold: Minimum similarity threshold
            metadata_filter: Optional metadata filter
            
        Returns:
            List of documents with similarity scores
        """
        # Get query embedding
        query_embedding = await self.ml_client.create_embedding(query)
        
        try:
            # Build query
            query_builder = self.supabase.rpc(
                'knn_match_embeddings',
                {
                    'query_embedding': query_embedding,
                    'k': k
                }
            )
            
            # Add metadata filter if provided
            if metadata_filter:
                for key, value in metadata_filter.items():
                    query_builder = query_builder.eq(f'metadata->{key}', value)
                    
            # Execute search
            result = query_builder.execute()
            
            return result.data
            
        except Exception as e:
            logger.error(f"Failed to search documents: {e}")
            raise
            
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