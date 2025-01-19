"""RAG Aether API."""
from fastapi import FastAPI, HTTPException, Depends, status
from pydantic import BaseModel, Field, field_validator
from typing import Dict, Any, List, Optional
import os

from rag_aether.ai.rag_system import RAGSystem
from rag_aether.core.monitoring import monitor

app = FastAPI(title="RAG Aether API")
rag_system: Optional[RAGSystem] = None

class Document(BaseModel):
    """Document model for ingestion."""
    content: str
    metadata: Optional[Dict[str, Any]] = None
    
    @field_validator("content")
    def content_must_not_be_empty(cls, v):
        """Validate document content."""
        if not v.strip():
            raise ValueError("Content must not be empty")
        return v

class Query(BaseModel):
    """Query model."""
    question: str
    
    @field_validator("question")
    def question_must_not_be_empty(cls, v):
        """Validate query question."""
        if not v.strip():
            raise ValueError("Question must not be empty")
        return v

def get_rag_system() -> RAGSystem:
    """Get or initialize RAG system."""
    global rag_system
    if rag_system is None:
        if not os.getenv("OPENAI_API_KEY"):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="RAG system not initialized: Missing OpenAI API key"
            )
        rag_system = RAGSystem()
    return rag_system

@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint."""
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="RAG system not initialized: Missing OpenAI API key"
        )
        
    try:
        system = get_rag_system()
        return {
            "status": "healthy",
            "rag_system_ready": True,
            "message": "RAG system initialized and ready",
            "metrics": monitor.get_metrics()
        }
    except HTTPException as e:
        return {
            "status": "healthy",
            "rag_system_ready": False,
            "message": str(e.detail),
            "metrics": monitor.get_metrics()
        }

@app.post("/api/v1/documents/{doc_id}")
async def add_document(
    doc_id: str,
    document: Document,
    rag: RAGSystem = Depends(get_rag_system)
):
    """Add document to RAG system."""
    try:
        success = await rag.ingest_text(
            text=document.content,
            metadata={"id": doc_id, **document.metadata}
        )
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to add document"
            )
        return {"success": success, "doc_id": doc_id}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add document: {str(e)}"
        )

@app.post("/api/v1/query")
async def query(
    query: Query,
    rag: RAGSystem = Depends(get_rag_system)
):
    """Query the RAG system."""
    try:
        monitor.record_query_start()
        results = await rag.query(query.question)
        monitor.record_query_success()
        return {
            "results": results,
            "metrics": monitor.get_metrics()
        }
    except ValueError as e:
        # Validation error
        monitor.record_query_failure()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        monitor.record_query_failure()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Query failed: {str(e)}"
        ) 