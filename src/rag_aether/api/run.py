"""Run the FastAPI server."""
import uvicorn
from .endpoints import app

if __name__ == "__main__":
    uvicorn.run(
        "rag_aether.api.endpoints:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    ) 