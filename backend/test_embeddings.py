from openai import AsyncOpenAI
import asyncio
import os
import numpy as np
from dotenv import load_dotenv

async def get_mock_embedding(text: str) -> list[float]:
    # Deterministic mock embeddings based on text length
    np.random.seed(len(text))
    return list(np.random.uniform(-1, 1, 1536))  # OpenAI ada-002 dimension

async def test_embeddings(use_mock: bool = True):
    load_dotenv()
    print(f"\nTesting embeddings in {'mock' if use_mock else 'real'} mode...")
    
    if use_mock:
        # Fast mock test
        text = "Testing OpenAI embeddings generation for RAG system"
        embedding = await get_mock_embedding(text)
        print(f"Successfully generated mock embedding with {len(embedding)} dimensions")
        print(f"First few values: {embedding[:5]}")
    else:
        # Real OpenAI test
        client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        text = "Testing OpenAI embeddings generation for RAG system"
        try:
            response = await client.embeddings.create(
                model="text-embedding-ada-002",
                input=text
            )
            print(f"Successfully generated embedding with {len(response.data[0].embedding)} dimensions")
            print(f"First few values: {response.data[0].embedding[:5]}")
        except Exception as e:
            print(f"Error generating embeddings: {e}")

if __name__ == "__main__":
    # Test both modes
    asyncio.run(test_embeddings(use_mock=True))  # Fast mock test
    # Uncomment to test real OpenAI:
    # asyncio.run(test_embeddings(use_mock=False)) 