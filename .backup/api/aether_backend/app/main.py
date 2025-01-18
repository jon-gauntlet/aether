from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from app.api.documents import router as documents_router
from app.api.rag import router as rag_router

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="RAG System API",
    description="A Retrieval Augmented Generation system using Claude",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Modify this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(documents_router, prefix="/api", tags=["documents"])
app.include_router(rag_router, prefix="/api/rag", tags=["rag"])

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "RAG system is running"} 