"""Configuration management for RAG system."""
import os
import subprocess
from dataclasses import dataclass
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

@dataclass
class Credentials:
    """Credentials for external services."""
    openai_api_key: str
    supabase_url: str
    supabase_key: str
    redis_url: Optional[str] = None

def get_secret_from_pass(secret_name: str) -> str:
    """Get secret from password manager.
    
    Args:
        secret_name: Name of secret in password store
        
    Returns:
        Secret value
        
    Raises:
        RuntimeError: If secret retrieval fails
    """
    try:
        result = subprocess.run(
            ["pass", secret_name],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"Failed to get secret {secret_name}: {e}")

def load_credentials() -> Credentials:
    """Load credentials from environment variables.
    
    Returns:
        Credentials object
        
    Raises:
        ValueError: If required credentials are missing
    """
    # Try password manager first, fall back to env vars
    try:
        openai_api_key = get_secret_from_pass("aether/openai_key")
    except RuntimeError:
        openai_api_key = os.getenv("OPENAI_API_KEY")
        
    try:
        supabase_key = get_secret_from_pass("aether/supabase_key")
    except RuntimeError:
        supabase_key = os.getenv("SUPABASE_KEY")
    
    supabase_url = os.getenv("SUPABASE_URL")
    
    if not all([openai_api_key, supabase_url, supabase_key]):
        raise ValueError(
            "Missing required credentials. Please set OPENAI_API_KEY, "
            "SUPABASE_URL, and SUPABASE_KEY environment variables."
        )
    
    return Credentials(
        openai_api_key=openai_api_key,
        supabase_url=supabase_url,
        supabase_key=supabase_key,
        redis_url=os.getenv("REDIS_URL")
    )

# Constants
SIMILARITY_THRESHOLD = 0.7  # Minimum similarity score for relevant documents
EMBEDDING_DIMENSION = 1536  # OpenAI ada-002 embedding dimension
BATCH_SIZE = 100  # Default batch size for processing
CACHE_TTL = 3600  # Cache TTL in seconds (1 hour)

# Model configuration
MODEL_CONFIG = {
    "query_expansion": {
        "model": "t5-small",
        "max_length": 128,
        "num_return_sequences": 3,
        "temperature": 0.7
    },
    "embedding": {
        "model": "text-embedding-3-small",
        "batch_size": 100,
        "max_retries": 3
    }
}

# Vector store configuration
VECTOR_DIMENSIONS = 3072  # For text-embedding-3-large
MEMORY_THRESHOLD = 0.85  # 85% memory usage threshold 