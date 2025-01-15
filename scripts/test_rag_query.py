#!/usr/bin/env python3
import asyncio
import os
from dotenv import load_dotenv
from rag_aether.ai.rag import RAGSystem

async def test_rag_queries():
    print("\n🔍 Testing RAG Queries with Firebase Data...")
    
    try:
        # Initialize RAG system
        print("\n1. Initializing RAG System...")
        rag = RAGSystem()
        await rag.initialize_from_firebase()
        print("✅ RAG system initialized!")
        
        # Test queries
        test_questions = [
            "What was discussed about project deadlines?",
            "What are the main technical requirements?",
            "What decisions were made in the last conversation?"
        ]
        
        print("\n2. Testing Queries...")
        for i, question in enumerate(test_questions, 1):
            print(f"\nQuery {i}: {question}")
            try:
                result = await rag.query(question)
                print("\nAnswer:", result['answer'])
                print("\nSources:")
                for source in result['sources']:
                    print(f"- {source['content'][:150]}...")
            except Exception as e:
                print(f"❌ Query failed: {str(e)}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ RAG testing failed: {str(e)}")
        return False

if __name__ == "__main__":
    load_dotenv()
    asyncio.run(test_rag_queries()) 