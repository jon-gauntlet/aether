"""FastAPI application for RAG system."""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List
import os

from .data.supabase_adapter import SupabaseAdapter

app = FastAPI(title="Aether RAG API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase client
try:
    db = SupabaseAdapter()
except Exception as e:
    print(f"Error initializing Supabase: {e}")
    db = None

class Message(BaseModel):
    """Message model for chat."""
    content: str
    sender: str
    metadata: Dict[str, Any] = {}

@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "healthy", "service": "aether-rag"}

@app.post("/messages")
async def create_message(message: Message):
    """Create a new message."""
    if not db:
        raise HTTPException(status_code=503, detail="Database connection not available")
    
    try:
        result = await db.messages.create(message.dict())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/messages")
async def list_messages():
    """List all messages."""
    if not db:
        raise HTTPException(status_code=503, detail="Database connection not available")
    
    try:
        messages = await db.messages.list()
        return messages
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 