"""Query expansion module for RAG system."""
from typing import List, Dict, Any, Optional, Tuple
import logging
import ast
from functools import lru_cache
from transformers import T5Tokenizer, T5ForConditionalGeneration
import torch
from ..core.errors import QueryProcessingError, QueryExpansionError
from ..core.monitoring import monitor
from ..core.performance import with_performance_monitoring, performance_section
from .cache_manager import LRUCache
import os

logger = logging.getLogger(__name__)

# Global model and tokenizer cache with LRU eviction
_model_cache = LRUCache(maxsize=2)  # Only keep 2 models in memory

@with_performance_monitoring
def get_model(model_name: str) -> Tuple[T5ForConditionalGeneration, T5Tokenizer, str]:
    """Get or create model and tokenizer with caching.
    
    Args:
        model_name: Name of T5 model to use
        
    Returns:
        Tuple of (model, tokenizer, device)
    """
    cache_key = f"model:{model_name}"
    cached = _model_cache.get(cache_key)
    
    if cached is not None:
        monitor.record_cache_hit("lru")
        return cached
        
    with performance_section("load_model"):
        monitor.take_snapshot(f"before_load_{model_name}")
        
        try:
            # Initialize tokenizer with error handling
            try:
                tokenizer = T5Tokenizer.from_pretrained(model_name)
            except Exception as e:
                raise QueryExpansionError(f"Failed to load tokenizer: {e}")
            
            # Initialize model with optimizations
            try:
                model = T5ForConditionalGeneration.from_pretrained(
                    model_name,
                    torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
                    low_cpu_mem_usage=True
                )
            except Exception as e:
                raise QueryExpansionError(f"Failed to load model: {e}")
                
            # Set device
            device = "cuda" if torch.cuda.is_available() else "cpu"
            model = model.to(device)
            
            # Cache the model, tokenizer, and device
            result = (model, tokenizer, device)
            _model_cache.set(cache_key, result)
            
            monitor.take_snapshot(f"after_load_{model_name}")
            monitor.compare_snapshots(f"before_load_{model_name}", f"after_load_{model_name}")
            
            return result
            
        except Exception as e:
            raise QueryExpansionError(f"Failed to initialize model: {e}")

class QueryProcessor:
    """Process and validate queries."""
    
    def __init__(self, max_length: int = 512, min_length: int = 3):
        """Initialize query processor.
        
        Args:
            max_length: Maximum query length
            min_length: Minimum query length
        """
        self.max_length = max_length
        self.min_length = min_length
        
    @with_performance_monitoring
    async def process(self, query: str) -> str:
        """Process a single query.
        
        Args:
            query: Query to process
            
        Returns:
            Processed query
            
        Raises:
            QueryProcessingError: If query is invalid
        """
        if not query:
            raise QueryProcessingError("Query cannot be empty")
            
        if len(query) > self.max_length:
            raise QueryProcessingError(f"Query too long (max {self.max_length} chars)")
            
        if len(query) < self.min_length:
            raise QueryProcessingError(f"Query too short (min {self.min_length} chars)")
            
        return query.strip()
        
    @with_performance_monitoring
    async def process_batch(self, queries: List[str]) -> List[str]:
        """Process multiple queries.
        
        Args:
            queries: List of queries to process
            
        Returns:
            List of processed queries
        """
        results = []
        for query in queries:
            try:
                processed = await self.process(query)
                results.append(processed)
            except QueryProcessingError as e:
                logger.warning(f"Skipping invalid query: {e}")
                continue
        return results

class QueryExpander:
    """Expands queries for better retrieval."""
    
    def __init__(self, use_mock: bool = False):
        """Initialize query expander.
        
        Args:
            use_mock: Whether to use mock responses for testing
        """
        self.use_mock = use_mock
        logger.info("Query expander initialized in %s mode", "mock" if use_mock else "normal")
    
    async def expand_query(self, query: str) -> str:
        """Expand a query for better retrieval.
        
        Args:
            query: Original query to expand
            
        Returns:
            Expanded query
            
        Raises:
            QueryExpansionError: If expansion fails
        """
        try:
            if not query.strip():
                raise ValueError("Query cannot be empty")
            
            if self.use_mock:
                return f"{query} (expanded mock)"
            
            # TODO: Implement actual query expansion
            # For now, just return the original query
            return query
            
        except Exception as e:
            logger.error(f"Query expansion failed: {str(e)}")
            raise QueryExpansionError(f"Failed to expand query: {str(e)}")
            
    @with_performance_monitoring
    async def expand_queries(self, queries: List[str]) -> List[Dict[str, Any]]:
        """Expand multiple queries.
        
        Args:
            queries: List of queries to expand
            
        Returns:
            List of expansion results
        """
        results = []
        for query in queries:
            try:
                expanded = await self.expand_query(query)
                results.append(expanded)
            except QueryExpansionError as e:
                logger.warning(f"Failed to expand query '{query}': {e}")
                continue
        return results 