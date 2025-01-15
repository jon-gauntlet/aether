"""Property-based testing framework for RAG system."""
from typing import Dict, Any, Optional, List, Callable
from dataclasses import dataclass
import hypothesis
from hypothesis import given, strategies as st
import numpy as np
import asyncio
from functools import wraps

# Custom strategies for RAG-specific data
@st.composite
def document_strategy(draw):
    """Strategy for generating test documents."""
    min_length = draw(st.integers(min_value=10, max_value=50))
    words = draw(st.lists(
        st.text(alphabet=st.characters(blacklist_categories=('Cs',))),
        min_size=min_length,
        max_size=min_length * 2
    ))
    return " ".join(words)

@st.composite
def query_strategy(draw):
    """Strategy for generating test queries."""
    words = draw(st.lists(
        st.text(alphabet=st.characters(blacklist_categories=('Cs',))),
        min_size=1,
        max_size=10
    ))
    return " ".join(words)

@st.composite
def metadata_strategy(draw):
    """Strategy for generating test metadata."""
    keys = draw(st.lists(
        st.text(min_size=1, max_size=10),
        min_size=1,
        max_size=5,
        unique=True
    ))
    values = draw(st.lists(
        st.one_of(st.text(), st.integers(), st.floats()),
        min_size=len(keys),
        max_size=len(keys)
    ))
    return dict(zip(keys, values))

def async_test(max_examples: int = 100):
    """Decorator for async property-based tests."""
    def decorator(test_func: Callable):
        @wraps(test_func)
        @hypothesis.settings(max_examples=max_examples)
        def wrapped(*args, **kwargs):
            asyncio.run(test_func(*args, **kwargs))
        return wrapped
    return decorator

# Core RAG properties
class RAGProperties:
    """Property-based tests for RAG system."""
    
    def __init__(self, rag_system):
        """Initialize with RAG system instance."""
        self.rag = rag_system
        
    @async_test()
    @given(
        documents=st.lists(document_strategy(), min_size=1, max_size=20),
        query=query_strategy()
    )
    async def test_retrieval_properties(self, documents: List[str], query: str):
        """Test core retrieval properties."""
        # Property 1: Results should not exceed document count
        results = await self.rag.search(query)
        assert len(results) <= len(documents)
        
        # Property 2: Results should come from indexed documents
        assert all(r.content in documents for r in results)
        
        # Property 3: Scores should be normalized
        assert all(0 <= r.score <= 1 for r in results)
        
        # Property 4: Results should be ordered by score
        scores = [r.score for r in results]
        assert scores == sorted(scores, reverse=True)
        
    @async_test()
    @given(
        documents=st.lists(document_strategy(), min_size=1, max_size=20),
        metadata=st.lists(metadata_strategy(), min_size=1, max_size=20)
    )
    async def test_document_properties(self, documents: List[str], metadata: List[Dict]):
        """Test document processing properties."""
        # Property 1: All documents should be processed
        await self.rag.index_documents(documents, metadata)
        assert len(self.rag.documents) == len(documents)
        
        # Property 2: Metadata should be preserved
        assert all(
            m1.items() <= m2.items()
            for m1, m2 in zip(metadata, self.rag.metadata)
        )
        
        # Property 3: Document order should be preserved
        assert all(
            d1 == d2
            for d1, d2 in zip(documents, self.rag.documents)
        )
        
    @async_test()
    @given(query=query_strategy())
    async def test_expansion_properties(self, query: str):
        """Test query expansion properties."""
        expanded = await self.rag.expand_query(query)
        
        # Property 1: Should preserve original query
        assert expanded.original == query
        
        # Property 2: Variations should be unique
        assert len(expanded.variations) == len(set(expanded.variations))
        
        # Property 3: Variations should be semantically similar
        assert all(score >= 0.5 for score in expanded.scores)
        
    @async_test()
    @given(
        documents=st.lists(document_strategy(), min_size=1, max_size=20),
        queries=st.lists(query_strategy(), min_size=1, max_size=5)
    )
    async def test_caching_properties(self, documents: List[str], queries: List[str]):
        """Test caching properties."""
        await self.rag.index_documents(documents)
        
        # Property 1: Cache hits should be faster
        times = []
        for query in queries:
            start = time.time()
            await self.rag.search(query)
            times.append(time.time() - start)
            
        # First query should be slowest (cold start)
        assert times[0] > np.mean(times[1:])
        
        # Property 2: Cache should respect TTL
        await asyncio.sleep(self.rag.cache_ttl + 0.1)
        assert await self.rag.query_cache.get(queries[0]) is None
        
    @async_test()
    @given(
        documents=st.lists(document_strategy(), min_size=1, max_size=20),
        query=query_strategy()
    )
    async def test_quality_properties(self, documents: List[str], query: str):
        """Test quality system properties."""
        await self.rag.index_documents(documents)
        results = await self.rag.search(query)
        
        for result in results:
            quality = await self.rag.evaluate_quality(
                query=query,
                response=result.content
            )
            
            # Property 1: Quality scores should be normalized
            assert all(0 <= v <= 1 for v in quality.values())
            
            # Property 2: Required metrics should be present
            required = {"relevance", "coherence", "factuality"}
            assert all(k in quality for k in required)
            
    @async_test()
    @given(
        documents=st.lists(document_strategy(), min_size=1, max_size=20),
        query=query_strategy()
    )
    async def test_performance_properties(self, documents: List[str], query: str):
        """Test performance properties."""
        # Property 1: Indexing throughput should be reasonable
        start = time.time()
        await self.rag.index_documents(documents)
        index_time = time.time() - start
        
        docs_per_second = len(documents) / index_time
        assert docs_per_second >= 1.0  # At least 1 doc/second
        
        # Property 2: Search latency should be bounded
        start = time.time()
        await self.rag.search(query)
        search_time = time.time() - start
        
        assert search_time <= 1.0  # Max 1 second per search
        
        # Property 3: Memory usage should be bounded
        memory = self.rag.get_memory_usage()
        assert memory <= 1024 * 1024 * 1024  # Max 1GB

# Helper functions for property testing
def assert_ordered(items: List[float], reverse: bool = False) -> bool:
    """Assert items are ordered."""
    return all(
        a >= b if reverse else a <= b
        for a, b in zip(items[:-1], items[1:])
    )

def assert_normalized(values: List[float]) -> bool:
    """Assert values are normalized to [0,1]."""
    return all(0 <= v <= 1 for v in values)

def assert_unique(items: List[Any]) -> bool:
    """Assert items are unique."""
    return len(items) == len(set(items)) 