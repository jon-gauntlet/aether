"""FastAPI routes for RAG system."""
from fastapi import APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

from ..ai.rag_system import RAGSystem
from ..core.monitor import SystemMonitor

router = APIRouter()
rag_system = RAGSystem()  # Using default initialization
monitor = SystemMonitor()

class Document(BaseModel):
    """Document model."""
    text: str
    metadata: Optional[Dict[str, Any]] = None

class Query(BaseModel):
    """Query model."""
    text: str
    top_k: int = 3

class SearchResponse(BaseModel):
    """Search response model."""
    results: List[Dict[str, Any]]
    metadata: Optional[Dict[str, Any]] = None

@router.options("/documents")
@router.options("/search")
@router.options("/health")
async def options_handler():
    """Handle CORS preflight requests."""
    return {}

@router.post("/documents", response_model=Dict[str, Any])
async def add_documents(documents: List[Document]):
    """Add documents to the RAG system."""
    try:
        texts = [doc.text for doc in documents]
        metadata = [doc.metadata for doc in documents]
        await rag_system.add_documents([{"text": t, "metadata": m} for t, m in zip(texts, metadata)])
        return {"status": "success", "count": len(documents)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/search", response_model=SearchResponse)
async def search(query: Query):
    """Search for relevant documents."""
    try:
        response = await rag_system.query(query.text, k=query.top_k)
        return SearchResponse(
            results=response.context,
            metadata={"expanded_query": response.expanded_query}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    """Health check endpoint."""
    try:
        metrics = monitor.get_metrics()
        return {
            "status": "healthy",
            "metrics": metrics,
            "version": "0.1.0"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "version": "0.1.0"
        } 