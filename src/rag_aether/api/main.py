"""FastAPI application for RAG system."""
import uvicorn
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging
import os
from typing import List, Optional, Dict, Any

from ..ai.rag import BaseRAG
from ..core.telemetry import track_operation
from ..data.document import Document

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Aether RAG System",
    description="Professional-grade RAG system with Supabase integration",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize RAG system on startup
rag: Optional[BaseRAG] = None

@app.on_event("startup")
async def startup_event():
    """Initialize RAG system on startup."""
    global rag
    try:
        rag = await BaseRAG.create(use_mock=False)
        logger.info("RAG system initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize RAG system: {str(e)}")
        raise

# Pydantic models for API
class QueryRequest(BaseModel):
    query: str
    conversation_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class QueryResponse(BaseModel):
    answer: str
    context: List[Dict[str, Any]]
    metadata: Dict[str, Any]

class DocumentRequest(BaseModel):
    content: str
    metadata: Optional[Dict[str, Any]] = None

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "rag_initialized": rag is not None
    }

@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Welcome to Aether RAG System"}

@app.post("/api/query", response_model=QueryResponse)
@track_operation("query_endpoint")
async def query(request: QueryRequest):
    """Process a query through the RAG system."""
    if not rag:
        raise HTTPException(status_code=503, detail="RAG system not initialized")
        
    try:
        response = await rag.process_query(
            query=request.query,
            conversation_id=request.conversation_id
        )
        return response
    except Exception as e:
        logger.error(f"Query processing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/documents")
@track_operation("document_ingestion")
async def add_document(document: DocumentRequest):
    """Add a document to the RAG system."""
    if not rag:
        raise HTTPException(status_code=503, detail="RAG system not initialized")
        
    try:
        doc = Document(
            content=document.content,
            metadata=document.metadata or {}
        )
        await rag.add_document(doc)
        return {"status": "success", "message": "Document added successfully"}
    except Exception as e:
        logger.error(f"Document ingestion failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/documents/upload")
@track_operation("file_upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload and process a file."""
    if not rag:
        raise HTTPException(status_code=503, detail="RAG system not initialized")
        
    try:
        content = await file.read()
        text_content = content.decode()
        doc = Document(
            content=text_content,
            metadata={"filename": file.filename}
        )
        await rag.add_document(doc)
        return {"status": "success", "message": "File processed successfully"}
    except Exception as e:
        logger.error(f"File upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/chat/{conversation_id}")
@track_operation("chat_history")
async def get_chat_history(conversation_id: str):
    """Get chat history for a conversation."""
    if not rag:
        raise HTTPException(status_code=503, detail="RAG system not initialized")
        
    try:
        history = await rag.get_chat_history(conversation_id)
        return {"history": history}
    except Exception as e:
        logger.error(f"Failed to get chat history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def main():
    """Run the FastAPI application."""
    port = int(os.getenv("PORT", "8000"))
    
    # Configure uvicorn logging
    log_config = uvicorn.config.LOGGING_CONFIG
    log_config["formatters"]["access"]["fmt"] = "%(asctime)s - %(levelname)s - %(message)s"
    
    # Run the server
    uvicorn.run(
        "src.rag_aether.api.main:app",
        host="127.0.0.1",
        port=port,
        reload=True,
        log_config=log_config
    )

if __name__ == "__main__":
    main() 