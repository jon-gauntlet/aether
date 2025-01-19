"""Tests for FastAPI application."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from rag_aether.api.app import app, Document, SearchQuery, ChatRequest, ChatMessage
from rag_aether.config import Credentials

@pytest.fixture
def mock_credentials():
    """Mock credentials for testing."""
    return Credentials(
        openai_api_key="test_openai_key",
        supabase_url="test_supabase_url",
        supabase_key="test_supabase_key"
    )

@pytest.fixture
def mock_vector_store():
    """Mock vector store for testing."""
    return AsyncMock()

@pytest.fixture
def mock_ml_client():
    """Mock ML client for testing."""
    return AsyncMock()

@pytest.fixture
def client(mock_vector_store, mock_ml_client, mock_credentials):
    """Test client with mocked dependencies."""
    with patch('rag_aether.ai.vector_store.load_credentials', return_value=mock_credentials), \
         patch('rag_aether.ai.ml_client.load_credentials', return_value=mock_credentials), \
         patch('rag_aether.api.app.VectorStore', return_value=mock_vector_store), \
         patch('rag_aether.api.app.MLClient', return_value=mock_ml_client):
        yield TestClient(app)

def test_add_documents(client, mock_vector_store):
    """Test adding documents."""
    mock_vector_store.add_texts.return_value = ['1', '2']
    
    response = client.post(
        "/documents",
        json=[
            {
                'text': 'test1',
                'metadata': {'source': 'test1'}
            },
            {
                'text': 'test2',
                'metadata': {'source': 'test2'}
            }
        ]
    )
    
    assert response.status_code == 200
    assert response.json() == ['1', '2']
    mock_vector_store.add_texts.assert_called_once()

def test_search(client, mock_vector_store):
    """Test similarity search."""
    mock_vector_store.similarity_search.return_value = [
        {
            'id': '1',
            'content': 'test content',
            'metadata': {'source': 'test'},
            'similarity': 0.9
        }
    ]
    
    response = client.post(
        "/search",
        json={
            'query': 'test query',
            'k': 1,
            'threshold': 0.8,
            'metadata_filter': {'source': 'test'}
        }
    )
    
    assert response.status_code == 200
    assert response.json() == [
        {
            'id': '1',
            'content': 'test content',
            'metadata': {'source': 'test'},
            'similarity': 0.9
        }
    ]
    mock_vector_store.similarity_search.assert_called_once()

def test_chat(client, mock_ml_client):
    """Test chat completion."""
    mock_ml_client.get_completion.return_value = 'test response'
    
    response = client.post(
        "/chat",
        json={
            'messages': [
                {
                    'role': 'user',
                    'content': 'test message'
                }
            ],
            'temperature': 0.7
        }
    )
    
    assert response.status_code == 200
    assert response.json() == {'response': 'test response'}
    mock_ml_client.get_completion.assert_called_once()

def test_delete_document(client, mock_vector_store):
    """Test deleting a document."""
    mock_vector_store.delete_texts.return_value = None
    
    response = client.delete("/documents/1")
    
    assert response.status_code == 200
    assert response.json() == {'message': 'Document deleted successfully'}
    mock_vector_store.delete_texts.assert_called_once_with(['1']) 