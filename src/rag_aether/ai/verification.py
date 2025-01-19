"""Verification utilities for RAG system."""
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import numpy as np
import logging
from ..core.monitoring import monitor
from ..core.performance import with_performance_monitoring, performance_section

logger = logging.getLogger(__name__)

@dataclass
class VerificationResult:
    """Result of verification test."""
    passed: bool
    details: Dict[str, Any]
    error: Optional[str] = None

@with_performance_monitoring
def verify_embeddings(
    embeddings: np.ndarray,
    expected_dim: int = 1536
) -> VerificationResult:
    """Verify embedding quality and dimensions.
    
    Args:
        embeddings: Document embeddings
        expected_dim: Expected embedding dimension
        
    Returns:
        Verification result
    """
    with performance_section("verify_embeddings"):
        try:
            # Check dimensions
            if len(embeddings.shape) != 2:
                return VerificationResult(
                    passed=False,
                    details={'shape': embeddings.shape},
                    error="Invalid embedding shape - must be 2D array"
                )
                
            if embeddings.shape[1] != expected_dim:
                return VerificationResult(
                    passed=False,
                    details={'dim': embeddings.shape[1]},
                    error=f"Invalid embedding dimension - expected {expected_dim}"
                )
                
            # Check for NaN/inf values
            if np.any(np.isnan(embeddings)) or np.any(np.isinf(embeddings)):
                return VerificationResult(
                    passed=False,
                    details={'has_nan': np.any(np.isnan(embeddings)),
                            'has_inf': np.any(np.isinf(embeddings))},
                    error="Embeddings contain NaN or inf values"
                )
                
            # Check norms
            norms = np.linalg.norm(embeddings, axis=1)
            if np.any(norms == 0):
                return VerificationResult(
                    passed=False,
                    details={'zero_norms': np.sum(norms == 0)},
                    error="Some embeddings have zero norm"
                )
                
            return VerificationResult(
                passed=True,
                details={
                    'shape': embeddings.shape,
                    'mean_norm': float(np.mean(norms)),
                    'std_norm': float(np.std(norms))
                }
            )
            
        except Exception as e:
            return VerificationResult(
                passed=False,
                details={},
                error=f"Verification failed: {str(e)}"
            )

@with_performance_monitoring
def verify_retrieval(
    query_results: List[Dict[str, Any]],
    min_results: int = 1,
    min_score: float = 0.0
) -> VerificationResult:
    """Verify retrieval results.
    
    Args:
        query_results: List of retrieval results
        min_results: Minimum number of results expected
        min_score: Minimum similarity score threshold
        
    Returns:
        Verification result
    """
    with performance_section("verify_retrieval"):
        try:
            if len(query_results) < min_results:
                return VerificationResult(
                    passed=False,
                    details={'result_count': len(query_results)},
                    error=f"Too few results - expected at least {min_results}"
                )
                
            scores = [r.get('score', 0.0) for r in query_results]
            if any(s < min_score for s in scores):
                return VerificationResult(
                    passed=False,
                    details={'min_score': min(scores)},
                    error=f"Some scores below threshold {min_score}"
                )
                
            return VerificationResult(
                passed=True,
                details={
                    'result_count': len(query_results),
                    'mean_score': float(np.mean(scores)),
                    'min_score': float(min(scores)),
                    'max_score': float(max(scores))
                }
            )
            
        except Exception as e:
            return VerificationResult(
                passed=False,
                details={},
                error=f"Verification failed: {str(e)}"
            )

@with_performance_monitoring
def verify_rag_pipeline(
    query: str,
    response: Dict[str, Any],
    min_sources: int = 1
) -> VerificationResult:
    """Verify complete RAG pipeline results.
    
    Args:
        query: Original query
        response: RAG system response
        min_sources: Minimum number of sources expected
        
    Returns:
        Verification result
    """
    with performance_section("verify_pipeline"):
        try:
            # Check response structure
            if not isinstance(response.get('answer'), str):
                return VerificationResult(
                    passed=False,
                    details={'response_type': type(response.get('answer'))},
                    error="Missing or invalid answer"
                )
                
            sources = response.get('sources', [])
            if len(sources) < min_sources:
                return VerificationResult(
                    passed=False,
                    details={'source_count': len(sources)},
                    error=f"Too few sources - expected at least {min_sources}"
                )
                
            # Check source relevance
            query_terms = set(query.lower().split())
            source_relevance = []
            for source in sources:
                text = source.get('content', '').lower()
                text_terms = set(text.split())
                overlap = len(query_terms & text_terms) / len(query_terms)
                source_relevance.append(overlap)
                
            return VerificationResult(
                passed=True,
                details={
                    'source_count': len(sources),
                    'mean_relevance': float(np.mean(source_relevance)),
                    'min_relevance': float(min(source_relevance)),
                    'response_length': len(response['answer'])
                }
            )
            
        except Exception as e:
            return VerificationResult(
                passed=False,
                details={},
                error=f"Verification failed: {str(e)}"
            ) 