"""Query expansion module for enhancing search recall."""

import asyncio
from typing import List, Dict, Any, Optional, Set
from dataclasses import dataclass
import logging
from transformers import T5Tokenizer, T5ForConditionalGeneration
import torch
import ast
from ..core.errors import QueryExpansionError, QueryProcessingError
from ..core.performance import with_performance_monitoring
from difflib import SequenceMatcher

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
            self.cache: Dict[str, Dict[str, Any]] = {}
            self.cache_size = cache_size
            self._lock = asyncio.Lock()
            self.processor = QueryProcessor()
            self.generate_count = 0
        except Exception as e:
            raise QueryExpansionError(f"Failed to initialize query expander: {str(e)}")

    def _parse_context(self, context: Optional[str]) -> Dict[str, Any]:
        """Parse string context into dictionary."""
        if not context:
            return {}
        try:
            return ast.literal_eval(context)
        except:
            return {"raw": context}

    @with_performance_monitoring
    async def expand_query(self, query: str, context: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Expand a query into multiple variations with metadata."""
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
                    temperature=0.7,
                    do_sample=True
                )
                self.generate_count += 1
                
                variations = [
                    self.tokenizer.decode(output, skip_special_tokens=True)
                    for output in outputs
                ]
                
                filtered_variations = self._filter_similar(variations)
                parsed_context = self._parse_context(context)
                
                result = {
                    "original_query": query,
                    "expanded_queries": filtered_variations,
                    "context": parsed_context,
                    "metadata": metadata or {}
                }
                
                if len(self.cache) >= self.cache_size:
                    self._prune_cache()
                    
                self.cache[cache_key] = result
                return result
                
        except QueryProcessingError:
            raise
        except Exception as e:
            raise QueryExpansionError(f"Failed to expand query: {str(e)}")

    @with_performance_monitoring
    async def expand_queries(self, queries: List[str]) -> List[Dict[str, Any]]:
        """Expand multiple queries in parallel."""
        if not queries:
            raise QueryExpansionError("Queries list cannot be empty")
            
        tasks = [self.expand_query(query) for query in queries]
        return await asyncio.gather(*tasks)

    def _filter_similar(self, variations: List[str], threshold: float = 0.8) -> List[str]:
        """Filter out similar variations using sequence matching."""
        if not variations:
            return []
            
        filtered = [variations[0]]
        for var in variations[1:]:
            if not any(self._similarity(var, existing) > threshold for existing in filtered):
                filtered.append(var)
        return filtered

    def _similarity(self, str1: str, str2: str) -> float:
        """Calculate similarity ratio between two strings."""
        return SequenceMatcher(None, str1, str2).ratio()

    def _prune_cache(self) -> None:
        """Remove oldest items from cache when it reaches capacity."""
        if len(self.cache) > self.cache_size:
            items = sorted(self.cache.items(), key=lambda x: len(x[1]["expanded_queries"]))
            to_remove = len(self.cache) - self.cache_size
            for key, _ in items[:to_remove]:
                del self.cache[key]

def expand_query(query: str, context: Optional[str] = None) -> Dict[str, Any]:
    """Standalone function to expand a single query."""
    expander = QueryExpander()
    return asyncio.run(expander.expand_query(query, context))

def get_flow_context(query: str) -> Dict[str, Any]:
    """Extract flow-related context from query."""
    flow_terms = {
        "performance": ["speed", "latency", "throughput"],
        "state": ["flow", "state", "condition"],
        "patterns": ["pattern", "behavior", "trend"]
    }
    
    context = {
        "has_flow_terms": False,
        "flow_context": {k: [] for k in flow_terms}
    }
    
    query_lower = query.lower()
    for category, terms in flow_terms.items():
        matches = [term for term in terms if term in query_lower]
        if matches:
            context["has_flow_terms"] = True
            context["flow_context"][category] = matches
            
    return context 