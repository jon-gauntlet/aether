"""Quality metrics and confidence scoring for RAG system."""
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
from dataclasses import dataclass
from rag_aether.core.logging import get_logger
from rag_aether.core.performance import with_performance_monitoring, performance_section
from rag_aether.core.errors import RAGError

logger = get_logger("quality")

@dataclass
class SourceAttribution:
    """Source attribution information."""
    text: str
    document_id: str
    section_title: Optional[str]
    page_number: Optional[int]
    chunk_id: str
    similarity_score: float
    confidence_score: float

@dataclass
class QualityMetrics:
    """Quality metrics for retrieval results."""
    relevance_score: float
    diversity_score: float
    confidence_score: float
    source_quality: float
    coverage_score: float
    attributes: Dict[str, Any]

class QualityScorer:
    """Calculate quality metrics and confidence scores."""
    
    def __init__(
        self,
        min_confidence_threshold: float = 0.7,
        min_relevance_threshold: float = 0.6,
        diversity_weight: float = 0.3
    ):
        """Initialize quality scorer."""
        self.min_confidence_threshold = min_confidence_threshold
        self.min_relevance_threshold = min_relevance_threshold
        self.diversity_weight = diversity_weight
        logger.info(
            "Initialized quality scorer",
            extra={
                "min_confidence_threshold": min_confidence_threshold,
                "min_relevance_threshold": min_relevance_threshold,
                "diversity_weight": diversity_weight
            }
        )
    
    @with_performance_monitoring(operation="score", component="quality")
    def calculate_metrics(
        self,
        query: str,
        results: List[Dict[str, Any]],
        embeddings: Optional[np.ndarray] = None
    ) -> QualityMetrics:
        """Calculate comprehensive quality metrics."""
        try:
            with performance_section("metrics", "quality"):
                # Calculate relevance score
                relevance_scores = [r["score"] for r in results]
                relevance_score = np.mean(relevance_scores)
                
                # Calculate diversity score
                if embeddings is not None:
                    diversity_score = self._calculate_diversity(embeddings)
                else:
                    diversity_score = self._calculate_text_diversity([r["text"] for r in results])
                
                # Calculate confidence score
                confidence_score = self._calculate_confidence(
                    relevance_scores,
                    diversity_score,
                    [r.get("source_quality", 1.0) for r in results]
                )
                
                # Calculate source quality
                source_quality = np.mean([r.get("source_quality", 1.0) for r in results])
                
                # Calculate coverage score
                coverage_score = self._calculate_coverage(query, results)
                
                return QualityMetrics(
                    relevance_score=float(relevance_score),
                    diversity_score=float(diversity_score),
                    confidence_score=float(confidence_score),
                    source_quality=float(source_quality),
                    coverage_score=float(coverage_score),
                    attributes={
                        "num_results": len(results),
                        "avg_length": np.mean([len(r["text"]) for r in results]),
                        "has_metadata": all("metadata" in r for r in results),
                        "min_score": float(min(relevance_scores)),
                        "max_score": float(max(relevance_scores))
                    }
                )
                
        except Exception as e:
            logger.error(f"Failed to calculate quality metrics: {str(e)}")
            raise RAGError(
                f"Quality metrics calculation failed: {str(e)}",
                operation="calculate_metrics",
                component="quality"
            )
    
    def _calculate_diversity(self, embeddings: np.ndarray) -> float:
        """Calculate diversity score using embeddings."""
        # Calculate pairwise cosine similarities
        similarities = np.dot(embeddings, embeddings.T)
        
        # Get upper triangle without diagonal
        upper_tri = similarities[np.triu_indices_from(similarities, k=1)]
        
        if len(upper_tri) == 0:
            return 1.0
            
        # Calculate diversity as 1 - average similarity
        return float(1.0 - np.mean(upper_tri))
    
    def _calculate_text_diversity(self, texts: List[str]) -> float:
        """Calculate diversity score using text features."""
        # Simple n-gram based diversity
        from collections import Counter
        
        # Get trigrams for each text
        def get_trigrams(text: str) -> set:
            words = text.lower().split()
            return set(' '.join(words[i:i+3]) for i in range(len(words)-2))
        
        # Calculate overlap between texts
        trigrams_sets = [get_trigrams(text) for text in texts]
        total_overlap = 0
        comparisons = 0
        
        for i in range(len(trigrams_sets)):
            for j in range(i+1, len(trigrams_sets)):
                if trigrams_sets[i] and trigrams_sets[j]:
                    overlap = len(trigrams_sets[i] & trigrams_sets[j]) / len(trigrams_sets[i] | trigrams_sets[j])
                    total_overlap += overlap
                    comparisons += 1
        
        if comparisons == 0:
            return 1.0
            
        return float(1.0 - (total_overlap / comparisons))
    
    def _calculate_confidence(
        self,
        relevance_scores: List[float],
        diversity_score: float,
        source_qualities: List[float]
    ) -> float:
        """Calculate confidence score."""
        # Weighted combination of factors
        avg_relevance = np.mean(relevance_scores)
        avg_source_quality = np.mean(source_qualities)
        
        # Higher weight to relevance, but consider diversity and source quality
        confidence = (
            0.5 * avg_relevance +
            0.3 * diversity_score +
            0.2 * avg_source_quality
        )
        
        # Apply sigmoid to get score between 0 and 1
        confidence = 1 / (1 + np.exp(-5 * (confidence - 0.5)))
        
        return float(confidence)
    
    def _calculate_coverage(self, query: str, results: List[Dict[str, Any]]) -> float:
        """Calculate query coverage score."""
        # Extract key terms from query
        query_terms = set(query.lower().split())
        
        # Calculate coverage for each result
        coverages = []
        for result in results:
            text_terms = set(result["text"].lower().split())
            if query_terms:
                coverage = len(query_terms & text_terms) / len(query_terms)
                coverages.append(coverage)
        
        if not coverages:
            return 0.0
            
        # Weight earlier results more heavily
        weights = np.exp(-np.arange(len(coverages)) / 2)  # Exponential decay
        weights = weights / weights.sum()
        
        return float(np.average(coverages, weights=weights))

