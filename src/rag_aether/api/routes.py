from fastapi import FastAPI, HTTPException, Depends
from typing import Dict, Any, Optional, List
from pydantic import BaseModel
from rag_aether.ai.rag import RAGSystem
from rag_aether.core.health import SystemHealth
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Aether RAG API")

# Dependency for RAG system
async def get_rag_system():
    try:
        rag = RAGSystem()
        await rag.initialize_from_firebase()
        return rag
    except Exception as e:
        logger.error(f"Failed to initialize RAG system: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to initialize RAG system")

class QueryRequest(BaseModel):
    query: str
    max_results: Optional[int] = 3
    relevant_ids: Optional[List[str]] = None

class RetrievalMetricsResponse(BaseModel):
    mrr: float
    ndcg: float
    recall_at_k: Dict[int, float]
    latency_ms: float
    num_results: int

class QueryMetricsResponse(BaseModel):
    retrieval: RetrievalMetricsResponse
    generation_time_ms: float
    total_time_ms: float
    num_tokens: int

class QueryResponse(BaseModel):
    answer: str
    context: List[Dict[str, Any]]
    model: str
    metrics: Optional[QueryMetricsResponse] = None

@app.post("/query")
async def query(
    request: QueryRequest,
    rag: RAGSystem = Depends(get_rag_system)
) -> QueryResponse:
    try:
        result = await rag.query(
            request.query,
            max_results=request.max_results,
            relevant_ids=request.relevant_ids
        )
        return QueryResponse(**result)
    except Exception as e:
        logger.error(f"Query failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ingest")
async def ingest_text(
    text: str,
    metadata: Optional[Dict[str, Any]] = None,
    rag: RAGSystem = Depends(get_rag_system)
) -> Dict[str, str]:
    try:
        await rag.ingest_text(text, metadata)
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Ingestion failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check(
    rag: RAGSystem = Depends(get_rag_system)
) -> Dict[str, str]:
    try:
        health_status = await rag.health.full_check()
        if health_status["status"] == "healthy":
            return health_status
        raise HTTPException(status_code=503, detail=health_status)
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/metrics")
async def get_metrics(
    rag: RAGSystem = Depends(get_rag_system)
) -> Dict[str, Any]:
    try:
        if not hasattr(rag, "metrics_tracker"):
            raise HTTPException(status_code=404, detail="Metrics not available")
        return rag.metrics_tracker.get_average_metrics()
    except Exception as e:
        logger.error(f"Failed to get metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 