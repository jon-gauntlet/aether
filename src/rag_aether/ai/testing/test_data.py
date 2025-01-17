"""Test data preparation for RAG system."""

from typing import List, Dict, Any, Optional
import json
from pathlib import Path
import numpy as np
from dataclasses import dataclass
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

@dataclass
class TestDocument:
    """Test document with metadata."""
    content: str
    metadata: Dict[str, Any]
    vector: Optional[np.ndarray] = None
    id: str = ""
    source: str = "test"
    timestamp: str = ""

@dataclass
class TestQuery:
    """Test query with expected results."""
    text: str
    expected_docs: List[str]
    expected_elements: List[str]
    category: str = "general"
    difficulty: str = "medium"

class TestDataManager:
    """Manages test data for RAG system."""
    
    def __init__(self, load_samples: bool = True, benchmark_path: Optional[str] = None):
        """Initialize test data manager.
        
        Args:
            load_samples: Whether to load benchmark samples
            benchmark_path: Optional path to benchmark samples file
        """
        self.documents: List[TestDocument] = []
        self.queries: List[TestQuery] = []
        self.categories = {
            "technical": ["system architecture", "performance", "security"],
            "business": ["project management", "requirements", "planning"],
            "domain": ["machine learning", "natural language processing", "vector search"]
        }
        self.benchmark_path = benchmark_path
        if load_samples:
            self.load_benchmark_samples()
        
    def load_benchmark_samples(self):
        """Load benchmark samples from JSON."""
        if self.benchmark_path:
            path = Path(self.benchmark_path)
        else:
            path = Path(__file__).parent.parent.parent.parent / "tests/data/benchmark_samples.json"
            
        if path.exists():
            try:
                with open(path) as f:
                    data = json.load(f)
                    
                # Load documents
                for text, meta in zip(data.get("texts", []), data.get("metadata", [])):
                    doc = TestDocument(
                        content=text,
                        metadata=meta,
                        id=meta.get("id", ""),
                        source=meta.get("source", "benchmark"),
                        timestamp=meta.get("timestamp", datetime.now().isoformat())
                    )
                    self.documents.append(doc)
                    
                # Load queries
                for query in data.get("queries", []):
                    if isinstance(query, dict):
                        self.queries.append(TestQuery(
                            text=query["text"],
                            expected_docs=query.get("expected_docs", []),
                            expected_elements=query.get("expected_elements", []),
                            category=query.get("category", "general"),
                            difficulty=query.get("difficulty", "medium")
                        ))
                    else:
                        logger.warning(f"Invalid query format: {query}")
                        
                logger.info(f"Loaded {len(self.documents)} documents and {len(self.queries)} queries from {path}")
                
            except Exception as e:
                logger.error(f"Failed to load benchmark samples from {path}: {str(e)}")
        else:
            logger.warning(f"Benchmark samples file not found at {path}")
            
    def generate_synthetic_data(self, num_docs: int = 100, category: str = "technical") -> List[TestDocument]:
        """Generate synthetic test documents.
        
        Args:
            num_docs: Number of documents to generate
            category: Category of documents to generate
            
        Returns:
            List of test documents
        """
        documents = []
        topics = self.categories.get(category, self.categories["technical"])
        
        for i in range(num_docs):
            topic = topics[i % len(topics)]
            timestamp = datetime.now().isoformat()
            
            # Generate more realistic content
            paragraphs = [
                f"This document discusses {topic} with a focus on system implementation.",
                f"Key considerations for {topic} include performance, reliability, and maintainability.",
                "The following sections detail the technical specifications and design decisions."
            ]
            
            doc = TestDocument(
                content="\n\n".join(paragraphs),
                metadata={
                    "id": f"doc_{category}_{i}",
                    "topic": topic,
                    "category": category,
                    "complexity": "high" if i % 3 == 0 else "medium",
                    "synthetic": True
                },
                id=f"doc_{category}_{i}",
                source="synthetic",
                timestamp=timestamp
            )
            documents.append(doc)
            
        return documents
        
    def get_test_conversations(self) -> List[Dict[str, Any]]:
        """Get test conversations with flow state context."""
        return [
            {
                "id": "conv_001",
                "title": "System Architecture Review",
                "participants": ["dev1", "architect1"],
                "created_at": "2024-01-15T10:00:00Z",
                "messages": [
                    {
                        "id": "msg_001",
                        "sender": "dev1",
                        "content": "The FlowStateManager implementation shows promising results. Key components include state tracking, memory optimization, and context preservation.",
                        "metadata": {
                            "flow_state": 0.8,
                            "energy_level": 0.9,
                            "technical_depth": 0.7
                        }
                    },
                    {
                        "id": "msg_002",
                        "sender": "architect1",
                        "content": "The memory system design looks solid. Have we considered the cognitive load implications during state transitions?",
                        "metadata": {
                            "flow_state": 0.85,
                            "energy_level": 0.8,
                            "technical_depth": 0.8
                        }
                    }
                ]
            }
        ]
        
    def get_test_queries(self, category: str = "all") -> List[TestQuery]:
        """Get test queries with expected results.
        
        Args:
            category: Category of queries to return
        """
        queries = [
            TestQuery(
                text="How does the system handle flow states?",
                expected_docs=["msg_001", "msg_002"],
                expected_elements=["FlowStateManager", "state tracking", "memory optimization"],
                category="technical",
                difficulty="medium"
            ),
            TestQuery(
                text="What are the performance implications?",
                expected_docs=["msg_001"],
                expected_elements=["memory optimization", "context preservation"],
                category="technical",
                difficulty="hard"
            ),
            TestQuery(
                text="Explain the cognitive load considerations",
                expected_docs=["msg_002"],
                expected_elements=["cognitive load", "state transitions"],
                category="domain",
                difficulty="medium"
            ),
            TestQuery(
                text="What is the project timeline?",
                expected_docs=[],
                expected_elements=["timeline", "milestones", "deadlines"],
                category="business",
                difficulty="easy"
            )
        ]
        
        if category != "all":
            queries = [q for q in queries if q.category == category]
            
        return queries
        
    def get_edge_cases(self) -> List[TestQuery]:
        """Get edge case queries for testing."""
        return [
            TestQuery(
                text="",  # Empty query
                expected_docs=[],
                expected_elements=["error", "invalid query"],
                category="edge",
                difficulty="easy"
            ),
            TestQuery(
                text="x" * 1000,  # Very long query
                expected_docs=[],
                expected_elements=["error", "query too long"],
                category="edge",
                difficulty="medium"
            ),
            TestQuery(
                text="unrelated topic about cooking",  # Out of domain
                expected_docs=[],
                expected_elements=["no relevant results"],
                category="edge",
                difficulty="hard"
            ),
            TestQuery(
                text="SELECT * FROM users;",  # SQL injection attempt
                expected_docs=[],
                expected_elements=["error", "invalid characters"],
                category="edge",
                difficulty="hard"
            )
        ]
        
    def get_performance_test_data(self, size: str = "small", category: str = "technical") -> List[TestDocument]:
        """Get performance test data.
        
        Args:
            size: Size of test data ("small", "medium", "large")
            category: Category of documents to generate
            
        Returns:
            List of test documents
        """
        sizes = {
            "small": 100,
            "medium": 1000,
            "large": 10000
        }
        
        num_docs = sizes.get(size, sizes["small"])
        return self.generate_synthetic_data(num_docs, category)
        
    def save_test_data(self, path: Optional[str] = None):
        """Save test data to JSON file.
        
        Args:
            path: Optional path to save file
        """
        if path is None:
            path = Path(__file__).parent.parent.parent.parent / "tests/data/test_data.json"
            
        data = {
            "version": "1.0",
            "timestamp": datetime.now().isoformat(),
            "documents": [
                {
                    "id": doc.id,
                    "content": doc.content,
                    "metadata": doc.metadata,
                    "source": doc.source,
                    "timestamp": doc.timestamp
                }
                for doc in self.documents
            ],
            "queries": [
                {
                    "text": query.text,
                    "expected_docs": query.expected_docs,
                    "expected_elements": query.expected_elements,
                    "category": query.category,
                    "difficulty": query.difficulty
                }
                for query in self.queries
            ]
        }
        
        try:
            path = Path(path)
            path.parent.mkdir(parents=True, exist_ok=True)
            with open(path, "w") as f:
                json.dump(data, f, indent=2)
            logger.info(f"Saved test data to {path}")
        except Exception as e:
            logger.error(f"Failed to save test data: {str(e)}")
            
    def load_test_data(self, path: str):
        """Load test data from JSON file.
        
        Args:
            path: Path to JSON file
        """
        try:
            with open(path) as f:
                data = json.load(f)
                
            self.documents = [
                TestDocument(
                    content=doc["content"],
                    metadata=doc["metadata"],
                    id=doc["id"],
                    source=doc["source"],
                    timestamp=doc["timestamp"]
                )
                for doc in data.get("documents", [])
            ]
            
            self.queries = [
                TestQuery(
                    text=query["text"],
                    expected_docs=query["expected_docs"],
                    expected_elements=query["expected_elements"],
                    category=query.get("category", "general"),
                    difficulty=query.get("difficulty", "medium")
                )
                for query in data.get("queries", [])
            ]
            
            logger.info(f"Loaded {len(self.documents)} documents and {len(self.queries)} queries from {path}")
            
        except Exception as e:
            logger.error(f"Failed to load test data: {str(e)}") 