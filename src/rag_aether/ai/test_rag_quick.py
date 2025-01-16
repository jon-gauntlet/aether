"""Quick test for RAG system with production features."""
from .rag_system import RAGSystem

def test_rag_with_mock():
    # Initialize with mock data and caching
    print("\nInitializing RAG system with mock data...")
    rag = RAGSystem(use_mock=True, use_cache=True)
    
    # Test technical query with metadata
    print("\nTesting technical query with metadata...")
    query = "What are the system performance patterns during flow states?"
    results = rag.query(query, include_metadata=True)
    print("\nResults with metadata:")
    for result in results["results"]:
        print(f"\nTitle: {result['title']}")
        print(f"Score: {result['search_score']:.3f}")
        print(f"Flow State: {result['flow_state']}")
        print(f"Content: {result['content'][:200]}...")
    
    # Test caching - should be instant
    print("\nTesting cache...")
    import time
    start = time.time()
    cached_results = rag.query(query, include_metadata=True)
    print(f"Cache retrieval time: {time.time() - start:.3f}s")
    
    # Test simple text response
    print("\nTesting simple text response...")
    query = "How do users behave during flow states?"
    text_results = rag.query(query, include_metadata=False)
    print(text_results)

if __name__ == "__main__":
    test_rag_with_mock() 