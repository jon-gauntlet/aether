"""Query expansion module for enhancing search recall."""

import asyncio
from typing import List, Dict, Any, Optional, Set
from dataclasses import dataclass
import logging
from transformers import T5Tokenizer, T5ForConditionalGeneration
import torch
from ..core.errors import QueryExpansionError, QueryProcessingError
from ..core.performance import with_performance_monitoring

logger = logging.getLogger(__name__)

@dataclass
class ExpandedQuery:
    """Represents an expanded query with metadata."""
    original: str
    expanded: str
    metadata: Dict[str, Any]

class QueryProcessor:
    """Processes and validates queries before expansion."""
    
    def __init__(self, max_length: int = 512, min_length: int = 3):
        """Initialize query processor with length constraints."""
        self.max_length = max_length
        self.min_length = min_length
        self._lock = asyncio.Lock()
        
    @with_performance_monitoring
    async def process(self, query: str) -> str:
        """Process and validate a query."""
        if not query or len(query.strip()) < self.min_length:
            raise QueryProcessingError("Query is too short")
            
        if len(query) > self.max_length:
            raise QueryProcessingError("Query exceeds maximum length")
            
        return query.strip()
        
    @with_performance_monitoring
    async def process_batch(self, queries: List[str]) -> List[str]:
        """Process multiple queries in parallel."""
        if not queries:
            raise QueryProcessingError("Queries list cannot be empty")
            
        tasks = [self.process(query) for query in queries]
        return await asyncio.gather(*tasks)

class QueryExpander:
    """Expands queries using T5 model for better recall."""
    
    def __init__(self, model_name: str = "t5-small", cache_size: int = 1000):
        """Initialize query expander with T5 model."""
        try:
            self.tokenizer = T5Tokenizer.from_pretrained(model_name)
            self.model = T5ForConditionalGeneration.from_pretrained(model_name)
            self.cache: Dict[str, List[str]] = {}
            self.cache_size = cache_size
            self._lock = asyncio.Lock()
            self.processor = QueryProcessor()
        except Exception as e:
            raise QueryExpansionError(f"Failed to initialize query expander: {str(e)}")

    @with_performance_monitoring
    async def expand_query(self, query: str, context: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None) -> List[str]:
        """Expand a query into multiple variations."""
        if not query:
            raise QueryExpansionError("Query cannot be empty")
            
        cache_key = f"{query}:{context or ''}"
        
        try:
            async with self._lock:
                if cache_key in self.cache:
                    return self.cache[cache_key]
                    
                processed_query = await self.processor.process(query)
                input_text = f"expand query: {processed_query}"
                if context:
                    input_text = f"{input_text} context: {context}"
                
                inputs = self.tokenizer(input_text, return_tensors="pt", max_length=512, truncation=True)
                outputs = self.model.generate(
                    **inputs,
                    max_length=128,
                    num_return_sequences=3,
                    num_beams=5,
                    temperature=0.7
                )
                
                variations = [
                    self.tokenizer.decode(output, skip_special_tokens=True)
                    for output in outputs
                ]
                
                filtered_variations = self._filter_similar(variations)
                
                if len(self.cache) >= self.cache_size:
                    self._prune_cache()
                self.cache[cache_key] = filtered_variations
                
                return filtered_variations
                
        except Exception as e:
            logger.error(f"Error expanding query: {str(e)}")
            raise QueryExpansionError(f"Failed to expand query: {str(e)}")

    @with_performance_monitoring
    async def expand_queries(self, queries: List[str]) -> List[List[str]]:
        """Expand multiple queries in parallel."""
        if not queries:
            raise QueryExpansionError("Queries list cannot be empty")
            
        try:
            tasks = [self.expand_query(query) for query in queries]
            return await asyncio.gather(*tasks)
        except Exception as e:
            logger.error(f"Error in batch query expansion: {str(e)}")
            raise QueryExpansionError(f"Failed to expand queries in batch: {str(e)}")
    
    def _filter_similar(self, variations: List[str], threshold: float = 0.8) -> List[str]:
        """Filter out very similar variations."""
        filtered: Set[str] = set()
        for var in variations:
            if not any(self._similarity(var, f) > threshold for f in filtered):
                filtered.add(var)
        return list(filtered)
    
    def _similarity(self, str1: str, str2: str) -> float:
        """Calculate string similarity."""
        set1 = set(str1.lower().split())
        set2 = set(str2.lower().split())
        intersection = len(set1.intersection(set2))
        union = len(set1.union(set2))
        return intersection / union if union > 0 else 0.0
    
    def _prune_cache(self) -> None:
        """Remove oldest items from cache."""
        items = list(self.cache.items())
        items.sort(key=lambda x: len(x[1]))
        for key, _ in items[:len(items)//2]:
            del self.cache[key]

def expand_query(query: str, context: Optional[str] = None) -> Dict[str, Any]:
    """Utility function to expand a single query."""
    expander = QueryExpander()
    return asyncio.run(expander.expand_query(query, context))

def get_flow_context(query: str) -> Dict[str, Any]:
    """Extract flow-related context from query."""
    flow_terms = {
        "state": ["flow", "resting", "transition"],
        "metrics": ["energy", "focus", "productivity"],
        "patterns": ["work", "break", "cycle"]
    }
    
    context = {category: [] for category in flow_terms}
    
    for word in query.lower().split():
        for category, terms in flow_terms.items():
            if word in terms:
                context[category].append(word)
                
    return {
        "query": query,
        "flow_context": context,
        "has_flow_terms": any(len(terms) > 0 for terms in context.values())
    } 