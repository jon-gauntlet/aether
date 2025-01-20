"""Main FastAPI application."""
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from rag_aether.api.main import app as rag_app

app = FastAPI(
    title="Aether Backend",
    description="Backend service for Aether",
    version="0.1.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the RAG API
app.mount("/api/rag", rag_app)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 