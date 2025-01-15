"""Test suite for advanced RAG system features."""
import pytest
import asyncio
from typing import Dict, Any, List
import numpy as np
from pathlib import Path
import json

from ..hybrid_search import HybridSearcher
from ..quality_system import QualitySystem
from ..performance_system import PerformanceMonitor
from ..query_expansion import QueryExpander

class RAGFeatureTests:
    """Tests for advanced RAG system features."""
    
    def __init__(self):
        """Initialize test components."""
        self.searcher = HybridSearcher()
        self.quality = QualitySystem()
        self.monitor = PerformanceMonitor()
        self.expander = QueryExpander()
        
    async def setup(self):
        """Set up test environment."""
        # Initialize components
        await self.searcher.initialize()
        await self.quality.initialize()
        await self.expander.initialize()
        
        # Load test data
        self.test_data = await self.load_test_data()
        
    async def teardown(self):
        """Clean up test environment."""
        await self.searcher.cleanup()
        await self.quality.cleanup()
        await self.expander.cleanup()
        
    async def load_test_data(self) -> Dict[str, Any]:
        """Load test conversation data."""
        test_conversations = {
            'technical': [
                {
                    'query': "What is machine learning?",
                    'context': "We're discussing AI and its subfields.",
                    'expected_topics': ['artificial intelligence', 'machine learning', 'data science']
                },
                {
                    'query': "How does it compare to deep learning?",
                    'context': "Following up on machine learning basics.",
                    'expected_topics': ['neural networks', 'deep learning', 'machine learning']
                }
            ],
            'casual': [
                {
                    'query': "Tell me about dogs",
                    'context': "Discussing pets and animals.",
                    'expected_topics': ['pets', 'dogs', 'animals']
                },
                {
                    'query': "What breeds are good with kids?",
                    'context': "Continuing discussion about dogs.",
                    'expected_topics': ['dog breeds', 'family pets', 'children']
                }
            ]
        }
        return test_conversations
        
    async def test_context_preservation(self):
        """Test context preservation across conversation turns."""
        for conv_type, conversation in self.test_data.items():
            context = None
            prev_response = None
            
            for turn in conversation:
                # Get response with context
                response = await self.searcher.search(
                    query=turn['query'],
                    context=context,
                    conversation_type=conv_type
                )
                
                # Verify topic consistency
                topics = await self.quality.extract_topics(response)
                assert any(topic in turn['expected_topics'] for topic in topics), \
                    f"Response topics don't match expected for {conv_type}"
                
                if prev_response:
                    # Verify context preservation
                    context_score = await self.quality.evaluate_context_preservation(
                        prev_response=prev_response,
                        current_response=response,
                        expected_context=turn['context']
                    )
                    assert context_score > 0.7, \
                        f"Context preservation below threshold for {conv_type}"
                
                # Update for next turn
                context = turn['context']
                prev_response = response
                
    async def test_query_expansion(self):
        """Test query expansion and enhancement."""
        test_queries = [
            {
                'original': "ml algorithms",
                'expected_expansions': [
                    "machine learning algorithms",
                    "types of machine learning algorithms",
                    "popular machine learning algorithms"
                ]
            },
            {
                'original': "neural nets",
                'expected_expansions': [
                    "neural networks",
                    "deep neural networks",
                    "artificial neural networks"
                ]
            }
        ]
        
        for test in test_queries:
            # Get expanded queries
            expansions = await self.expander.expand_query(test['original'])
            
            # Verify expansion quality
            assert len(expansions) >= 3, "Too few query expansions"
            
            # Verify semantic similarity
            for expected in test['expected_expansions']:
                similarity = await self.quality.evaluate_semantic_similarity(
                    text1=expected,
                    text2=expansions[0]  # Compare with top expansion
                )
                assert similarity > 0.7, \
                    f"Expansion not semantically similar: {expansions[0]} vs {expected}"
                    
    async def test_response_quality(self):
        """Test response quality and relevance."""
        test_cases = [
            {
                'query': "Explain transformers in NLP",
                'min_quality_score': 0.8,
                'required_aspects': [
                    'attention mechanism',
                    'architecture',
                    'applications'
                ]
            },
            {
                'query': "What is transfer learning?",
                'min_quality_score': 0.8,
                'required_aspects': [
                    'pre-training',
                    'fine-tuning',
                    'benefits'
                ]
            }
        ]
        
        for test in test_cases:
            # Get response
            response = await self.searcher.search(query=test['query'])
            
            # Evaluate overall quality
            quality_score = await self.quality.evaluate_response(
                query=test['query'],
                response=response
            )
            assert quality_score >= test['min_quality_score'], \
                f"Response quality below threshold: {quality_score}"
                
            # Check for required aspects
            for aspect in test['required_aspects']:
                coverage = await self.quality.evaluate_aspect_coverage(
                    response=response,
                    aspect=aspect
                )
                assert coverage > 0.6, \
                    f"Missing or insufficient coverage of aspect: {aspect}"
                    
    async def test_hybrid_search(self):
        """Test hybrid search capabilities."""
        test_queries = [
            {
                'query': "deep learning applications",
                'expected_sources': ['academic', 'technical'],
                'min_sources': 3
            },
            {
                'query': "machine learning in healthcare",
                'expected_sources': ['medical', 'technical'],
                'min_sources': 3
            }
        ]
        
        for test in test_queries:
            # Perform hybrid search
            results = await self.searcher.hybrid_search(
                query=test['query'],
                max_results=5
            )
            
            # Verify result count
            assert len(results) >= test['min_sources'], \
                f"Too few search results: {len(results)}"
                
            # Verify source diversity
            sources = [result['source'] for result in results]
            for expected in test['expected_sources']:
                assert any(expected in source for source in sources), \
                    f"Missing expected source type: {expected}"
                    
            # Verify result relevance
            relevance_scores = [
                await self.quality.evaluate_result_relevance(
                    query=test['query'],
                    result=result
                )
                for result in results
            ]
            assert np.mean(relevance_scores) > 0.7, \
                "Average result relevance below threshold"
                
# Test fixtures
@pytest.fixture
async def rag_tests():
    """Create RAG feature test instance."""
    tests = RAGFeatureTests()
    await tests.setup()
    yield tests
    await tests.teardown()
    
# Test cases
@pytest.mark.asyncio
async def test_context(rag_tests):
    """Test context preservation."""
    await rag_tests.test_context_preservation()
    
@pytest.mark.asyncio
async def test_expansion(rag_tests):
    """Test query expansion."""
    await rag_tests.test_query_expansion()
    
@pytest.mark.asyncio
async def test_quality(rag_tests):
    """Test response quality."""
    await rag_tests.test_response_quality()
    
@pytest.mark.asyncio
async def test_hybrid(rag_tests):
    """Test hybrid search."""
    await rag_tests.test_hybrid_search() 