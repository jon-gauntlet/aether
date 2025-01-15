import asyncio
import logging
from rag_aether.ai.rag import RAGSystem

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("rag_verify")

async def verify_rag_health():
    """Verify RAG system health and features."""
    try:
        logger.info("Starting RAG system verification...")
        
        # Initialize RAG system
        rag = RAGSystem()
        
        # Test Firebase initialization
        logger.info("Testing Firebase initialization...")
        await rag.initialize_from_firebase()
        
        # Verify health metrics
        logger.info("Verifying health metrics...")
        health_stats = rag.health.get_stats()
        logger.info(f"Health stats: {health_stats}")
        
        # Test querying
        test_questions = [
            "What are the key findings from the user research?",
            "How does the system handle flow state optimization?",
            "What technical challenges were identified?"
        ]
        
        for question in test_questions:
            logger.info(f"Testing query: {question}")
            result = await rag.query(question)
            logger.info(f"Answer: {result['answer'][:100]}...")
            logger.info(f"Sources: {len(result['sources'])} documents")
        
        # Verify final health state
        final_stats = rag.health.get_stats()
        logger.info(f"Final health stats: {final_stats}")
        
        # Test cleanup
        logger.info("Testing cleanup...")
        await rag._cleanup()
        
        logger.info("Verification complete - all tests passed")
        return True
        
    except Exception as e:
        logger.error(f"Verification failed: {str(e)}")
        return False

if __name__ == "__main__":
    asyncio.run(verify_rag_health()) 