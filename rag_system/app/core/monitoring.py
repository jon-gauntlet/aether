from typing import Dict, Optional
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta

@dataclass
class QueryMetrics:
    total_queries: int = 0
    successful_queries: int = 0
    failed_queries: int = 0
    total_latency: float = 0.0
    last_query_time: Optional[datetime] = None
    
    @property
    def average_latency(self) -> float:
        return self.total_latency / self.total_queries if self.total_queries > 0 else 0.0
    
    @property
    def success_rate(self) -> float:
        return (self.successful_queries / self.total_queries * 100) if self.total_queries > 0 else 0.0

class PerformanceMonitor:
    def __init__(self):
        self.document_count: int = 0
        self.metrics: QueryMetrics = QueryMetrics()
        self._query_start_time: Optional[float] = None
    
    def record_document_added(self):
        self.document_count += 1
    
    def record_document_removed(self):
        self.document_count = max(0, self.document_count - 1)
    
    def start_query(self):
        self._query_start_time = time.time()
        self.metrics.total_queries += 1
        self.metrics.last_query_time = datetime.now()
    
    def end_query(self, success: bool):
        if self._query_start_time is None:
            return
        
        query_time = time.time() - self._query_start_time
        self.metrics.total_latency += query_time
        
        if success:
            self.metrics.successful_queries += 1
        else:
            self.metrics.failed_queries += 1
        
        self._query_start_time = None
    
    def get_stats(self) -> Dict:
        return {
            "document_count": self.document_count,
            "total_queries": self.metrics.total_queries,
            "successful_queries": self.metrics.successful_queries,
            "failed_queries": self.metrics.failed_queries,
            "average_latency": round(self.metrics.average_latency, 3),
            "success_rate": round(self.metrics.success_rate, 2),
            "last_query_time": self.metrics.last_query_time.isoformat() if self.metrics.last_query_time else None
        }

# Create singleton instance
monitor = PerformanceMonitor() 