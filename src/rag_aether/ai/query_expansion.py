"""Query expansion module for RAG system."""

from typing import Dict, Any, List, Optional
import logging
import torch
from transformers import T5Tokenizer, T5ForConditionalGeneration
from ..core.errors import QueryProcessingError, QueryExpansionError

logger = logging.getLogger(__name__)

def get_flow_context(query: str) -> Dict[str, Any]:
    """Get flow context for query expansion."""
    return {
        "operation": "query_expansion",
        "query_length": len(query)
    }

async def expand_query(query: str, model: Optional[str] = None) -> Dict[str, Any]:
    """Expand a query using default expander."""
    expander = QueryExpander(model) if model else QueryExpander()
    return await expander.expand_query(query)

class QueryProcessor:
    """Process and validate queries."""
    
    def __init__(self, max_length: int = 512, min_length: int = 3, batch_size: int = 32):
        self.max_length = max_length
        self.min_length = min_length
        self.batch_size = batch_size  # Optimized for 32GB RAM
    
    async def process(self, query: str) -> str:
        """Process a single query."""
        query = query.strip()
        if not query:
            raise QueryProcessingError("Query cannot be empty")
            
        if len(query) > self.max_length:
            raise QueryProcessingError(f"Query too long ({len(query)} > {self.max_length})")
            
        if len(query) < self.min_length:
            raise QueryProcessingError(f"Query too short ({len(query)} < {self.min_length})")
            
        return query
    
    async def process_batch(self, queries: List[str]) -> List[str]:
        """Process queries in optimized batches."""
        results = []
        # Process in batches to optimize memory usage
        for i in range(0, len(queries), self.batch_size):
            batch = queries[i:i + self.batch_size]
            for query in batch:
                try:
                    processed = await self.process(query)
                    results.append(processed)
                except QueryProcessingError:
                    continue
        return results

class MockT5Model:
    """Mock T5 model for testing."""
    def __init__(self):
        self.device = "cpu"
        
    def to(self, device):
        """Mock device movement."""
        return self
        
    def half(self):
        """Mock half precision."""
        return self
        
    def generate(self, *args, **kwargs):
        """Mock generation."""
        return torch.tensor([[1, 2, 3]])

class MockT5Tokenizer:
    """Mock T5 tokenizer for testing."""
    def __init__(self):
        pass
        
    def encode(self, text, return_tensors="pt", **kwargs):
        """Mock encoding."""
        return torch.tensor([[1, 2, 3]])
        
    def decode(self, ids, **kwargs):
        """Mock decoding."""
        return "mock expanded query"

class QueryExpander:
    """Query expansion using T5 model with GPU acceleration."""
    
    def __init__(self, model_name: str = "t5-small"):
        """Initialize the query expander with specified model.
        
        Args:
            model_name: Name of the T5 model to use for query expansion
        """
        self.model_name = model_name
        self.tokenizer = T5Tokenizer.from_pretrained(model_name)
        
        # Try CUDA first, fall back to CPU if OOM
        try:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            self.model = (
                T5ForConditionalGeneration
                .from_pretrained(model_name)
                .to(self.device)
            )
        except RuntimeError as e:
            if "out of memory" in str(e):
                logger.warning(f"CUDA out of memory, falling back to CPU for {model_name}")
                self.device = torch.device("cpu")
                self.model = (
                    T5ForConditionalGeneration
                    .from_pretrained(model_name)
                    .to(self.device)
                )
            else:
                raise QueryExpansionError(f"Failed to initialize query expander: {str(e)}")

    def expand(self, query: str, max_length: int = 128) -> str:
        """Expand a query using the T5 model.
        
        Args:
            query: The query to expand
            max_length: Maximum length of generated expansion
            
        Returns:
            The expanded query
        """
        try:
            inputs = self.tokenizer(
                f"expand query: {query}",
                return_tensors="pt",
                max_length=max_length,
                truncation=True
            ).to(self.device)
            
            outputs = self.model.generate(
                **inputs,
                max_length=max_length,
                num_beams=4,
                temperature=0.7,
                no_repeat_ngram_size=2
            )
            
            expanded = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            return expanded
            
        except Exception as e:
            raise QueryExpansionError(f"Failed to expand query: {str(e)}")
            
    async def expand_query(self, query: str, context: Optional[Dict] = None) -> Dict[str, Any]:
        """Expand a query using the T5 model.
        
        Args:
            query: The query to expand
            context: Optional context to help with expansion
            
        Returns:
            Dict containing expanded query and metadata
        """
        try:
            # Prepare input
            input_text = f"expand query: {query}"
            if context:
                input_text = f"{input_text} context: {context}"
                
            inputs = self.tokenizer(
                input_text,
                return_tensors="pt",
                max_length=512,
                truncation=True
            ).to(self.device)
            
            # Generate expansion
            outputs = self.model.generate(
                **inputs,
                max_length=128,
                num_beams=4,
                temperature=0.7,
                no_repeat_ngram_size=2
            )
            
            expanded = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            return {
                "original_query": query,
                "expanded_query": expanded,
                "model_name": self.model_name,
                "device": self.device.type if hasattr(self.device, "type") else str(self.device),
                "context_used": bool(context)
            }
            
        except Exception as e:
            raise QueryExpansionError(f"Failed to expand query: {str(e)}")
            
    async def expand_queries(self, queries: List[str], context: Optional[Dict] = None) -> List[Dict[str, Any]]:
        """Expand multiple queries in batch.
        
        Args:
            queries: List of queries to expand
            context: Optional shared context
            
        Returns:
            List of expansion results
        """
        try:
            results = []
            for query in queries:
                result = await self.expand_query(query, context)
                results.append(result)
            return results
            
        except Exception as e:
            raise QueryExpansionError(f"Failed to expand queries in batch: {str(e)}") 