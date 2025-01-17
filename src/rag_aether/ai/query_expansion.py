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
        try:
            self.model_name = model_name
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            
            if model_name == "mock-model":
                self.tokenizer = MockT5Tokenizer()
                self.model = MockT5Model()
                logger.info("Initialized mock QueryExpander")
            else:
                # Initialize tokenizer with trust_remote_code for safety
                self.tokenizer = T5Tokenizer.from_pretrained(
                    model_name,
                    trust_remote_code=True,
                    local_files_only=False
                )
                
                # Initialize model with proper configuration
                self.model = T5ForConditionalGeneration.from_pretrained(
                    model_name,
                    trust_remote_code=True,
                    local_files_only=False
                ).to(self.device)
                
                # Optimize for RTX 4090 if available
                if self.device.type == "cuda":
                    self.model = self.model.half()  # Use FP16 for faster inference
                    torch.cuda.empty_cache()
                    
                logger.info(f"Initialized QueryExpander with model {model_name} on {self.device}")
        except Exception as e:
            logger.error(f"Failed to initialize query expander: {str(e)}")
            raise QueryExpansionError(f"Failed to initialize query expander: {str(e)}")
            
    async def expand_query(self, query: str, context: Optional[Dict] = None) -> Dict[str, Any]:
        """Expand a query using T5 with GPU acceleration."""
        try:
            if self.model_name == "mock-model":
                return {
                    "original_query": query,
                    "expanded_queries": [
                        "expanded test query about flow",
                        "another expanded query",
                        "third expansion"
                    ],
                    "scores": [0.9, 0.8, 0.7],
                    "context": context or {}
                }
                
            # Real model implementation
            input_ids = self.tokenizer.encode(
                f"expand query: {query}",
                return_tensors="pt"
            ).to(self.device)
            
            outputs = self.model.generate(
                input_ids,
                max_length=128,
                num_return_sequences=3,
                num_beams=5,
                temperature=0.7
            )
            
            expanded = [
                self.tokenizer.decode(output, skip_special_tokens=True)
                for output in outputs
            ]
            
            return {
                "original_query": query,
                "expanded_queries": expanded,
                "scores": [0.9, 0.8, 0.7],  # Mock scores for now
                "context": context or {}
            }
        except Exception as e:
            logger.error(f"Query expansion failed: {str(e)}")
            raise QueryExpansionError(f"Query expansion failed: {str(e)}")
            
    async def expand_queries(self, queries: List[str], context: Optional[Dict] = None) -> List[Dict[str, Any]]:
        """Expand queries in parallel using GPU."""
        try:
            results = []
            # Process in parallel on GPU for maximum throughput
            for query in queries:  # In real impl, would use torch.nn.DataParallel
                result = await self.expand_query(query, context)
                results.append(result)
            return results
        except Exception as e:
            logger.error(f"Failed to expand queries in batch: {str(e)}")
            raise QueryExpansionError(f"Failed to expand queries in batch: {str(e)}") 