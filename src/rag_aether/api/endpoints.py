"""FastAPI endpoints for RAG system."""
from fastapi import FastAPI, HTTPException, Query
from typing import Optional
from ..ai.rag_system import RAGSystem
from ..core.errors import RAGError
import logging

logger = logging.getLogger(__name__)

app = FastAPI()
rag = RAGSystem(use_mock=True)  # Using mock data for MVP

@app.post("/api/search")
async def search_endpoint(
    query: str = Query(..., description="Search query text"),
    k: int = Query(3, description="Number of results to return")
):
    """API endpoint for search."""
    try:
        results = rag.query(query, k=k, include_metadata=True)
        return results
    except RAGError as e:
        logger.error(f"Search endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in search endpoint: {e}")
        raise HTTPException(status_code=500, detail="Internal server error") 