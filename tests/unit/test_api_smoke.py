import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.parent))

from fastapi.testclient import TestClient
from backend.src.main import app

client = TestClient(app)

def test_health_check():
    """Basic health check endpoint test"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_api_availability():
    """Test that the API is responding"""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to Aether API"} 