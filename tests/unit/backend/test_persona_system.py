"""Tests for the persona system."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
import pytest_asyncio
from rag_aether.ai.persona_system import PersonaSystem, PersonaProfile
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
async def persona_system(mock_ml_client, mock_supabase, mock_credentials):
    """Test persona system with mocked dependencies."""
    with patch('rag_aether.ai.ml_client.load_credentials', return_value=mock_credentials), \
         patch('rag_aether.ai.persona_system.load_credentials', return_value=mock_credentials), \
         patch('rag_aether.ai.persona_system.create_client', return_value=mock_supabase):
        system = PersonaSystem()
        system.ml_client = mock_ml_client
        return system

@pytest.mark.asyncio
async def test_analyze_user_style(persona_system, mock_ml_client):
    """Test analyzing user communication style."""
    # Mock ML client response
    mock_ml_client.get_completion.return_value = """{
        "formality_level": 0.8,
        "technical_level": 0.7,
        "tone_characteristics": {"friendly": 0.9, "professional": 0.8},
        "common_phrases": ["indeed", "essentially", "fundamentally"],
        "typical_length": 100
    }"""
    
    # Test messages
    messages = [
        {"content": "Indeed, the technical implementation looks solid."},
        {"content": "Essentially, we need to refactor this component."}
    ]
    
    # Analyze style
    profile = await persona_system.analyze_user_style("user123", messages)
    
    # Verify profile
    assert profile.user_id == "user123"
    assert profile.communication_style["formal"] == 0.8
    assert profile.communication_style["technical"] == 0.7
    assert profile.tone_preferences["friendly"] == 0.9
    assert "indeed" in profile.common_phrases
    assert profile.average_response_length == 100
    
    # Verify ML client call
    mock_ml_client.get_completion.assert_called_once()
    call_args = mock_ml_client.get_completion.call_args[1]
    assert call_args["temperature"] == 0.3
    assert len(call_args["messages"]) == 2

@pytest.mark.asyncio
async def test_generate_response_with_profile(persona_system, mock_ml_client):
    """Test generating response with existing profile."""
    # Setup test profile
    profile = PersonaProfile(
        user_id="user123",
        communication_style={"formal": 0.8, "technical": 0.7},
        tone_preferences={"friendly": 0.9, "professional": 0.8},
        common_phrases=["indeed", "essentially"],
        average_response_length=100
    )
    persona_system.profiles["user123"] = profile
    
    # Mock response
    mock_ml_client.get_completion.return_value = "Indeed, that's a valid approach."
    
    # Generate response
    response = await persona_system.generate_response(
        user_id="user123",
        context={"history": ["previous message"]},
        prompt="What do you think?"
    )
    
    # Verify response
    assert response == "Indeed, that's a valid approach."
    
    # Verify ML client call
    mock_ml_client.get_completion.assert_called_once()
    call_args = mock_ml_client.get_completion.call_args[1]
    assert call_args["temperature"] == 0.7
    assert len(call_args["messages"]) == 2
    assert "formal language" in call_args["messages"][0]["content"]

@pytest.mark.asyncio
async def test_generate_response_without_profile(persona_system, mock_ml_client):
    """Test generating response without existing profile."""
    # Mock response
    mock_ml_client.get_completion.return_value = "That seems reasonable."
    
    # Generate response
    response = await persona_system.generate_response(
        user_id="unknown_user",
        context={"history": ["previous message"]},
        prompt="What do you think?"
    )
    
    # Verify response
    assert response == "That seems reasonable."
    
    # Verify ML client call
    mock_ml_client.get_completion.assert_called_once()
    call_args = mock_ml_client.get_completion.call_args[1]
    assert call_args["temperature"] == 0.5
    assert "professional" in call_args["messages"][0]["content"]

@pytest.mark.asyncio
async def test_is_user_available_no_profile(persona_system):
    """Test availability check without profile."""
    # Check availability
    available = await persona_system.is_user_available("unknown_user")
    
    # Should default to available
    assert available == True

@pytest.mark.asyncio
async def test_is_user_available_with_profile(persona_system):
    """Test availability check with profile."""
    # Setup test profile
    profile = PersonaProfile(
        user_id="user123",
        communication_style={"formal": 0.8},
        tone_preferences={"friendly": 0.9},
        common_phrases=[],
        average_response_length=100,
        active_hours={"monday": [9, 17]}
    )
    persona_system.profiles["user123"] = profile
    
    # Check availability
    available = await persona_system.is_user_available("user123")
    
    # Should be available (current implementation always returns True)
    assert available == True

@pytest.mark.asyncio
async def test_analyze_user_style_error(persona_system, mock_ml_client):
    """Test error handling in style analysis."""
    # Mock ML client to raise exception
    mock_ml_client.get_completion.side_effect = Exception("API error")
    
    # Attempt to analyze style
    with pytest.raises(Exception) as exc_info:
        await persona_system.analyze_user_style("user123", [{"content": "test"}])
    
    assert str(exc_info.value) == "API error"

@pytest.mark.asyncio
async def test_generate_response_error(persona_system, mock_ml_client):
    """Test error handling in response generation."""
    # Setup test profile
    profile = PersonaProfile(
        user_id="user123",
        communication_style={"formal": 0.8},
        tone_preferences={"friendly": 0.9},
        common_phrases=[],
        average_response_length=100
    )
    persona_system.profiles["user123"] = profile
    
    # Mock ML client to raise exception
    mock_ml_client.get_completion.side_effect = Exception("API error")
    
    # Attempt to generate response
    with pytest.raises(Exception) as exc_info:
        await persona_system.generate_response(
            user_id="user123",
            context={},
            prompt="test"
        )
    
    assert str(exc_info.value) == "API error" 