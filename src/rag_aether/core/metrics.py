"""Core metrics for evaluating RAG system performance."""
from typing import List, Dict, Any, Optional
import numpy as np
from dataclasses import dataclass
import time
import logging

logger = logging.getLogger(__name__)

@dataclass
class RetrievalMetrics:
    """Metrics for retrieval performance."""
    mrr: float
    ndcg: float
    recall_at_k: Dict[int, float]
    latency_ms: float
    num_results: int

@dataclass
class QueryMetrics:
    """Complete metrics for a query."""
    retrieval: RetrievalMetrics
    generation_time_ms: float
    total_time_ms: float
    num_tokens: int

def mean_reciprocal_rank(relevant_docs: List[str], retrieved_docs: List[str]) -> float:
    """Calculate Mean Reciprocal Rank (MRR).
    
    Args:
        relevant_docs: List of relevant document IDs
        retrieved_docs: List of retrieved document IDs in rank order
    
    Returns:
        MRR score between 0 and 1
    """
    for rank, doc_id in enumerate(retrieved_docs):
        if doc_id in relevant_docs:
            return 1.0 / (rank + 1)
    return 0.0

def normalized_dcg(relevant_docs: List[str], retrieved_docs: List[str], k: Optional[int] = None) -> float:
    """Calculate Normalized Discounted Cumulative Gain (NDCG).
    
    Args:
        relevant_docs: List of relevant document IDs
        retrieved_docs: List of retrieved document IDs in rank order
        k: Number of results to consider (optional)
    
    Returns:
        NDCG score between 0 and 1
    """
    if k is not None:
        retrieved_docs = retrieved_docs[:k]
        
    dcg = 0.0
    idcg = 0.0
    
    # Calculate DCG
    for i, doc_id in enumerate(retrieved_docs):
        rel = 1 if doc_id in relevant_docs else 0
        dcg += rel / np.log2(i + 2)  # i + 2 because log_2(1) = 0
        
    # Calculate IDCG
    num_rel = min(len(relevant_docs), len(retrieved_docs))
    for i in range(num_rel):
        idcg += 1 / np.log2(i + 2)
        
    return dcg / idcg if idcg > 0 else 0.0

def recall_at_k(relevant_docs: List[str], retrieved_docs: List[str], k: int) -> float:
    """Calculate Recall@K.
    
    Args:
        relevant_docs: List of relevant document IDs
        retrieved_docs: List of retrieved document IDs in rank order
        k: Number of results to consider
    
    Returns:
        Recall@K score between 0 and 1
    """
    if not relevant_docs:
        return 0.0
        
    retrieved_k = set(retrieved_docs[:k])
    relevant = set(relevant_docs)
    
    return len(retrieved_k.intersection(relevant)) / len(relevant)

class MetricsTracker:
    """Track and aggregate RAG system metrics."""
    
    def __init__(self):
        self.query_metrics: List[QueryMetrics] = []
        
    def add_query_metrics(self, metrics: QueryMetrics):
        """Add metrics for a query."""
        self.query_metrics.append(metrics)
        
    def get_average_metrics(self) -> Dict[str, float]:
        """Get averaged metrics across all queries."""
        if not self.query_metrics:
            return {}
            
        avg_metrics = {
            "mrr": np.mean([m.retrieval.mrr for m in self.query_metrics]),
            "ndcg": np.mean([m.retrieval.ndcg for m in self.query_metrics]),
            "retrieval_time_ms": np.mean([m.retrieval.latency_ms for m in self.query_metrics]),
            "generation_time_ms": np.mean([m.generation_time_ms for m in self.query_metrics]),
            "total_time_ms": np.mean([m.total_time_ms for m in self.query_metrics]),
            "avg_num_tokens": np.mean([m.num_tokens for m in self.query_metrics])
        }
        
        # Average Recall@K for each K
        recall_ks = self.query_metrics[0].retrieval.recall_at_k.keys()
        for k in recall_ks:
            avg_metrics[f"recall@{k}"] = np.mean([
                m.retrieval.recall_at_k[k] for m in self.query_metrics
            ])
            
        return avg_metrics
        
    def log_metrics(self):
        """Log current metrics."""
        avg_metrics = self.get_average_metrics()
        if not avg_metrics:
            logger.info("No metrics available")
            return
            
        logger.info("=== RAG System Metrics ===")
        logger.info(f"Number of queries: {len(self.query_metrics)}")
        for metric, value in avg_metrics.items():
            logger.info(f"{metric}: {value:.3f}")
        logger.info("=========================") 