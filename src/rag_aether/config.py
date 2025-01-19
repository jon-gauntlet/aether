"""Environment configuration with secure secret loading."""
import os
import subprocess
from typing import Optional
import logging
from dataclasses import dataclass

@dataclass
class Credentials:
    """Secure credential container."""
    openai_api_key: str
    supabase_url: str
    supabase_key: str

def get_secret_from_pass(path: str) -> Optional[str]:
    """Securely retrieve a secret from pass.
    
    Args:
        path: Path to the secret in pass store
        
    Returns:
        The secret value or None if not found
    """
    try:
        result = subprocess.run(
            ['pass', 'show', path],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        logging.error(f"Failed to get secret from pass: {path}")
        logging.debug(f"pass error: {e.stderr}")
        return None
    except Exception as e:
        logging.error(f"Unexpected error getting secret: {e}")
        return None

def load_credentials() -> Credentials:
    """Load credentials from pass or environment.
    
    Prioritizes pass storage, falls back to environment variables.
    Raises ValueError if required credentials are missing.
    """
    # Try pass first, then environment variables
    openai_key = (
        get_secret_from_pass('openai/api_key') or 
        os.getenv('OPENAI_API_KEY')
    )
    
    supabase_url = (
        get_secret_from_pass('supabase/url') or 
        os.getenv('SUPABASE_URL')
    )
    
    supabase_key = (
        get_secret_from_pass('supabase/key') or 
        os.getenv('SUPABASE_KEY')
    )
    
    # Validate all required credentials are present
    missing = []
    if not openai_key:
        missing.append('OpenAI API key')
    if not supabase_url:
        missing.append('Supabase URL')
    if not supabase_key:
        missing.append('Supabase key')
        
    if missing:
        raise ValueError(
            f"Missing required credentials: {', '.join(missing)}. "
            "Please set them in pass or environment variables."
        )
    
    return Credentials(
        openai_api_key=openai_key,
        supabase_url=supabase_url,
        supabase_key=supabase_key
    )

# Model configuration
EMBEDDING_MODEL = "text-embedding-3-large"
COMPLETION_MODEL = "gpt-4-turbo-preview"

# Vector store configuration
VECTOR_DIMENSIONS = 3072  # For text-embedding-3-large
SIMILARITY_THRESHOLD = 0.8

# Performance tuning
BATCH_SIZE = 100
MAX_WORKERS = 4
MEMORY_THRESHOLD = 0.85  # 85% memory usage threshold 