#!/usr/bin/env python3
import uvicorn
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment
env_path = Path(__file__).parents[1] / '.env'
load_dotenv(env_path)

def main():
    """Run the RAG API server."""
    uvicorn.run(
        "rag_aether.api.server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

if __name__ == "__main__":
    main() 