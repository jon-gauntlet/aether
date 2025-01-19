"""Tests for vector store client."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from rag_aether.ai.vector_store import VectorStore

@pytest.fixture
def mock_supabase():
    """Mock Supabase client."""
    with patch('rag_aether.ai.vector_store.create_client') as mock:
        mock_client = MagicMock()
        mock.return_value = mock_client
        
        # Set up query chain mocks
        mock_execute = MagicMock()
        mock_eq = MagicMock()
        mock_rpc = MagicMock()
        
        mock_execute.execute = MagicMock()
        mock_eq.eq = MagicMock(return_value=mock_execute)
        mock_rpc.rpc = MagicMock(return_value=mock_eq)
        
        mock_client.configure_mock(**{
            'rpc': mock_rpc.rpc,
            'rpc.return_value': mock_eq,
            'rpc.return_value.eq': mock_eq.eq,
            'rpc.return_value.eq.return_value': mock_execute,
            'rpc.return_value.eq.return_value.execute': mock_execute.execute
        })
        
        yield mock_client

@pytest.fixture
def mock_ml_client():
    """Mock ML client."""
    with patch('rag_aether.ai.vector_store.MLClient') as mock:
        mock_client = MagicMock()
        mock.return_value = mock_client
        yield mock_client

@pytest.fixture
def mock_credentials():
    """Mock credentials loading."""
    with patch('rag_aether.ai.vector_store.load_credentials') as mock:
        mock.return_value = MagicMock(
            openai_api_key='test-key',
            supabase_url='test-url',
            supabase_key='test-key'
        )
        yield mock

@pytest.mark.asyncio
async def test_add_texts(mock_supabase, mock_ml_client, mock_credentials):
    """Test adding texts to vector store."""
    # Mock ML client response
    mock_ml_client.create_embeddings_batch = AsyncMock(
        return_value=[[0.1, 0.2], [0.3, 0.4]]
    )
    
    # Mock Supabase response
    mock_result = MagicMock()
    mock_result.data = [{'id': '1'}, {'id': '2'}]
    mock_supabase.table.return_value.insert.return_value.execute.return_value = mock_result
    
    store = VectorStore()
    doc_ids = await store.add_texts(
        texts=['text1', 'text2'],
        metadata=[{'source': 'test1'}, {'source': 'test2'}]
    )
    
    assert doc_ids == ['1', '2']
    mock_ml_client.create_embeddings_batch.assert_called_once_with(
        ['text1', 'text2'],
        batch_size=100
    )
    mock_supabase.table.assert_called_once_with('embeddings')
    mock_supabase.table.return_value.insert.assert_called_once_with([
        {
            'content': 'text1',
            'embedding': [0.1, 0.2],
            'metadata': {'source': 'test1'}
        },
        {
            'content': 'text2',
            'embedding': [0.3, 0.4],
            'metadata': {'source': 'test2'}
        }
    ])

@pytest.mark.asyncio
async def test_similarity_search(mock_supabase, mock_ml_client, mock_credentials):
    """Test similarity search."""
    # Mock ML client response
    mock_ml_client.create_embedding = AsyncMock(
        return_value=[0.1, 0.2]
    )
    
    # Mock Supabase response
    expected_results = [
        {
            'id': '1',
            'content': 'text1',
            'metadata': {'source': 'test1'},
            'similarity': 0.9
        }
    ]
    mock_supabase.rpc.return_value.eq.return_value.execute.return_value = MagicMock(
        data=expected_results
    )
    
    store = VectorStore()
    results = await store.similarity_search(
        query='test query',
        k=1,
        metadata_filter={'source': 'test1'}
    )
    
    assert results == expected_results
    mock_ml_client.create_embedding.assert_called_once_with('test query')
    mock_supabase.rpc.assert_called_once_with(
        'knn_match_embeddings',
        {
            'query_embedding': [0.1, 0.2],
            'k': 1
        }
    )
    mock_supabase.rpc.return_value.eq.assert_called_once_with(
        'metadata->source',
        'test1'
    )

@pytest.mark.asyncio
async def test_delete_texts(mock_supabase, mock_ml_client, mock_credentials):
    """Test deleting texts."""
    store = VectorStore()
    await store.delete_texts(['1', '2'])
    
    mock_supabase.table.assert_called_once_with('embeddings')
    mock_supabase.table.return_value.delete.return_value.in_.assert_called_once_with(
        'id',
        ['1', '2']
    ) 