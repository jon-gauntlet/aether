from typing import Optional, List
import logging
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from rag_aether.ai.rag import RAGSystem

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Aether RAG API",
    description="Professional-grade RAG system with Firebase integration",
    version="0.1.0"
)

# Initialize RAG system
rag: Optional[RAGSystem] = None

class QueryRequest(BaseModel):
    query: str
    k: int = 3

class QueryResponse(BaseModel):
    answer: str

@app.on_event("startup")
async def startup_event():
    """Initialize RAG system on startup."""
    global rag
    logger.info("Initializing RAG system...")
    rag = RAGSystem()
    await rag.initialize_from_firebase()
    logger.info("RAG system initialized successfully")

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown."""
    global rag
    if rag:
        await rag._cleanup()
    logger.info("Cleanup complete")

@app.post("/query", response_model=QueryResponse)
async def query(request: QueryRequest):
    """Query the RAG system."""
    if not rag:
        raise HTTPException(status_code=503, detail="RAG system not initialized")
    
    try:
        answer = await rag.query(request.query, k=request.k)
        return QueryResponse(answer=answer)
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Check system health."""
    if not rag:
        raise HTTPException(status_code=503, detail="RAG system not initialized")
    return {"status": "healthy"} 