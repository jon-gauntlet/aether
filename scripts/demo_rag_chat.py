#!/usr/bin/env python3
import asyncio
import json
import time
from pathlib import Path
from rag_aether.ai.rag import RAGSystem, ChatMessage, PersonaConfig

async def demo_chat_rag():
    """Demonstrate RAG system with chat messages."""
    print("🚀 Initializing RAG system with chat capabilities...")
    
    # Initialize RAG with custom persona
    rag = RAGSystem(
        persona=PersonaConfig(
            name="Aether",
            style="friendly and professional",
            expertise=["technical communication", "workplace collaboration"],
            communication_preferences={
                "formality": "adaptable",
                "tone": "friendly but professional",
                "response_length": "concise but thorough"
            }
        )
    )
    
    # Sample chat messages
    messages = [
        ChatMessage(
            content="We should use the new BGE embeddings model for better semantic search",
            channel_id="tech-discussion",
            user_id="alice",
            timestamp=time.time() - 3600
        ),
        ChatMessage(
            content="Agreed, the performance improvements are significant. Let's also add batch processing.",
            channel_id="tech-discussion",
            user_id="bob",
            timestamp=time.time() - 3500
        ),
        ChatMessage(
            content="I've implemented the batch processing with a size of 32. Tests show 40% speed improvement.",
            channel_id="tech-discussion",
            user_id="alice",
            timestamp=time.time() - 3400
        ),
        ChatMessage(
            content="Great work team! The metrics look promising. MRR is up to 0.85 and latency is down.",
            channel_id="tech-discussion",
            user_id="charlie",
            timestamp=time.time() - 3300
        )
    ]
    
    # Ingest messages
    print("\n📥 Ingesting chat messages...")
    for msg in messages:
        await rag.ingest_chat_message(msg)
        print(f"  ✓ Ingested message from {msg.user_id} in #{msg.channel_id}")
    
    # Demo queries
    queries = [
        "What improvements were made to the system?",
        "Who worked on the batch processing implementation?",
        "What are the current performance metrics?"
    ]
    
    print("\n🔍 Testing queries...")
    for query in queries:
        print(f"\nQuery: {query}")
        result = await rag.query(
            query=query,
            max_results=3
        )
        
        print("\nRelevant messages:")
        print(f"Found {len(result['results'])} results")
        print(f"Total documents in index: {len(rag.metadata)}")
        print(f"Sample metadata: {rag.metadata[0] if rag.metadata else 'No metadata'}")
        
        for text, meta in zip(result["results"], result["metadata"]):
            print(f"  @{meta.get('user_id', 'unknown')}: {text}")
            
        print("\nMetrics:")
        metrics = result["metrics"]
        print(f"  Retrieval Time: {metrics['retrieval_time_ms']:.0f}ms")
        print(f"  Results: {metrics['num_results']}")
        if metrics.get('similarity_scores'):
            print(f"  Top Similarity: {max(metrics['similarity_scores']):.3f}")

if __name__ == "__main__":
    asyncio.run(demo_chat_rag()) 