from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, List, Optional

from ..core.rag import rag_system, RAGResponse
from ..core.monitoring import monitor

router = APIRouter()

def get_rag_system():
    if rag_system is None:
        raise HTTPException(
            status_code=503,
            detail="RAG system is not initialized. Please check if ANTHROPIC_API_KEY is set."
        )
    return rag_system

class QueryRequest(BaseModel):
    question: str

class DocumentRequest(BaseModel):
    content: str
    metadata: Dict = {}

class SystemStatus(BaseModel):
    status: str
    rag_system_ready: bool
    message: Optional[str] = None
    metrics: Dict

@router.post("/query", response_model=RAGResponse)
async def query(request: QueryRequest, rag=Depends(get_rag_system)):
    try:
        return await rag.query(request.question)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/documents/{doc_id}")
async def add_document(doc_id: str, request: DocumentRequest, rag=Depends(get_rag_system)):
    try:
        await rag.add_document(doc_id, request.content, request.metadata)
        return {"status": "success", "message": f"Document {doc_id} added successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health", response_model=SystemStatus)
async def health_check():
    return SystemStatus(
        status="healthy",
        rag_system_ready=rag_system is not None,
        message=None if rag_system is not None else "RAG system not initialized",
        metrics=monitor.get_stats()
    ) 