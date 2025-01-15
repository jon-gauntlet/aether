"""Query expansion system with caching for RAG."""
from typing import Dict, Any, Optional, List, Union
from dataclasses import dataclass
import torch
from transformers import T5Tokenizer, T5ForConditionalGeneration
import numpy as np
from sentence_transformers import SentenceTransformer
import logging
import asyncio

from .caching_system import QueryCache, EmbeddingCache

@dataclass
class ExpandedQuery:
    """Expanded query with variations and scores."""
    original: str
    variations: List[str]
    scores: List[float]
    metadata: Dict[str, Any]

class QueryExpander:
    """Query expansion using T5 model with caching."""
    
    def __init__(
        self,
        model_name: str = "t5-base",
        similarity_model: str = "sentence-transformers/all-mpnet-base-v2",
        max_variations: int = 5,
        min_similarity: float = 0.7,
        temperature: float = 0.7,
        min_length: int = 8,
        max_length: int = 64,
        cache_variations: bool = True,
        cache_embeddings: bool = True,
        device: Optional[str] = None
    ):
        """Initialize query expander.
        
        Args:
            model_name: T5 model name/path
            similarity_model: Model for computing similarity
            max_variations: Maximum variations to generate
            min_similarity: Minimum similarity threshold
            temperature: Generation temperature
            min_length: Minimum generation length
            max_length: Maximum generation length
            cache_variations: Whether to cache query variations
            cache_embeddings: Whether to cache embeddings
            device: Device to use (cpu/cuda)
        """
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        
        # Load models
        self.tokenizer = T5Tokenizer.from_pretrained(model_name)
        self.model = T5ForConditionalGeneration.from_pretrained(model_name)
        self.model.to(self.device)
        self.model.eval()
        
        self.similarity_model = SentenceTransformer(similarity_model)
        self.similarity_model.to(self.device)
        
        # Parameters
        self.max_variations = max_variations
        self.min_similarity = min_similarity
        self.temperature = temperature
        self.min_length = min_length
        self.max_length = max_length
        
        # Initialize caches if enabled
        self.variation_cache = QueryCache() if cache_variations else None
        self.embedding_cache = EmbeddingCache() if cache_embeddings else None
        
        self.logger = logging.getLogger("query_expansion")
        
    async def expand_query(
        self,
        query: str,
        context: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> ExpandedQuery:
        """Expand query with variations.
        
        Args:
            query: Original query
            context: Optional context for expansion
            metadata: Optional metadata
            
        Returns:
            Expanded query with variations
        """
        # Check variation cache first
        if self.variation_cache:
            cached = await self.variation_cache.get_results(
                query=query,
                filters={"context": context} if context else None
            )
            if cached is not None:
                return ExpandedQuery(**cached[0])  # Only one result
                
        # Generate variations
        variations = await self._generate_variations(query, context)
        
        # Get embeddings for similarity filtering
        query_embedding = None
        variation_embeddings = []
        
        if self.embedding_cache:
            # Try to get cached query embedding
            query_embedding = await self.embedding_cache.get_embedding(
                query,
                self.similarity_model.get_model_name()
            )
            
            # Try to get cached variation embeddings
            for var in variations:
                emb = await self.embedding_cache.get_embedding(
                    var,
                    self.similarity_model.get_model_name()
                )
                if emb is not None:
                    variation_embeddings.append(emb)
                    continue
                    
                # Compute and cache if not found
                emb = self.similarity_model.encode(var)
                variation_embeddings.append(emb)
                await self.embedding_cache.cache_embedding(
                    var,
                    emb,
                    self.similarity_model.get_model_name()
                )
                
        if query_embedding is None:
            # Compute query embedding if not cached
            query_embedding = self.similarity_model.encode(query)
            if self.embedding_cache:
                await self.embedding_cache.cache_embedding(
                    query,
                    query_embedding,
                    self.similarity_model.get_model_name()
                )
                
        if not variation_embeddings:
            # Compute all variation embeddings if none cached
            variation_embeddings = self.similarity_model.encode(variations)
            if self.embedding_cache:
                for var, emb in zip(variations, variation_embeddings):
                    await self.embedding_cache.cache_embedding(
                        var,
                        emb,
                        self.similarity_model.get_model_name()
                    )
                    
        # Calculate similarities
        similarities = [
            float(np.dot(query_embedding, var_emb))
            for var_emb in variation_embeddings
        ]
        
        # Filter variations
        filtered = [
            (var, sim) for var, sim in zip(variations, similarities)
            if sim >= self.min_similarity
        ]
        filtered.sort(key=lambda x: x[1], reverse=True)
        filtered = filtered[:self.max_variations]
        
        result = ExpandedQuery(
            original=query,
            variations=[v[0] for v in filtered],
            scores=[v[1] for v in filtered],
            metadata={
                "context": context,
                **(metadata or {})
            }
        )
        
        # Cache result
        if self.variation_cache:
            await self.variation_cache.cache_results(
                query=query,
                results=[result.__dict__],
                filters={"context": context} if context else None
            )
            
        return result
        
    async def expand_queries(
        self,
        queries: List[str],
        context: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> List[ExpandedQuery]:
        """Expand multiple queries.
        
        Args:
            queries: List of queries
            context: Optional context for expansion
            metadata: Optional metadata
            
        Returns:
            List of expanded queries
        """
        tasks = [
            self.expand_query(q, context, metadata)
            for q in queries
        ]
        return await asyncio.gather(*tasks)
        
    async def _generate_variations(
        self,
        query: str,
        context: Optional[str] = None
    ) -> List[str]:
        """Generate query variations using T5.
        
        Args:
            query: Original query
            context: Optional context
            
        Returns:
            List of query variations
        """
        # Prepare input
        if context:
            input_text = f"context: {context} query: {query}"
        else:
            input_text = f"query: {query}"
            
        input_ids = self.tokenizer(
            input_text,
            return_tensors="pt",
            max_length=self.max_length,
            truncation=True
        ).input_ids.to(self.device)
        
        # Generate variations
        with torch.no_grad():
            outputs = self.model.generate(
                input_ids,
                max_length=self.max_length,
                min_length=self.min_length,
                do_sample=True,
                temperature=self.temperature,
                num_return_sequences=self.max_variations * 2,  # Generate extra for filtering
                num_beams=4,
                no_repeat_ngram_size=2
            )
            
        # Decode variations
        variations = self.tokenizer.batch_decode(
            outputs,
            skip_special_tokens=True
        )
        
        # Remove duplicates while preserving order
        seen = set()
        unique_variations = []
        for var in variations:
            if var.lower() not in seen and var.lower() != query.lower():
                seen.add(var.lower())
                unique_variations.append(var)
                
        return unique_variations 