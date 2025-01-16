"""System monitoring utilities."""

import psutil
import threading
import time
import logging
from typing import Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class SystemMonitor:
    """Monitors system resources and performance."""
    
    def __init__(self, interval: float = 1.0):
        """Initialize system monitor.
        
        Args:
            interval: Monitoring interval in seconds
        """
        self.interval = interval
        self._stop_event = threading.Event()
        self._monitor_thread: Optional[threading.Thread] = None
        self.metrics: Dict[str, Any] = {
            'cpu_percent': 0.0,
            'memory_percent': 0.0,
            'disk_usage_percent': 0.0,
            'timestamp': None
        }
        
    def start_memory_tracking(self) -> None:
        """Start monitoring system resources."""
        if self._monitor_thread is not None:
            logger.warning("Memory tracking already started")
            return
            
        def _monitor_loop():
            while not self._stop_event.is_set():
                try:
                    self.metrics.update({
                        'cpu_percent': psutil.cpu_percent(),
                        'memory_percent': psutil.virtual_memory().percent,
                        'disk_usage_percent': psutil.disk_usage('/').percent,
                        'timestamp': datetime.now().isoformat()
                    })
                    
                    if any(v > 90 for v in [
                        self.metrics['cpu_percent'],
                        self.metrics['memory_percent'],
                        self.metrics['disk_usage_percent']
                    ]):
                        logger.warning(
                            "High resource usage detected: "
                            f"CPU: {self.metrics['cpu_percent']}%, "
                            f"Memory: {self.metrics['memory_percent']}%, "
                            f"Disk: {self.metrics['disk_usage_percent']}%"
                        )
                        
                except Exception as e:
                    logger.error(f"Error in monitoring loop: {e}")
                    
                time.sleep(self.interval)
                
        self._monitor_thread = threading.Thread(target=_monitor_loop, daemon=True)
        self._monitor_thread.start()
        logger.info("Started system resource monitoring")
        
    def stop_memory_tracking(self) -> None:
        """Stop monitoring system resources."""
        if self._monitor_thread is None:
            logger.warning("Memory tracking not started")
            return
            
        self._stop_event.set()
        self._monitor_thread.join()
        self._monitor_thread = None
        logger.info("Stopped system resource monitoring")
        
    def get_metrics(self) -> Dict[str, Any]:
        """Get current system metrics."""
        return self.metrics.copy()
        
    def check_resources(self) -> bool:
        """Check if system resources are within acceptable limits."""
        return all(v < 90 for v in [
            self.metrics['cpu_percent'],
            self.metrics['memory_percent'],
            self.metrics['disk_usage_percent']
        ])

# Global monitor instance
monitor = SystemMonitor() 