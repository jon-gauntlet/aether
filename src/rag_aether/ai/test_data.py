from pathlib import Path
import json
from typing import List, Dict

def generate_test_cases() -> List[Dict]:
    """
    Generate comprehensive test cases for RAG system evaluation
    """
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

def save_test_dataset(output_dir: str = "tests/data"):
    """
    Generate and save test dataset
    """
    test_cases = generate_test_cases()
    
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    with open(output_path / "rag_test_cases.json", "w") as f:
        json.dump({
            "version": "1.0",
            "cases": test_cases
        }, f, indent=2)
        
def load_test_dataset(input_dir: str = "tests/data") -> List[Dict]:
    """
    Load test dataset from file
    """
    input_path = Path(input_dir) / "rag_test_cases.json"
    
    if not input_path.exists():
        save_test_dataset(input_dir)
        
    with open(input_path) as f:
        data = json.load(f)
        
    return data["cases"] 