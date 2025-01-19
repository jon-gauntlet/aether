"""Tests for the integration system."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
import pytest_asyncio
from rag_aether.ai.integration_system import IntegrationSystem
from rag_aether.ai.persona_system import PersonaProfile
from rag_aether.config import Credentials

@pytest.fixture
def mock_credentials():
    """Mock credentials for testing."""
    return Credentials(
        openai_api_key="test_openai_api_key",
        supabase_url="https://test.supabase.co",
        supabase_key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjE1MjAwMCwiZXhwIjoxOTMxNzI4MDAwfQ.T72RK_UcCqBZe9I_kxlAVyEPV-3sL6t7-VPGe5qHFHE"
    )

@pytest.fixture
def mock_vector_store():
    """Mock vector store for testing."""
    return AsyncMock()

@pytest.fixture
def mock_persona_system():
    """Mock persona system for testing."""
    return AsyncMock()

@pytest.fixture
def mock_ml_client():
    """Mock ML client for testing."""
    return AsyncMock()

@pytest.fixture
def mock_supabase():
    """Mock Supabase client for testing."""
    mock = MagicMock()
    # Mock table operations
    table_mock = MagicMock()
    table_mock.select.return_value.eq.return_value.execute.return_value.data = []
    table_mock.upsert.return_value.execute.return_value = None
    mock.table.return_value = table_mock
    return mock

@pytest_asyncio.fixture
async def integration_system(mock_vector_store, mock_persona_system, mock_ml_client, mock_supabase, mock_credentials):
    """Test integration system with mocked dependencies."""
    with patch('rag_aether.ai.ml_client.load_credentials', return_value=mock_credentials), \
         patch('rag_aether.ai.vector_store.load_credentials', return_value=mock_credentials), \
         patch('rag_aether.ai.persona_system.load_credentials', return_value=mock_credentials), \
         patch('rag_aether.ai.vector_store.create_client', return_value=mock_supabase), \
         patch('rag_aether.ai.persona_system.create_client', return_value=mock_supabase):
        system = IntegrationSystem()
        system.vector_store = mock_vector_store
        system.persona_system = mock_persona_system
        system.ml_client = mock_ml_client
        return system

@pytest.mark.asyncio
async def test_process_message_user_unavailable(integration_system, mock_vector_store, mock_persona_system):
    """Test processing message when user is unavailable."""
    # Mock RAG results
    mock_vector_store.similarity_search.return_value = [
        {"content": "relevant doc 1"},
        {"content": "relevant doc 2"}
    ]
    
    # Mock user unavailable
    mock_persona_system.is_user_available.return_value = False
    mock_persona_system.generate_response.return_value = "AI response"
    
    # Process message
    result = await integration_system.process_message(
        user_id="user123",
        message="test message",
        conversation_history=[{"role": "user", "content": "previous message"}]
    )
    
    # Verify response
    assert result["response"] == "AI response"
    assert result["is_user_available"] == False
    assert len(result["relevant_documents"]) == 2
    assert "conversation_history" in result["context_used"]
    
    # Verify calls
    mock_vector_store.similarity_search.assert_called_once()
    mock_persona_system.is_user_available.assert_called_once()
    mock_persona_system.generate_response.assert_called_once()

@pytest.mark.asyncio
async def test_process_message_user_available(integration_system, mock_vector_store, mock_persona_system):
    """Test processing message when user is available."""
    # Mock RAG results
    mock_vector_store.similarity_search.return_value = [
        {"content": "relevant doc 1"}
    ]
    
    # Mock user available
    mock_persona_system.is_user_available.return_value = True
    
    # Process message
    result = await integration_system.process_message(
        user_id="user123",
        message="test message",
        conversation_history=[]
    )
    
    # Verify response
    assert result["response"] is None
    assert result["is_user_available"] == True
    assert len(result["relevant_documents"]) == 1
    
    # Verify calls
    mock_vector_store.similarity_search.assert_called_once()
    mock_persona_system.is_user_available.assert_called_once()
    mock_persona_system.generate_response.assert_not_called()

@pytest.mark.asyncio
async def test_analyze_user_messages(integration_system, mock_vector_store, mock_persona_system):
    """Test analyzing user messages."""
    # Mock profile creation
    mock_profile = PersonaProfile(
        user_id="user123",
        communication_style={"formal": 0.8},
        tone_preferences={"friendly": 0.9},
        common_phrases=["indeed"],
        average_response_length=100
    )
    mock_persona_system.analyze_user_style.return_value = mock_profile
    
    # Mock vector store
    mock_vector_store.add_texts.return_value = ["1", "2"]
    
    # Analyze messages
    result = await integration_system.analyze_user_messages(
        user_id="user123",
        messages=[
            {"content": "message 1"},
            {"content": "message 2"}
        ]
    )
    
    # Verify result
    assert result["profile"] == mock_profile.to_dict()
    assert result["message_count"] == 2
    assert result["indexed_for_search"] == True
    
    # Verify calls
    mock_persona_system.analyze_user_style.assert_called_once()
    mock_vector_store.add_texts.assert_called_once()

@pytest.mark.asyncio
async def test_update_user_availability(integration_system, mock_persona_system):
    """Test updating user availability."""
    # Mock profile
    mock_profile = PersonaProfile(
        user_id="user123",
        communication_style={"formal": 0.8},
        tone_preferences={"friendly": 0.9},
        common_phrases=[],
        average_response_length=100
    )
    mock_persona_system._load_profile.return_value = mock_profile
    
    # Update availability
    active_hours = {"monday": [9, 17], "tuesday": [9, 17]}
    result = await integration_system.update_user_availability(
        user_id="user123",
        active_hours=active_hours
    )
    
    # Verify result
    assert result == True
    
    # Verify calls
    mock_persona_system._load_profile.assert_called_once()
    mock_persona_system._save_profile.assert_called_once()

@pytest.mark.asyncio
async def test_process_message_error(integration_system, mock_vector_store):
    """Test error handling in message processing."""
    # Mock vector store to raise exception
    mock_vector_store.similarity_search.side_effect = Exception("Search failed")
    
    # Attempt to process message
    with pytest.raises(Exception) as exc_info:
        await integration_system.process_message(
            user_id="user123",
            message="test",
            conversation_history=[]
        )
    
    assert str(exc_info.value) == "Search failed"

@pytest.mark.asyncio
async def test_analyze_messages_error(integration_system, mock_persona_system):
    """Test error handling in message analysis."""
    # Mock persona system to raise exception
    mock_persona_system.analyze_user_style.side_effect = Exception("Analysis failed")
    
    # Attempt to analyze messages
    with pytest.raises(Exception) as exc_info:
        await integration_system.analyze_user_messages(
            user_id="user123",
            messages=[{"content": "test"}]
        )
    
    assert str(exc_info.value) == "Analysis failed" 