import pytest
from datetime import datetime, timedelta
from rag_aether.ai.rag_system import RAGSystem

@pytest.fixture
def rag_system(mock_embedding_model):
    """Fixture for RAG system with mock embedding model."""
    return RAGSystem(model_name="mock")

@pytest.fixture
def sample_messages():
    """Fixture for sample messages across channels and threads."""
    base_time = datetime.now()
    return [
        {
            "content": "How do I use the search feature?",
            "channel": "general",
            "user_id": "user1",
            "timestamp": (base_time - timedelta(hours=1)).isoformat(),
            "thread_id": None
        },
        {
            "content": "The search feature uses semantic matching",
            "channel": "general",
            "user_id": "user2",
            "timestamp": (base_time - timedelta(minutes=55)).isoformat(),
            "thread_id": "thread1"
        },
        {
            "content": "Can you give an example?",
            "channel": "general",
            "user_id": "user1",
            "timestamp": (base_time - timedelta(minutes=50)).isoformat(),
            "thread_id": "thread1"
        },
        {
            "content": "What's the latest deployment status?",
            "channel": "deployments",
            "user_id": "user3",
            "timestamp": (base_time - timedelta(minutes=30)).isoformat(),
            "thread_id": None
        }
    ]

def test_context_aware_search(rag_system, sample_messages):
    """Test context-aware search functionality."""
    # Ingest sample messages
    for msg in sample_messages:
        rag_system.ingest_message(msg)
    
    # Test channel-specific search
    results = rag_system.search_context(
        "search",
        k=2,
        channel="general"
    )
    assert len(results) > 0
    assert all(r["channel"] == "general" for r in results)
    
    # Test thread-specific search
    results = rag_system.search_context(
        "example",
        k=2,
        thread_id="thread1"
    )
    assert len(results) > 0
    assert all(r["thread_id"] == "thread1" for r in results)
    
    # Test time window
    results = rag_system.search_context(
        "status",
        k=2,
        time_window_hours=0.5
    )
    assert len(results) == 1
    assert "deployment" in results[0]["content"].lower()

def test_enhanced_context(rag_system, sample_messages):
    """Test enhanced context retrieval."""
    # Ingest sample messages
    for msg in sample_messages:
        rag_system.ingest_message(msg)
    
    # Get enhanced context
    context = rag_system.get_enhanced_context(
        "How does search work?",
        k=2
    )
    
    # Verify context structure
    assert "semantic_matches" in context
    assert len(context["semantic_matches"]) > 0
    
    # Verify channel context
    assert "channel_context" in context
    assert all(msg["channel"] == "general" for msg in context["channel_context"])
    
    # Verify thread context
    assert "thread_context" in context
    thread_msgs = context["thread_context"]
    assert len(thread_msgs) > 0
    assert all(msg["thread_id"] == "thread1" for msg in thread_msgs)
    
    # Verify chronological order in thread
    timestamps = [datetime.fromisoformat(msg["timestamp"]) for msg in thread_msgs]
    assert all(t1 <= t2 for t1, t2 in zip(timestamps, timestamps[1:]))

@pytest.mark.parametrize("include_params", [
    {"include_channels": False, "include_threads": True, "include_user_history": True},
    {"include_channels": True, "include_threads": False, "include_user_history": True},
    {"include_channels": True, "include_threads": True, "include_user_history": False},
])
def test_selective_context(rag_system, sample_messages, include_params):
    """Test selective context inclusion."""
    # Ingest sample messages
    for msg in sample_messages:
        rag_system.ingest_message(msg)
    
    # Get context with specific inclusions
    context = rag_system.get_enhanced_context(
        "search feature",
        k=2,
        **include_params
    )
    
    # Verify expected context parts
    assert "semantic_matches" in context
    assert ("channel_context" in context) == include_params["include_channels"]
    assert ("thread_context" in context) == include_params["include_threads"]
    assert ("user_history" in context) == include_params["include_user_history"] 

def test_response_generation_formats(rag_system, sample_messages):
    """Test response generation in different formats."""
    # Ingest sample messages
    for msg in sample_messages:
        rag_system.ingest_message(msg)
    
    query = "How does the search feature work?"
    
    # Test text format
    text_response = rag_system.generate_response(query, format="text")
    assert isinstance(text_response, str)
    assert len(text_response) > 0
    
    # Test markdown format
    md_response = rag_system.generate_response(query, format="markdown")
    assert isinstance(md_response, str)
    assert "# Response" in md_response
    assert "## Context" in md_response
    assert "*Generated at" in md_response
    
    # Test JSON format
    json_response = rag_system.generate_response(query, format="json")
    assert isinstance(json_response, dict)
    assert "answer" in json_response
    assert "context" in json_response
    assert "metadata" in json_response
    assert isinstance(json_response["metadata"]["timestamp"], str)

