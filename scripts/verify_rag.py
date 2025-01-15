#!/usr/bin/env python3
import asyncio
import logging
import os
from pathlib import Path
from dotenv import load_dotenv
from rag_aether.ai.rag import RAGSystem

# Configure logging for natural flow
logging.basicConfig(
    level=logging.INFO,
    format='%(message)s'  # Simplified format for natural flow
)
logger = logging.getLogger(__name__)

# Load environment
env_path = Path(__file__).parents[1] / '.env'
logger.info(f"Loading environment from: {env_path}")
load_dotenv(env_path)
logger.info(f"ANTHROPIC_API_KEY: {os.getenv('ANTHROPIC_API_KEY')[:10]}...")

async def verify_natural_flow():
    """Verify RAG system's natural functionality with mock data."""
    rag = None
    try:
        # Natural initialization
        logger.info("\n🌱 Starting Natural Flow Verification")
        logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        
        logger.info("\n1️⃣  Initializing System")
        rag = RAGSystem(use_mock=True)
        await rag.initialize_from_firebase()
        
        # Natural flow test cases
        test_flows = [
            {
                "query": "What are the main technical requirements?",
                "flow_patterns": {
                    "memory": ["memory", "usage", "optimization"],
                    "pipeline": ["pipeline", "processing", "real-time"]
                },
                "description": "Technical Flow"
            },
            {
                "query": "What was decided about deadlines?",
                "flow_patterns": {
                    "timing": ["specific dates", "deadlines"],
                    "priority": ["quality", "stability"]
                },
                "description": "Known Information Flow"
            },
            {
                "query": "What is the project budget?",
                "flow_patterns": {
                    "absence": ["does not", "no information"],
                    "focus": ["focuses on", "instead"]
                },
                "description": "Unknown Information Flow"
            }
        ]
        
        logger.info("\n2️⃣  Checking Natural Responses")
        flow_disrupted = False
        
        for flow in test_flows:
            logger.info(f"\n⋯⋯⋯ {flow['description']} ⋯⋯⋯")
            logger.info(f"Query: {flow['query']}")
            
            response = await rag.query(flow['query'])
            logger.info(f"Response: {response}\n")
            
            # Check natural flow patterns
            patterns_found = {}
            for aspect, patterns in flow['flow_patterns'].items():
                matches = [p for p in patterns if p.lower() in response.lower()]
                patterns_found[aspect] = len(matches) > 0
            
            if all(patterns_found.values()):
                logger.info(f"✨ Natural flow detected - {', '.join(patterns_found.keys())}")
            else:
                flow_disrupted = True
                missing = [k for k, v in patterns_found.items() if not v]
                logger.info(f"⚠️  Flow disrupted - missing {', '.join(missing)}")
        
        # Natural completion
        logger.info("\n3️⃣  Checking System Health")
        logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        
        if not flow_disrupted:
            logger.info("✨ Natural flow maintained throughout verification")
            return True
        else:
            logger.info("⚠️  Natural flow disrupted in some responses")
            return False
            
    except Exception as e:
        logger.error(f"⚠️  Flow disrupted by error: {str(e)}")
        return False
        
    finally:
        if rag:
            logger.info("\n🍃 Releasing Resources")
            await rag._cleanup()
            logger.info("✨ Resources released naturally")

if __name__ == "__main__":
    success = asyncio.run(verify_natural_flow())
    exit(0 if success else 1) 