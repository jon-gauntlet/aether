"""
RAG Aether package initialization.
"""

__version__ = "0.1.0" 

import os
from pathlib import Path
from functools import lru_cache
from dotenv import load_dotenv

@lru_cache()
def load_env_fast():
    """Fast, cached environment loading with security checks."""
    env_path = Path(__file__).parents[2] / '.env'
    
    # Security check
    if not env_path.exists():
        raise EnvironmentError(".env file not found")
    
    # Check permissions
    stat = env_path.stat()
    if stat.st_mode & 0o077:  # Check if group/others have any permissions
        raise EnvironmentError("Insecure .env permissions detected")
        
    # Fast load with caching
    load_dotenv(env_path)
    
    # Validate critical secrets
    required_secrets = [
        'ANTHROPIC_API_KEY',
        'OPENAI_API_KEY',
        'FIREBASE_SERVICE_ACCOUNT_PATH'
    ]
    
    missing = [key for key in required_secrets if not os.getenv(key)]
    if missing:
        raise EnvironmentError(f"Missing required secrets: {', '.join(missing)}")
    
    return True

# Initialize on import for fastest access
load_env_fast() 