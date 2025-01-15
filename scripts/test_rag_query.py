#!/usr/bin/env python3
import asyncio
import logging
from rag_aether.ai.rag import RAGSystem

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def main():
    # Initialize RAG system
    logger.info("Initializing RAG system...")
    rag = RAGSystem()
    await rag.initialize_from_firebase()
    logger.info("RAG system initialized successfully")
    
    try:
        # Test queries
        queries = [
            "What are the main technical requirements?",
            "What decisions were made in the last conversation?",
            "What are the project deadlines?"
        ]
        
        for query in queries:
            logger.info(f"\nProcessing query: {query}")
            response = await rag.query(query)
            logger.info(f"Response: {response}")
    finally:
        # Clean up resources
        await rag._cleanup()

if __name__ == "__main__":
    asyncio.run(main()) 