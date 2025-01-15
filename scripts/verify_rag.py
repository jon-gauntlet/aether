#!/usr/bin/env python3
import asyncio
import logging
from rag_aether.ai.rag import RAGSystem

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def verify_rag():
    """Verify essential RAG functionality with mock data."""
    try:
        # Initialize RAG with mock data
        logger.info("\n=== Initializing RAG System ===")
        rag = RAGSystem(use_mock=True)
        await rag.initialize_from_firebase()
        
        # Test essential queries
        test_cases = [
            {
                "query": "What are the main technical requirements?",
                "required": ["memory usage", "pipeline"],
                "description": "Technical requirements query"
            },
            {
                "query": "What was decided about deadlines?",
                "required": ["did not set any specific dates"],
                "description": "Deadline decisions query"
            },
            {
                "query": "What is the project budget?",
                "required": ["does not mention", "budget"],
                "description": "Missing information query"
            }
        ]
        
        logger.info("\n=== Running Test Queries ===")
        all_passed = True
        
        for test in test_cases:
            logger.info(f"\nTesting: {test['description']}")
            logger.info(f"Query: {test['query']}")
            
            # Get response
            response = await rag.query(test['query'])
            logger.info(f"Response: {response}")
            
            # Verify required elements
            missing = [req for req in test['required'] 
                      if req.lower() not in response.lower()]
            
            if not missing:
                logger.info("✓ Response contains all required elements")
            else:
                all_passed = False
                logger.error(f"✗ Missing required elements: {missing}")
        
        # Final status
        logger.info("\n=== Verification Complete ===")
        if all_passed:
            logger.info("✓ All essential tests passed")
            return True
        else:
            logger.error("✗ Some tests failed")
            return False
            
    except Exception as e:
        logger.error(f"✗ Verification failed with error: {str(e)}")
        return False
    finally:
        # Clean up
        if 'rag' in locals():
            await rag._cleanup()

if __name__ == "__main__":
    success = asyncio.run(verify_rag())
    exit(0 if success else 1) 