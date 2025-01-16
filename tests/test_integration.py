"""Integration tests for RAG system."""
import pytest
from fastapi.testclient import TestClient
from rag_aether.api.endpoints import app

client = TestClient(app)

def test_search_endpoint():
    """Test the search endpoint with flow state query."""
    response = client.post(
        "/api/search",
        params={"query": "What are the performance patterns during flow states?", "k": 3}
    )
    assert response.status_code == 200
    data = response.json()
    
    # Check response structure
    assert "results" in data
    assert "query" in data
    assert "expanded_query" in data
    assert "flow_context" in data
    assert len(data["results"]) > 0
    
    # Check result fields
    result = data["results"][0]
    assert "content" in result
    assert "search_score" in result
    assert "metadata" in result
    
    # Verify flow state content
    assert any("flow" in r["content"].lower() for r in data["results"])
    assert any("performance" in r["content"].lower() for r in data["results"])

def test_flow_state_queries():
    """Test different flow state related queries."""
    queries = [
        "How do developers behave in flow state?",
        "What metrics indicate optimal flow?",
        "Show me productivity patterns during peak flow"
    ]
    
    for query in queries:
        response = client.post("/api/search", params={"query": query, "k": 3})
        assert response.status_code == 200
        data = response.json()
        
        # Verify relevant results
        assert len(data["results"]) > 0
        texts = [r["content"].lower() for r in data["results"]]
        assert any("flow" in text for text in texts)
        
        # Check flow state metadata
        states = [r.get("flow_state") for r in data["results"]]
        assert any(state is not None for state in states)

def test_error_handling():
    """Test error handling with invalid request."""
    response = client.post("/api/search")  # Missing required query parameter
    assert response.status_code == 422  # Validation error

def test_metadata_presence():
    """Test that metadata is included in results."""
    response = client.post(
        "/api/search",
        params={"query": "Show me developer behavior", "k": 3}
    )
    assert response.status_code == 200
    data = response.json()
    
    # Check metadata fields
    result = data["results"][0]
    assert "title" in result
    assert "participants" in result
    assert "flow_state" in result
    assert "search_score" in result
    assert "semantic_score" in result
    assert "bm25_score" in result
    assert "context_boost" in result
    assert "query_expansion" in result

def test_search_ranking():
    """Test that search results are properly ranked."""
    response = client.post(
        "/api/search",
        params={"query": "performance patterns in flow state", "k": 3}
    )
    assert response.status_code == 200
    data = response.json()
    
    # Check score ordering
    scores = [r["search_score"] for r in data["results"]]
    assert all(scores[i] <= scores[i+1] for i in range(len(scores)-1))  # Lower scores are better
    
    # Verify most relevant result
    best_match = data["results"][0]
    assert any(term in best_match["content"].lower() for term in ["performance", "patterns", "flow"]) 