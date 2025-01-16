"""Query processing and expansion module."""

from typing import List, Dict, Any, Optional, Tuple
from transformers import T5ForConditionalGeneration, T5Tokenizer
import torch
import logging
from dataclasses import dataclass

from rag_aether.core.errors import QueryProcessingError
from rag_aether.core.performance import with_performance_monitoring, performance_section

logger = logging.getLogger(__name__)

@dataclass
class ExpandedQuery:
    """A query with its expansions and metadata."""
    original: str
    expanded: str
    metadata: Optional[Dict[str, Any]] = None

class QueryProcessor:
    """Processes and expands queries using T5."""

    def __init__(
        self,
        model_name: str = "t5-small",
        device: Optional[str] = None,
        max_length: int = 512,
        num_return_sequences: int = 1,
        temperature: float = 0.7,
    ):
        """Initialize the query processor.
        
        Args:
            model_name: Name of the T5 model to use
            device: Device to run model on (cuda/cpu)
            max_length: Maximum length of expanded query
            num_return_sequences: Number of expansions to generate
            temperature: Sampling temperature
        """
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.model = T5ForConditionalGeneration.from_pretrained(model_name).to(self.device)
        self.tokenizer = T5Tokenizer.from_pretrained(model_name)
        
        self.max_length = max_length
        self.num_return_sequences = num_return_sequences
        self.temperature = temperature

    @with_performance_monitoring
    def process(self, query: str, context: Optional[str] = None) -> ExpandedQuery:
        """Process and expand a query.
        
        Args:
            query: Query text to expand
            context: Optional context to help with expansion
            
        Returns:
            ExpandedQuery with original and expanded queries
        """
        with performance_section("query_processing"):
            try:
                # Prepare input
                input_text = f"expand query: {query}"
                if context:
                    input_text = f"context: {context}\n{input_text}"
                    
                # Tokenize
                inputs = self.tokenizer(
                    input_text,
                    return_tensors="pt",
                    max_length=self.max_length,
                    truncation=True
                ).to(self.device)
                
                # Generate expansion
                outputs = self.model.generate(
                    **inputs,
                    max_length=self.max_length,
                    num_return_sequences=self.num_return_sequences,
                    temperature=self.temperature,
                    do_sample=True
                )
                
                # Decode expansion
                expanded = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
                
                metadata = {
                    "model": self.model.name_or_path,
                    "context_length": len(context) if context else 0,
                    "temperature": self.temperature
                }
                
                return ExpandedQuery(
                    original=query,
                    expanded=expanded,
                    metadata=metadata
                )
                
            except Exception as e:
                logger.error(f"Error processing query: {str(e)}")
                raise QueryProcessingError(f"Failed to process query: {str(e)}")

    @with_performance_monitoring
    def process_batch(
        self,
        queries: List[str],
        contexts: Optional[List[str]] = None
    ) -> List[ExpandedQuery]:
        """Process multiple queries in batch.
        
        Args:
            queries: List of queries to process
            contexts: Optional list of contexts for each query
            
        Returns:
            List of ExpandedQuery objects
        """
        if contexts and len(queries) != len(contexts):
            raise ValueError("Number of queries and contexts must match")
            
        results = []
        for i, query in enumerate(queries):
            context = contexts[i] if contexts else None
            results.append(self.process(query, context))
            
        return results 

class QueryExpander:
    """Expands queries using T5 model."""
    def __init__(self, model_name: str = "t5-base"):
        self.model = T5ForConditionalGeneration.from_pretrained(model_name)
        self.tokenizer = T5Tokenizer.from_pretrained(model_name)
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model.to(self.device)

    @with_performance_monitoring
    def expand_query(self, query: str, max_length: int = 100) -> ExpandedQuery:
        """Expand a query using T5."""
        try:
            with performance_section("query_expansion"):
                input_text = f"expand query: {query}"
                input_ids = self.tokenizer.encode(input_text, return_tensors="pt").to(self.device)
                
                outputs = self.model.generate(
                    input_ids,
                    max_length=max_length,
                    num_beams=4,
                    no_repeat_ngram_size=2,
                    early_stopping=True
                )
                
                expanded = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
                
                return ExpandedQuery(
                    original=query,
                    expanded=expanded,
                    metadata={
                        "model": self.model.name_or_path,
                        "device": str(self.device)
                    }
                )
        except Exception as e:
            logger.error(f"Error expanding query: {e}")
            raise QueryProcessingError(f"Failed to expand query: {e}")

    @with_performance_monitoring
    def batch_expand(self, queries: List[str], max_length: int = 100) -> List[ExpandedQuery]:
        """Expand multiple queries in batch."""
        try:
            with performance_section("batch_query_expansion"):
                input_texts = [f"expand query: {q}" for q in queries]
                inputs = self.tokenizer(input_texts, return_tensors="pt", padding=True).to(self.device)
                
                outputs = self.model.generate(
                    inputs.input_ids,
                    max_length=max_length,
                    num_beams=4,
                    no_repeat_ngram_size=2,
                    early_stopping=True
                )
                
                expanded_texts = self.tokenizer.batch_decode(outputs, skip_special_tokens=True)
                
                return [
                    ExpandedQuery(
                        original=query,
                        expanded=expanded,
                        metadata={
                            "model": self.model.name_or_path,
                            "device": str(self.device)
                        }
                    )
                    for query, expanded in zip(queries, expanded_texts)
                ]
        except Exception as e:
            logger.error(f"Error in batch query expansion: {e}")
            raise QueryProcessingError(f"Failed to expand queries in batch: {e}") 