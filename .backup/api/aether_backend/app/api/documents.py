from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import List, Optional
from pydantic import BaseModel
from app.core.document_store import document_store
from app.models.document import Document

router = APIRouter()

class DocumentResponse(BaseModel):
    id: str
    content: str
    title: Optional[str] = None
    metadata: dict

class QueryRequest(BaseModel):
    query: str
    top_k: Optional[int] = 5

@router.post("/documents/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    title: Optional[str] = None
):
    try:
        content = await file.read()
        content = content.decode("utf-8")
        
        document = document_store.add_document(
            content=content,
            title=title or file.filename,
            metadata={"filename": file.filename}
        )
        
        return DocumentResponse(
            id=document.id,
            content=document.content,
            title=document.title,
            metadata=document.metadata
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/documents", response_model=List[DocumentResponse])
async def list_documents():
    documents = document_store.get_all_documents()
    return [
        DocumentResponse(
            id=doc.id,
            content=doc.content,
            title=doc.title,
            metadata=doc.metadata
        )
        for doc in documents
    ]

@router.post("/documents/search", response_model=List[DocumentResponse])
async def search_documents(query: QueryRequest):
    documents = document_store.search_documents(query.query, query.top_k)
    return [
        DocumentResponse(
            id=doc.id,
            content=doc.content,
            title=doc.title,
            metadata=doc.metadata
        )
        for doc in documents
    ] 