class SourceAttributor:
    """Handle source attribution for retrieved results."""
    
    def __init__(self):
        """Initialize source attributor."""
        logger.info("Initialized source attributor")
    
    @with_performance_monitoring(operation="attribute", component="source_attribution")
    def add_attribution(
        self,
        results: List[Dict[str, Any]],
        quality_metrics: QualityMetrics
    ) -> List[SourceAttribution]:
        """Add source attribution to results."""
        try:
            attributions = []
            
            for result in results:
                metadata = result.get("metadata", {})
                
                attribution = SourceAttribution(
                    text=result["text"],
                    document_id=metadata.get("document_id", "unknown"),
                    section_title=metadata.get("section_title"),
                    page_number=metadata.get("page_number"),
                    chunk_id=metadata.get("chunk_id", "unknown"),
                    similarity_score=result["score"],
                    confidence_score=quality_metrics.confidence_score
                )
                
                attributions.append(attribution)
            
            return attributions
            
        except Exception as e:
            logger.error(f"Failed to add source attribution: {str(e)}")
            raise RAGError(
                f"Source attribution failed: {str(e)}",
                operation="add_attribution",
                component="source_attribution"
            )

class ResultDiversifier:
    """Enhance diversity in retrieval results."""
    
    def __init__(
        self,
        diversity_threshold: float = 0.3,
        max_similarity: float = 0.8
    ):
        """Initialize result diversifier."""
        self.diversity_threshold = diversity_threshold
        self.max_similarity = max_similarity
        logger.info(
            "Initialized result diversifier",
            extra={
                "diversity_threshold": diversity_threshold,
                "max_similarity": max_similarity
            }
        )
    
    @with_performance_monitoring(operation="diversify", component="diversity")
    def diversify_results(
        self,
        results: List[Dict[str, Any]],
        embeddings: Optional[np.ndarray] = None,
        min_results: int = 3
    ) -> List[Dict[str, Any]]:
        """Diversify results while maintaining relevance."""
        try:
            if len(results) <= min_results:
                return results
                
            # If embeddings provided, use them for diversity
            if embeddings is not None:
                return self._diversify_with_embeddings(
                    results,
                    embeddings,
                    min_results
                )
            
            # Otherwise use text-based diversity
            return self._diversify_with_text(
                results,
                min_results
            )
            
        except Exception as e:
            logger.error(f"Failed to diversify results: {str(e)}")
            raise RAGError(
                f"Result diversification failed: {str(e)}",
                operation="diversify_results",
                component="diversity"
            )
    
    def _diversify_with_embeddings(
        self,
        results: List[Dict[str, Any]],
        embeddings: np.ndarray,
        min_results: int
    ) -> List[Dict[str, Any]]:
        """Diversify results using embedding similarities."""
        # Start with highest scoring result
        selected_indices = [0]
        remaining_indices = list(range(1, len(results)))
        
        while len(selected_indices) < min_results and remaining_indices:
            # Calculate max similarity to selected results
            max_similarities = []
            for idx in remaining_indices:
                similarities = [
                    np.dot(embeddings[idx], embeddings[selected])
                    for selected in selected_indices
                ]
                max_similarities.append(max(similarities))
            
            # Select result with lowest max similarity
            best_idx = min(
                range(len(remaining_indices)),
                key=lambda i: max_similarities[i]
            )
            
            if max_similarities[best_idx] > self.max_similarity:
                break
                
            selected_indices.append(remaining_indices[best_idx])
            remaining_indices.pop(best_idx)
        
        # Add remaining results if needed
        while len(selected_indices) < min_results and remaining_indices:
            selected_indices.append(remaining_indices.pop(0))
        
        # Return diversified results
        return [results[i] for i in selected_indices]
    
    def _diversify_with_text(
        self,
        results: List[Dict[str, Any]],
        min_results: int
    ) -> List[Dict[str, Any]]:
        """Diversify results using text features."""
        from collections import Counter
        
        # Get trigrams for each result
        def get_trigrams(text: str) -> set:
            words = text.lower().split()
            return set(' '.join(words[i:i+3]) for i in range(len(words)-2))
        
        trigrams_list = [get_trigrams(r["text"]) for r in results]
        
        # Start with highest scoring result
        selected_indices = [0]
        remaining_indices = list(range(1, len(results)))
        
        while len(selected_indices) < min_results and remaining_indices:
            # Calculate max overlap with selected results
            max_overlaps = []
            for idx in remaining_indices:
                overlaps = [
                    len(trigrams_list[idx] & trigrams_list[selected]) / len(trigrams_list[idx] | trigrams_list[selected])
                    for selected in selected_indices
                ]
                max_overlaps.append(max(overlaps))
            
            # Select result with lowest max overlap
            best_idx = min(
                range(len(remaining_indices)),
                key=lambda i: max_overlaps[i]
            )
            
            if max_overlaps[best_idx] > self.diversity_threshold:
                break
                
            selected_indices.append(remaining_indices[best_idx])
            remaining_indices.pop(best_idx)
        
        # Add remaining results if needed
        while len(selected_indices) < min_results and remaining_indices:
            selected_indices.append(remaining_indices.pop(0))
        
        # Return diversified results
        return [results[i] for i in selected_indices] 