"""FastAPI application for RAG API."""
import logging
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from ..ai.vector_store import VectorStore
from ..ai.ml_client import MLClient

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Aether RAG API",
    description="API for retrieval-augmented generation",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configured in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency injection
async def get_vector_store():
    """Get vector store client."""
    return VectorStore()

async def get_ml_client():
    """Get ML client."""
    return MLClient()

class Document(BaseModel):
    """Document for ingestion."""
    text: str
    metadata: Dict[str, Any] = Field(default_factory=dict)

class SearchQuery(BaseModel):
    """Search query with parameters."""
    query: str
    k: int = 4
    threshold: float = 0.8
    metadata_filter: Optional[Dict[str, Any]] = None

class ChatMessage(BaseModel):
    """Chat message."""
    role: str
    content: str

class ChatRequest(BaseModel):
    """Chat request with context."""
    messages: List[ChatMessage]
    max_tokens: Optional[int] = None
    temperature: float = 0.7

@app.post("/documents", response_model=List[str])
async def add_documents(
    documents: List[Document],
    vector_store: VectorStore = Depends(get_vector_store)
) -> List[str]:
    """Add documents to the vector store.
    
    Args:
        documents: List of documents to add
        vector_store: Vector store client
        
    Returns:
        List of document IDs
    """
    try:
        texts = [doc.text for doc in documents]
        metadata = [doc.metadata for doc in documents]
        return await vector_store.add_texts(texts, metadata)
    except Exception as e:
        logger.error(f"Failed to add documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search")
async def search(
    query: SearchQuery,
    vector_store: VectorStore = Depends(get_vector_store)
) -> List[Dict[str, Any]]:
    """Search for similar documents.
    
    Args:
        query: Search parameters
        vector_store: Vector store client
        
    Returns:
        List of matching documents with similarity scores
    """
    try:
        return await vector_store.similarity_search(
            query=query.query,
            k=query.k,
            threshold=query.threshold,
            metadata_filter=query.metadata_filter
        )
    except Exception as e:
        logger.error(f"Failed to search documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat(
    request: ChatRequest,
    ml_client: MLClient = Depends(get_ml_client)
) -> Dict[str, str]:
    """Get a chat completion.
    
    Args:
        request: Chat request parameters
        ml_client: ML client
        
    Returns:
        Generated response text
    """
    try:
        messages = [
            {"role": msg.role, "content": msg.content}
            for msg in request.messages
        ]
        response = await ml_client.get_completion(
            messages=messages,
            max_tokens=request.max_tokens,
            temperature=request.temperature
        )
        return {"response": response}
    except Exception as e:
        logger.error(f"Failed to get chat completion: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/documents/{doc_id}")
async def delete_document(
    doc_id: str,
    vector_store: VectorStore = Depends(get_vector_store)
) -> Dict[str, str]:
    """Delete a document from the vector store.
    
    Args:
        doc_id: Document ID to delete
        vector_store: Vector store client
        
    Returns:
        Success message
    """
    try:
        await vector_store.delete_texts([doc_id])
        return {"message": "Document deleted successfully"}
    except Exception as e:
        logger.error(f"Failed to delete document: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 