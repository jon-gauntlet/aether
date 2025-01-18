"""FastAPI application for RAG system."""
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging
from typing import Optional, Dict, Any
from anthropic import Anthropic

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Aether RAG System",
    description="Professional-grade RAG system",
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

# Initialize Anthropic client
anthropic = Anthropic()

# Pydantic models for API
class QueryRequest(BaseModel):
    query: str
    conversation_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class QueryResponse(BaseModel):
    answer: str
    metadata: Dict[str, Any]

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Welcome to Aether RAG System"}

@app.post("/api/query", response_model=QueryResponse)
async def query(request: QueryRequest):
    """Process a query through Claude."""
    try:
        # Call Claude
        message = await anthropic.messages.create(
            model="claude-3-opus-20240229",
            max_tokens=1000,
            messages=[{
                "role": "user",
                "content": request.query
            }]
        )
        
        return QueryResponse(
            answer=message.content[0].text,
            metadata={
                "model": "claude-3-opus-20240229",
                "conversation_id": request.conversation_id
            }
        )
    except Exception as e:
        logger.error(f"Query processing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def main():
    """Run the FastAPI application."""
    uvicorn.run(
        "src.rag_aether.api.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )

if __name__ == "__main__":
    main() 