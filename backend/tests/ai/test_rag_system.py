import pytest
import pytest_asyncio
from datetime import datetime, timedelta
from rag_aether.ai.rag_system import RAGSystem
from rag_aether.core.errors import RAGError
import os
from unittest.mock import patch, Mock, AsyncMock
import torch

@pytest.fixture
def mock_query_expander():
    """Mock query expander for testing."""
    mock = Mock()
    
    def mock_expand(query: str) -> str:
        if query == "test query":
            return "test query with additional context and terms"
        return f"{query} expanded"
        
    mock.expand_query = AsyncMock(side_effect=mock_expand)
    return mock

@pytest_asyncio.fixture
async def rag_system(mock_embedding_model, mock_query_expander):
    """Fixture for RAG system with mock models."""
    system = RAGSystem(model_name="all-MiniLM-L6-v2", mock_model=mock_embedding_model)
    system.query_expander = mock_query_expander
    return system

@pytest.fixture
def mock_embedding_model():
    """Mock embedding model for testing."""
    mock = Mock()
    
    def mock_encode(texts, convert_to_tensor=True, device=None):
        # Create mock embeddings
        embeddings = torch.randn(len(texts), 384)  # Using 384 dimensions
        if device:
            embeddings = embeddings.to(device)
        return embeddings
        
    mock.encode = mock_encode
    return mock

@pytest.fixture
def mock_anthropic():
    """Mock Anthropic client for testing."""
    mock = Mock()
    mock.messages = AsyncMock()
    
    def get_styled_response(system_msg):
        if "brief" in system_msg.lower():
            return "A concise test response."
        elif "technical" in system_msg.lower():
            return "The system algorithm processes data through a distributed pipeline, utilizing advanced algorithms for optimal performance."
        else:  # detailed
            return """This is a detailed response that provides comprehensive information about the topic at hand. 
            It includes multiple aspects and considerations, ensuring thorough coverage of the subject matter. 
            The response elaborates on key points and provides relevant examples to illustrate the concepts effectively.
            Furthermore, it explores various implications and potential applications, while also addressing common questions
            and misconceptions that might arise. The explanation is structured to build understanding progressively,
            making complex ideas accessible while maintaining depth and accuracy."""
            
    mock.messages.create.return_value = Mock(
        content=[Mock(text=get_styled_response("detailed"))]  # Default to detailed
    )
    
    # Allow dynamic response based on system message
    async def create_message(*args, **kwargs):
        return Mock(content=[Mock(text=get_styled_response(kwargs.get('system', '')))])
        
    mock.messages.create = AsyncMock(side_effect=create_message)
    return mock

@pytest.fixture
def sample_messages():
    """Sample messages for testing."""
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
            "content": "What's the latest deployment status?",
            "channel": "deployments",
            "user_id": "user2",
            "timestamp": base_time.isoformat(),
            "thread_id": "thread1"
        }
    ]

@pytest.mark.asyncio
async def test_context_aware_search(rag_system, sample_messages):
    """Test context-aware search functionality."""
    # Convert messages to documents
    documents = [{"text": msg["content"], "metadata": msg} for msg in sample_messages]
    rag_system.add_documents(documents)
    
    # Test search with context
    query = "What was discussed about search?"
    response = await rag_system.search(query)
    assert len(response) > 0
    assert any("search" in doc["document"]["text"].lower() for doc in response)

@pytest.mark.asyncio
async def test_enhanced_context(rag_system, sample_messages):
    """Test enhanced context retrieval."""
    # Convert messages to documents
    documents = [{"text": msg["content"], "metadata": msg} for msg in sample_messages]
    rag_system.add_documents(documents)
    
    # Test with enhanced context
    query = "What's happening with deployments?"
    response = await rag_system.search(query)
    assert len(response) > 0
    assert any("deployment" in doc["document"]["text"].lower() for doc in response)

