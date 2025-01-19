#!/usr/bin/env python3
"""Initialize environment variables using Supabase CLI."""
import sys
import logging
from pathlib import Path

# Add src to Python path
src_path = str(Path(__file__).parent.parent / "src")
sys.path.insert(0, src_path)

from rag_aether.utils.env_utils import (
    load_env,
    get_supabase_config,
    update_env,
    validate_env
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    """Initialize environment variables."""
    try:
        # Load existing env
        load_env()
        logger.info("Loaded existing environment variables")
        
        # Get Supabase config
        logger.info("Getting Supabase configuration...")
        supabase_config = get_supabase_config()
        
        # Update .env file
        logger.info("Updating .env file with Supabase configuration...")
        update_env(supabase_config)
        
        # Reload and validate
        load_env()
        validate_env()
        
        logger.info("Environment initialization complete!")
        
    except Exception as e:
        logger.error(f"Failed to initialize environment: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 