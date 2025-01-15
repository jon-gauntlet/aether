from fastapi import FastAPI, HTTPException, Depends
from typing import Dict, Any, Optional
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
    question: str
    context: Optional[Dict[str, Any]] = None

@app.post("/query")
async def query(
    request: QueryRequest,
    rag: RAGSystem = Depends(get_rag_system)
) -> Dict[str, Any]:
    try:
        result = await rag.query(request.question)
        return result
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