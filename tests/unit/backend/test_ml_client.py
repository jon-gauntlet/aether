"""Tests for ML API client."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from rag_aether.ai.ml_client import MLClient

@pytest.fixture
def mock_openai():
    """Mock OpenAI client."""
    with patch('rag_aether.ai.ml_client.AsyncOpenAI') as mock:
        mock_client = AsyncMock()
        mock.return_value = mock_client
        yield mock_client

@pytest.fixture
def mock_credentials():
    """Mock credentials loading."""
    with patch('rag_aether.ai.ml_client.load_credentials') as mock:
        mock.return_value = MagicMock(
            openai_api_key='test-key',
            supabase_url='test-url',
            supabase_key='test-key'
        )
        yield mock

@pytest.mark.asyncio
async def test_create_embedding(mock_openai, mock_credentials):
    """Test creating a single embedding."""
    mock_response = MagicMock()
    mock_response.data = [MagicMock(embedding=[0.1, 0.2, 0.3])]
    mock_openai.embeddings.create = AsyncMock(return_value=mock_response)
    
    client = MLClient()
    embedding = await client.create_embedding("test text")
    
    assert embedding == [0.1, 0.2, 0.3]
    mock_openai.embeddings.create.assert_called_once_with(
        model="text-embedding-3-large",
        input="test text"
    )

@pytest.mark.asyncio
async def test_create_embeddings_batch(mock_openai, mock_credentials):
    """Test creating embeddings in batch."""
    mock_response = MagicMock()
    mock_response.data = [
        MagicMock(embedding=[0.1, 0.2, 0.3]),
        MagicMock(embedding=[0.4, 0.5, 0.6])
    ]
    mock_openai.embeddings.create = AsyncMock(return_value=mock_response)
    
    client = MLClient()
    embeddings = await client.create_embeddings_batch(
        ["text 1", "text 2"],
        batch_size=2
    )
    
    assert embeddings == [[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]]
    mock_openai.embeddings.create.assert_called_once_with(
        model="text-embedding-3-large",
        input=["text 1", "text 2"]
    )

@pytest.mark.asyncio
async def test_get_completion(mock_openai, mock_credentials):
    """Test getting a completion."""
    mock_response = MagicMock()
    mock_response.choices = [
        MagicMock(message=MagicMock(content="test completion"))
    ]
    mock_openai.chat.completions.create = AsyncMock(return_value=mock_response)
    
    client = MLClient()
    completion = await client.get_completion([
        {"role": "user", "content": "test prompt"}
    ])
    
    assert completion == "test completion"
    mock_openai.chat.completions.create.assert_called_once_with(
        model="gpt-4-turbo-preview",
        messages=[{"role": "user", "content": "test prompt"}],
        temperature=0.7,
        max_tokens=None,
        top_p=1.0,
        frequency_penalty=0.0,
        presence_penalty=0.0,
        stop=None
    )

@pytest.mark.asyncio
async def test_get_completions_batch(mock_openai, mock_credentials):
    """Test getting completions in batch."""
    mock_response1 = MagicMock()
    mock_response1.choices = [
        MagicMock(message=MagicMock(content="completion 1"))
    ]
    mock_response2 = MagicMock()
    mock_response2.choices = [
        MagicMock(message=MagicMock(content="completion 2"))
    ]
    
    mock_openai.chat.completions.create = AsyncMock()
    mock_openai.chat.completions.create.side_effect = [
        mock_response1,
        mock_response2
    ]
    
    client = MLClient()
    completions = await client.get_completions_batch([
        [{"role": "user", "content": "prompt 1"}],
        [{"role": "user", "content": "prompt 2"}]
    ])
    
    assert completions == ["completion 1", "completion 2"]
    assert mock_openai.chat.completions.create.call_count == 2 