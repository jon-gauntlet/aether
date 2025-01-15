from typing import Optional, Dict, Any, List
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import logging
import asyncio
from rag_aether.ai.rag import RAGSystem

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("rag_api")

# Initialize FastAPI app
app = FastAPI(
    title="Aether RAG API",
    description="Professional-grade RAG system with Firebase integration",
    version="0.1.0"
)

# Initialize RAG system
rag: Optional[RAGSystem] = None
initialization_lock = asyncio.Lock()

class QueryRequest(BaseModel):
    query: str = Field(..., description="The query to search for")
    max_results: Optional[int] = Field(3, description="Maximum number of results to return")
    relevant_ids: Optional[List[str]] = Field(None, description="List of relevant document IDs for metric calculation")

class RetrievalResult(BaseModel):
    text: str = Field(..., description="Retrieved text chunk")
    metadata: Dict[str, Any] = Field(..., description="Associated metadata")
    score: Optional[float] = Field(None, description="Retrieval score")

class RetrievalMetricsResponse(BaseModel):
    mrr: float = Field(..., description="Mean Reciprocal Rank")
    ndcg: float = Field(..., description="Normalized Discounted Cumulative Gain")
    recall_at_k: Dict[int, float] = Field(..., description="Recall@K for different K values")
    latency_ms: float = Field(..., description="Retrieval latency in milliseconds")
    num_results: int = Field(..., description="Number of results returned")

class QueryMetricsResponse(BaseModel):
    retrieval: RetrievalMetricsResponse = Field(..., description="Retrieval metrics")
    generation_time_ms: float = Field(..., description="Generation time in milliseconds")
    total_time_ms: float = Field(..., description="Total query time in milliseconds")
    num_tokens: int = Field(..., description="Number of tokens in response")

class QueryResponse(BaseModel):
    answer: str = Field(..., description="Generated answer")
    context: List[RetrievalResult] = Field(..., description="Retrieved context chunks with metadata")
    model: str = Field(..., description="Model used for generation")
    metrics: QueryMetricsResponse = Field(..., description="Query performance metrics")

@app.on_event("startup")
async def startup_event():
    """Initialize RAG system on startup."""
    global rag
    async with initialization_lock:
        if rag is None:
            logger.info("Initializing RAG system...")
            rag = RAGSystem(use_mock=True)
            await rag.initialize_from_firebase()
            logger.info("RAG system initialized")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup RAG system on shutdown."""
    global rag
    if rag:
        logger.info("Cleaning up RAG system...")
        await rag._cleanup()
        rag = None
        logger.info("RAG system cleaned up")

@app.get("/health")
async def health_check():
    """Check system health."""
    if not rag:
        raise HTTPException(status_code=503, detail="RAG system not initialized")
    return {
        "status": "healthy",
        "model": rag.model_name,
        "index_size": len(rag.texts),
        "embedding_dimension": rag.dimension
    }

@app.get("/metrics")
async def get_metrics():
    """Get system metrics."""
    if not rag:
        raise HTTPException(status_code=503, detail="RAG system not initialized")
    return rag.metrics.get_average_metrics()

@app.post("/query", response_model=QueryResponse)
async def query(request: QueryRequest):
    """Query the RAG system with fusion retrieval."""
    if not rag:
        raise HTTPException(status_code=503, detail="RAG system not initialized")
    
    try:
        # Get answer and metrics
        result = await rag.query(
            request.query, 
            request.max_results,
            request.relevant_ids
        )
        
        # Create response with detailed context
        return QueryResponse(**result)
        
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 