import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get configuration
port = int(os.getenv("PORT", 8200))
host = os.getenv("HOST", "0.0.0.0")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "rag_aether.main:app",
        host=host,
        port=port,
        reload=True
    ) 