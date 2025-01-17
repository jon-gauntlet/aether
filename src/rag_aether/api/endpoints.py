"""FastAPI endpoints for RAG system."""

from typing import Dict, Any, List
from fastapi import FastAPI
from pydantic import BaseModel

from .routes import router
from ..ai.rag_system import RAGSystem
from ..core.monitor import SystemMonitor

app = FastAPI(title="RAG Aether API")
rag_system = RAGSystem()
monitor = SystemMonitor()

@app.get("/")
async def root() -> Dict[str, str]:
    """Root endpoint."""
    return {
        "name": "RAG API",
        "version": "1.0.0",
        "status": "running"
    }

class IndexRequest(BaseModel):
    """Document indexing request model."""
    documents: List[str]

class Query(BaseModel):
    text: str

@app.post("/query")
async def process_query(query: Query) -> Dict[str, Any]:
    """
    Process a query through the RAG system
    """
    try:
        result = rag_system.process_query(query.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/index")
async def index(request: IndexRequest) -> Dict[str, Any]:
    """Index documents for retrieval."""
    try:
        await rag_system.index_documents(request.documents)
        return {
            "status": "success",
            "indexed_count": len(request.documents)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health() -> Dict[str, Any]:
    """Health check endpoint."""
    try:
        metrics = monitor.get_metrics()
        return {
            "status": "healthy",
            "system_metrics": metrics,
            "version": "1.0.0"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "version": "1.0.0"
        } 