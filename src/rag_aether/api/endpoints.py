"""FastAPI endpoints for RAG system."""

from typing import Dict, Any, List
from fastapi import FastAPI
from pydantic import BaseModel

from .routes import router
from ..ai.rag_system import RAGSystem
from ..core.monitor import SystemMonitor

app = FastAPI(title="RAG API", version="1.0.0")
app.include_router(router)

# Initialize monitoring
monitor = SystemMonitor()

@app.get("/")
async def root() -> Dict[str, str]:
    """Root endpoint."""
    return {
        "name": "RAG API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/system/health")
async def system_health() -> Dict[str, Any]:
    """System-wide health check endpoint."""
    try:
        metrics = monitor.get_metrics()
        return {
            "status": "healthy",
            "system_metrics": metrics,
            "version": "1.0.0"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "version": "1.0.0"
        } 