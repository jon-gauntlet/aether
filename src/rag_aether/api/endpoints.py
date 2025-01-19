"""API endpoints and dependencies."""
import os
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, Field
from rag_aether.ai.rag_system import RAGSystem
from rag_aether.core.monitoring import monitor
from rag_aether.core.performance import with_performance_monitoring

# Create FastAPI app
app = FastAPI(
    title="RAG Aether API",
    description="API for RAG system with efficient batch processing",
    version="0.1.0"
)

# Global RAG system instance
rag_system = None

class QueryRequest(BaseModel):
    """Query request model."""
    query: str = Field(..., description="Query text")
    max_results: Optional[int] = Field(5, description="Maximum number of results to return")
    min_score: Optional[float] = Field(0.0, description="Minimum similarity score threshold")

class QueryResponse(BaseModel):
    """Query response model."""
    results: List[Dict[str, Any]] = Field(..., description="Search results")
    metrics: Dict[str, Any] = Field(..., description="Performance metrics")

class IngestRequest(BaseModel):
    """Ingest request model."""
    text: str = Field(..., description="Text to ingest")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Optional metadata")

def get_rag_system() -> RAGSystem:
    """Get or initialize RAG system.
    
    Returns:
        RAGSystem: The initialized RAG system
        
    Raises:
        HTTPException: If OpenAI API key is missing
    """
    global rag_system
    if rag_system is None:
        if not os.getenv("OPENAI_API_KEY"):
            raise HTTPException(
                status_code=503,
                detail="RAG system not initialized: Missing OpenAI API key"
            )
        rag_system = RAGSystem()
    return rag_system

@app.post("/api/query", response_model=QueryResponse)
@with_performance_monitoring
async def query(
    request: QueryRequest,
    rag: RAGSystem = Depends(get_rag_system)
) -> Dict[str, Any]:
    """Query the RAG system.
    
    Args:
        request: Query request
        rag: RAG system instance
        
    Returns:
        Query response with results and metrics
    """
    try:
        monitor.take_snapshot("before_query")
        results = await rag.query(
            request.query,
            max_results=request.max_results,
            min_score=request.min_score
        )
        monitor.take_snapshot("after_query")
        
        metrics = {
            "memory_diff": monitor.compare_snapshots("before_query", "after_query"),
            "performance": monitor.get_metrics()
        }
        
        return {
            "results": results,
            "metrics": metrics
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Query failed: {str(e)}"
        )

@app.post("/api/ingest")
@with_performance_monitoring
async def ingest(
    request: IngestRequest,
    rag: RAGSystem = Depends(get_rag_system)
) -> Dict[str, Any]:
    """Ingest text into the RAG system.
    
    Args:
        request: Ingest request
        rag: RAG system instance
        
    Returns:
        Success status and metrics
    """
    try:
        monitor.take_snapshot("before_ingest")
        success = await rag.ingest_text(
            request.text,
            metadata=request.metadata
        )
        monitor.take_snapshot("after_ingest")
        
        metrics = {
            "memory_diff": monitor.compare_snapshots("before_ingest", "after_ingest"),
            "performance": monitor.get_metrics()
        }
        
        return {
            "success": success,
            "metrics": metrics
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ingestion failed: {str(e)}"
        )

@app.get("/api/health")
async def health_check(
    rag: RAGSystem = Depends(get_rag_system)
) -> Dict[str, Any]:
    """Check system health.
    
    Args:
        rag: RAG system instance
        
    Returns:
        Health status and metrics
    """
    return {
        "status": "healthy",
        "metrics": monitor.get_metrics()
    } 