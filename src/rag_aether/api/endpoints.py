"""FastAPI endpoints for RAG system."""

from typing import Dict, Any, List
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from ..ai.rag_system import RAGSystem
from ..core.monitor import SystemMonitor

app = FastAPI()
rag = RAGSystem(use_mock=False)  # Using real model for production
monitor = SystemMonitor()

class QueryRequest(BaseModel):
    """Query request model."""
    query: str

class IndexRequest(BaseModel):
    """Document indexing request model."""
    documents: List[str]

@app.post("/query")
async def query(request: QueryRequest) -> Dict[str, Any]:
    """Process a query through the RAG system."""
    try:
        return await rag.process_query(request.query)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/index")
async def index(request: IndexRequest) -> Dict[str, Any]:
    """Index documents for retrieval."""
    try:
        await rag.index_documents(request.documents)
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
            "system_metrics": metrics
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 