"""System monitoring and profiling."""
from typing import Dict, Any, Optional
import logging
import time
from datetime import datetime, UTC
import psutil
import tracemalloc
from dataclasses import dataclass, asdict

logger = logging.getLogger(__name__)

@dataclass
class SystemMetrics:
    """System performance metrics."""
    cpu_percent: float
    memory_percent: float
    memory_available: int
    disk_usage: float
    timestamp: float
    process_memory: int
    process_threads: int
    
@dataclass
class PerformanceMetrics:
    """Performance metrics for RAG system."""
    total_queries: int
    successful_queries: int
    failed_queries: int
    avg_response_time: float
    cache_hit_rate: float
    cache_hits_by_type: Dict[str, int]
    memory_snapshots: Dict[str, Any]
    system_metrics: SystemMetrics

class SystemMonitor:
    """Monitors system performance and resource usage."""
    
    def __init__(self):
        """Initialize system monitor."""
        self._start_time = datetime.now(UTC)
        self._total_queries = 0
        self._successful_queries = 0
        self._failed_queries = 0
        self._response_times = []
        self._cache_hits = 0
        self._cache_hits_by_type = {"redis": 0, "lru": 0}
        self._memory_snapshots = {}
        self._current_query_start = None
        tracemalloc.start()
    
    def take_snapshot(self, name: str) -> None:
        """Take a memory snapshot with a given name."""
        snapshot = tracemalloc.take_snapshot()
        self._memory_snapshots[name] = snapshot
        
    def compare_snapshots(self, first: str, second: str) -> None:
        """Compare two memory snapshots."""
        if first not in self._memory_snapshots or second not in self._memory_snapshots:
            logger.warning("Snapshot not found")
            return
            
        snapshot1 = self._memory_snapshots[first]
        snapshot2 = self._memory_snapshots[second]
        
        top_stats = snapshot2.compare_to(snapshot1, 'lineno')
        logger.info("Memory diff between %s and %s:", first, second)
        for stat in top_stats[:3]:
            logger.info(str(stat))
            
    def record_query_start(self) -> None:
        """Record the start of a query."""
        self._current_query_start = time.time()
        self._total_queries += 1
        
    def record_query_success(self) -> None:
        """Record a successful query."""
        if self._current_query_start:
            response_time = time.time() - self._current_query_start
            self._response_times.append(response_time)
            self._successful_queries += 1
            self._current_query_start = None
            
    def record_query_failure(self) -> None:
        """Record a failed query."""
        if self._current_query_start:
            response_time = time.time() - self._current_query_start
            self._response_times.append(response_time)
            self._failed_queries += 1
            self._current_query_start = None
            
    def record_cache_hit(self, cache_type: str = "lru") -> None:
        """Record a cache hit.
        
        Args:
            cache_type: Type of cache that was hit (redis or lru)
        """
        self._cache_hits += 1
        if cache_type in self._cache_hits_by_type:
            self._cache_hits_by_type[cache_type] += 1
            
    def record_cache_miss(self) -> None:
        """Record a cache miss."""
        pass  # Cache misses are tracked implicitly
        
    def get_metrics(self) -> PerformanceMetrics:
        """Get current performance metrics."""
        process = psutil.Process()
        avg_response_time = (
            sum(self._response_times) / len(self._response_times)
            if self._response_times
            else 0.0
        )
        cache_hit_rate = (
            self._cache_hits / self._total_queries
            if self._total_queries > 0
            else 0.0
        )
        
        return PerformanceMetrics(
            total_queries=self._total_queries,
            successful_queries=self._successful_queries,
            failed_queries=self._failed_queries,
            avg_response_time=avg_response_time,
            cache_hit_rate=cache_hit_rate,
            cache_hits_by_type=self._cache_hits_by_type.copy(),
            memory_snapshots=self._memory_snapshots,
            system_metrics=SystemMetrics(
                cpu_percent=psutil.cpu_percent(),
                memory_percent=psutil.virtual_memory().percent,
                memory_available=psutil.virtual_memory().available,
                disk_usage=psutil.disk_usage('/').percent,
                timestamp=time.time(),
                process_memory=process.memory_info().rss,
                process_threads=process.num_threads()
            )
        )
    
    def reset(self) -> None:
        """Reset all metrics."""
        self._start_time = datetime.now(UTC)
        self._total_queries = 0
        self._successful_queries = 0
        self._failed_queries = 0
        self._response_times = []
        self._cache_hits = 0
        self._cache_hits_by_type = {"redis": 0, "lru": 0}
        self._memory_snapshots = {}
        tracemalloc.stop()
        tracemalloc.start()

# Global monitor instance
monitor = SystemMonitor() 