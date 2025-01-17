from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
from .query import documents  # Import the shared document store

router = APIRouter()

class Document(BaseModel):
    content: str
    metadata: Optional[Dict[str, Any]] = None

@router.post("/documents/{doc_id}")
async def add_document(doc_id: str, document: Document):
    try:
        if not document.content:
            raise HTTPException(status_code=400, detail="Document content cannot be empty")
            
        # Store document in memory
        documents[doc_id] = {
            "content": document.content,
            "metadata": document.metadata or {}
        }
            
        return {
            "status": "success",
            "message": f"Document {doc_id} added successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 