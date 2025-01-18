"""Quality assessment and feedback system."""

from typing import Any, Dict, List, Optional, Tuple, Union
from dataclasses import dataclass
import json
import logging
from pathlib import Path
import numpy as np
from sentence_transformers import SentenceTransformer

from ..errors import QualityError

logger = logging.getLogger(__name__)

@dataclass
class QualityMetrics:
    """Container for quality metrics."""
    
    relevance_score: float
    coherence_score: float
    completeness_score: float
    accuracy_score: Optional[float] = None
    source_quality_score: Optional[float] = None
    
    def to_dict(self) -> Dict[str, float]:
        """Convert metrics to dictionary."""
        return {
            'relevance_score': self.relevance_score,
            'coherence_score': self.coherence_score,
            'completeness_score': self.completeness_score,
            'accuracy_score': self.accuracy_score,
            'source_quality_score': self.source_quality_score
        }
        
    @classmethod
    def from_dict(cls, data: Dict[str, float]) -> 'QualityMetrics':
        """Create metrics from dictionary."""
        return cls(**data)

@dataclass
class QualityFeedback:
    """Container for quality feedback."""
    
    query: str
    response: str
    metrics: QualityMetrics
    feedback: str
    timestamp: float
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert feedback to dictionary."""
        return {
            'query': self.query,
            'response': self.response,
            'metrics': self.metrics.to_dict(),
            'feedback': self.feedback,
            'timestamp': self.timestamp
        }
        
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'QualityFeedback':
        """Create feedback from dictionary."""
        data['metrics'] = QualityMetrics.from_dict(data['metrics'])
        return cls(**data)

class QualitySystem:
    """Manages quality assessment and feedback."""
    
    def __init__(self, 
                 model_name: str = "all-MiniLM-L6-v2",
                 feedback_dir: Optional[str] = None,
                 min_relevance_score: float = 0.7,
                 min_coherence_score: float = 0.7,
                 min_completeness_score: float = 0.7):
        """Initialize the quality system.
        
        Args:
            model_name: Name of the sentence transformer model
            feedback_dir: Directory to store feedback
            min_relevance_score: Minimum acceptable relevance score
            min_coherence_score: Minimum acceptable coherence score
            min_completeness_score: Minimum acceptable completeness score
        """
        self.model = SentenceTransformer(model_name)
        self.feedback_dir = Path(feedback_dir or '.feedback')
        self.feedback_dir.mkdir(exist_ok=True)
        
        self.min_scores = {
            'relevance': min_relevance_score,
            'coherence': min_coherence_score,
            'completeness': min_completeness_score
        }
        
    def _get_feedback_path(self) -> Path:
        """Get path for feedback file."""
        return self.feedback_dir / "quality_feedback.json"
        
    def compute_relevance_score(self, query: str, response: str) -> float:
        """Compute semantic similarity between query and response."""
        try:
            query_embedding = self.model.encode([query])[0]
            response_embedding = self.model.encode([response])[0]
            
            similarity = np.dot(query_embedding, response_embedding) / (
                np.linalg.norm(query_embedding) * np.linalg.norm(response_embedding)
            )
            return float(similarity)
            
        except Exception as e:
            raise QualityError(f"Failed to compute relevance score: {e}")
            
    def compute_coherence_score(self, response: str) -> float:
        """Compute coherence score for response."""
        try:
            # Split into sentences and compute pairwise similarities
            sentences = response.split('.')
            if len(sentences) < 2:
                return 1.0
                
            embeddings = self.model.encode(sentences)
            similarities = []
            
            for i in range(len(embeddings) - 1):
                similarity = np.dot(embeddings[i], embeddings[i+1]) / (
                    np.linalg.norm(embeddings[i]) * np.linalg.norm(embeddings[i+1])
                )
                similarities.append(similarity)
                
            return float(np.mean(similarities))
            
        except Exception as e:
            raise QualityError(f"Failed to compute coherence score: {e}")
            
    def compute_completeness_score(self, response: str) -> float:
        """Compute completeness score for response."""
        try:
            # Simple heuristic based on response length and structure
            words = response.split()
            sentences = response.split('.')
            
            if len(words) < 10:
                return 0.5
            elif len(words) > 100:
                return 1.0
                
            # Check for presence of key structural elements
            has_intro = len(sentences) > 1
            has_body = len(sentences) > 2
            has_conclusion = len(sentences) > 3
            
            score = 0.6  # Base score
            if has_intro:
                score += 0.1
            if has_body:
                score += 0.2
            if has_conclusion:
                score += 0.1
                
            return score
            
        except Exception as e:
            raise QualityError(f"Failed to compute completeness score: {e}")
            
    def assess_quality(self, 
                      query: str, 
                      response: str,
                      accuracy_score: Optional[float] = None,
                      source_quality_score: Optional[float] = None) -> QualityMetrics:
        """Assess quality of a response."""
        try:
            metrics = QualityMetrics(
                relevance_score=self.compute_relevance_score(query, response),
                coherence_score=self.compute_coherence_score(response),
                completeness_score=self.compute_completeness_score(response),
                accuracy_score=accuracy_score,
                source_quality_score=source_quality_score
            )
            return metrics
            
        except Exception as e:
            raise QualityError(f"Failed to assess quality: {e}")
            
    def check_quality(self, metrics: QualityMetrics) -> Tuple[bool, List[str]]:
        """Check if quality metrics meet minimum requirements."""
        issues = []
        
        if metrics.relevance_score < self.min_scores['relevance']:
            issues.append(f"Low relevance score: {metrics.relevance_score:.2f}")
            
        if metrics.coherence_score < self.min_scores['coherence']:
            issues.append(f"Low coherence score: {metrics.coherence_score:.2f}")
            
        if metrics.completeness_score < self.min_scores['completeness']:
            issues.append(f"Low completeness score: {metrics.completeness_score:.2f}")
            
        return len(issues) == 0, issues
        
    def store_feedback(self, feedback: QualityFeedback) -> None:
        """Store quality feedback."""
        try:
            feedback_path = self._get_feedback_path()
            
            # Load existing feedback
            if feedback_path.exists():
                with open(feedback_path) as f:
                    data = json.load(f)
            else:
                data = []
                
            # Add new feedback
            data.append(feedback.to_dict())
            
            # Save updated feedback
            with open(feedback_path, 'w') as f:
                json.dump(data, f)
                
        except Exception as e:
            raise QualityError(f"Failed to store feedback: {e}")
            
    def get_feedback(self) -> List[QualityFeedback]:
        """Get stored quality feedback."""
        try:
            feedback_path = self._get_feedback_path()
            if not feedback_path.exists():
                return []
                
            with open(feedback_path) as f:
                data = json.load(f)
                return [QualityFeedback.from_dict(d) for d in data]
                
        except Exception as e:
            raise QualityError(f"Failed to load feedback: {e}")
            
    def analyze_feedback(self) -> Dict[str, Any]:
        """Analyze stored feedback for patterns."""
        feedback_list = self.get_feedback()
        if not feedback_list:
            return {}
            
        analysis = {
            'total_feedback': len(feedback_list),
            'average_scores': {
                'relevance': np.mean([f.metrics.relevance_score for f in feedback_list]),
                'coherence': np.mean([f.metrics.coherence_score for f in feedback_list]),
                'completeness': np.mean([f.metrics.completeness_score for f in feedback_list])
            },
            'score_distributions': {
                'relevance': self._compute_distribution([f.metrics.relevance_score for f in feedback_list]),
                'coherence': self._compute_distribution([f.metrics.coherence_score for f in feedback_list]),
                'completeness': self._compute_distribution([f.metrics.completeness_score for f in feedback_list])
            }
        }
        
        return analysis
        
    def _compute_distribution(self, values: List[float]) -> Dict[str, float]:
        """Compute distribution statistics for a list of values."""
        return {
            'mean': float(np.mean(values)),
            'std': float(np.std(values)),
            'min': float(np.min(values)),
            'max': float(np.max(values)),
            'p25': float(np.percentile(values, 25)),
            'p50': float(np.percentile(values, 50)),
            'p75': float(np.percentile(values, 75))
        } 