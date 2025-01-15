"""Property-based tests for RAG system using hypothesis."""
import pytest
from hypothesis import given, strategies as st
import numpy as np
from rag_aether.ai.rag import BaseRAG
from ..test_utils import MockEmbeddingModel, assert_embeddings_similar
from unittest.mock import patch

# Strategy for generating valid text content
text_strategy = st.text(
    alphabet=st.characters(blacklist_categories=('Cs',)), 
    min_size=1,
    max_size=1000
)

# Strategy for generating metadata
metadata_strategy = st.fixed_dictionaries({
    'type': st.sampled_from(['technical', 'general', 'other']),
    'author': st.text(min_size=1, max_size=50),
    'timestamp': st.integers(min_value=0)
})

@pytest.mark.asyncio
@given(
    texts=st.lists(text_strategy, min_size=1, max_size=10),
    metadata_list=st.lists(metadata_strategy, min_size=1, max_size=10)
)
async def test_ingest_property(texts, metadata_list):
    """Test that ingestion maintains invariants for arbitrary valid inputs."""
    with patch('rag_aether.ai.rag.SentenceTransformer', return_value=MockEmbeddingModel()):
        rag = BaseRAG()
        
        # Truncate metadata_list to match texts length if needed
        metadata_list = metadata_list[:len(texts)]
        while len(metadata_list) < len(texts):
            metadata_list.append(metadata_list[0])
            
        # Ingest all texts
        for text, metadata in zip(texts, metadata_list):
            await rag.ingest_text(text, metadata)
            
        # Verify invariants
        assert rag.index.ntotal == len(texts)
        assert len(rag.metadata) == len(texts)
        
        # Verify all metadata was stored correctly
        for i, expected_metadata in enumerate(metadata_list):
            assert rag.metadata[i] == expected_metadata

@pytest.mark.asyncio
@given(
    query=text_strategy,
    k=st.integers(min_value=1, max_value=5),
    texts=st.lists(text_strategy, min_size=1, max_size=10),
    metadata_list=st.lists(metadata_strategy, min_size=1, max_size=10)
)
async def test_retrieve_property(query, k, texts, metadata_list):
    """Test that retrieval maintains invariants for arbitrary valid inputs."""
    with patch('rag_aether.ai.rag.SentenceTransformer', return_value=MockEmbeddingModel()):
        rag = BaseRAG()
        
        # Truncate metadata_list to match texts length if needed
        metadata_list = metadata_list[:len(texts)]
        while len(metadata_list) < len(texts):
            metadata_list.append(metadata_list[0])
            
        # Ingest all texts
        for text, metadata in zip(texts, metadata_list):
            await rag.ingest_text(text, metadata)
            
        # Perform retrieval
        k = min(k, len(texts))  # Ensure k doesn't exceed available texts
        retrieved_texts, retrieved_metadata, metrics = await rag.retrieve_with_fusion(query, k)
        
        # Verify invariants
        assert len(retrieved_texts) == k
        assert len(retrieved_metadata) == k
        assert len(metrics['similarity_scores']) == k
        assert metrics['num_results'] == k
        assert all(score <= 1.0 for score in metrics['similarity_scores'])
        assert all(score >= -1.0 for score in metrics['similarity_scores'])
        
        # Verify metadata consistency
        for meta in retrieved_metadata:
            assert isinstance(meta, dict)
            assert 'type' in meta
            assert 'author' in meta
            assert 'timestamp' in meta

@pytest.mark.asyncio
@given(
    query=text_strategy,
    texts=st.lists(text_strategy, min_size=1, max_size=10),
    metadata_list=st.lists(metadata_strategy, min_size=1, max_size=10),
    filter_type=st.sampled_from(['technical', 'general', 'other'])
)
async def test_metadata_filter_property(query, texts, metadata_list, filter_type):
    """Test that metadata filtering maintains invariants for arbitrary valid inputs."""
    with patch('rag_aether.ai.rag.SentenceTransformer', return_value=MockEmbeddingModel()):
        rag = BaseRAG()
        
        # Truncate metadata_list to match texts length if needed
        metadata_list = metadata_list[:len(texts)]
        while len(metadata_list) < len(texts):
            metadata_list.append(metadata_list[0])
            
        # Ingest all texts
        for text, metadata in zip(texts, metadata_list):
            await rag.ingest_text(text, metadata)
            
        # Count how many documents should match our filter
        expected_matches = sum(1 for meta in metadata_list if meta['type'] == filter_type)
        if expected_matches == 0:
            return  # Skip test if no matches expected
            
        # Perform filtered retrieval
        k = expected_matches
        metadata_filters = {'type': filter_type}
        retrieved_texts, retrieved_metadata, metrics = await rag.retrieve_with_fusion(
            query, k, metadata_filters=metadata_filters
        )
        
        # Verify filter invariants
        assert all(meta['type'] == filter_type for meta in retrieved_metadata)
        assert len(retrieved_texts) <= expected_matches
        assert len(retrieved_metadata) == len(retrieved_texts) 