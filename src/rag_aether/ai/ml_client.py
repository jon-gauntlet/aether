"""ML client for model interactions."""
import asyncio
from typing import List, Dict, Any
import logging
from openai import AsyncOpenAI
from ..config import load_credentials, BATCH_SIZE

logger = logging.getLogger(__name__)

class MLClient:
    """Client for ML model interactions."""
    
    def __init__(self):
        """Initialize ML client with OpenAI."""
        creds = load_credentials()
        self.client = AsyncOpenAI(api_key=creds.openai_api_key)
        
    async def create_embedding(self, text: str) -> List[float]:
        """Create embedding for a single text.
        
        Args:
            text: Text to embed
            
        Returns:
            List of embedding values
        """
        try:
            response = await self.client.embeddings.create(
                model="text-embedding-3-small",
                input=text
            )
            return response.data[0].embedding
            
        except Exception as e:
            logger.error(f"Failed to create embedding: {e}")
            raise
            
    async def create_embeddings_batch(
        self,
        texts: List[str],
        batch_size: int = BATCH_SIZE
    ) -> List[List[float]]:
        """Create embeddings for multiple texts in batches.
        
        Args:
            texts: List of texts to embed
            batch_size: Number of texts to process in each batch
            
        Returns:
            List of embeddings
        """
        embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            
            try:
                response = await self.client.embeddings.create(
                    model="text-embedding-3-small",
                    input=batch
                )
                batch_embeddings = [data.embedding for data in response.data]
                embeddings.extend(batch_embeddings)
                
            except Exception as e:
                logger.error(f"Failed to create embeddings batch: {e}")
                raise
                
        return embeddings
        
    async def generate_response(
        self,
        system_prompt: str,
        user_prompt: str,
        model: str = "gpt-4-turbo-preview"
    ) -> str:
        """Generate response from language model.
        
        Args:
            system_prompt: System context/instruction
            user_prompt: User query/input
            model: Model to use
            
        Returns:
            Generated response text
        """
        try:
            response = await self.client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
            )
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Failed to generate response: {e}")
            raise 