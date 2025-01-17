"""Property-based tests for RAG system behavior."""
from typing import List, Dict, Any
import pytest
from hypothesis import given, settings, strategies as st
from hypothesis.stateful import Bundle, RuleBasedStateMachine, rule, invariant
import numpy as np
from datetime import datetime, timedelta
from rag_aether.ai.rag_system import RAGSystem

from tests.rag_aether.test_utils import (
    MockEmbeddingModel,
    text_content_strategy,
    metadata_strategy,
    embedding_strategy,
    assert_embeddings_similar,
    assert_results_ordered,
    assert_response_quality,
    measure_performance,
    PerformanceMetrics
)

class RAGStateMachine(RuleBasedStateMachine):
    """State machine for testing RAG system behavior."""
    
    def __init__(self):
        super().__init__()
        self.rag = RAGSystem(use_mock=True)
        self.documents = []
        self.queries = []
        self.metadata = {}
        self.doc_ids = set()
        
    documents = Bundle("documents")
    queries = Bundle("queries")
    
    @rule(target=documents, content=text_content_strategy())
    def add_document(self, content: str) -> Dict[str, Any]:
        """Add a document to the RAG system."""
        doc_id = len(self.documents)
        metadata = {"id": doc_id, "timestamp": datetime.now().isoformat()}
        self.rag.ingest_document(content, metadata)
        self.documents.append(content)
        self.metadata[doc_id] = metadata
        self.doc_ids.add(doc_id)
        return {"content": content, "metadata": metadata}
    
    @rule(target=queries, content=text_content_strategy())
    def add_query(self, content: str) -> str:
        """Add a query and get results."""
        self.queries.append(content)
        return content
        
    @rule(query=queries)
    def test_retrieval(self, query: str):
        """Test basic properties of retrieval."""
        results = self.rag.retrieve(query, k=3)
        assert len(results) <= 3
        if results:
            assert all(0 <= r.score <= 1 for r in results)
            assert_results_ordered(results)
            
    @invariant()
    def check_consistency(self):
        """Check that documents and metadata remain consistent."""
        assert len(self.documents) == len(self.metadata)
        assert all(doc_id in self.doc_ids for doc_id in self.metadata)

TestRAGProperties = RAGStateMachine.TestCase 