import os
import json
import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime
import uuid
from systemd import journal
import numpy as np
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler

from .learner import Pattern, PatternValidator

@dataclass
class SynthesisConfig:
    min_patterns: int = 5
    min_confidence: float = 0.7
    max_complexity: float = 0.8
    clustering_eps: float = 0.3
    clustering_min_samples: int = 3
    synthesis_threshold: float = 0.6

class PatternSynthesizer:
    def __init__(self):
        self.config = SynthesisConfig()
        self.validator = PatternValidator()
        self.log = logging.getLogger("pattern_synthesizer")
        self.log.addHandler(journal.JournalHandler())
        self.log.setLevel(logging.INFO)
        
    async def synthesize(self, patterns: List[Pattern]) -> List[Pattern]:
        """Synthesize higher-level patterns from existing ones."""
        try:
            if len(patterns) < self.config.min_patterns:
                return []
                
            # Group patterns by type
            grouped = self._group_patterns(patterns)
            
            synthesized = []
            for pattern_type, type_patterns in grouped.items():
                # Analyze patterns
                clusters = await self._cluster_patterns(type_patterns)
                
                # Synthesize each cluster
                for cluster in clusters:
                    if len(cluster) >= self.config.clustering_min_samples:
                        synth = await self._synthesize_cluster(cluster)
                        if synth and self.validator._validate_pattern(synth):
                            synthesized.append(synth)
                            
            self.log.info(f"Synthesized {len(synthesized)} patterns")
            return synthesized
            
        except Exception as e:
            self.log.error(f"Pattern synthesis failed: {e}")
            return []
            
    def _group_patterns(self, patterns: List[Pattern]) -> Dict[str, List[Pattern]]:
        """Group patterns by type."""
        grouped = {}
        for pattern in patterns:
            if pattern.pattern_type not in grouped:
                grouped[pattern.pattern_type] = []
            grouped[pattern.pattern_type].append(pattern)
        return grouped
        
    async def _cluster_patterns(self, patterns: List[Pattern]) -> List[List[Pattern]]:
        """Cluster similar patterns using DBSCAN."""
        try:
            if len(patterns) < self.config.clustering_min_samples:
                return []
                
            # Extract features
            features = []
            for pattern in patterns:
                feat = self._extract_features(pattern)
                if feat is not None:
                    features.append(feat)
                    
            if not features:
                return []
                
            # Normalize features
            X = StandardScaler().fit_transform(features)
            
            # Cluster
            db = DBSCAN(
                eps=self.config.clustering_eps,
                min_samples=self.config.clustering_min_samples
            ).fit(X)
            
            # Group patterns by cluster
            clusters = {}
            for i, label in enumerate(db.labels_):
                if label == -1:  # Noise
                    continue
                if label not in clusters:
                    clusters[label] = []
                clusters[label].append(patterns[i])
                
            return list(clusters.values())
            
        except Exception as e:
            self.log.error(f"Pattern clustering failed: {e}")
            return []
            
    def _extract_features(self, pattern: Pattern) -> Optional[List[float]]:
        """Extract numerical features from pattern for clustering."""
        try:
            features = [
                pattern.confidence,
                len(pattern.source_contexts),
                len(json.dumps(pattern.data))
            ]
            
            # Add type-specific features
            if pattern.pattern_type == 'code':
                features.extend([
                    pattern.data.get('complexity', 0),
                    len(pattern.data.get('dependencies', [])),
                    len(pattern.data.get('tests', [])),
                    pattern.data.get('coverage', 0)
                ])
            elif pattern.pattern_type == 'workflow':
                features.extend([
                    len(pattern.data.get('steps', [])),
                    pattern.data.get('success_rate', 0),
                    pattern.data.get('completion_time', 0)
                ])
            elif pattern.pattern_type == 'integration':
                features.extend([
                    len(pattern.data.get('dependencies', [])),
                    pattern.data.get('success_rate', 0),
                    pattern.data.get('stability', 0)
                ])
                
            return features
            
        except Exception as e:
            self.log.error(f"Feature extraction failed: {e}")
            return None
            
    async def _synthesize_cluster(self, patterns: List[Pattern]) -> Optional[Pattern]:
        """Synthesize a new pattern from a cluster of similar patterns."""
        try:
            if not patterns:
                return None
                
            pattern_type = patterns[0].pattern_type
            
            # Merge pattern data
            merged_data = {}
            for pattern in patterns:
                self._deep_merge(merged_data, pattern.data)
                
            # Calculate confidence
            confidence = np.mean([p.confidence for p in patterns])
            if confidence < self.config.min_confidence:
                return None
                
            # Create synthesized pattern
            return Pattern(
                id=str(uuid.uuid4()),
                timestamp=datetime.now(),
                pattern_type=pattern_type,
                data=merged_data,
                confidence=confidence,
                source_contexts=list(set(
                    ctx for p in patterns
                    for ctx in p.source_contexts
                )),
                metadata={
                    'synthesized': True,
                    'source_patterns': [p.id for p in patterns],
                    'synthesis_timestamp': datetime.now().isoformat()
                }
            )
            
        except Exception as e:
            self.log.error(f"Cluster synthesis failed: {e}")
            return None
            
    def _deep_merge(self, target: Dict, source: Dict) -> None:
        """Deep merge two dictionaries."""
        for key, value in source.items():
            if key in target:
                if isinstance(target[key], dict) and isinstance(value, dict):
                    self._deep_merge(target[key], value)
                elif isinstance(target[key], list) and isinstance(value, list):
                    target[key].extend(value)
                else:
                    # For scalar values, keep the higher confidence one
                    if isinstance(value, (int, float)) and value > target[key]:
                        target[key] = value
            else:
                target[key] = value
                
    async def analyze_synthesis_impact(self, original: List[Pattern],
                                     synthesized: List[Pattern]) -> Dict:
        """Analyze the impact of pattern synthesis."""
        try:
            metrics = {
                'original_count': len(original),
                'synthesized_count': len(synthesized),
                'compression_ratio': len(synthesized) / len(original) if original else 0,
                'average_confidence': {
                    'original': np.mean([p.confidence for p in original]) if original else 0,
                    'synthesized': np.mean([p.confidence for p in synthesized]) if synthesized else 0
                },
                'pattern_types': {
                    'original': {},
                    'synthesized': {}
                },
                'complexity': {
                    'original': self._calculate_complexity(original),
                    'synthesized': self._calculate_complexity(synthesized)
                }
            }
            
            # Count pattern types
            for p in original:
                metrics['pattern_types']['original'][p.pattern_type] = \
                    metrics['pattern_types']['original'].get(p.pattern_type, 0) + 1
                    
            for p in synthesized:
                metrics['pattern_types']['synthesized'][p.pattern_type] = \
                    metrics['pattern_types']['synthesized'].get(p.pattern_type, 0) + 1
                    
            return metrics
            
        except Exception as e:
            self.log.error(f"Impact analysis failed: {e}")
            return {}
            
    def _calculate_complexity(self, patterns: List[Pattern]) -> float:
        """Calculate overall pattern complexity."""
        try:
            if not patterns:
                return 0
                
            complexities = []
            for pattern in patterns:
                if pattern.pattern_type == 'code':
                    complexities.append(pattern.data.get('complexity', 0))
                elif pattern.pattern_type == 'workflow':
                    complexities.append(len(pattern.data.get('steps', [])) / 10)
                elif pattern.pattern_type == 'integration':
                    complexities.append(len(pattern.data.get('dependencies', [])) / 5)
                    
            return np.mean(complexities) if complexities else 0
            
        except Exception as e:
            self.log.error(f"Complexity calculation failed: {e}")
            return 0 