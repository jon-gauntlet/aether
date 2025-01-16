from rag_aether.ai.rag import RAGSystem
import os
from dotenv import load_dotenv
import time
import warnings
from langsmith.client import Client

# Disable LangSmith telemetry warnings
warnings.filterwarnings("ignore", category=UserWarning, module="langsmith.client")

def test_rag_pipeline():
    """Test the complete RAG pipeline."""
    print("\n🔍 Testing RAG Pipeline")
    print("=" * 60)
    
    # Load environment variables
    load_dotenv()
    
    # Disable LangSmith telemetry
    os.environ["LANGCHAIN_TRACING_V2"] = "false"
    os.environ["LANGCHAIN_ENDPOINT"] = ""
    
    # Initialize RAG system
    print("\n1. Initializing RAG system...")
    rag = RAGSystem()
    
    # Test document ingestion
    print("\n2. Testing document ingestion...")
    test_docs = [
        {
            "text": """
            Flow state is a mental state in which a person performing an activity is fully immersed
            and focused. It is characterized by complete absorption in what one does, and a resulting
            transformation in one's sense of time. The concept was introduced by Mihaly Csikszentmihalyi.
            """,
            "metadata": {"source": "flow_state", "type": "concept"}
        },
        {
            "text": """
            Deep work is the ability to focus without distraction on a cognitively demanding task.
            It's a skill that allows you to quickly master complicated information and produce better
            results in less time. Deep work will make you better at what you do and provide the sense
            of true fulfillment that comes from craftsmanship.
            """,
            "metadata": {"source": "deep_work", "type": "concept"}
        }
    ]
    
    total_chunks = 0
    for doc in test_docs:
        chunks = rag.ingest_text(doc["text"], doc["metadata"])
        total_chunks += chunks
        print(f"✅ Ingested document from {doc['metadata']['source']} ({chunks} chunks)")
    
    print(f"\nTotal chunks created: {total_chunks}")
    
    # Test retrieval and generation
    print("\n3. Testing retrieval and generation...")
    test_queries = [
        "What is flow state and who introduced it?",
        "How does deep work relate to productivity?",
        "What are the key characteristics of focused work?",
    ]
    
    for query in test_queries:
        print(f"\nQuery: {query}")
        start_time = time.time()
        response = rag.query(query)
        end_time = time.time()
        
        print(f"Response: {response}")
        print(f"Time taken: {end_time - start_time:.2f} seconds")
        print("-" * 60)

if __name__ == "__main__":
    test_rag_pipeline() 