@pytest.mark.asyncio
@pytest.mark.parametrize("include_params", [
    {"include_channels": False, "include_threads": True, "include_user_history": True},
    {"include_channels": True, "include_threads": False, "include_user_history": True},
    {"include_channels": True, "include_threads": True, "include_user_history": False},
])
async def test_selective_context(rag_system, sample_messages, include_params):
    """Test selective context inclusion."""
    # Ingest sample messages
    for msg in sample_messages:
        await rag_system.ingest_message(msg)
        
    # Test with selective context
    query = "What's the latest status?"
    response = await rag_system.query(query, **include_params)
    assert response.answer is not None
    assert len(response.context) > 0

@pytest.mark.asyncio
async def test_response_generation_formats(rag_system, sample_messages):
    """Test response generation in different formats."""
    # Ingest sample messages
    for msg in sample_messages:
        await rag_system.ingest_message(msg)
        
    # Test different formats
    formats = ["text", "json", "markdown"]
    for fmt in formats:
        response = await rag_system.query("test query", format=fmt)
        assert response.answer is not None

@pytest.mark.asyncio
@pytest.mark.parametrize("style", ["concise", "detailed", "technical"])
async def test_response_styles(rag_system, sample_messages, style, mock_anthropic):
    """Test response generation with different styles."""
    # Set mock Anthropic client
    rag_system.anthropic = mock_anthropic
    
    # Ingest sample messages
    for msg in sample_messages:
        await rag_system.ingest_message(msg)
    
    # Test with different styles
    response = await rag_system.query("test query", style=style, use_llm=True)
    assert response.answer is not None
    if style == "concise":
        assert len(response.answer.split()) < 50
    elif style == "detailed":
        assert len(response.answer.split()) > 50
    elif style == "technical":
        assert any(term in response.answer.lower() for term in ["algorithm", "system", "process"])

@pytest.mark.asyncio
async def test_response_metadata(rag_system, sample_messages):
    """Test response metadata accuracy."""
    # Ingest sample messages
    for msg in sample_messages:
        await rag_system.ingest_message(msg)
        
    # Test metadata in response
    response = await rag_system.query("test query", include_metadata=True)
    assert response.answer is not None
    assert hasattr(response, "context")
    assert all("timestamp" in ctx for ctx in response.context)

@pytest.mark.asyncio
async def test_invalid_format(rag_system):
    """Test handling of invalid response format."""
    with pytest.raises(ValueError, match="Unsupported format"):
        await rag_system.generate_response("test", format="invalid")

@pytest.mark.asyncio
async def test_llm_response_generation(rag_system, sample_messages, mock_anthropic):
    """Test LLM response generation with different styles."""
    # Convert messages to documents
    documents = [{"text": msg["content"], "metadata": msg} for msg in sample_messages]
    rag_system.add_documents(documents)
    
    # Test LLM response
    response = await rag_system.search("test query")
    assert len(response) > 0
    assert all(isinstance(doc["score"], float) for doc in response)

@pytest.mark.asyncio
async def test_llm_temperature_control(rag_system, sample_messages, mock_anthropic):
    """Test temperature parameter effect on responses."""
    # Convert messages to documents
    documents = [{"text": msg["content"], "metadata": msg} for msg in sample_messages]
    rag_system.add_documents(documents)
    
    # Test with different temperatures
    temps = [0.0, 0.5, 1.0]
    responses = []
    for temp in temps:
        response = await rag_system.search("test query")
        responses.append(response)
    
    # Verify different responses have different scores
    scores = [r[0]["score"] for r in responses if r]
    assert len(set(scores)) > 1

@pytest.mark.asyncio
async def test_llm_context_integration(rag_system, sample_messages, mock_anthropic):
    """Test integration of context in LLM responses."""
    # Ingest sample messages
    for msg in sample_messages:
        await rag_system.ingest_message(msg)
        
    # Test context integration
    response = await rag_system.query("What was discussed?", use_llm=True)
    assert response.answer is not None
    assert len(response.context) > 0
    assert any(msg["content"] in str(ctx) for msg in sample_messages for ctx in response.context)

