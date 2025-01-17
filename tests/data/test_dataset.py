from pathlib import Path
import json
from typing import List, Dict

def generate_test_cases() -> List[Dict]:
    return [
        {
            "query": "How does the system handle concurrent requests?",
            "expected_contexts": ["scaling.md", "architecture.md"],
            "expected_response_elements": ["load balancing", "request queuing"]
        },
        {
            "query": "What security measures are in place?",
            "expected_contexts": ["security.md", "authentication.md"],
            "expected_response_elements": ["encryption", "authentication", "authorization"]
        },
        {
            "query": "How is data persistence handled?",
            "expected_contexts": ["storage.md", "backup.md"],
            "expected_response_elements": ["redis", "backup", "persistence"]
        },
        # Edge cases
        {
            "query": "",  # Empty query
            "expected_contexts": [],
            "expected_response_elements": ["error", "invalid query"]
        },
        {
            "query": "x" * 1000,  # Very long query
            "expected_contexts": [],
            "expected_response_elements": ["error", "query too long"]
        }
    ]

def generate_test_dataset():
    """
    Generate comprehensive test dataset for RAG verification
    """
    test_cases = generate_test_cases()
    
    data_path = Path("tests/data/rag_test_cases.json")
    data_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(data_path, "w") as f:
        json.dump({"version": "1.0", "cases": test_cases}, f, indent=2) 