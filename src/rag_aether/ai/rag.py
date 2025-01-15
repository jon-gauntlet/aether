from langchain_anthropic import ChatAnthropic
from langchain_community.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQA
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings
from typing import List, Optional, Dict, Any
import os
import json
import logging
import atexit
from dotenv import load_dotenv
from rag_aether.data.firebase_adapter import FirebaseAdapter
from rag_aether.core.health import SystemHealth, with_retries, with_health_check

load_dotenv()
logger = logging.getLogger("rag_system")

class RAGSystem:
    def __init__(self, model_name: str = "claude-3-opus-20240229"):
        self.embeddings = HuggingFaceEmbeddings(
            model_name="all-MiniLM-L6-v2",
            model_kwargs={'device': 'cpu'}
        )
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )
        self.llm = ChatAnthropic(
            model_name=model_name,
            temperature=0,
            anthropic_api_key=os.getenv("ANTHROPIC_API_KEY")
        )
        self.vector_store = None
        self.qa_chain = None
        self.firebase = FirebaseAdapter()
        self.health = SystemHealth()
        
        # Register cleanup
        atexit.register(self._cleanup)
        
    async def _cleanup(self):
        """Cleanup resources on shutdown."""
        logger.info("Cleaning up RAG system resources...")
        if hasattr(self, 'conversation_listener'):
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
        texts = [doc.page_content for doc in docs]
        metadatas = [doc.metadata for doc in docs]
        self.vector_store = FAISS.from_texts(texts, self.embeddings, metadatas=metadatas)
        logger.info("Vector store initialization complete")
        
        # Set up real-time updates
        async def on_conversation_update(doc: Document):
            await self.ingest_text(doc.page_content, doc.metadata)
        
        self.conversation_listener = await self.firebase.watch_conversations(on_conversation_update)
        logger.info("Firebase initialization and real-time updates configured")

    async def ingest_text(self, text: str, metadata: Optional[Dict[str, Any]] = None):
        """Ingest new text into the vector store."""
        if not self.vector_store:
            raise RuntimeError("Vector store not initialized")
            
        # Split text into chunks
        chunks = self.text_splitter.split_text(text)
        
        # Add to vector store
        metadatas = [metadata or {}] * len(chunks)
        self.vector_store.add_texts(chunks, metadatas=metadatas)
        
        # Record operation
        self.health.record_operation("ingestions")
        logger.info(f"Operation recorded: ingestions, total: {self.health.get_operation_count('ingestions')}")

    @with_health_check
    async def query(self, question: str) -> Dict[str, Any]:
        """Query the RAG system."""
        logger.info(f"Processing query: {question}...")
        
        if not self.vector_store:
            raise RuntimeError("Vector store not initialized")
        
        # Get relevant documents
        docs = self.vector_store.similarity_search(question, k=3)
        context = "\n\n".join([doc.page_content for doc in docs])
        
        # Generate answer
        messages = [
            {"role": "system", "content": "You are a helpful AI assistant. Answer questions based on the provided context. If the context doesn't contain relevant information, say so."},
            {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"}
        ]
        response = await self.llm.ainvoke(messages)
        
        # Record operation
        self.health.record_operation("queries")
        logger.info(f"Operation recorded: queries, total: {self.health.get_operation_count('queries')}")
        logger.info("Query processing complete")
        
        return {
            "answer": response.content,
            "sources": [{"content": doc.page_content, "metadata": doc.metadata} for doc in docs]
        } 