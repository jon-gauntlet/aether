from typing import Dict, List, Optional
import os
from anthropic import Anthropic
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi import HTTPException

from .monitoring import monitor

load_dotenv()

class Document(BaseModel):
    content: str
    metadata: Dict = {}

class RAGResponse(BaseModel):
    answer: str
    context: List[str]
    
class RAGSystem:
    def __init__(self):
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable is not set")
        self.anthropic = Anthropic(api_key=api_key)
        self.document_store: Dict[str, Document] = {}
        
    async def add_document(self, doc_id: str, content: str, metadata: Optional[Dict] = None):
        if not content.strip():
            raise ValueError("Document content cannot be empty")
        self.document_store[doc_id] = Document(
            content=content,
            metadata=metadata or {}
        )
        monitor.record_document_added()
        
    async def query(self, question: str) -> RAGResponse:
        monitor.start_query()
        try:
            if not question.strip():
                raise ValueError("Question cannot be empty")
                
            if not self.document_store:
                monitor.end_query(success=True)
                return RAGResponse(
                    answer="No documents have been added to the knowledge base yet.",
                    context=[]
                )
                
            # Simple implementation - concatenate all documents
            context = "\n\n".join([doc.content for doc in self.document_store.values()])
            
            system_prompt = f"""You are a helpful AI assistant. Use the following context to answer the question.
            If you cannot answer based on the context, say so.
            
            Context:
            {context}
            """
            
            try:
                message = await self.anthropic.messages.create(
                    model="claude-3-sonnet-20240229",
                    max_tokens=1000,
                    system=system_prompt,
                    messages=[{"role": "user", "content": question}]
                )
                
                monitor.end_query(success=True)
                return RAGResponse(
                    answer=message.content[0].text,
                    context=[doc.content for doc in self.document_store.values()]
                )
            except Exception as e:
                monitor.end_query(success=False)
                raise HTTPException(
                    status_code=500,
                    detail=f"Error querying Anthropic API: {str(e)}"
                )
        except Exception as e:
            monitor.end_query(success=False)
            raise e

# Create singleton instance with error handling
try:
    rag_system = RAGSystem()
except ValueError as e:
    print(f"Warning: RAG system initialization failed: {e}")
    rag_system = None 