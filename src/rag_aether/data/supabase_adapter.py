"""Supabase adapter for data persistence."""
from supabase import create_client
import os
from typing import List, Optional, Dict, Any
from datetime import datetime
import json

from .document import Document, Chunk
from ..core.conversation import Message

class SupabaseAdapter:
    """Adapter for Supabase database operations."""
    
    def __init__(self):
        """Initialize Supabase client."""
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_ANON_KEY")
        if not url or not key:
            raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY environment variables must be set")
        
        self.client = create_client(url, key)
    
    async def save_document(self, document: Document) -> str:
        """Save a document and its chunks."""
        # Save document
        doc_data = {
            'content': document.content,
            'metadata': json.dumps(document.metadata),
            'created_at': document.created_at.isoformat()
        }
        doc_response = self.client.table("documents").insert(doc_data).execute()
        document_id = doc_response.data[0]['id']
        
        # Save chunks
        for chunk in document.chunks:
            chunk_data = {
                'document_id': document_id,
                'content': chunk.content,
                'start_idx': chunk.start_idx,
                'end_idx': chunk.end_idx,
                'metadata': json.dumps(chunk.metadata)
            }
            self.client.table("document_chunks").insert(chunk_data).execute()
            
        return document_id
    
    async def get_documents(self) -> List[Document]:
        """Get all documents with their chunks."""
        docs_response = self.client.table("documents").select("*").execute()
        documents = []
        
        for doc_data in docs_response.data:
            # Get chunks for this document
            chunks_response = self.client.table("document_chunks").select("*").eq("document_id", doc_data['id']).execute()
            
            # Create chunks
            chunks = [
                Chunk(
                    content=chunk['content'],
                    start_idx=chunk['start_idx'],
                    end_idx=chunk['end_idx'],
                    metadata=json.loads(chunk['metadata'])
                )
                for chunk in chunks_response.data
            ]
            
            # Create document
            doc = Document(
                content=doc_data['content'],
                metadata=json.loads(doc_data['metadata']),
                chunks=chunks,
                created_at=datetime.fromisoformat(doc_data['created_at'])
            )
            documents.append(doc)
            
        return documents
    
    async def save_message(self, conversation_id: str, message: Message) -> None:
        """Save a chat message."""
        message_data = {
            'conversation_id': conversation_id,
            'content': message.content,
            'role': message.role,
            'timestamp': message.timestamp.isoformat(),
            'metadata': json.dumps(message.metadata)
        }
        self.client.table("messages").insert(message_data).execute()
    
    async def get_conversation_messages(self, conversation_id: str) -> List[Message]:
        """Get all messages for a conversation."""
        response = self.client.table("messages").select("*").eq("conversation_id", conversation_id).order("timestamp").execute()
        
        return [
            Message(
                content=msg['content'],
                role=msg['role'],
                timestamp=datetime.fromisoformat(msg['timestamp']),
                metadata=json.loads(msg['metadata'])
            )
            for msg in response.data
        ] 