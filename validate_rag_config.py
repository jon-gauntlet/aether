from src.ai.rag import RAGSystem
import os
from dotenv import load_dotenv

def validate_rag_config():
    # Force reload environment variables
    load_dotenv(override=True)
    
    print("Validating RAG System Configuration...")
    
    # Print Anthropic API key format (first 10 chars)
    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    print(f"API Key format (first 10 chars): {api_key[:10]}...")
    
    # Initialize RAG system
    rag = RAGSystem()
    print(f"Model name: {rag.llm.model_name}")
    
    # Test with mock data
    print("\nInitializing with mock data...")
    rag.initialize_from_mock_data()
    
    # Try a simple query
    test_query = "What are the key findings about memory usage during flow states?"
    print(f"\nTesting query: {test_query}")
    response = rag.query(test_query)
    print(f"\nResponse: {response}")

if __name__ == "__main__":
    validate_rag_config() 