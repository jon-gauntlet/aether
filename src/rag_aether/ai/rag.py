from typing import List, Optional, Dict, Any
import os
import json
import logging
import asyncio
import numpy as np
import aiohttp
from sentence_transformers import SentenceTransformer
import faiss
from dotenv import load_dotenv
from rag_aether.data.firebase_adapter import FirebaseAdapter
from rag_aether.core.health import SystemHealth, with_retries, with_health_check

load_dotenv()
logger = logging.getLogger("rag_system")

class RAGSystem:
    def __init__(self, model_name: str = "claude-3-opus-20240229", use_mock: bool = True):
        self.embeddings = SentenceTransformer("all-MiniLM-L6-v2")
        self.embeddings.to('cpu')
        
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable not set")
        self.api_key = api_key
        self.model_name = model_name
        
        # Initialize FAISS index
        self.dimension = 384  # all-MiniLM-L6-v2 dimension
        self.index = faiss.IndexFlatL2(self.dimension)
        self.texts = []
        self.metadatas = []
        
        self.firebase = FirebaseAdapter(use_mock=use_mock)
        self.health = SystemHealth()
        self.conversation_listener = None
        
    async def _cleanup(self):
        """Cleanup resources on shutdown."""
        logger.info("Cleaning up RAG system resources...")
        if self.conversation_listener:
            self.conversation_listener.unsubscribe()
        logger.info("Cleanup complete")

    @with_retries(max_attempts=3)
    async def initialize_from_firebase(self):
        """Initialize the vector store from Firebase data."""
        logger.info("Initializing from Firebase...")
        
        # Get initial conversations
        docs = await self.firebase.get_conversations()
        logger.info(f"Initializing vector store with {len(docs)} documents")
        
        # Create vector store
        for doc in docs:
            await self.ingest_text(doc.page_content, doc.metadata)
            
        logger.info("Vector store initialization complete")
        
        # Set up real-time updates
        async def on_conversation_update(doc):
            await self.ingest_text(doc.page_content, doc.metadata)
        
        self.conversation_listener = await self.firebase.watch_conversations(on_conversation_update)
        logger.info("Firebase initialization and real-time updates configured")

    async def ingest_text(self, text: str, metadata: Dict[str, Any]):
        """Add text to the vector store."""
        embedding = self.embeddings.encode([text])[0]
        self.index.add(np.array([embedding], dtype=np.float32))
        self.texts.append(text)
        self.metadatas.append(metadata)

    @with_retries(max_attempts=3, delay=1)
    async def _call_claude_api(self, context: str, query: str) -> str:
        """Call Claude API with retry logic."""
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": self.api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                },
                json={
                    "model": self.model_name,
                    "max_tokens": 1000,
                    "temperature": 0,
                    "system": "You are a helpful assistant. Use the following context to answer the user's question. If you cannot answer based on the context, say so.",
                    "messages": [
                        {
                            "role": "user",
                            "content": f"Context:\n{context}\n\nQuestion: {query}"
                        }
                    ]
                }
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise RuntimeError(f"Claude API error: {error_text}")
                    
                result = await response.json()
                return result["content"][0]["text"]

    async def query(self, query: str, k: int = 3) -> str:
        """Query the RAG system."""
        # Get query embedding
        query_embedding = self.embeddings.encode([query])[0]
        
        # Search for similar texts
        D, I = self.index.search(np.array([query_embedding], dtype=np.float32), k)
        
        # Build context from retrieved texts
        context = "\n\n".join([self.texts[i] for i in I[0]])
        
        # Generate response with Claude
        return await self._call_claude_api(context, query) 