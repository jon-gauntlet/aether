"""Quality monitoring system for RAG."""

from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional
from datetime import datetime
import json
import nltk
from transformers import AutoTokenizer, AutoModel
import torch
import numpy as np
from ..core.performance import track_operation
from sentence_transformers import SentenceTransformer, util

@dataclass
class QualityMetrics:
    """Quality metrics for RAG responses."""
    relevance_score: float
    coherence_score: float
    factual_accuracy: float
    response_time: float
    token_count: int
    metadata: Dict[str, Any] = field(default_factory=dict)
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())

@dataclass
class QualityFeedback:
    """User feedback on RAG responses."""
    response_id: str
    rating: int
    feedback_text: Optional[str] = None
    categories: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())

class QualityMonitor:
    """Monitors and evaluates quality of RAG operations."""
    
    def __init__(self, thresholds: Optional[Dict[str, float]] = None):
        """Initialize quality monitor."""
        self.thresholds = thresholds or {
            'relevance': 0.7,
            'coherence': 0.6,
            'factual_accuracy': 0.8,
            'response_time': 2.0,
            'token_ratio': 0.8
        }
        self.metrics_history: List[QualityMetrics] = []
        self.feedback_history: List[QualityFeedback] = []
        
    def evaluate_response(
        self,
        query: str,
        response: str,
        context: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> QualityMetrics:
        """Evaluate response quality."""
        start_time = datetime.now()
        
        # Initialize quality system for evaluation
        quality_system = QualitySystem()
        
        # Compute metrics
        metrics = quality_system.compute_metrics(query, response, context)
        
        # Add metadata
        if metadata:
            metrics.metadata.update(metadata)
            
        # Store metrics
        self.metrics_history.append(metrics)
        
        return metrics
        
    def record_feedback(self, feedback: QualityFeedback) -> None:
        """Record user feedback."""
        self.feedback_history.append(feedback)
        
    def check_quality_threshold(self, metrics: QualityMetrics) -> bool:
        """Check if quality metrics meet thresholds."""
        checks = [
            metrics.relevance_score >= self.thresholds['relevance'],
            metrics.coherence_score >= self.thresholds['coherence'],
            metrics.factual_accuracy >= self.thresholds['factual_accuracy'],
            metrics.response_time <= self.thresholds['response_time']
        ]
        return all(checks)
        
    def get_quality_stats(self) -> Dict[str, Any]:
        """Get quality statistics."""
        if not self.metrics_history:
            return {}
            
        stats = {
            'relevance': np.mean([m.relevance_score for m in self.metrics_history]),
            'coherence': np.mean([m.coherence_score for m in self.metrics_history]),
            'factual_accuracy': np.mean([m.factual_accuracy for m in self.metrics_history]),
            'avg_response_time': np.mean([m.response_time for m in self.metrics_history]),
            'avg_token_count': np.mean([m.token_count for m in self.metrics_history])
        }
        
        if self.feedback_history:
            stats['avg_rating'] = np.mean([f.rating for f in self.feedback_history])
            
        return stats
        
    def to_json(self) -> str:
        """Convert quality data to JSON string."""
        return json.dumps({
            'metrics_history': [vars(m) for m in self.metrics_history],
            'feedback_history': [vars(f) for f in self.feedback_history],
            'thresholds': self.thresholds,
            'stats': self.get_quality_stats()
        })

class QualitySystem:
    """System for monitoring and improving RAG quality."""
    
    def __init__(self, model_name: str = "BAAI/bge-small-en"):
        """Initialize quality evaluation system
        
        Args:
            model_name: Name of the embedding model to use
        """
        self.model = SentenceTransformer(model_name)
        
    def evaluate_response(self, 
                         query: str, 
                         response: str, 
                         context: Optional[str] = None) -> Dict[str, float]:
        """Evaluate response quality
        
        Args:
            query: Original query
            response: Generated response
            context: Optional context used for generation
            
        Returns:
            Dictionary of quality metrics
        """
        metrics = {
            "relevance": self._evaluate_relevance(query, response),
            "coherence": self._evaluate_coherence(response),
            "factuality": self._evaluate_factuality(response, context) if context else 1.0,
            "context_adherence": self._evaluate_context_adherence(response, context) if context else 1.0
        }
        
        # Overall quality score
        metrics["overall_quality"] = np.mean(list(metrics.values()))
        
        return metrics
        
    def _evaluate_relevance(self, query: str, response: str) -> float:
        """Evaluate response relevance to query
        
        Args:
            query: Original query
            response: Generated response
            
        Returns:
            Relevance score between 0 and 1
        """
        # Encode query and response
        query_embedding = self.model.encode(query)
        response_embedding = self.model.encode(response)
        
        # Compute cosine similarity
        similarity = util.cos_sim(query_embedding, response_embedding)
        
        return float(similarity[0][0])
        
    def _evaluate_coherence(self, response: str) -> float:
        """Evaluate response coherence
        
        Args:
            response: Generated response
            
        Returns:
            Coherence score between 0 and 1
        """
        # Split into sentences
        sentences = response.split(". ")
        if len(sentences) < 2:
            return 1.0
            
        # Encode sentences
        embeddings = self.model.encode(sentences)
        
        # Compute pairwise similarities
        similarities = []
        for i in range(len(sentences)-1):
            sim = util.cos_sim(embeddings[i], embeddings[i+1])
            similarities.append(float(sim[0][0]))
            
        return np.mean(similarities)
        
    def _evaluate_factuality(self, response: str, context: str) -> float:
        """Evaluate response factual accuracy against context
        
        Args:
            response: Generated response
            context: Context used for generation
            
        Returns:
            Factuality score between 0 and 1
        """
        # Encode response and context
        response_embedding = self.model.encode(response)
        context_embedding = self.model.encode(context)
        
        # Compute semantic similarity
        similarity = util.cos_sim(response_embedding, context_embedding)
        
        return float(similarity[0][0])
        
    def _evaluate_context_adherence(self, response: str, context: str) -> float:
        """Evaluate how well response adheres to given context
        
        Args:
            response: Generated response
            context: Context used for generation
            
        Returns:
            Context adherence score between 0 and 1
        """
        # Encode response and context
        response_embedding = self.model.encode(response)
        context_embedding = self.model.encode(context)
        
        # Compute semantic similarity with focus on context coverage
        similarity = util.cos_sim(response_embedding, context_embedding)
        
        return float(similarity[0][0])
        
    def get_improvement_suggestions(self, metrics: Dict[str, float]) -> List[str]:
        """Get suggestions for improving response quality
        
        Args:
            metrics: Quality metrics from evaluate_response
            
        Returns:
            List of improvement suggestions
        """
        suggestions = []
        
        if metrics["relevance"] < 0.7:
            suggestions.append("Response could be more relevant to the query")
            
        if metrics["coherence"] < 0.7:
            suggestions.append("Response could be more coherent and better structured")
            
        if metrics.get("factuality", 1.0) < 0.7:
            suggestions.append("Response could better align with provided context")
            
        if metrics.get("context_adherence", 1.0) < 0.7:
            suggestions.append("Response could make better use of context information")
            
        return suggestions
        
    def compute_metrics(self, query: str, response: str, context: str) -> QualityMetrics:
        """Compute quality metrics for a response."""
        start_time = datetime.now()
        
        # Compute relevance score
        relevance = self._compute_semantic_similarity(query, response)
        
        # Compute coherence score
        coherence = self._compute_coherence(response)
        
        # Compute factual accuracy
        factual = self._compute_factual_accuracy(response, context)
        
        # Get response time
        response_time = (datetime.now() - start_time).total_seconds()
        
        # Count tokens
        tokens = len(self.tokenizer.encode(response))
        
        metrics = QualityMetrics(
            relevance_score=relevance,
            coherence_score=coherence,
            factual_accuracy=factual,
            response_time=response_time,
            token_count=tokens
        )
        
        self.metrics_history.append(metrics)
        return metrics
        
    def record_feedback(self, feedback: QualityFeedback) -> None:
        """Record user feedback."""
        self.feedback_history.append(feedback)
        
    def get_quality_stats(self) -> Dict[str, Any]:
        """Get quality statistics."""
        if not self.metrics_history:
            return {}
            
        metrics = {
            'relevance': np.mean([m.relevance_score for m in self.metrics_history]),
            'coherence': np.mean([m.coherence_score for m in self.metrics_history]),
            'factual_accuracy': np.mean([m.factual_accuracy for m in self.metrics_history]),
            'avg_response_time': np.mean([m.response_time for m in self.metrics_history]),
            'avg_token_count': np.mean([m.token_count for m in self.metrics_history])
        }
        
        if self.feedback_history:
            metrics['avg_rating'] = np.mean([f.rating for f in self.feedback_history])
            
        return metrics
        
    def _compute_semantic_similarity(self, text1: str, text2: str) -> float:
        """Compute semantic similarity between two texts."""
        start_time = datetime.now()
        try:
            # Encode texts
            inputs1 = self.tokenizer(text1, return_tensors="pt", padding=True, truncation=True)
            inputs2 = self.tokenizer(text2, return_tensors="pt", padding=True, truncation=True)
            
            # Get embeddings
            with torch.no_grad():
                embedding1 = self.model(**inputs1).last_hidden_state.mean(dim=1)
                embedding2 = self.model(**inputs2).last_hidden_state.mean(dim=1)
                
            # Compute cosine similarity
            similarity = torch.nn.functional.cosine_similarity(embedding1, embedding2)
            return float(similarity[0])
            
        finally:
            duration = (datetime.now() - start_time).total_seconds()
            track_operation("semantic_similarity", duration, {
                "text1_length": len(text1),
                "text2_length": len(text2)
            })
        
    def _compute_coherence(self, text: str) -> float:
        """Compute text coherence score."""
        start_time = datetime.now()
        try:
            # Simple coherence based on sentence transitions
            sentences = nltk.sent_tokenize(text)
            if len(sentences) <= 1:
                return 1.0
                
            # Compute coherence as average similarity between adjacent sentences
            coherence_scores = []
            for i in range(len(sentences) - 1):
                score = self._compute_semantic_similarity(sentences[i], sentences[i + 1])
                coherence_scores.append(score)
                
            return float(np.mean(coherence_scores))
            
        finally:
            duration = (datetime.now() - start_time).total_seconds()
            track_operation("coherence_computation", duration, {
                "text_length": len(text),
                "sentence_count": len(sentences)
            })
        
    def _compute_factual_accuracy(self, response: str, context: str) -> float:
        """Compute factual accuracy score."""
        start_time = datetime.now()
        try:
            # Simple factual accuracy based on semantic similarity with context
            return self._compute_semantic_similarity(response, context)
            
        finally:
            duration = (datetime.now() - start_time).total_seconds()
            track_operation("factual_accuracy", duration, {
                "response_length": len(response),
                "context_length": len(context)
            })
        
    def to_json(self) -> str:
        """Convert quality data to JSON string."""
        return json.dumps({
            'metrics_history': [vars(m) for m in self.metrics_history],
            'feedback_history': [vars(f) for f in self.feedback_history],
            'thresholds': self.thresholds,
            'stats': self.get_quality_stats()
        }) 