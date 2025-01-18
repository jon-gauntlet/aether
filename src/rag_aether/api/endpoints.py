"""FastAPI endpoints for RAG system."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import router

app = FastAPI(title="RAG Aether API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Include router
app.include_router(router)

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "RAG API",
        "version": "1.0.0",
        "status": "running",
        "docs_url": "/docs"
    } 