"""Telemetry system for RAG operations."""
import time
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from datetime import datetime
import json
from pathlib import Path
import asyncio
from collections import deque
import numpy as np
from rag_aether.core.logging import get_logger

logger = get_logger("telemetry")

@dataclass
class TelemetryPoint:
    """Single telemetry measurement."""
    timestamp: datetime
    operation: str
    component: str
    metrics: Dict[str, Any]
    labels: Dict[str, str] = field(default_factory=dict)

class TelemetryBuffer:
    """Buffer for storing telemetry points."""
    
    def __init__(self, max_size: int = 1000):
        self.buffer = deque(maxlen=max_size)
        
    def add(self, point: TelemetryPoint):
        """Add telemetry point to buffer."""
        self.buffer.append(point)
        
    def get_points(
        self,
        operation: Optional[str] = None,
        component: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> List[TelemetryPoint]:
        """Get filtered telemetry points."""
        points = list(self.buffer)
        
        if operation:
            points = [p for p in points if p.operation == operation]
        if component:
            points = [p for p in points if p.component == component]
        if start_time:
            points = [p for p in points if p.timestamp >= start_time]
        if end_time:
            points = [p for p in points if p.timestamp <= end_time]
            
        return points
    
    def clear(self):
        """Clear buffer."""
        self.buffer.clear()

class TelemetryCollector:
    """Collector for system telemetry."""
    
    def __init__(self, output_dir: Optional[Path] = None):
        self.output_dir = output_dir or Path("telemetry")
        self.output_dir.mkdir(exist_ok=True)
        self.buffer = TelemetryBuffer()
        self._collection_task: Optional[asyncio.Task] = None
        self._running = False
        
        # Initialize psutil for system monitoring
        try:
            import psutil
            self._psutil = psutil
            self._has_psutil = True
        except ImportError:
            logger.warning("psutil not available - system metrics will be limited")
            self._has_psutil = False
            
        # Initialize alert manager
        from rag_aether.core.alerts import manager as alert_manager
        self.alert_manager = alert_manager
        
        # Load default alert config if exists
        config_path = Path("config/alerts.json")
        if config_path.exists():
            self.alert_manager.load_config(config_path)
    
    def start(self):
        """Start telemetry collection."""
        if not self._running:
            self._running = True
            self._collection_task = asyncio.create_task(self._collect_loop())
            logger.info("Telemetry collection started")
    
    def stop(self):
        """Stop telemetry collection."""
        if self._running:
            self._running = False
            if self._collection_task:
                self._collection_task.cancel()
            logger.info("Telemetry collection stopped")
    
    async def _collect_loop(self):
        """Background collection loop."""
        try:
            while self._running:
                await self._collect_metrics()
                await asyncio.sleep(60)  # Collect every minute
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Telemetry collection error: {str(e)}")
            raise
    
    async def _collect_metrics(self):
        """Collect system metrics."""
        try:
            # Collect basic system metrics
            metrics = {
                "cpu_percent": await self._get_cpu_usage(),
                "memory_percent": await self._get_memory_usage(),
                "disk_usage": await self._get_disk_usage()
            }
            
            # Add process-specific metrics if psutil available
            if self._has_psutil:
                try:
                    process = self._psutil.Process()
                    
                    # Get process metrics
                    metrics.update({
                        "process_cpu_percent": await asyncio.to_thread(process.cpu_percent),
                        "process_memory_percent": await asyncio.to_thread(
                            lambda: process.memory_percent()
                        ),
                        "process_threads": await asyncio.to_thread(
                            lambda: process.num_threads()
                        ),
                        "process_fds": await asyncio.to_thread(
                            lambda: process.num_fds()
                        ) if hasattr(process, "num_fds") else None
                    })
                    
                    # Get memory details
                    mem_info = await asyncio.to_thread(process.memory_info)
                    metrics.update({
                        "process_rss_mb": mem_info.rss / (1024 * 1024),
                        "process_vms_mb": mem_info.vms / (1024 * 1024)
                    })
                    
                except Exception as e:
                    logger.error(f"Error collecting process metrics: {str(e)}")
            
            point = TelemetryPoint(
                timestamp=datetime.now(),
                operation="system_metrics",
                component="system",
                metrics=metrics
            )
            
            self.buffer.add(point)
            await self._save_point(point)
            
            # Process alerts
            await self.alert_manager.process_metrics({"metrics": metrics})
            
        except Exception as e:
            logger.error(f"Error collecting metrics: {str(e)}")
    
    async def _get_cpu_usage(self) -> float:
        """Get CPU usage percentage."""
        if not self._has_psutil:
            return 0.0
            
        try:
            # Get CPU usage over 1 second interval
            return await asyncio.to_thread(self._psutil.cpu_percent, interval=1)
        except Exception as e:
            logger.error(f"Error getting CPU usage: {str(e)}")
            return 0.0
    
    async def _get_memory_usage(self) -> float:
        """Get memory usage percentage."""
        if not self._has_psutil:
            return 0.0
            
        try:
            # Get virtual memory stats
            mem = await asyncio.to_thread(self._psutil.virtual_memory)
            return mem.percent
        except Exception as e:
            logger.error(f"Error getting memory usage: {str(e)}")
            return 0.0
    
    async def _get_disk_usage(self) -> Dict[str, float]:
        """Get disk usage statistics."""
        if not self._has_psutil:
            return {"used_percent": 0.0}
            
        try:
            # Get disk usage for the telemetry directory
            disk_usage = await asyncio.to_thread(
                self._psutil.disk_usage,
                str(self.output_dir)
            )
            
            return {
                "used_percent": disk_usage.percent,
                "total_gb": disk_usage.total / (1024 ** 3),
                "used_gb": disk_usage.used / (1024 ** 3),
                "free_gb": disk_usage.free / (1024 ** 3)
            }
        except Exception as e:
            logger.error(f"Error getting disk usage: {str(e)}")
            return {"used_percent": 0.0}
    
    async def _save_point(self, point: TelemetryPoint):
        """Save telemetry point to file."""
        try:
            data = {
                "timestamp": point.timestamp.isoformat(),
                "operation": point.operation,
                "component": point.component,
                "metrics": point.metrics,
                "labels": point.labels
            }
            
            file_path = self.output_dir / f"telemetry_{point.timestamp.strftime('%Y%m%d')}.jsonl"
            with open(file_path, "a") as f:
                f.write(json.dumps(data) + "\n")
                
        except Exception as e:
            logger.error(f"Error saving telemetry point: {str(e)}")
    
    def add_point(
        self,
        operation: str,
        component: str,
        metrics: Dict[str, Any],
        labels: Optional[Dict[str, str]] = None
    ):
        """Add telemetry point."""
        point = TelemetryPoint(
            timestamp=datetime.now(),
            operation=operation,
            component=component,
            metrics=metrics,
            labels=labels or {}
        )
        
        self.buffer.add(point)
        asyncio.create_task(self._save_point(point))
        
        # Process alerts
        asyncio.create_task(
            self.alert_manager.process_metrics({
                "operation": operation,
                "component": component,
                "metrics": metrics
            })
        )
    
    def get_component_metrics(
        self,
        component: str,
        operation: Optional[str] = None,
        window_minutes: int = 60
    ) -> Dict[str, Any]:
        """Get aggregated metrics for a component."""
        start_time = datetime.now().replace(
            minute=datetime.now().minute - window_minutes
        )
        
        points = self.buffer.get_points(
            operation=operation,
            component=component,
            start_time=start_time
        )
        
        if not points:
            return {}
            
        # Aggregate metrics
        all_metrics = {}
        for point in points:
            for key, value in point.metrics.items():
                if isinstance(value, (int, float)):
                    if key not in all_metrics:
                        all_metrics[key] = []
                    all_metrics[key].append(value)
        
        # Calculate statistics
        stats = {}
        for key, values in all_metrics.items():
            stats[key] = {
                "avg": np.mean(values),
                "min": np.min(values),
                "max": np.max(values),
                "std": np.std(values),
                "p95": np.percentile(values, 95)
            }
            
        return stats
    
    def get_operation_metrics(
        self,
        operation: str,
        window_minutes: int = 60
    ) -> Dict[str, Any]:
        """Get aggregated metrics for an operation."""
        start_time = datetime.now().replace(
            minute=datetime.now().minute - window_minutes
        )
        
        points = self.buffer.get_points(
            operation=operation,
            start_time=start_time
        )
        
        if not points:
            return {}
            
        # Group by component
        by_component = {}
        for point in points:
            if point.component not in by_component:
                by_component[point.component] = []
            by_component[point.component].append(point)
            
        # Aggregate metrics by component
        stats = {}
        for component, component_points in by_component.items():
            all_metrics = {}
            for point in component_points:
                for key, value in point.metrics.items():
                    if isinstance(value, (int, float)):
                        if key not in all_metrics:
                            all_metrics[key] = []
                        all_metrics[key].append(value)
            
            component_stats = {}
            for key, values in all_metrics.items():
                component_stats[key] = {
                    "avg": np.mean(values),
                    "min": np.min(values),
                    "max": np.max(values),
                    "std": np.std(values),
                    "p95": np.percentile(values, 95)
                }
            
            stats[component] = component_stats
            
        return stats

# Global telemetry collector instance
collector = TelemetryCollector()

def track_operation(operation: str, component: str):
    """Decorator for tracking operation telemetry."""
    def decorator(func):
        async def async_wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                duration = (time.time() - start_time) * 1000
                
                collector.add_point(
                    operation=operation,
                    component=component,
                    metrics={
                        "duration_ms": duration,
                        "success": True
                    }
                )
                
                return result
                
            except Exception as e:
                duration = (time.time() - start_time) * 1000
                
                collector.add_point(
                    operation=operation,
                    component=component,
                    metrics={
                        "duration_ms": duration,
                        "success": False,
                        "error": str(e)
                    }
                )
                raise
                
        def sync_wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                duration = (time.time() - start_time) * 1000
                
                collector.add_point(
                    operation=operation,
                    component=component,
                    metrics={
                        "duration_ms": duration,
                        "success": True
                    }
                )
                
                return result
                
            except Exception as e:
                duration = (time.time() - start_time) * 1000
                
                collector.add_point(
                    operation=operation,
                    component=component,
                    metrics={
                        "duration_ms": duration,
                        "success": False,
                        "error": str(e)
                    }
                )
                raise
                
        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper
    return decorator 