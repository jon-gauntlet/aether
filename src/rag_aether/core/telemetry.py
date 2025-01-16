"""Telemetry implementation for RAG system."""
from typing import Dict, Any, List, Optional, Union, Set
import time
import asyncio
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from collections import defaultdict
import numpy as np
from rag_aether.core.logging import get_logger
from rag_aether.core.errors import TelemetryError
from rag_aether.core.performance import with_performance_monitoring

logger = get_logger("telemetry")

@dataclass
class MetricPoint:
    """Individual metric data point."""
    value: Union[int, float]
    timestamp: datetime
    labels: Dict[str, str] = field(default_factory=dict)

@dataclass
class MetricConfig:
    """Metric configuration."""
    name: str
    description: str
    unit: str
    aggregation: str = "avg"  # One of: avg, sum, min, max, count
    retention_days: int = 7
    labels: Set[str] = field(default_factory=set)

@dataclass
class MetricSummary:
    """Summary statistics for a metric."""
    count: int = 0
    sum: float = 0.0
    min: float = float('inf')
    max: float = float('-inf')
    avg: float = 0.0
    p50: float = 0.0
    p90: float = 0.0
    p95: float = 0.0
    p99: float = 0.0

class MetricStore:
    """Store and aggregate metric data points."""
    
    def __init__(
        self,
        config: MetricConfig
    ):
        """Initialize metric store."""
        self.config = config
        self.points: List[MetricPoint] = []
        self.last_cleanup: datetime = datetime.now()
        logger.info(
            f"Initialized metric store: {config.name}",
            extra={"config": vars(config)}
        )
        
    def add_point(
        self,
        value: Union[int, float],
        timestamp: Optional[datetime] = None,
        labels: Optional[Dict[str, str]] = None
    ) -> None:
        """Add metric data point."""
        point = MetricPoint(
            value=value,
            timestamp=timestamp or datetime.now(),
            labels=labels or {}
        )
        self.points.append(point)
        self._cleanup_old_points()
        
    def _cleanup_old_points(self) -> None:
        """Remove points older than retention period."""
        now = datetime.now()
        if (now - self.last_cleanup).total_seconds() < 3600:
            return
            
        cutoff = now - timedelta(days=self.config.retention_days)
        self.points = [
            point for point in self.points
            if point.timestamp > cutoff
        ]
        self.last_cleanup = now
        
    def get_summary(
        self,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        labels: Optional[Dict[str, str]] = None
    ) -> MetricSummary:
        """Get summary statistics for metric points."""
        # Filter points
        points = self.points
        if start_time:
            points = [p for p in points if p.timestamp >= start_time]
        if end_time:
            points = [p for p in points if p.timestamp <= end_time]
        if labels:
            points = [
                p for p in points
                if all(p.labels.get(k) == v for k, v in labels.items())
            ]
            
        if not points:
            return MetricSummary()
            
        # Calculate statistics
        values = np.array([p.value for p in points])
        return MetricSummary(
            count=len(values),
            sum=float(np.sum(values)),
            min=float(np.min(values)),
            max=float(np.max(values)),
            avg=float(np.mean(values)),
            p50=float(np.percentile(values, 50)),
            p90=float(np.percentile(values, 90)),
            p95=float(np.percentile(values, 95)),
            p99=float(np.percentile(values, 99))
        )
        
    def get_points(
        self,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        labels: Optional[Dict[str, str]] = None
    ) -> List[MetricPoint]:
        """Get filtered metric points."""
        points = self.points
        if start_time:
            points = [p for p in points if p.timestamp >= start_time]
        if end_time:
            points = [p for p in points if p.timestamp <= end_time]
        if labels:
            points = [
                p for p in points
                if all(p.labels.get(k) == v for k, v in labels.items())
            ]
        return points

class TelemetryManager:
    """Manage system telemetry and metrics."""
    
    def __init__(self):
        """Initialize telemetry manager."""
        self.stores: Dict[str, MetricStore] = {}
        self._task: Optional[asyncio.Task] = None
        logger.info("Initialized telemetry manager")
        
    def register_metric(
        self,
        name: str,
        description: str,
        unit: str,
        aggregation: str = "avg",
        retention_days: int = 7,
        labels: Optional[Set[str]] = None
    ) -> MetricStore:
        """Register new metric."""
        if name in self.stores:
            raise ValueError(f"Metric already exists: {name}")
            
        config = MetricConfig(
            name=name,
            description=description,
            unit=unit,
            aggregation=aggregation,
            retention_days=retention_days,
            labels=labels or set()
        )
        store = MetricStore(config)
        self.stores[name] = store
        return store
        
    @with_performance_monitoring(operation="record", component="telemetry")
    def record_value(
        self,
        metric_name: str,
        value: Union[int, float],
        labels: Optional[Dict[str, str]] = None
    ) -> None:
        """Record metric value."""
        if metric_name not in self.stores:
            raise ValueError(f"Metric not found: {metric_name}")
            
        store = self.stores[metric_name]
        store.add_point(value, labels=labels)
        
    def get_metric_summary(
        self,
        metric_name: str,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        labels: Optional[Dict[str, str]] = None
    ) -> MetricSummary:
        """Get metric summary statistics."""
        if metric_name not in self.stores:
            raise ValueError(f"Metric not found: {metric_name}")
            
        store = self.stores[metric_name]
        return store.get_summary(
            start_time=start_time,
            end_time=end_time,
            labels=labels
        )
        
    def get_metric_points(
        self,
        metric_name: str,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        labels: Optional[Dict[str, str]] = None
    ) -> List[MetricPoint]:
        """Get metric data points."""
        if metric_name not in self.stores:
            raise ValueError(f"Metric not found: {metric_name}")
            
        store = self.stores[metric_name]
        return store.get_points(
            start_time=start_time,
            end_time=end_time,
            labels=labels
        )
        
    def get_all_metrics(self) -> Dict[str, Dict[str, Any]]:
        """Get summaries for all metrics."""
        return {
            name: {
                "config": vars(store.config),
                "summary": vars(store.get_summary()),
                "points": len(store.points)
            }
            for name, store in self.stores.items()
        }
        
    async def start_cleanup(self, interval: int = 3600) -> None:
        """Start periodic cleanup of old points."""
        if self._task:
            return
            
        async def cleanup_loop():
            while True:
                for store in self.stores.values():
                    store._cleanup_old_points()
                await asyncio.sleep(interval)
                
        self._task = asyncio.create_task(cleanup_loop())
        
    async def stop_cleanup(self) -> None:
        """Stop periodic cleanup."""
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None 