@pytest.mark.parametrize("style", ["concise", "detailed", "technical"])
def test_response_styles(rag_system, sample_messages, style):
    """Test response generation with different styles."""
    # Ingest sample messages
    for msg in sample_messages:
        rag_system.ingest_message(msg)
    
    response = rag_system.generate_response(
        "Tell me about search",
        style=style,
        format="json"
    )
    
    if style == "concise":
        # Should only include top match
        assert len(response["context"].split("\n")) <= 2
    elif style == "technical":
        # Should include scores
        assert "score:" in response["context"]
    else:
        # Should include full context
        assert len(response["context"].split("\n")) > 2

def test_response_metadata(rag_system, sample_messages):
    """Test response metadata accuracy."""
    # Ingest sample messages
    for msg in sample_messages:
        rag_system.ingest_message(msg)
    
    response = rag_system.generate_response(
        "How does search work?",
        format="json"
    )
    
    metadata = response["metadata"]
    assert metadata["num_context_messages"] > 0
    assert isinstance(metadata["has_thread_context"], bool)
    assert isinstance(metadata["has_channel_context"], bool)
    
    # Verify timestamp format
    timestamp = datetime.fromisoformat(metadata["timestamp"])
    assert isinstance(timestamp, datetime)

def test_invalid_format(rag_system):
    """Test handling of invalid response format."""
    with pytest.raises(ValueError, match="Unsupported format"):
        rag_system.generate_response("test", format="invalid") 

@pytest.fixture
def mock_openai(monkeypatch):
    """Mock OpenAI client for testing."""
    class MockCompletion:
        def __init__(self, content):
            self.choices = [
                type('Choice', (), {'message': type('Message', (), {'content': content})})()
            ]
    
    class MockOpenAI:
        def __init__(self):
            self.chat = type('Chat', (), {
                'completions': type('Completions', (), {
                    'create': self.create_completion
                })()
            })()
        
        def create_completion(self, model, messages, temperature, max_tokens):
            # Return different responses based on style
            system_msg = next(m for m in messages if m["role"] == "system")
            if "brief" in system_msg["content"]:
                return MockCompletion("Brief answer")
            elif "technical" in system_msg["content"]:
                return MockCompletion("Technical answer with score: 0.95")
            else:
                return MockCompletion("Detailed answer with context")
    
    monkeypatch.setattr("openai.OpenAI", MockOpenAI)
    return MockOpenAI()

def test_llm_response_generation(rag_system, sample_messages, mock_openai):
    """Test LLM response generation with different styles."""
    # Ingest sample messages
    for msg in sample_messages:
        rag_system.ingest_message(msg)
    
    # Test concise style
    response = rag_system.generate_response(
        "How does search work?",
        style="concise",
        format="json"
    )
    assert "Brief answer" in response["answer"]
    assert response["metadata"]["model"] == "gpt-3.5-turbo"
    
    # Test technical style
    response = rag_system.generate_response(
        "How does search work?",
        style="technical",
        format="json"
    )
    assert "Technical answer" in response["answer"]
    assert "score: 0.95" in response["answer"]
    
    # Test detailed style
    response = rag_system.generate_response(
        "How does search work?",
        style="detailed",
        format="json"
    )
    assert "Detailed answer" in response["answer"]
    assert "context" in response["answer"].lower()

def test_llm_temperature_control(rag_system, sample_messages, mock_openai):
    """Test temperature parameter effect on responses."""
    # Ingest sample messages
    for msg in sample_messages:
        rag_system.ingest_message(msg)
    
    # Test different temperatures
    temps = [0.0, 0.5, 1.0]
    responses = []
    
    for temp in temps:
        response = rag_system.generate_response(
            "How does search work?",
            temperature=temp,
            format="json"
        )
        responses.append(response)
        assert response["metadata"]["temperature"] == temp

def test_llm_context_integration(rag_system, sample_messages, mock_openai):
    """Test integration of context in LLM responses."""
    # Ingest sample messages
    for msg in sample_messages:
        rag_system.ingest_message(msg)
    
    # Get response with different context types
    response = rag_system.generate_response(
        "How does search work?",
        format="json",
        max_context_messages=3
    )
    
    # Verify context integration
    assert response["context"] is not None
    assert len(response["context"]) > 0
    assert response["metadata"]["num_context_messages"] <= 3 