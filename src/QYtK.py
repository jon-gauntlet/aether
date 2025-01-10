"""
Autonomic Manager implementing self-MAPE loop for continuous system evolution.
"""

import asyncio
import logging
import json
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

@dataclass
class EvolutionMetrics:
    timestamp: datetime
    cpu_usage: float
    memory_usage: float
    model_loads: int
    error_rate: float
    response_time: float
    improvement_score: float

@dataclass
class EvolutionPolicy:
    min_improvement_threshold: float = 0.05
    measurement_window: timedelta = timedelta(hours=24)
    max_daily_changes: int = 3
    backoff_multiplier: float = 1.5
    min_stability_period: timedelta = timedelta(hours=12)
    # ADHD optimization parameters
    hyperfocus_detection_threshold: float = 0.85  # High activity threshold
    focus_preservation_window: timedelta = timedelta(minutes=90)  # Typical hyperfocus duration
    context_switch_cost: float = 0.2  # Penalty for interrupting flow
    recovery_period: timedelta = timedelta(minutes=15)  # Minimum break time
    max_sustained_focus: timedelta = timedelta(hours=16)  # Max recommended daily focus time
    # Pattern-based optimization
    pattern_confidence_threshold: float = 0.8
    pattern_weight: float = 0.3  # Weight given to pattern-based decisions
    max_pattern_age: timedelta = timedelta(days=30)
    min_pattern_samples: int = 5

