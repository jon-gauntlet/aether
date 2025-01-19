import os
import pytest
import redis
from openai import OpenAI
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def test_environment_variables():
    """Test that all required environment variables are set"""
    required_vars = [
        'OPENAI_API_KEY',
        'SUPABASE_URL',
        'SUPABASE_KEY'
    ]
    for var in required_vars:
        assert os.getenv(var) is not None, f"Missing environment variable: {var}"

@pytest.mark.asyncio
async def test_openai_connection():
    """Test OpenAI API connection"""
    client = OpenAI()
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": "test"}],
            max_tokens=5
        )
        assert response is not None
    except Exception as e:
        pytest.fail(f"OpenAI connection failed: {str(e)}")

def test_redis_connection():
    """Test Redis connection"""
    try:
        redis_client = redis.Redis(host='localhost', port=6379, db=0)
        assert redis_client.ping()
    except Exception as e:
        pytest.fail(f"Redis connection failed: {str(e)}")

@pytest.mark.asyncio
async def test_supabase_connection():
    """Test Supabase connection"""
    try:
        supabase: Client = create_client(
            os.getenv('SUPABASE_URL'),
            os.getenv('SUPABASE_KEY')
        )
        # Use a properly formatted but invalid JWT token
        dummy_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
        response = await supabase.auth.get_user(dummy_token)
        assert response is not None
    except Exception as e:
        if 'Invalid JWT' in str(e) or 'invalid JWT' in str(e):
            # This is expected as we used a dummy token
            pass
        else:
            pytest.fail(f"Supabase connection failed: {str(e)}") 