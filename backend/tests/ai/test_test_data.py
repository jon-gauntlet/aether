"""Tests for test data preparation module."""

import pytest
from pathlib import Path
import json
import tempfile
from rag_aether.ai.testing.test_data import TestDataManager, TestDocument, TestQuery

@pytest.fixture
def test_manager():
    """Create test data manager without loading samples."""
    return TestDataManager(load_samples=False)

@pytest.fixture
def temp_json_path():
    """Create temporary JSON file."""
    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
        json.dump({
            "texts": ["Test content 1", "Test content 2"],
            "metadata": [
                {"id": "1", "source": "test"},
                {"id": "2", "source": "test"}
            ],
            "queries": [
                {
                    "text": "Test query",
                    "expected_docs": ["1"],
                    "expected_elements": ["test"],
                    "category": "technical",
                    "difficulty": "easy"
                }
            ]
        }, f)
    yield Path(f.name)
    Path(f.name).unlink()

@pytest.mark.unit
def test_generate_synthetic_data(test_manager):
    """Test synthetic data generation."""
    docs = test_manager.generate_synthetic_data(num_docs=5, category="technical")
    assert len(docs) == 5
    assert all(isinstance(doc, TestDocument) for doc in docs)
    assert all(doc.source == "synthetic" for doc in docs)
    assert all(doc.metadata["category"] == "technical" for doc in docs)

@pytest.mark.unit
def test_get_test_queries_by_category(test_manager):
    """Test getting queries by category."""
    queries = test_manager.get_test_queries(category="technical")
    assert all(q.category == "technical" for q in queries)
    
    queries = test_manager.get_test_queries(category="all")
    assert len(queries) > 0
    assert any(q.category == "technical" for q in queries)
    assert any(q.category == "business" for q in queries)

@pytest.mark.unit
def test_edge_cases(test_manager):
    """Test edge case queries."""
    edge_cases = test_manager.get_edge_cases()
    assert len(edge_cases) > 0
    assert all(q.category == "edge" for q in edge_cases)
    
    # Check empty query
    empty_query = next(q for q in edge_cases if q.text == "")
    assert "invalid query" in empty_query.expected_elements
    
    # Check SQL injection
    sql_query = next(q for q in edge_cases if "SELECT" in q.text)
    assert "invalid characters" in sql_query.expected_elements

@pytest.mark.unit
def test_performance_test_data(test_manager):
    """Test performance test data generation."""
    small_data = test_manager.get_performance_test_data(size="small")
    assert len(small_data) == 100
    
    medium_data = test_manager.get_performance_test_data(size="medium")
    assert len(medium_data) == 1000
    
    # Test with custom category
    business_data = test_manager.get_performance_test_data(size="small", category="business")
    assert all(doc.metadata["category"] == "business" for doc in business_data)

@pytest.mark.unit
def test_save_and_load_test_data(test_manager, tmp_path):
    """Test saving and loading test data."""
    # Generate some test data
    docs = test_manager.generate_synthetic_data(num_docs=5)
    test_manager.documents = docs
    test_manager.queries = test_manager.get_test_queries()
    
    # Save data
    save_path = tmp_path / "test_data.json"
    test_manager.save_test_data(str(save_path))
    assert save_path.exists()
    
    # Load data in new manager
    new_manager = TestDataManager(load_samples=False)
    new_manager.load_test_data(str(save_path))
    
    # Verify data
    assert len(new_manager.documents) == len(docs)
    assert len(new_manager.queries) > 0
    assert all(isinstance(doc, TestDocument) for doc in new_manager.documents)
    assert all(isinstance(q, TestQuery) for q in new_manager.queries)

@pytest.mark.unit
def test_load_benchmark_samples(temp_json_path):
    """Test loading benchmark samples."""
    manager = TestDataManager(load_samples=False, benchmark_path=str(temp_json_path))
    manager.load_benchmark_samples()
    
    assert len(manager.documents) == 2
    assert len(manager.queries) == 1
    assert manager.documents[0].source == "test"
    assert manager.queries[0].category == "technical"

@pytest.mark.unit
def test_test_conversations(test_manager):
    """Test conversation data."""
    convs = test_manager.get_test_conversations()
    assert len(convs) > 0
    
    conv = convs[0]
    assert "id" in conv
    assert "messages" in conv
    assert len(conv["messages"]) > 0
    
    msg = conv["messages"][0]
    assert "metadata" in msg
    assert "flow_state" in msg["metadata"]
    assert 0 <= msg["metadata"]["flow_state"] <= 1 