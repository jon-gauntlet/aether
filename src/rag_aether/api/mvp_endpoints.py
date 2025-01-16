"""FastAPI endpoints for MVP RAG system."""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from ..ai.mvp_rag import MVPRagSystem
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mvp_api")

# Initialize FastAPI app
app = FastAPI(title="RAG MVP API")

# Initialize RAG system
rag_system = MVPRagSystem()

class DocumentRequest(BaseModel):
    """Request model for adding documents."""
    text: str
    metadata: Optional[Dict[str, Any]] = None

class SearchRequest(BaseModel):
    """Request model for search queries."""
    query: str
    k: Optional[int] = 5
    threshold: Optional[float] = 0.5

class SearchResult(BaseModel):
    """Response model for search results."""
    text: str
    metadata: Optional[Dict[str, Any]] = None
    similarity: float

@app.post("/documents", status_code=201)
async def add_document(request: DocumentRequest):
    """Add a document to the RAG system."""
    try:
        rag_system.add_document(request.text, request.metadata)
        return {"message": "Document added successfully"}
    except Exception as e:
        logger.error(f"Failed to add document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search", response_model=List[SearchResult])
async def search(request: SearchRequest):
    """Search for relevant documents."""
    try:
        results = rag_system.search(
            query=request.query,
            k=request.k,
            threshold=request.threshold
        )
        
        # Convert to response model
        response = []
        for doc, similarity in results:
            response.append(SearchResult(
                text=doc.text,
                metadata=doc.metadata,
                similarity=similarity
            ))
        
        return response
    except Exception as e:
        logger.error(f"Search failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Simple health check endpoint."""
    return {"status": "healthy"} 