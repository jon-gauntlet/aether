"""Metrics tracking module for RAG system."""

from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional
from datetime import datetime
import json

@dataclass
class MetricsTracker:
    """Tracks various metrics for the RAG system."""
    
    metrics: Dict[str, Any] = field(default_factory=dict)
    history: List[Dict[str, Any]] = field(default_factory=list)
    max_history: int = 1000
    
    def track(self, metric_name: str, value: Any, metadata: Optional[Dict[str, Any]] = None) -> None:
        """Track a metric value with optional metadata."""
        timestamp = datetime.now().isoformat()
        entry = {
            "name": metric_name,
            "value": value,
            "timestamp": timestamp,
            "metadata": metadata or {}
        }
        
        self.metrics[metric_name] = value
        self.history.append(entry)
        
        if len(self.history) > self.max_history:
            self.history = self.history[-self.max_history:]
            
    def get_metric(self, metric_name: str) -> Optional[Any]:
        """Get the current value of a metric."""
        return self.metrics.get(metric_name)
        
    def get_history(self, metric_name: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get metric history, optionally filtered by metric name."""
        if metric_name is None:
            return self.history
        return [entry for entry in self.history if entry["name"] == metric_name]
        
    def clear(self) -> None:
        """Clear all metrics and history."""
        self.metrics.clear()
        self.history.clear()
        
    def to_json(self) -> str:
        """Convert metrics to JSON string."""
        return json.dumps({
            "metrics": self.metrics,
            "history": self.history,
            "max_history": self.max_history
        }) 