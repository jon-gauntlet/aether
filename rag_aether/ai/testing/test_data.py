"""Test data management system."""

from typing import Any, Dict, List, Optional, Union
from dataclasses import dataclass, field
import json
import logging
from pathlib import Path
import random
import time

from ...errors import TestDataError

logger = logging.getLogger(__name__)

@dataclass
class TestDocument:
    """Test document with metadata."""
    
    id: str
    text: str
    metadata: Dict[str, Any]
    tags: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'id': self.id,
            'text': self.text,
            'metadata': self.metadata,
            'tags': self.tags
        }
        
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'TestDocument':
        """Create from dictionary."""
        return cls(**data)

@dataclass
class TestQuery:
    """Test query with expected results."""
    
    query: str
    expected_doc_ids: List[str]
    metadata: Dict[str, Any]
    tags: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'query': self.query,
            'expected_doc_ids': self.expected_doc_ids,
            'metadata': self.metadata,
            'tags': self.tags
        }
        
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'TestQuery':
        """Create from dictionary."""
        return cls(**data)

class TestDataManager:
    """Manages test data for RAG system."""
    
    def __init__(self, data_dir: Optional[str] = None):
        self.data_dir = Path(data_dir or '.test_data')
        self.data_dir.mkdir(exist_ok=True)
        self.documents: Dict[str, TestDocument] = {}
        self.queries: Dict[str, TestQuery] = {}
        self._load_data()
        
    def _get_docs_path(self) -> Path:
        """Get path for documents file."""
        return self.data_dir / "test_documents.json"
        
    def _get_queries_path(self) -> Path:
        """Get path for queries file."""
        return self.data_dir / "test_queries.json"
        
    def _load_data(self) -> None:
        """Load test data from disk."""
        try:
            # Load documents
            docs_path = self._get_docs_path()
            if docs_path.exists():
                with open(docs_path) as f:
                    data = json.load(f)
                    for doc_data in data:
                        doc = TestDocument.from_dict(doc_data)
                        self.documents[doc.id] = doc
                        
            # Load queries
            queries_path = self._get_queries_path()
            if queries_path.exists():
                with open(queries_path) as f:
                    data = json.load(f)
                    for query_data in data:
                        query = TestQuery.from_dict(query_data)
                        self.queries[query.query] = query
                        
        except Exception as e:
            raise TestDataError(f"Failed to load test data: {e}")
            
    def _save_data(self) -> None:
        """Save test data to disk."""
        try:
            # Save documents
            docs_path = self._get_docs_path()
            with open(docs_path, 'w') as f:
                json.dump(
                    [doc.to_dict() for doc in self.documents.values()],
                    f
                )
                
            # Save queries
            queries_path = self._get_queries_path()
            with open(queries_path, 'w') as f:
                json.dump(
                    [query.to_dict() for query in self.queries.values()],
                    f
                )
                
        except Exception as e:
            raise TestDataError(f"Failed to save test data: {e}")
            
    def add_document(self, document: TestDocument) -> None:
        """Add a test document."""
        self.documents[document.id] = document
        self._save_data()
        
    def add_documents(self, documents: List[TestDocument]) -> None:
        """Add multiple test documents."""
        for doc in documents:
            self.documents[doc.id] = doc
        self._save_data()
        
    def get_document(self, doc_id: str) -> Optional[TestDocument]:
        """Get a test document by ID."""
        return self.documents.get(doc_id)
        
    def get_documents(self, 
                     tags: Optional[List[str]] = None) -> List[TestDocument]:
        """Get test documents, optionally filtered by tags."""
        if not tags:
            return list(self.documents.values())
            
        return [
            doc for doc in self.documents.values()
            if any(tag in doc.tags for tag in tags)
        ]
        
    def remove_document(self, doc_id: str) -> None:
        """Remove a test document."""
        if doc_id in self.documents:
            del self.documents[doc_id]
            self._save_data()
            
    def add_query(self, query: TestQuery) -> None:
        """Add a test query."""
        self.queries[query.query] = query
        self._save_data()
        
    def add_queries(self, queries: List[TestQuery]) -> None:
        """Add multiple test queries."""
        for query in queries:
            self.queries[query.query] = query
        self._save_data()
        
    def get_query(self, query_text: str) -> Optional[TestQuery]:
        """Get a test query by text."""
        return self.queries.get(query_text)
        
    def get_queries(self, 
                   tags: Optional[List[str]] = None) -> List[TestQuery]:
        """Get test queries, optionally filtered by tags."""
        if not tags:
            return list(self.queries.values())
            
        return [
            query for query in self.queries.values()
            if any(tag in query.tags for tag in tags)
        ]
        
    def remove_query(self, query_text: str) -> None:
        """Remove a test query."""
        if query_text in self.queries:
            del self.queries[query_text]
            self._save_data()
            
    def generate_test_suite(self,
                          num_docs: int = 10,
                          num_queries: int = 5) -> None:
        """Generate a basic test suite."""
        try:
            # Generate test documents
            for i in range(num_docs):
                doc = TestDocument(
                    id=f"test_doc_{i}",
                    text=f"This is test document {i} with some content.",
                    metadata={
                        'created_at': time.time(),
                        'author': f"test_author_{i % 3}"
                    },
                    tags=['generated', f'group_{i % 3}']
                )
                self.add_document(doc)
                
            # Generate test queries
            for i in range(num_queries):
                # Randomly select expected documents
                expected_docs = random.sample(
                    list(self.documents.keys()),
                    k=random.randint(1, 3)
                )
                
                query = TestQuery(
                    query=f"Find documents about test content {i}",
                    expected_doc_ids=expected_docs,
                    metadata={
                        'created_at': time.time(),
                        'difficulty': random.choice(['easy', 'medium', 'hard'])
                    },
                    tags=['generated', f'group_{i % 3}']
                )
                self.add_query(query)
                
        except Exception as e:
            raise TestDataError(f"Failed to generate test suite: {e}")
            
    def clear(self) -> None:
        """Clear all test data."""
        self.documents.clear()
        self.queries.clear()
        self._save_data() 