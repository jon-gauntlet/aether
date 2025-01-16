"""System health monitoring module."""

from dataclasses import dataclass
from typing import Dict, Any, List, Optional
import psutil
import time

@dataclass
class SystemHealth:
    """System health metrics."""
    cpu_percent: float
    memory_percent: float
    disk_usage_percent: float
    timestamp: float
    component_metrics: Dict[str, Any]

    @classmethod
    def capture(cls, component_metrics: Optional[Dict[str, Any]] = None) -> 'SystemHealth':
        """Capture current system health metrics."""
        return cls(
            cpu_percent=psutil.cpu_percent(),
            memory_percent=psutil.virtual_memory().percent,
            disk_usage_percent=psutil.disk_usage('/').percent,
            timestamp=time.time(),
            component_metrics=component_metrics or {}
        )

    def to_dict(self) -> Dict[str, Any]:
        """Convert health metrics to dictionary."""
        return {
            'cpu_percent': self.cpu_percent,
            'memory_percent': self.memory_percent,
            'disk_usage_percent': self.disk_usage_percent,
            'timestamp': self.timestamp,
            'component_metrics': self.component_metrics
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'SystemHealth':
        """Create SystemHealth instance from dictionary."""
        return cls(
            cpu_percent=data['cpu_percent'],
            memory_percent=data['memory_percent'],
            disk_usage_percent=data['disk_usage_percent'],
            timestamp=data['timestamp'],
            component_metrics=data['component_metrics']
        ) 