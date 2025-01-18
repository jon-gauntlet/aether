"""Tests for base RAG functionality."""

import pytest
import torch
import numpy as np
from rag_aether.core.base_rag import BaseRAG

@pytest.mark.critical
def test_encode_texts_batch():
    """Test batch text encoding."""
    rag = BaseRAG()
    texts = ["test text 1", "test text 2"]
    embeddings = rag.encode_texts(texts)
    assert embeddings.shape[0] == len(texts)
    assert embeddings.shape[1] == rag.embedding_dim

@pytest.mark.critical
def test_ingest_text():
    """Test text ingestion."""
    rag = BaseRAG()
    text = "test document"
    embedding = rag.ingest_text(text)
    assert isinstance(embedding, np.ndarray)
    assert embedding.shape[0] == rag.embedding_dim

@pytest.mark.critical
@pytest.mark.asyncio
async def test_retrieve_with_fusion():
    """Test retrieval with fusion."""
    rag = BaseRAG()
    query = "test query"
    documents = [
        {"text": "test document 1"},
        {"text": "test document 2"}
    ]
    results = await rag.retrieve(query, documents, k=2)
    assert len(results) <= 2
    assert all("score" in r for r in results)
    assert all("document" in r for r in results)

@pytest.mark.critical
@pytest.mark.asyncio
async def test_retrieve_with_metadata_filters():
    """Test retrieval with metadata filters."""
    rag = BaseRAG()
    query = "test query"
    documents = [
        {"text": "doc1", "metadata": {"type": "a"}},
        {"text": "doc2", "metadata": {"type": "b"}}
    ]
    
    # Test with filter
    results = await rag.retrieve(
        query, 
        documents,
        k=2,
        metadata_filter=lambda x: x["type"] == "a"
    )
    assert len(results) == 1
    assert results[0]["document"]["metadata"]["type"] == "a" 