"""Performance monitoring and optimization system."""

from typing import Any, Dict, List, Optional, Tuple, Union
import asyncio
import time
import psutil
import numpy as np
from dataclasses import dataclass
import logging
from pathlib import Path
import json

from ..errors import PerformanceError

logger = logging.getLogger(__name__)

@dataclass
class PerformanceMetrics:
    """Container for performance metrics."""
    
    duration_ms: float
    memory_mb: float
    cpu_percent: float
    throughput: Optional[float] = None
    latency_p50: Optional[float] = None
    latency_p90: Optional[float] = None
    latency_p99: Optional[float] = None
    error_rate: Optional[float] = None
    
    def to_dict(self) -> Dict[str, float]:
        """Convert metrics to dictionary."""
        return {
            'duration_ms': self.duration_ms,
            'memory_mb': self.memory_mb,
            'cpu_percent': self.cpu_percent,
            'throughput': self.throughput,
            'latency_p50': self.latency_p50,
            'latency_p90': self.latency_p90,
            'latency_p99': self.latency_p99,
            'error_rate': self.error_rate
        }
        
    @classmethod
    def from_dict(cls, data: Dict[str, float]) -> 'PerformanceMetrics':
        """Create metrics from dictionary."""
        return cls(**data)

class PerformanceMonitor:
    """Monitors and records performance metrics."""
    
    def __init__(self, metrics_dir: Optional[str] = None):
        self.metrics_dir = Path(metrics_dir or '.metrics')
        self.metrics_dir.mkdir(exist_ok=True)
        self.current_metrics: Dict[str, List[PerformanceMetrics]] = {}
        
    def _get_metrics_path(self, operation: str) -> Path:
        """Get path for metrics file."""
        return self.metrics_dir / f"{operation}_metrics.json"
        
    def record_metrics(self, operation: str, metrics: PerformanceMetrics) -> None:
        """Record performance metrics for an operation."""
        if operation not in self.current_metrics:
            self.current_metrics[operation] = []
        self.current_metrics[operation].append(metrics)
        
        # Save to disk
        try:
            metrics_path = self._get_metrics_path(operation)
            with open(metrics_path, 'w') as f:
                json.dump([m.to_dict() for m in self.current_metrics[operation]], f)
        except Exception as e:
            raise PerformanceError(f"Failed to save metrics: {e}")
            
    def get_metrics(self, operation: str) -> List[PerformanceMetrics]:
        """Get recorded metrics for an operation."""
        try:
            metrics_path = self._get_metrics_path(operation)
            if not metrics_path.exists():
                return []
                
            with open(metrics_path) as f:
                data = json.load(f)
                return [PerformanceMetrics.from_dict(d) for d in data]
                
        except Exception as e:
            raise PerformanceError(f"Failed to load metrics: {e}")
            
    def compute_statistics(self, operation: str) -> Dict[str, Dict[str, float]]:
        """Compute statistics for recorded metrics."""
        metrics = self.get_metrics(operation)
        if not metrics:
            return {}
            
        stats = {}
        for field in PerformanceMetrics.__dataclass_fields__:
            values = [getattr(m, field) for m in metrics if getattr(m, field) is not None]
            if values:
                stats[field] = {
                    'mean': float(np.mean(values)),
                    'std': float(np.std(values)),
                    'min': float(np.min(values)),
                    'max': float(np.max(values))
                }
                
        return stats
        
    def clear_metrics(self, operation: str) -> None:
        """Clear recorded metrics for an operation."""
        if operation in self.current_metrics:
            del self.current_metrics[operation]
            
        try:
            metrics_path = self._get_metrics_path(operation)
            if metrics_path.exists():
                metrics_path.unlink()
        except Exception as e:
            raise PerformanceError(f"Failed to clear metrics: {e}")

class PerformanceOptimizer:
    """Optimizes system performance based on collected metrics."""
    
    def __init__(self, monitor: PerformanceMonitor):
        self.monitor = monitor
        self.thresholds = {
            'duration_ms': 1000,  # 1 second
            'memory_mb': 1024,    # 1 GB
            'cpu_percent': 80,    # 80%
            'error_rate': 0.01    # 1%
        }
        
    def set_threshold(self, metric: str, value: float) -> None:
        """Set performance threshold for a metric."""
        if metric not in PerformanceMetrics.__dataclass_fields__:
            raise ValueError(f"Invalid metric: {metric}")
        self.thresholds[metric] = value
        
    def check_performance(self, operation: str) -> List[str]:
        """Check performance against thresholds."""
        stats = self.monitor.compute_statistics(operation)
        if not stats:
            return []
            
        warnings = []
        for metric, threshold in self.thresholds.items():
            if metric in stats:
                mean_value = stats[metric]['mean']
                if mean_value > threshold:
                    warnings.append(
                        f"{metric} exceeds threshold: {mean_value:.2f} > {threshold}"
                    )
                    
        return warnings
        
    def suggest_optimizations(self, operation: str) -> List[str]:
        """Suggest optimizations based on performance metrics."""
        warnings = self.check_performance(operation)
        if not warnings:
            return []
            
        suggestions = []
        stats = self.monitor.compute_statistics(operation)
        
        if 'duration_ms' in stats and stats['duration_ms']['mean'] > self.thresholds['duration_ms']:
            suggestions.append("Consider implementing caching or batch processing")
            
        if 'memory_mb' in stats and stats['memory_mb']['mean'] > self.thresholds['memory_mb']:
            suggestions.append("Consider implementing memory-efficient algorithms or streaming")
            
        if 'cpu_percent' in stats and stats['cpu_percent']['mean'] > self.thresholds['cpu_percent']:
            suggestions.append("Consider implementing parallel processing or reducing workload")
            
        if 'error_rate' in stats and stats['error_rate']['mean'] > self.thresholds['error_rate']:
            suggestions.append("Implement better error handling and retry mechanisms")
            
        return suggestions

def measure_performance(func: callable) -> callable:
    """Decorator to measure performance of a function."""
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        start_memory = psutil.Process().memory_info().rss / 1024 / 1024
        start_cpu = psutil.Process().cpu_percent()
        
        try:
            result = await func(*args, **kwargs)
            error_rate = 0.0
        except Exception as e:
            error_rate = 1.0
            raise e
        finally:
            end_time = time.time()
            end_memory = psutil.Process().memory_info().rss / 1024 / 1024
            end_cpu = psutil.Process().cpu_percent()
            
            metrics = PerformanceMetrics(
                duration_ms=(end_time - start_time) * 1000,
                memory_mb=end_memory - start_memory,
                cpu_percent=end_cpu - start_cpu,
                error_rate=error_rate
            )
            
            # Get monitor instance (assuming it's passed as kwarg)
            monitor = kwargs.get('performance_monitor')
            if monitor:
                monitor.record_metrics(func.__name__, metrics)
                
        return result
        
    return wrapper 