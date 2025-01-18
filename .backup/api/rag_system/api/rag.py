from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.core.document_store import document_store
from app.core.claude_service import claude_service

router = APIRouter()

class RAGRequest(BaseModel):
    query: str
    top_k: Optional[int] = 3

class SourceDocument(BaseModel):
    id: str
    title: Optional[str]
    metadata: dict

class RAGResponse(BaseModel):
    response: str
    sources: List[SourceDocument]

@router.post("/query", response_model=RAGResponse)
async def query_documents(request: RAGRequest):
    try:
        # Get relevant documents
        context_docs = document_store.search_documents(request.query, request.top_k)
        
        if not context_docs:
            return RAGResponse(
                response="I don't have any relevant documents to answer your question.",
                sources=[]
            )
        
        # Generate response with sources
        result = await claude_service.generate_response_with_sources(
            request.query,
            context_docs
        )
        
        return RAGResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 