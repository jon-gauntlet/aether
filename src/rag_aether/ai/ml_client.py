"""ML API client for embeddings and completions."""
import asyncio
from typing import List, Dict, Any, Optional
import logging
from openai import AsyncOpenAI
from ..config import load_credentials, EMBEDDING_MODEL, COMPLETION_MODEL

logger = logging.getLogger(__name__)

class MLClient:
    """Client for ML API interactions."""
    
    def __init__(self):
        """Initialize the ML client with credentials."""
        creds = load_credentials()
        self.client = AsyncOpenAI(api_key=creds.openai_api_key)
        
    async def create_embedding(self, text: str) -> List[float]:
        """Create an embedding for the given text.
        
        Args:
            text: The text to embed
            
        Returns:
            List of floats representing the embedding vector
        """
        try:
            response = await self.client.embeddings.create(
                model=EMBEDDING_MODEL,
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Failed to create embedding: {e}")
            raise
            
    async def create_embeddings_batch(
        self, 
        texts: List[str],
        batch_size: int = 100
    ) -> List[List[float]]:
        """Create embeddings for multiple texts in batches.
        
        Args:
            texts: List of texts to embed
            batch_size: Number of texts to embed in each batch
            
        Returns:
            List of embedding vectors
        """
        embeddings = []
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            try:
                response = await self.client.embeddings.create(
                    model=EMBEDDING_MODEL,
                    input=batch
                )
                batch_embeddings = [data.embedding for data in response.data]
                embeddings.extend(batch_embeddings)
            except Exception as e:
                logger.error(f"Failed to create embeddings batch: {e}")
                raise
                
        return embeddings
        
    async def get_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        top_p: float = 1.0,
        frequency_penalty: float = 0.0,
        presence_penalty: float = 0.0,
        stop: Optional[List[str]] = None
    ) -> str:
        """Get a completion from the language model.
        
        Args:
            messages: List of message dictionaries with 'role' and 'content'
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens to generate
            top_p: Nucleus sampling parameter
            frequency_penalty: Frequency penalty (-2 to 2)
            presence_penalty: Presence penalty (-2 to 2)
            stop: List of strings to stop generation at
            
        Returns:
            The generated completion text
        """
        try:
            response = await self.client.chat.completions.create(
                model=COMPLETION_MODEL,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                top_p=top_p,
                frequency_penalty=frequency_penalty,
                presence_penalty=presence_penalty,
                stop=stop
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Failed to get completion: {e}")
            raise
            
    async def get_completions_batch(
        self,
        batch_messages: List[List[Dict[str, str]]],
        **kwargs
    ) -> List[str]:
        """Get completions for multiple message sets in parallel.
        
        Args:
            batch_messages: List of message lists
            **kwargs: Additional arguments passed to get_completion
            
        Returns:
            List of completion texts
        """
        tasks = [
            self.get_completion(messages, **kwargs)
            for messages in batch_messages
        ]
        return await asyncio.gather(*tasks) 