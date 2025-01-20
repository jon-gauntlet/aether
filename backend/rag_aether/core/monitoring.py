"""RAG monitoring system."""
import os
import time
import psutil
import logging
from typing import Dict, Any, Optional
from dataclasses import dataclass
from prometheus_client import Counter, Gauge, Histogram, CollectorRegistry, start_http_server

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

class RAGMonitor:
    """Monitor RAG system metrics."""
    
    def __init__(self):
        """Initialize monitoring system."""
        self.use_monitoring = os.getenv("USE_MONITORING", "false").lower() == "true"
        self.use_mock = os.getenv("USE_MOCK", "false").lower() == "true"
        
        # Initialize metrics without Prometheus if monitoring is disabled
        self._queries = 0
        self._latency = 0
        self._cache_hits = 0
        self._system_ready = False
        self._doc_count = 0
        self._batch_count = 0
        self._error_count = 0
        
        if self.use_monitoring and not self.use_mock:
            try:
                # Create a new registry for this instance
                self.registry = CollectorRegistry()
                
                # Document processing metrics
                self.doc_ingestion_rate = Counter(
                    "rag_doc_ingestion_total",
                    "Total number of documents ingested",
                    registry=self.registry
                )
                self.batch_ingestion_rate = Counter(
                    "rag_batch_ingestion_total",
                    "Total number of document batches ingested",
                    registry=self.registry
                )
                
                # Query processing metrics
                self.query_rate = Counter(
                    "rag_query_total",
                    "Total number of queries processed",
                    registry=self.registry
                )
                self.cached_query_rate = Counter(
                    "rag_cached_query_total",
                    "Total number of cached queries",
                    registry=self.registry
                )
                
                # Performance metrics
                self.query_time = Histogram(
                    "rag_query_duration_seconds",
                    "Query processing duration in seconds",
                    buckets=(0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0),
                    registry=self.registry
                )
                self.memory_usage = Gauge(
                    "rag_memory_usage_percent",
                    "System memory usage percentage",
                    registry=self.registry
                )
                
                # Error metrics
                self.error_counter = Counter(
                    "rag_errors_total",
                    "Total number of errors",
                    ["type"],
                    registry=self.registry
                )
                self.error_rate = Gauge(
                    "rag_error_rate",
                    "Error rate percentage",
                    registry=self.registry
                )
                
                # Cache metrics
                self.cache_size = Gauge(
                    "rag_cache_size_bytes",
                    "Cache size in bytes",
                    registry=self.registry
                )
                self.cache_hit_ratio = Gauge(
                    "rag_cache_hit_ratio",
                    "Cache hit ratio",
                    registry=self.registry
                )
                
                # System metrics
                self.cpu_usage = Gauge(
                    "rag_cpu_usage_percent",
                    "CPU usage percentage",
                    registry=self.registry
                )
                self.io_wait = Gauge(
                    "rag_io_wait_percent",
                    "IO wait percentage",
                    registry=self.registry
                )
                self.system_ready = Gauge(
                    "rag_system_ready",
                    "Whether the RAG system is ready",
                    registry=self.registry
                )
                
                # Initialize thresholds
                self.thresholds = MetricThresholds()
                
                # Start background monitoring
                self._start_system_monitoring()
                
                logger.info("Prometheus metrics initialized successfully")
            except Exception as e:
                logger.warning(f"Failed to initialize Prometheus metrics: {str(e)}")
                self.use_monitoring = False
    
    def _start_system_monitoring(self):
        """Start background system metric collection."""
        if not self.use_monitoring or self.use_mock:
            return
            
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
        """Record document ingestion."""
        self._doc_count += count
        if batch:
            self._batch_count += 1
            
        if self.use_monitoring and not self.use_mock:
            try:
                self.doc_ingestion_rate.inc(count)
                if batch:
                    self.batch_ingestion_rate.inc()
            except Exception as e:
                logger.warning(f"Failed to record document ingestion: {str(e)}")
    
    def record_query(self, duration: float, cached: bool = False):
        """Record query processing."""
        self._queries += 1
        self._latency = duration
        if cached:
            self._cache_hits += 1
            
        if self.use_monitoring and not self.use_mock:
            try:
                self.query_rate.inc()
                self.query_time.observe(duration)
                if cached:
                    self.cached_query_rate.inc()
            except Exception as e:
                logger.warning(f"Failed to record query metrics: {str(e)}")
    
    def record_error(self, error_type: str):
        """Record system error."""
        self._error_count += 1
        
        if self.use_monitoring and not self.use_mock:
            try:
                self.error_counter.labels(type=error_type).inc()
                
                # Calculate error rate
                total_ops = float(self.query_rate._value.get() + self.doc_ingestion_rate._value.get())
                total_errors = sum(
                    counter._value.get() 
                    for counter in self.error_counter._metrics.values()
                )
                if total_ops > 0:
                    self.error_rate.set((total_errors / total_ops) * 100)
            except Exception as e:
                logger.warning(f"Failed to record error: {str(e)}")
    
    def update_cache_metrics(self, size_bytes: int, hit_ratio: float):
        """Update cache metrics."""
        if self.use_monitoring and not self.use_mock:
            try:
                self.cache_size.set(size_bytes)
                self.cache_hit_ratio.set(hit_ratio)
            except Exception as e:
                logger.warning(f"Failed to update cache metrics: {str(e)}")
    
    def set_system_ready(self, ready: bool):
        """Set system ready state."""
        self._system_ready = ready
        if self.use_monitoring and not self.use_mock:
            try:
                self.system_ready.set(1 if ready else 0)
            except Exception as e:
                logger.warning(f"Failed to set system ready state: {str(e)}")
    
    def check_thresholds(self) -> Dict[str, Any]:
        """Check if any metrics exceed thresholds."""
        if not self.use_monitoring or self.use_mock:
            return {}
            
        alerts = {}
        
        try:
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
        except Exception as e:
            logger.warning(f"Failed to check thresholds: {str(e)}")
        
        return alerts
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get current metrics."""
        metrics = {
            "queries": self._queries,
            "latency": self._latency,
            "cache_hits": self._cache_hits,
            "system_ready": self._system_ready,
            "documents": self._doc_count,
            "batches": self._batch_count,
            "errors": self._error_count
        }
        
        if self.use_monitoring and not self.use_mock:
            try:
                metrics.update({
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
                })
            except Exception as e:
                logger.warning(f"Failed to get Prometheus metrics: {str(e)}")
        
        return metrics

# Global monitor instance
monitor = RAGMonitor() 