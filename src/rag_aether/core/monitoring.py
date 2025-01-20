"""Monitoring system for RAG implementation.


"""
import os
import time
import psutil
import logging
from typing import Dict, Any, Optional
from dataclasses import dataclass
from prometheus_client import Counter, Gauge, Histogram, start_http_server

# Configure logging
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

@dataclass
class MetricThresholds:
    """Thresholds for system metrics."""
    memory_usage_warning: float = 80.0
    memory_usage_critical: float = 85.0
    error_rate_warning: float = 1.0
    error_rate_critical: float = 5.0
    query_time_warning: float = 800.0  # ms
    query_time_critical: float = 1000.0  # ms
    doc_rate_warning: float = 160000
    doc_rate_critical: float = 150000
    query_rate_warning: float = 170000
    query_rate_critical: float = 150000

class RAGMonitoring:
    """Monitoring system for RAG implementation."""
    
    def __init__(self, port: int = 8000):
        """Initialize monitoring system.
        
        Args:
            port: Port for Prometheus metrics server
        """
        # Start Prometheus metrics server
        start_http_server(port)
        
        # Document processing metrics
        self.doc_ingestion_rate = Counter(
            "rag_system_doc_ingestion_total",
            "Total number of documents ingested"
        )
        self.batch_ingestion_rate = Counter(
            "rag_system_batch_ingestion_total",
            "Total number of document batches ingested"
        )
        
        # Query processing metrics
        self.query_rate = Counter(
            "rag_system_query_total",
            "Total number of queries processed"
        )
        self.cached_query_rate = Counter(
            "rag_system_cached_query_total",
            "Total number of cached queries"
        )
        
        # Performance metrics
        self.query_time = Histogram(
            "rag_system_query_duration_seconds",
            "Query processing duration in seconds",
            buckets=(0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0)
        )
        self.memory_usage = Gauge(
            "rag_system_memory_usage_percent",
            "System memory usage percentage"
        )
        
        # Error metrics
        self.error_counter = Counter(
            "rag_system_errors_total",
            "Total number of errors",
            ["type"]
        )
        self.error_rate = Gauge(
            "rag_system_error_rate",
            "Error rate percentage"
        )
        
        # Cache metrics
        self.cache_size = Gauge(
            "rag_system_cache_size_bytes",
            "Cache size in bytes"
        )
        self.cache_hit_ratio = Gauge(
            "rag_system_cache_hit_ratio",
            "Cache hit ratio"
        )
        
        # System metrics
        self.cpu_usage = Gauge(
            "rag_system_cpu_usage_percent",
            "CPU usage percentage"
        )
        self.io_wait = Gauge(
            "rag_system_io_wait_percent",
            "IO wait percentage"
        )
        
        # Initialize thresholds
        self.thresholds = MetricThresholds()
        
        # Start background monitoring
        self._start_system_monitoring()
    
    def _start_system_monitoring(self):
        """Start background system metric collection."""
        import threading
        
        def collect_metrics():
            while True:
                try:
                    # Update system metrics
                    self.memory_usage.set(psutil.virtual_memory().percent)
                    self.cpu_usage.set(psutil.cpu_percent())
                    self.io_wait.set(psutil.cpu_times_percent().iowait)
                    
                    # Sleep for 10 seconds
                    time.sleep(10)
                except Exception as e:
                    logger.error(f"Error collecting system metrics: {e}")
        
        thread = threading.Thread(target=collect_metrics, daemon=True)
        thread.start()
    
    def record_document_ingestion(self, count: int = 1, batch: bool = False):
        """Record document ingestion.
        
        Args:
            count: Number of documents ingested
            batch: Whether this was a batch ingestion
        """
        self.doc_ingestion_rate.inc(count)
        if batch:
            self.batch_ingestion_rate.inc()
    
    def record_query(self, duration: float, cached: bool = False):
        """Record query processing.
        
        Args:
            duration: Query duration in seconds
            cached: Whether the query was cached
        """
        self.query_rate.inc()
        self.query_time.observe(duration)
        if cached:
            self.cached_query_rate.inc()
    
    def record_error(self, error_type: str):
        """Record system error.
        
        Args:
            error_type: Type of error encountered
        """
        self.error_counter.labels(type=error_type).inc()
        
        # Calculate error rate
        total_ops = float(self.query_rate._value.get() + self.doc_ingestion_rate._value.get())
        total_errors = sum(
            counter._value.get() 
            for counter in self.error_counter._metrics.values()
        )
        if total_ops > 0:
            self.error_rate.set((total_errors / total_ops) * 100)
    
    def update_cache_metrics(self, size_bytes: int, hit_ratio: float):
        """Update cache metrics.
        
        Args:
            size_bytes: Current cache size in bytes
            hit_ratio: Current cache hit ratio
        """
        self.cache_size.set(size_bytes)
        self.cache_hit_ratio.set(hit_ratio)
    
    def check_thresholds(self) -> Dict[str, Any]:
        """Check if any metrics exceed thresholds.
        
        Returns:
            Dict of alerts with their severity
        """
        alerts = {}
        
        # Check memory usage
        memory = self.memory_usage._value.get()
        if memory > self.thresholds.memory_usage_critical:
            alerts["memory"] = "critical"
        elif memory > self.thresholds.memory_usage_warning:
            alerts["memory"] = "warning"
        
        # Check error rate
        error_rate = self.error_rate._value.get()
        if error_rate > self.thresholds.error_rate_critical:
            alerts["error_rate"] = "critical"
        elif error_rate > self.thresholds.error_rate_warning:
            alerts["error_rate"] = "warning"
        
        # Check query time (convert to ms)
        query_time = self.query_time.observe(float("inf")) * 1000
        if query_time > self.thresholds.query_time_critical:
            alerts["query_time"] = "critical"
        elif query_time > self.thresholds.query_time_warning:
            alerts["query_time"] = "warning"
        
        return alerts
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get current system metrics.
        
        Returns:
            Dict of current metric values
        """
        return {
            "throughput": {
                "ingestion_rate": self.doc_ingestion_rate._value.get(),
                "query_rate": self.query_rate._value.get(),
                "cache_hit_ratio": self.cache_hit_ratio._value.get()
            },
            "latency": {
                "p50_ms": self.query_time.observe(0.5) * 1000,
                "p95_ms": self.query_time.observe(0.95) * 1000,
                "p99_ms": self.query_time.observe(0.99) * 1000
            },
            "memory": {
                "usage_percent": self.memory_usage._value.get(),
                "cache_size_mb": self.cache_size._value.get() / (1024 * 1024)
            },
            "errors": {
                "rate": self.error_rate._value.get(),
                "count": sum(
                    counter._value.get() 
                    for counter in self.error_counter._metrics.values()
                )
            },
            "system": {
                "cpu_usage": self.cpu_usage._value.get(),
                "io_wait": self.io_wait._value.get()
            }
        } 