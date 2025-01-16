"""Query expansion module for RAG system."""

from typing import Dict, Any, List, Optional
import logging
from transformers import T5Tokenizer, T5ForConditionalGeneration
from ..core.errors import QueryExpansionError
from ..core.performance import with_performance_monitoring

logger = logging.getLogger(__name__)

class QueryExpander:
    """Query expansion using T5 model."""
    
    def __init__(self, model_name: str = "t5-small"):
        """Initialize query expander.
        
        Args:
            model_name: Name of the model to use for query expansion
        """
        try:
            self.model_name = "t5-small"  # Always use t5-small for query expansion
            self.tokenizer = T5Tokenizer.from_pretrained(self.model_name)
            self.model = T5ForConditionalGeneration.from_pretrained(self.model_name)
        except Exception as e:
            raise QueryExpansionError(f"Failed to initialize query expander: {str(e)}")
            
    @with_performance_monitoring(operation="expand_query")
    async def expand_query(self, query: str) -> str:
        """Expand a query using T5.
        
        Args:
            query: Query to expand
            
        Returns:
            Expanded query
        """
        try:
            # Prepare input
            input_text = f"expand query: {query}"
            input_ids = self.tokenizer(input_text, return_tensors="pt").input_ids
            
            # Generate expanded query
            outputs = self.model.generate(
                input_ids,
                max_length=128,
                num_beams=4,
                early_stopping=True
            )
            expanded = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            return expanded
            
        except Exception as e:
            raise QueryExpansionError(f"Failed to expand query: {str(e)}")
            
    @with_performance_monitoring(operation="expand_queries")
    async def expand_queries(self, queries: List[str]) -> List[str]:
        """Expand multiple queries in batch.
        
        Args:
            queries: List of queries to expand
            
        Returns:
            List of expanded queries
        """
        try:
            expanded = []
            for query in queries:
                result = await self.expand_query(query)
                expanded.append(result)
            return expanded
            
        except Exception as e:
            raise QueryExpansionError(f"Failed to expand queries in batch: {str(e)}")
            
    def __del__(self):
        """Clean up resources."""
        # Clean up any resources if needed
        pass 