import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

import asyncio
from rag_aether.ai.rag import RAGSystem
import json

async def main():
    # Initialize RAG system
    rag = RAGSystem()
    
    try:
        # Initialize from Firebase
        print("Initializing from Firebase...")
        await rag.initialize_from_firebase()
        
        # Test queries
        questions = [
            "What are the key findings about system performance during flow states?",
            "What patterns were observed in user behavior during flow states?",
            "What solutions were proposed for optimizing the system?"
        ]
        
        for question in questions:
            print(f"\nQuestion: {question}")
            result = await rag.query(question)
            print(f"Answer: {result['answer']}")
            print("\nSources:")
            for source in result['sources']:
                print(f"- From conversation: {source.get('title', 'Unknown')}")
                print(f"  ID: {source.get('conversation_id', 'Unknown')}")
    
    except Exception as e:
        print(f"Error: {str(e)}")
    
    # Keep the script running to test real-time updates
    print("\nWatching for real-time updates (Ctrl+C to exit)...")
    try:
        await asyncio.Event().wait()
    except KeyboardInterrupt:
        print("\nExiting...")

if __name__ == "__main__":
    asyncio.run(main()) 