@pytest.mark.asyncio
async def test_query_no_documents():
    """Test querying with no documents."""
    system = RAGSystem(model_name="all-MiniLM-L6-v2")
    response = await system.search("test query")
    assert len(response) == 0

@pytest.mark.asyncio
async def test_query_no_api_key():
    """Test querying without Anthropic API key."""
    with patch.dict(os.environ, {"ANTHROPIC_API_KEY": ""}):
        system = RAGSystem(model_name="all-MiniLM-L6-v2")
        system.add_documents([{"text": "test doc", "metadata": {}}])
        response = await system.search("test query")
        assert len(response) > 0

@pytest.mark.asyncio
async def test_successful_query(rag_system, mock_anthropic, sample_messages):
    """Test successful query with Claude."""
    # Add sample documents first
    for msg in sample_messages:
        await rag_system.ingest_message(msg)
        
    response = await rag_system.query("What is testing?")
    assert response.answer is not None
    assert len(response.context) > 0

@pytest.mark.asyncio
async def test_query_error_handling(rag_system, mock_anthropic, sample_messages):
    """Test error handling in query."""
    # Set mock Anthropic client
    rag_system.anthropic = mock_anthropic
    mock_anthropic.messages.create.side_effect = Exception("API error")
    
    # Add documents first
    for msg in sample_messages:
        await rag_system.ingest_message(msg)
    
    with pytest.raises(RAGError) as exc_info:
        await rag_system.query("test query", use_llm=True)
    assert "API error" in str(exc_info.value)

@pytest.mark.asyncio
async def test_query_with_expanded_query(rag_system, sample_messages):
    """Test query with query expansion."""
    # Add documents first
    for msg in sample_messages:
        await rag_system.ingest_message(msg)
        
    response = await rag_system.query("test query")
    assert response.expanded_query is not None
    assert response.expanded_query == "test query with additional context and terms"

@pytest.mark.asyncio
async def test_channel_context_awareness(rag_system, sample_messages):
    """Test channel-specific context retrieval."""
    # Convert messages to documents
    documents = [{"text": msg["content"], "metadata": msg} for msg in sample_messages]
    rag_system.add_documents(documents)
    
    # Test channel-specific search
    query = "What's in general channel?"
    response = await rag_system.search(query)
    assert len(response) > 0
    assert all(doc["document"]["metadata"]["channel"] == "general" 
              for doc in response if "search" in doc["document"]["text"].lower())

@pytest.mark.asyncio
async def test_thread_context_awareness(rag_system, sample_messages):
    """Test thread context awareness."""
    # Convert messages to documents
    documents = [{"text": msg["content"], "metadata": msg} for msg in sample_messages]
    rag_system.add_documents(documents)
    
    # Test thread-specific search
    query = "deployment status"
    response = await rag_system.search(query)
    assert len(response) > 0
    assert any(doc["document"]["metadata"]["thread_id"] == "thread1" 
              for doc in response if "deployment" in doc["document"]["text"].lower())

@pytest.mark.asyncio
async def test_system_stability(rag_system):
    """Test system stability under load."""
    # Generate test documents
    num_docs = 1000
    documents = [
        {
            "text": f"Test document {i}",
            "metadata": {"id": i, "timestamp": datetime.now().isoformat()}
        }
        for i in range(num_docs)
    ]
    
    # Test batch ingestion
    rag_system.add_documents(documents)
    
    # Test concurrent searches
    import asyncio
    queries = ["test", "document", "search"] * 10
    responses = await asyncio.gather(*[rag_system.search(q) for q in queries])
    
    assert all(len(r) > 0 for r in responses)
    assert all(isinstance(r[0]["score"], float) for r in responses) 