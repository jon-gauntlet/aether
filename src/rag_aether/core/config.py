"""Configuration settings for the RAG system."""
import os
from typing import Dict, Any
from dataclasses import dataclass
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

@dataclass
class Credentials:
    """API credentials."""
    openai_api_key: str
    supabase_url: str
    supabase_key: str

def load_credentials() -> Credentials:
    """Load API credentials from environment."""
    return Credentials(
        openai_api_key=os.getenv("OPENAI_API_KEY", ""),
        supabase_url=os.getenv("SUPABASE_URL", ""),
        supabase_key=os.getenv("SUPABASE_KEY", "")
    )

# Constants
SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "0.7"))
CACHE_TTL = int(os.getenv("CACHE_TTL", "3600"))  # 1 hour
MAX_CACHE_SIZE = int(os.getenv("MAX_CACHE_SIZE", "1000"))

# Model settings
MODEL_CONFIG: Dict[str, Any] = {
    "completion": {
        "model": os.getenv("COMPLETION_MODEL", "gpt-4-turbo-preview"),
        "max_tokens": int(os.getenv("MAX_TOKENS", "4096")),
        "temperature": float(os.getenv("TEMPERATURE", "0.7")),
    },
    "embedding": {
        "model": os.getenv("EMBEDDING_MODEL", "text-embedding-3-small"),
        "batch_size": int(os.getenv("BATCH_SIZE", "32")),
    }
} 