class AutonomicManager:
    def __init__(self, data_dir: Optional[Path] = None):
        self.data_dir = data_dir or Path("/home/jon/ai_system_evolution/data/autonomic")
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.metrics_file = self.data_dir / "evolution_metrics.jsonl"
        self.policy = EvolutionPolicy()
        self.last_evolution = datetime.now()
        self.recent_metrics: List[EvolutionMetrics] = []
        self.changes_today = 0
        self.last_change_time = datetime.now() - timedelta(days=1)
        self.context_manager = ContextManager()
        
    async def initialize(self):
        """Initialize the autonomic manager."""
        await self._load_historical_metrics()
        await self.context_manager.initialize()
        logger.info("Autonomic manager initialized")
        
    async def _load_historical_metrics(self):
        """Load historical metrics from disk."""
        if not self.metrics_file.exists():
            return
            
        try:
            with open(self.metrics_file, 'r') as f:
                for line in f:
                    data = json.loads(line)
                    metric = EvolutionMetrics(
                        timestamp=datetime.fromisoformat(data['timestamp']),
                        cpu_usage=data['cpu_usage'],
                        memory_usage=data['memory_usage'],
                        model_loads=data['model_loads'],
                        error_rate=data['error_rate'],
                        response_time=data['response_time'],
                        improvement_score=data['improvement_score']
                    )
                    self.recent_metrics.append(metric)
        except Exception as e:
            logger.error(f"Error loading metrics: {e}")
            
    async def record_metrics(self, metrics: Dict):
        """Record new metrics."""
        try:
            metric = EvolutionMetrics(
                timestamp=datetime.now(),
                cpu_usage=metrics['cpu_percent'],
                memory_usage=metrics['memory_gb'],
                model_loads=metrics['models_loaded'],
                error_rate=metrics.get('error_rate', 0.0),
                response_time=metrics.get('response_time', 0.0),
                improvement_score=self._calculate_improvement_score(metrics)
            )
            
            self.recent_metrics.append(metric)
            
            # Persist metrics
            with open(self.metrics_file, 'a') as f:
                json.dump(metric.__dict__, f)
                f.write('\n')
                
            # Cleanup old metrics
            self._cleanup_old_metrics()
            
        except Exception as e:
            logger.error(f"Error recording metrics: {e}")
            
    def _calculate_improvement_score(self, metrics: Dict) -> float:
        """Calculate improvement score from metrics."""
        try:
            # Weighted scoring based on key metrics
            weights = {
                'cpu_efficiency': 0.3,
                'memory_efficiency': 0.3,
                'error_rate': 0.2,
                'response_time': 0.2
            }
            
            cpu_score = max(0, 1 - (metrics['cpu_percent'] / 100))
            memory_score = max(0, 1 - (metrics['memory_gb'] / 8))  # Assuming 8GB target
            error_score = max(0, 1 - metrics.get('error_rate', 0))
            response_score = max(0, 1 - (metrics.get('response_time', 1) / 5))  # Assuming 5s target
            
            return (
                weights['cpu_efficiency'] * cpu_score +
                weights['memory_efficiency'] * memory_score +
                weights['error_rate'] * error_score +
                weights['response_time'] * response_score
            )
        except Exception as e:
            logger.error(f"Error calculating improvement score: {e}")
            return 0.0
            
    def _cleanup_old_metrics(self):
        """Remove metrics outside the measurement window."""
        cutoff = datetime.now() - self.policy.measurement_window
        self.recent_metrics = [m for m in self.recent_metrics if m.timestamp > cutoff]
        
    async def should_evolve(self) -> bool:
        """Determine if system should evolve based on metrics, patterns, and policy."""
        if len(self.recent_metrics) < 2:
            return False
            
        # Check stability period
        if datetime.now() - self.last_change_time < self.policy.min_stability_period:
            return False
            
        # Check daily change limit
        if self.changes_today >= self.policy.max_daily_changes:
            return False
            
        # Calculate improvement potential
        recent_score = self.recent_metrics[-1].improvement_score
        baseline_score = sum(m.improvement_score for m in self.recent_metrics[:-1]) / (len(self.recent_metrics) - 1)
        improvement_potential = recent_score - baseline_score
        
        # Get relevant patterns
        patterns = await self.context_manager.get_patterns(
            pattern_type='evolution',
            min_confidence=self.policy.pattern_confidence_threshold
        )
        
        # Filter to recent, relevant patterns
        recent_patterns = [
            p for p in patterns
            if (datetime.now() - p.created_at) <= self.policy.max_pattern_age
            and p.metadata.get('sample_size', 0) >= self.policy.min_pattern_samples
        ]
        
        if recent_patterns:
            # Calculate pattern-based score
            pattern_scores = []
            for pattern in recent_patterns:
                pattern_contexts = await self._get_pattern_contexts(pattern)
                if pattern_contexts:
                    success_rate = self._calculate_pattern_success(pattern_contexts)
                    pattern_scores.append(success_rate)
                    
            if pattern_scores:
                pattern_score = sum(pattern_scores) / len(pattern_scores)
                # Combine metrics-based and pattern-based scores
                weighted_score = (
                    (1 - self.policy.pattern_weight) * improvement_potential +
                    self.policy.pattern_weight * pattern_score
                )
                return weighted_score > self.policy.min_improvement_threshold
                
        return improvement_potential > self.policy.min_improvement_threshold
        
    async def _get_pattern_contexts(self, pattern: Pattern) -> List[Context]:
        """Get contexts associated with a pattern."""
        contexts = []
        for context_id in pattern.contexts:
            context = await self.context_manager.get_context(context_id)
            if context:
                contexts.append(context)
        return contexts
        
    def _calculate_pattern_success(self, contexts: List[Context]) -> float:
        """Calculate success rate for a pattern's contexts."""
        if not contexts:
            return 0.0
            
        successes = sum(
            1 for c in contexts
            if c.metadata.get('success', False)
        )
        return successes / len(contexts)
        
    async def record_evolution(self, success: bool = True):
        """Record that an evolution occurred."""
        self.last_change_time = datetime.now()
        self.changes_today += 1
        
        # Reset daily counter if it's a new day
        if self.last_evolution.date() != datetime.now().date():
            self.changes_today = 1
            
        self.last_evolution = datetime.now()
        
        # Create evolution context
        await self.context_manager.create_context(
            context_type='evolution',
            data={
                'metrics': self.recent_metrics[-1].__dict__,
                'changes_today': self.changes_today,
                'time_since_last': (datetime.now() - self.last_change_time).total_seconds()
            },
            metadata={
                'success': success,
                'pattern_based': len(await self.context_manager.get_patterns()) > 0
            }
        )
        
    async def get_evolution_status(self) -> Dict:
        """Get current evolution status."""
        patterns = await self.context_manager.get_patterns(
            pattern_type='evolution',
            min_confidence=self.policy.pattern_confidence_threshold
        )
        
        return {
            "last_evolution": self.last_evolution.isoformat(),
            "changes_today": self.changes_today,
            "recent_metrics_count": len(self.recent_metrics),
            "current_improvement_score": self.recent_metrics[-1].improvement_score if self.recent_metrics else 0.0,
            "can_evolve": await self.should_evolve(),
            "pattern_count": len(patterns),
            "pattern_based_decisions": any(p.metadata.get('pattern_based', False) for p in patterns)
        }
        
    async def detect_hyperfocus_state(self, current_metrics: EvolutionMetrics) -> bool:
        """Detect if system is in a hyperfocus state based on metrics."""
        # Calculate focus indicators
        productivity_score = (
            (1 - current_metrics.error_rate) * 
            (1 / max(0.1, current_metrics.response_time)) *
            current_metrics.improvement_score
        )
        
        # Check if we're in a potential hyperfocus state
        return productivity_score > self.policy.hyperfocus_detection_threshold
        
    async def should_preserve_focus(self, is_hyperfocus: bool) -> bool:
        """Determine if we should preserve the current focus state."""
        if not is_hyperfocus:
            return False
            
        # Check if we're within the focus preservation window
        time_in_focus = datetime.now() - self.last_evolution
        if time_in_focus < self.policy.focus_preservation_window:
            return True
            
        # Check if we've exceeded max sustained focus
        daily_focus = await self._calculate_daily_focus_time()
        return daily_focus < self.policy.max_sustained_focus
        
    async def _calculate_daily_focus_time(self) -> timedelta:
        """Calculate total focus time in the last 24 hours."""
        today = datetime.now().date()
        daily_metrics = [m for m in self.recent_metrics 
                        if m.timestamp.date() == today]
        
        focus_periods = []
        current_period = None
        
        for metric in sorted(daily_metrics, key=lambda x: x.timestamp):
            is_focus = await self.detect_hyperfocus_state(metric)
            
            if is_focus and not current_period:
                current_period = metric.timestamp
            elif not is_focus and current_period:
                focus_periods.append(metric.timestamp - current_period)
                current_period = None
                
        if current_period:
            focus_periods.append(datetime.now() - current_period)
            
        return sum(focus_periods, timedelta())
        
    async def suggest_break(self) -> bool:
        """Suggest if a break is needed based on focus patterns."""
        daily_focus = await self._calculate_daily_focus_time()
        time_since_last_break = datetime.now() - self.last_evolution
        
        return (
            daily_focus > self.policy.max_sustained_focus or
            time_since_last_break > self.policy.focus_preservation_window
        ) 