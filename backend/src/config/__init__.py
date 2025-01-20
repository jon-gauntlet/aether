from pydantic import BaseModel
from functools import lru_cache

class Settings(BaseModel):
    jwt_secret: str = "test_secret"
    jwt_algorithm: str = "HS256"
    jwt_expires_s: int = 3600
    
    # Supabase settings
    supabase_url: str = "http://localhost:8000"
    supabase_key: str = "test_key"
    supabase_anon_key: str = "test_anon_key"
    supabase_jwt_secret: str = "test_jwt_secret"
    supabase_service_key: str = "test_service_key"

@lru_cache()
def get_settings() -> Settings:
    return Settings()
