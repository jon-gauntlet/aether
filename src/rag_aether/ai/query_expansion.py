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
    """Expand queries using T5 model."""
    
    def __init__(self, model_name: Optional[str] = None):
        """Initialize query expander.
        
        Args:
            model_name: Optional model name override
        """
        self.model_name = model_name or os.getenv("QUERY_EXPANSION_MODEL", "t5-small")
        self.model, self.tokenizer, self.device = get_model(self.model_name)
        self.processor = QueryProcessor()
        
    @with_performance_monitoring
    async def expand_query(
        self,
        query: str,
        context: Optional[str] = None
    ) -> Dict[str, Any]:
        """Expand a single query.
        
        Args:
            query: Query to expand
            context: Optional context for expansion
            
        Returns:
            Dict containing original query, expanded queries, and metadata
        """
        try:
            # Process query
            processed_query = await self.processor.process(query)
            
            # Prepare input text
            input_text = f"expand query: {processed_query}"
            if context:
                try:
                    context_dict = ast.literal_eval(context)
                    input_text += f" context: {str(context_dict)}"
                except (ValueError, SyntaxError) as e:
                    logger.warning(f"Failed to parse context: {e}")
            
            # Generate expansions
            with performance_section("generate_expansions"):
                try:
                    # Encode input text
                    inputs = self.tokenizer(
                        input_text,
                        return_tensors="pt",
                        padding=True,
                        truncation=True,
                        max_length=self.processor.max_length
                    )
                    inputs = {k: v.to(self.device) for k, v in inputs.items()}
                    
                    # Generate expansions
                    outputs = self.model.generate(
                        **inputs,
                        max_length=128,
                        num_return_sequences=3,
                        num_beams=5,
                        temperature=0.7,
                        do_sample=True,
                        no_repeat_ngram_size=2
                    )
                    
                    # Decode outputs
                    expanded = self.tokenizer.batch_decode(outputs, skip_special_tokens=True)
                    
                    # Clean and deduplicate
                    expanded = [q.strip() for q in expanded]
                    expanded = list(dict.fromkeys([q for q in expanded if q]))
                    
                    # Always include original query
                    if processed_query not in expanded:
                        expanded.insert(0, processed_query)
                        
                except Exception as e:
                    raise QueryExpansionError(f"Failed to generate expansions: {e}")
            
            result = {
                "original_query": query,
                "expanded_queries": expanded,
                "metadata": {
                    "model": self.model_name,
                    "device": self.device,
                    "processor_metrics": {
                        "max_length": self.processor.max_length,
                        "min_length": self.processor.min_length
                    }
                }
            }
            
            if context:
                result["context"] = ast.literal_eval(context)
                
            return result
            
        except Exception as e:
            raise QueryExpansionError(f"Failed to expand query: {e}")
            
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