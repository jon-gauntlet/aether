"""System monitoring for RAG system."""

import psutil
from typing import Dict, Any
import time

class SystemMonitor:
    """Monitor system health and performance."""
    
    def __init__(self):
        """Initialize system monitor."""
        self.start_time = time.time()
        
    def get_metrics(self) -> Dict[str, Any]:
        """Get current system metrics."""
        try:
            return {
                "cpu_percent": psutil.cpu_percent(),
                "memory_percent": psutil.virtual_memory().percent,
                "uptime": time.time() - self.start_time,
                "disk_usage": psutil.disk_usage("/").percent
            }
        except Exception as e:
            return {
                "error": str(e),
                "status": "error"
            } 