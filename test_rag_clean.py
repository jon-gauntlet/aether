import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add project root to Python path
project_root = str(Path(__file__).parent)
if project_root not in sys.path:
    sys.path.append(project_root)

# Load environment variables
load_dotenv()

def test_api_key():
    """Test if the OpenAI API key is valid."""
    from openai import OpenAI
    try:
        client = OpenAI(
            api_key=os.getenv("OPENAI_API_KEY")
        )
        
        # Try a simple API call
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            store=True,
            messages=[{"role": "user", "content": "Hello, World!"}]
        )
        print("✓ API key is valid")
        return True
    except Exception as e:
        print(f"✗ API key error: {str(e)}")
        return False

def test_rag_system():
    """Test the RAG system functionality."""
    from src.ai.rag import RAGSystem
    
    try:
        # Initialize RAG system
        print("\nInitializing RAG system...")
        rag = RAGSystem(model_name="gpt-4o-mini")
        print("✓ RAG system initialized")
        
        # Load mock data
        print("\nLoading mock data...")
        rag.initialize_from_mock_data()
        print("✓ Mock data loaded")
        
        # Test QA
        print("\nTesting question answering...")
        question = "How is the FlowStateManager implemented?"
        answer = rag.query(question)
        print("✓ Successfully generated answer")
        print(f"\nAnswer: {answer}")
        
        return True
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        return False

def main():
    print("Testing RAG System Components")
    print("=" * 50)
    
    # Test API key first
    print("\nTesting OpenAI API key...")
    if not test_api_key():
        print("\nPlease check your OpenAI API key configuration.")
        return
    
    # Test RAG system
    if test_rag_system():
        print("\n✓ All tests completed successfully!")
    else:
        print("\n✗ Some tests failed. Please check the errors above.")

if __name__ == "__main__":
    main() 