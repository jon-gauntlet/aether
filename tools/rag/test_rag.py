import os
from pathlib import Path
import json
import asyncio
from dotenv import load_dotenv
import sys
import traceback

from tools.rag.core import RAGSystem

# Load environment variables
load_dotenv()
print("Environment variables loaded")

async def test_document_processing():
    """Test document processing and chunking."""
    print("Starting test_document_processing")
    rag = RAGSystem(chunk_size=500, chunk_overlap=100)
    print("RAG system initialized")
    rag.initialize_from_mock_data()
    print("Mock data initialized")
    
    print("\nTesting Document Processing")
    print("=" * 60)
    
    # Test basic search
    query = "What are the key components of the system?"
    print(f"Running search with query: {query}")
    results = await rag.search(query, k=2)
    
    # Verify results
    assert len(results) > 0, "No search results returned"
    for result in results:
        print(f"\nScore: {result.score:.3f}")
        print(f"Content: {result.document.page_content[:100]}...")
        assert len(result.document.page_content) <= 500, "Chunk size exceeded"

async def test_semantic_search():
    """Test semantic search capabilities."""
    rag = RAGSystem()
    rag.initialize_from_mock_data()
    
    print("\nTesting Semantic Search")
    print("=" * 60)
    
    # Test different types of queries
    queries = [
        "What is the system architecture?",
        "How does the memory system work?",
        "What are the implementation details?",
        "How is state managed?"
    ]
    
    for query in queries:
        print(f"\nQuery: {query}")
        results = await rag.search(query, k=3)
        
        # Verify results
        assert len(results) > 0, "No search results returned"
        print("\nResults:")
        for i, result in enumerate(results, 1):
            print(f"\n{i}. Score: {result.score:.3f}")
            print(f"Content: {result.document.page_content[:100]}...")
        
        # Verify score ordering
        scores = [r.score for r in results]
        assert all(s1 >= s2 for s1, s2 in zip(scores, scores[1:])), \
            "Results not properly ordered by score"

async def test_qa_chain():
    """Test question answering capabilities."""
    rag = RAGSystem()
    rag.initialize_from_mock_data()
    
    print("\nTesting Question Answering")
    print("=" * 60)
    
    questions = [
        "How is the FlowStateManager implemented?",
        "What are the main components of the memory system?",
        "How does the system handle state transitions?",
        "What metrics are tracked in the system?"
    ]
    
    for question in questions:
        print(f"\nQuestion: {question}")
        result = await rag.query(question)
        
        # Verify answer
        assert result["answer"], "No answer generated"
        assert result["source_documents"], "No source documents returned"
        
        print(f"\nAnswer: {result['answer']}")
        print("\nSources:")
        for i, doc in enumerate(result["source_documents"], 1):
            print(f"\n{i}. {doc.page_content[:100]}...")

async def test_metadata_filtering():
    """Test metadata-based filtering."""
    rag = RAGSystem()
    rag.initialize_from_mock_data()
    
    print("\nTesting Metadata Filtering")
    print("=" * 60)
    
    # Test different metadata filters
    filters = [
        {"technical_domain": "Architecture"},
        {"sender_role": "Lead Developer"},
        {"project_phase": "Design"}
    ]
    
    query = "How is the system implemented?"
    
    for filter_metadata in filters:
        print(f"\nFilter: {filter_metadata}")
        results = await rag.search(query, k=2, filter_metadata=filter_metadata)
        
        # Verify results
        assert len(results) > 0, "No search results returned"
        print("\nResults:")
        for i, result in enumerate(results, 1):
            print(f"\n{i}. Score: {result.score:.3f}")
            meta = result.document.metadata
            print(f"Metadata: {meta}")
            print(f"Content: {result.document.page_content[:100]}...")
            
            # Verify filter application
            for key, value in filter_metadata.items():
                assert meta.get(key) == value, \
                    f"Result metadata doesn't match filter: {key}={value}"

async def main():
    """Run all tests."""
    print("\nRunning RAG System Tests")
    print("=" * 60)
    
    try:
        print("Starting document processing test")
        await test_document_processing()
        print("Document processing test completed")
        
        print("Starting semantic search test")
        await test_semantic_search()
        print("Semantic search test completed")
        
        print("Starting QA chain test")
        await test_qa_chain()
        print("QA chain test completed")
        
        print("Starting metadata filtering test")
        await test_metadata_filtering()
        print("Metadata filtering test completed")
        
        print("\nAll tests completed successfully!")
    except AssertionError as e:
        print(f"\nTest failed: {str(e)}")
        traceback.print_exc()
        sys.exit(1)
    except Exception as e:
        print(f"\nUnexpected error: {str(e)}")
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    print("Starting test script")
    asyncio.run(main()) 