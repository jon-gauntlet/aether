"""FastAPI routes for RAG system."""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
from rag_aether.ai.rag_system import RAGSystem
import logging

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="RAG API")

# Initialize RAG system
rag = RAGSystem(use_cache=True)

class Document(BaseModel):
    """Document for ingestion."""
    text: str
    metadata: Optional[Dict] = None

class Query(BaseModel):
    """Search query."""
    text: str
    top_k: Optional[int] = 3

class SearchResponse(BaseModel):
    """Search response."""
    results: List[Dict]
    query: str

@app.post("/documents")
async def add_documents(documents: List[Document]):
    """Add documents to the RAG system."""
    try:
        texts = [doc.text for doc in documents]
        metadata = [doc.metadata for doc in documents]
        rag.add_documents(texts, metadata)
        return {"status": "success", "count": len(documents)}
    except Exception as e:
        logger.error(f"Failed to add documents: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search")
async def search(query: Query) -> SearchResponse:
    """Search for relevant documents."""
    try:
        results = rag.search(query.text, k=query.top_k)
        return SearchResponse(
            results=[{
                "text": r.text,
                "score": r.score,
                "metadata": r.metadata
            } for r in results],
            query=query.text
        )
    except Exception as e:
        logger.error(f"Search failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Simple health check endpoint."""
    return {"status": "healthy"} 