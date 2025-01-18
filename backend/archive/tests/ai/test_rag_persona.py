import pytest
from unittest.mock import Mock, patch
import json
from datetime import datetime
import numpy as np

from rag_aether.ai.rag_system import RAGSystem
from rag_aether.ai.persona_system import PersonaSystem, PersonaConfig

@pytest.fixture
def sample_messages():
    return [
        {
            "content": "Hello team, let's discuss the project timeline",
            "channel": "general",
            "user_id": "U123",
            "timestamp": datetime.now().timestamp(),
            "thread_id": None
        },
        {
            "content": "I think we should focus on the API first",
            "channel": "general",
            "user_id": "U124",
            "timestamp": datetime.now().timestamp(),
            "thread_id": "T1"
        },
        {
            "content": "Agreed, API is the priority",
            "channel": "general",
            "user_id": "U123",
            "timestamp": datetime.now().timestamp(),
            "thread_id": "T1"
        }
    ]

@pytest.fixture
def rag_system():
    with patch("sentence_transformers.SentenceTransformer") as mock_transformer:
        # Mock encode to return predictable embeddings
        mock_transformer.return_value.encode.return_value = np.random.rand(1, 384)
        system = RAGSystem()
        return system

@pytest.fixture
def persona_system(rag_system):
    return PersonaSystem(rag_system, "fake-api-key")

class TestRAGSystem:
    def test_message_ingestion(self, rag_system, sample_messages):
        """Test that messages can be ingested and stored"""
        for msg in sample_messages:
            rag_system.ingest_message(msg)
            
        assert len(rag_system.messages) == len(sample_messages)
        
    def test_channel_context(self, rag_system, sample_messages):
        """Test retrieving channel context"""
        for msg in sample_messages:
            rag_system.ingest_message(msg)
            
        context = rag_system.get_channel_context("general")
        assert len(context) == 3
        assert all(msg["channel"] == "general" for msg in context)
        
    def test_thread_context(self, rag_system, sample_messages):
        """Test retrieving thread context"""
        for msg in sample_messages:
            rag_system.ingest_message(msg)
            
        context = rag_system.get_thread_context("T1")
        assert len(context) == 2
        assert all(msg["thread_id"] == "T1" for msg in context)
        
    def test_user_context(self, rag_system, sample_messages):
        """Test retrieving user context"""
        for msg in sample_messages:
            rag_system.ingest_message(msg)
            
        context = rag_system.get_user_context("U123")
        assert len(context) == 2
        assert all(msg["user_id"] == "U123" for msg in context)

class TestPersonaSystem:
    def test_persona_creation(self, persona_system):
        """Test creating and retrieving personas"""
        config = PersonaConfig(
            user_id="U123",
            name="Test User",
            style_prompt="Be professional"
        )
        
        persona_system.create_persona(config)
        retrieved = persona_system.get_persona("U123")
        
        assert retrieved == config
        
    @pytest.mark.asyncio
    async def test_response_generation(self, persona_system, sample_messages):
        """Test generating responses with context"""
        # Setup persona
        config = PersonaConfig(
            user_id="U123",
            name="Test User",
            style_prompt="Be professional"
        )
        persona_system.create_persona(config)
        
        # Add messages to RAG
        for msg in sample_messages:
            persona_system.rag.ingest_message(msg)
            
        # Mock OpenAI response
        mock_response = {
            "choices": [{
                "message": {
                    "content": "I understand the API is our priority. Let's proceed with that."
                }
            }]
        }
        
        with patch("aiohttp.ClientSession.post") as mock_post:
            mock_post.return_value.__aenter__.return_value.json.return_value = mock_response
            
            response = await persona_system.generate_response(
                user_id="U123",
                query="What should we work on?",
                channel="general",
                thread_id="T1"
            )
            
            assert response == mock_response["choices"][0]["message"]["content"]
            
            # Verify context was included in prompt
            call_args = mock_post.call_args
            assert "API is the priority" in str(call_args)
            assert "project timeline" in str(call_args)
