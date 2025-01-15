from src.ai.rag import RAGSystem
import os
from dotenv import load_dotenv

load_dotenv()

def main():
    # Initialize RAG system
    rag = RAGSystem()
    
    # Sample documents about software development methodologies
    documents = [
        {
            "text": """
            Agile is an iterative approach to project management and software development
            that helps teams deliver value to their customers faster and with fewer headaches. 
            Instead of betting everything on a "big bang" launch, an agile team delivers work 
            in small, but consumable, increments. Requirements, plans, and results are evaluated 
            continuously so teams have a natural mechanism for responding to change quickly.
            """,
            "metadata": {"source": "agile", "type": "methodology"}
        },
        {
            "text": """
            DevOps is a set of practices that combines software development (Dev) and IT operations (Ops).
            It aims to shorten the systems development life cycle and provide continuous delivery
            with high software quality. DevOps is complementary with Agile software development;
            several DevOps aspects came from Agile methodology.
            """,
            "metadata": {"source": "devops", "type": "methodology"}
        },
        {
            "text": """
            The Autonomic Acceleration Arsenal (AAA) represents an evolution beyond traditional
            Agile and DevOps approaches. It introduces AI-powered assistance and optimization
            at every stage of development, enabling teams to maintain flow state and maximize
            productivity. AAA preserves the best aspects of Agile and DevOps while adding
            intelligent automation and natural system evolution.
            """,
            "metadata": {"source": "aaa", "type": "methodology"}
        }
    ]
    
    # Ingest documents
    total_chunks = 0
    print("\n📚 Ingesting documents...")
    for doc in documents:
        chunks = rag.ingest_text(doc["text"], doc["metadata"])
        total_chunks += chunks
        print(f"✅ Ingested document from {doc['metadata']['source']}")
    print(f"Total chunks created: {total_chunks}\n")
    
    # Example queries to test the system
    queries = [
        "What is Agile and how does it work?",
        "How does DevOps relate to Agile?",
        "What is AAA and how does it improve upon Agile and DevOps?",
    ]
    
    # Run queries
    print("🔍 Testing queries...")
    for query in queries:
        print(f"\nQ: {query}")
        response = rag.query(query)
        print(f"A: {response}\n")
        print("-" * 80)

if __name__ == "__main__":
    main() 