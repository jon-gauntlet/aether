import asyncio
from dataclasses import dataclass
from datetime import datetime
import numpy as np
from sklearn.cluster import DBSCAN
from typing import List, Dict, Any, Optional
import uuid

from .learner import Pattern

@dataclass
class SynthesizerConfig:
    """Configuration for pattern synthesis."""
    clustering_min_samples: int = 2
    clustering_eps: float = 0.3
    min_confidence: float = 0.7
    max_patterns_per_cluster: int = 3
    feature_weights: Dict[str, float] = None
    
    def __post_init__(self):
        if self.feature_weights is None:
            self.feature_weights = {
                'complexity': 1.0,
                'confidence': 1.0,
                'coverage': 1.0,
                'success_rate': 1.0,
                'stability': 1.0
            }

class PatternSynthesizer:
    """Synthesizes new patterns from existing ones through clustering and merging."""
    
    def __init__(self, config: Optional[SynthesizerConfig] = None):
        self.config = config or SynthesizerConfig()
    
    async def synthesize(self, patterns: List[Pattern]) -> List[Pattern]:
        """Synthesize new patterns from existing ones."""
        if not patterns:
            return []
            
        # Cluster similar patterns
        clusters = await self._cluster_patterns(patterns)
        
        # Synthesize new patterns from each cluster
        synthesized = []
        for cluster in clusters:
            new_pattern = await self._synthesize_cluster(cluster)
            if new_pattern:
                synthesized.append(new_pattern)
        
        return synthesized
    
    async def analyze_synthesis_impact(
        self, 
        original_patterns: List[Pattern],
        synthesized_patterns: List[Pattern]
    ) -> Dict[str, Any]:
        """Analyze the impact of pattern synthesis."""
        return {
            'original_count': len(original_patterns),
            'synthesized_count': len(synthesized_patterns),
            'compression_ratio': len(synthesized_patterns) / len(original_patterns),
            'average_confidence': {
                'original': np.mean([p.confidence for p in original_patterns]),
                'synthesized': np.mean([p.confidence for p in synthesized_patterns])
            },
            'pattern_types': {
                'original': {p.pattern_type for p in original_patterns},
                'synthesized': {p.pattern_type for p in synthesized_patterns}
            },
            'complexity': {
                'original': self._calculate_complexity(original_patterns),
                'synthesized': self._calculate_complexity(synthesized_patterns)
            }
        }
    
    async def _cluster_patterns(self, patterns: List[Pattern]) -> List[List[Pattern]]:
        """Cluster patterns based on their features."""
        if len(patterns) < self.config.clustering_min_samples:
            return [patterns]
            
        # Extract features for clustering
        features = np.array([self._extract_features(p) for p in patterns])
        
        # Perform clustering
        clustering = DBSCAN(
            eps=self.config.clustering_eps,
            min_samples=self.config.clustering_min_samples
        ).fit(features)
        
        # Group patterns by cluster
        clusters = {}
        for i, label in enumerate(clustering.labels_):
            if label == -1:  # Noise points
                continue
            if label not in clusters:
                clusters[label] = []
            clusters[label].append(patterns[i])
        
        return list(clusters.values())
    
    def _extract_features(self, pattern: Pattern) -> np.ndarray:
        """Extract numerical features from a pattern for clustering."""
        features = []
        
        # Extract basic features
        features.append(pattern.confidence)
        
        # Extract data-specific features
        data = pattern.data
        if isinstance(data, dict):
            for key, weight in self.config.feature_weights.items():
                if key in data:
                    value = data[key]
                    if isinstance(value, (int, float)):
                        features.append(value * weight)
                    elif isinstance(value, list):
                        features.append(len(value) * weight)
        
        # Normalize features
        features = np.array(features)
        if len(features) > 0:
            features = (features - np.mean(features)) / (np.std(features) + 1e-8)
        
        return features
    
    async def _synthesize_cluster(self, cluster: List[Pattern]) -> Optional[Pattern]:
        """Synthesize a new pattern from a cluster of similar patterns."""
        if not cluster:
            return None
            
        # Merge pattern data
        merged_data = {}
        pattern_type = cluster[0].pattern_type
        
        for pattern in cluster:
            for key, value in pattern.data.items():
                if key not in merged_data:
                    merged_data[key] = []
                if isinstance(value, list):
                    merged_data[key].extend(value)
                else:
                    merged_data[key].append(value)
        
        # Process merged data
        for key, values in merged_data.items():
            if all(isinstance(v, (int, float)) for v in values):
                merged_data[key] = np.mean(values)
            elif all(isinstance(v, list) for v in values):
                merged_data[key] = list(set([item for sublist in values for item in sublist]))
            else:
                merged_data[key] = max(set(values), key=values.count)
        
        # Calculate confidence
        confidence = np.mean([p.confidence for p in cluster])
        if confidence < self.config.min_confidence:
            return None
        
        # Combine source contexts
        source_contexts = list(set([
            ctx for pattern in cluster 
            for ctx in pattern.source_contexts
        ]))
        
        # Create synthesized pattern
        return Pattern(
            id=str(uuid.uuid4()),
            timestamp=datetime.now(),
            pattern_type=pattern_type,
            data=merged_data,
            confidence=confidence,
            source_contexts=source_contexts,
            metadata={'synthesized': True}
        )
    
    def _calculate_complexity(self, patterns: List[Pattern]) -> float:
        """Calculate the overall complexity of a set of patterns."""
        if not patterns:
            return 0.0
            
        complexities = []
        for pattern in patterns:
            # Calculate pattern-specific complexity
            data_complexity = 0.0
            if isinstance(pattern.data, dict):
                # Consider the number of fields and their values
                for value in pattern.data.values():
                    if isinstance(value, list):
                        data_complexity += len(value) * 0.1
                    elif isinstance(value, (int, float)):
                        data_complexity += 0.1
                data_complexity /= max(len(pattern.data), 1)
            
            # Consider source contexts
            context_complexity = len(pattern.source_contexts) * 0.1
            
            # Combine complexities
            complexity = (data_complexity + context_complexity) / 2
            complexities.append(complexity)
        
        return np.mean(complexities) 