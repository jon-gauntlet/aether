import os
import asyncio
import logging
import psutil
import json
from typing import Dict, List, Optional
from datetime import datetime
from systemd import journal
from dataclasses import dataclass
from pathlib import Path

@dataclass
class SystemMetrics:
    timestamp: datetime
    cpu_percent: float
    memory_percent: float
    io_counters: Dict
    network_counters: Dict
    context_count: int
    pattern_count: int
    active_services: List[str]
    
class MetricsStore:
    def __init__(self, base_path: str = "/home/jon/.local/share/cursor/metrics"):
        self.base_path = Path(base_path)
        self.log = logging.getLogger("metrics_store")
        self.log.addHandler(journal.JournalHandler())
        self.log.setLevel(logging.INFO)
        self._ensure_paths()
        
    def _ensure_paths(self):
        """Ensure required directory structure exists"""
        self.base_path.mkdir(parents=True, exist_ok=True)
        for path in ['system', 'services', 'patterns', 'contexts']:
            (self.base_path / path).mkdir(exist_ok=True)
            
    async def store_metrics(self, metrics: SystemMetrics):
        """Store system metrics"""
        try:
            # Create timestamp-based directory structure
            dt = metrics.timestamp
            year_month = dt.strftime("%Y/%m")
            day_hour = dt.strftime("%d/%H")
            
            metrics_dir = self.base_path / "system" / year_month / day_hour
            metrics_dir.mkdir(parents=True, exist_ok=True)
            
            # Store metrics
            metrics_file = metrics_dir / f"{dt.strftime('%M%S')}.json"
            async with asyncio.Lock():
                with open(metrics_file, 'w') as f:
                    json.dump({
                        'timestamp': metrics.timestamp.isoformat(),
                        'cpu_percent': metrics.cpu_percent,
                        'memory_percent': metrics.memory_percent,
                        'io_counters': metrics.io_counters,
                        'network_counters': metrics.network_counters,
                        'context_count': metrics.context_count,
                        'pattern_count': metrics.pattern_count,
                        'active_services': metrics.active_services
                    }, f)
                    
            self.log.info(f"Stored metrics at {metrics_file}")
            return True
        except Exception as e:
            self.log.error(f"Failed to store metrics: {e}")
            return False
            
    async def get_metrics(self, start_time: datetime, end_time: datetime) -> List[SystemMetrics]:
        """Get metrics within time range"""
        metrics = []
        try:
            # Calculate directory paths
            start_year_month = start_time.strftime("%Y/%m")
            end_year_month = end_time.strftime("%Y/%m")
            
            # Get all relevant directories
            metrics_base = self.base_path / "system"
            for year_dir in metrics_base.glob("*"):
                if not year_dir.is_dir():
                    continue
                    
                for month_dir in year_dir.glob("*"):
                    if not month_dir.is_dir():
                        continue
                        
                    year_month = f"{year_dir.name}/{month_dir.name}"
                    if year_month < start_year_month or year_month > end_year_month:
                        continue
                        
                    # Process metrics files
                    for metrics_file in month_dir.rglob("*.json"):
                        with open(metrics_file) as f:
                            data = json.load(f)
                            timestamp = datetime.fromisoformat(data['timestamp'])
                            
                            if start_time <= timestamp <= end_time:
                                metrics.append(SystemMetrics(
                                    timestamp=timestamp,
                                    cpu_percent=data['cpu_percent'],
                                    memory_percent=data['memory_percent'],
                                    io_counters=data['io_counters'],
                                    network_counters=data['network_counters'],
                                    context_count=data['context_count'],
                                    pattern_count=data['pattern_count'],
                                    active_services=data['active_services']
                                ))
                                
            return sorted(metrics, key=lambda m: m.timestamp)
        except Exception as e:
            self.log.error(f"Failed to get metrics: {e}")
            return []

class SystemMonitor:
    def __init__(self):
        self.store = MetricsStore()
        self.log = logging.getLogger("system_monitor")
        self.log.addHandler(journal.JournalHandler())
        self.log.setLevel(logging.INFO)
        self.active = False
        
    async def start(self):
        """Start monitoring"""
        if self.active:
            return
            
        self.active = True
        self.log.info("System monitor starting")
        
        # Start monitoring tasks
        asyncio.create_task(self._collect_metrics())
        
    async def stop(self):
        """Stop monitoring"""
        self.active = False
        self.log.info("System monitor stopping")
        
    async def _collect_metrics(self):
        """Collect system metrics"""
        while self.active:
            try:
                # Collect metrics
                metrics = await self._get_current_metrics()
                
                # Store metrics
                await self.store.store_metrics(metrics)
                
                # Sleep for collection interval
                await asyncio.sleep(60)  # Collect every minute
                
            except Exception as e:
                self.log.error(f"Metrics collection error: {e}")
                await asyncio.sleep(5)
                
    async def _get_current_metrics(self) -> SystemMetrics:
        """Get current system metrics"""
        try:
            # Get system metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            io_counters = psutil.disk_io_counters()._asdict()
            network_counters = psutil.net_io_counters()._asdict()
            
            # Get service metrics
            active_services = []
            cursor_slice = "/home/jon/.config/systemd/user/cursor.slice"
            if os.path.exists(cursor_slice):
                for service in os.listdir(cursor_slice):
                    if service.endswith('.service'):
                        active_services.append(service)
                        
            # Get context/pattern counts
            context_count = len(os.listdir('/home/jon/.local/share/cursor/contexts/active'))
            pattern_count = sum(
                len(os.listdir(f'/home/jon/.local/share/cursor/patterns/{d}'))
                for d in ['code', 'workflow', 'integration', 'synthesized']
                if os.path.exists(f'/home/jon/.local/share/cursor/patterns/{d}')
            )
            
            return SystemMetrics(
                timestamp=datetime.now(),
                cpu_percent=cpu_percent,
                memory_percent=memory.percent,
                io_counters=io_counters,
                network_counters=network_counters,
                context_count=context_count,
                pattern_count=pattern_count,
                active_services=active_services
            )
        except Exception as e:
            self.log.error(f"Failed to get metrics: {e}")
            raise

async def main():
    """Main monitor entry point"""
    monitor = SystemMonitor()
    
    try:
        await monitor.start()
        
        # Keep running
        while True:
            await asyncio.sleep(1)
            
    except KeyboardInterrupt:
        await monitor.stop()
    except Exception as e:
        logger.error(f"Monitor error: {e}")
        await monitor.stop()
        raise

if __name__ == "__main__":
    asyncio.run(main()) 