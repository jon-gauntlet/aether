"""Environment configuration utilities."""
import os
import json
import subprocess
from typing import Optional, Dict, Any
from pathlib import Path
from dotenv import load_dotenv

def load_env(env_path: Optional[str] = None) -> None:
    """Load environment variables from .env file.
    
    Args:
        env_path: Optional path to .env file. If None, searches in default locations.
    """
    if env_path:
        load_dotenv(env_path)
    else:
        # Search in common locations
        paths = [
            ".env",
            "../.env",
            "../../.env",
            str(Path.home() / ".env")
        ]
        for path in paths:
            if os.path.exists(path):
                load_dotenv(path)
                break

def get_supabase_config() -> Dict[str, str]:
    """Get Supabase configuration using Supabase CLI.
    
    Returns:
        Dict containing Supabase URL and key
    
    Raises:
        RuntimeError: If Supabase CLI is not installed or command fails
    """
    try:
        # Check if Supabase CLI is installed
        subprocess.run(["supabase", "--version"], check=True, capture_output=True)
        
        # Get project settings
        result = subprocess.run(
            ["supabase", "status", "--output", "json"],
            check=True,
            capture_output=True,
            text=True
        )
        
        config = json.loads(result.stdout)
        return {
            "SUPABASE_URL": config.get("api", {}).get("url", ""),
            "SUPABASE_KEY": config.get("api", {}).get("service_role_key", "")
        }
        
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"Failed to get Supabase config: {e}")
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Failed to parse Supabase config: {e}")
    except FileNotFoundError:
        raise RuntimeError("Supabase CLI not found. Install with: npm install -g supabase-cli")

def get_env(key: str, default: Any = None) -> Any:
    """Get environment variable with fallback to default.
    
    Args:
        key: Environment variable key
        default: Default value if key not found
        
    Returns:
        Environment variable value or default
    """
    return os.environ.get(key, default)

def validate_env() -> None:
    """Validate required environment variables are set.
    
    Raises:
        RuntimeError: If required variables are missing
    """
    required = [
        "OPENAI_API_KEY",
        "SUPABASE_URL", 
        "SUPABASE_KEY",
        "REDIS_HOST",
        "REDIS_PORT"
    ]
    
    missing = [key for key in required if not get_env(key)]
    if missing:
        raise RuntimeError(f"Missing required environment variables: {', '.join(missing)}")

def update_env(updates: Dict[str, str], env_path: str = ".env") -> None:
    """Update environment variables in .env file.
    
    Args:
        updates: Dict of environment variables to update
        env_path: Path to .env file
    """
    # Read existing content
    content = {}
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    key, value = line.split('=', 1)
                    content[key.strip()] = value.strip()
    
    # Update with new values
    content.update(updates)
    
    # Write back to file
    with open(env_path, 'w') as f:
        for key, value in content.items():
            f.write(f"{key}={value}\n") 