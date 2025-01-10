import os
import asyncio
import logging
from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime
import json
import psutil
from pathlib import Path
import time

@dataclass
class AutonomicConfig:
    min_free_memory_gb: float = 2.0
    max_cpu_percent: float = 40.0
    evolution_interval_minutes: int = 30
    pattern_batch_size: int = 100
    context_batch_size: int = 50
    max_concurrent_tasks: int = 3

class AutonomicManager:
    def __init__(self, base_path: str = "/home/jon/ai_system_evolution"):
        self.base_path = Path(base_path)
        self.config = AutonomicConfig()
        self.active = False
        self._task_semaphore = asyncio.Semaphore(self.config.max_concurrent_tasks)
        self._setup_logging()
        
    def _setup_logging(self) -> None:
        """Setup logging configuration."""
        log_dir = Path("/home/jon/.local/share/cursor/logs")
        log_dir.mkdir(parents=True, exist_ok=True)
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            filename=str(log_dir / 'autonomic_manager.log')
        )
        self.logger = logging.getLogger('autonomic_manager')
        
    async def start(self) -> None:
        """Start autonomic management."""
        if self.active:
            return
            
        self.active = True
        self.logger.info("Starting autonomic management")
        
        # Start background tasks
        asyncio.create_task(self._monitor_loop())
        asyncio.create_task(self._optimization_loop())
        asyncio.create_task(self._pattern_evolution_loop())
        
    async def stop(self) -> None:
        """Stop autonomic management."""
        self.active = False
        self.logger.info("Stopping autonomic management")
        
    async def _monitor_loop(self) -> None:
        """Monitor system health and resources."""
        while self.active:
            try:
                metrics = await self._collect_metrics()
                await self._store_metrics(metrics)
                
                if await self._should_optimize(metrics):
                    await self._trigger_optimization()
                    
                await asyncio.sleep(60)  # Check every minute
            except Exception as e:
                self.logger.error(f"Monitor error: {e}")
                await asyncio.sleep(300)  # Back off on error
                
    async def _optimization_loop(self) -> None:
        """Optimize system based on collected metrics."""
        while self.active:
            try:
                if await self._can_optimize():
                    async with self._task_semaphore:
                        await self._optimize_system()
                        
                await asyncio.sleep(self.config.evolution_interval_minutes * 60)
            except Exception as e:
                self.logger.error(f"Optimization error: {e}")
                await asyncio.sleep(300)
                
    async def _pattern_evolution_loop(self) -> None:
        """Evolve system patterns based on observations."""
        while self.active:
            try:
                if await self._can_evolve_patterns():
                    async with self._task_semaphore:
                        await self._evolve_patterns()
                        
                await asyncio.sleep(self.config.evolution_interval_minutes * 30)
            except Exception as e:
                self.logger.error(f"Pattern evolution error: {e}")
                await asyncio.sleep(300)
                
    async def _collect_metrics(self) -> Dict:
        """Collect system metrics."""
        cpu_percent = psutil.cpu_percent(interval=1)
        mem = psutil.virtual_memory()
        
        return {
            'timestamp': datetime.now().isoformat(),
            'system': {
                'cpu_percent': cpu_percent,
                'memory_available_gb': mem.available / (1024 * 1024 * 1024),
                'memory_percent': mem.percent
            },
            'tasks': {
                'active': self._task_semaphore._value,
                'queued': self._task_semaphore._waiters and len(self._task_semaphore._waiters) or 0
            },
            'patterns': await self._get_pattern_metrics(),
            'contexts': await self._get_context_metrics()
        }
        
    async def _store_metrics(self, metrics: Dict) -> None:
        """Store collected metrics."""
        metrics_dir = self.base_path / 'data/metrics'
        metrics_dir.mkdir(parents=True, exist_ok=True)
        
        metrics_file = metrics_dir / f"autonomic_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        with open(metrics_file, 'w') as f:
            json.dump(metrics, f, indent=2)
            
    async def _should_optimize(self, metrics: Dict) -> bool:
        """Determine if optimization is needed."""
        system = metrics['system']
        
        # Check resource thresholds
        if system['memory_available_gb'] < self.config.min_free_memory_gb:
            return True
            
        if system['cpu_percent'] > self.config.max_cpu_percent:
            return True
            
        # Check task load
        tasks = metrics['tasks']
        if tasks['queued'] > 0:
            return True
            
        return False
        
    async def _can_optimize(self) -> bool:
        """Check if optimization can run."""
        mem = psutil.virtual_memory()
        cpu_percent = psutil.cpu_percent(interval=1)
        
        return (mem.available / (1024 * 1024 * 1024) >= self.config.min_free_memory_gb and
                cpu_percent <= self.config.max_cpu_percent)
                
    async def _can_evolve_patterns(self) -> bool:
        """Check if pattern evolution can run."""
        if not await self._can_optimize():
            return False
            
        # Check if we have enough new data
        pattern_count = await self._get_pattern_count()
        return pattern_count >= self.config.pattern_batch_size
        
    async def _optimize_system(self) -> None:
        """Run system optimization."""
        self.logger.info("Starting system optimization")
        
        try:
            # Optimize resource allocation
            await self._optimize_resources()
            
            # Optimize task scheduling
            await self._optimize_scheduling()
            
            # Optimize model loading
            await self._optimize_models()
            
            self.logger.info("System optimization completed")
        except Exception as e:
            self.logger.error(f"Optimization failed: {e}")
            
    async def _evolve_patterns(self) -> None:
        """Evolve system patterns."""
        self.logger.info("Starting pattern evolution")
        
        try:
            # Load recent patterns
            patterns = await self._load_recent_patterns()
            
            # Analyze patterns
            analysis = await self._analyze_patterns(patterns)
            
            # Generate optimizations
            optimizations = await self._generate_optimizations(analysis)
            
            # Apply optimizations
            await self._apply_optimizations(optimizations)
            
            self.logger.info("Pattern evolution completed")
        except Exception as e:
            self.logger.error(f"Pattern evolution failed: {e}")
            
    async def _get_pattern_metrics(self) -> Dict:
        """Get pattern-related metrics."""
        pattern_dir = self.base_path / 'data/patterns'
        if not pattern_dir.exists():
            return {'count': 0, 'size_mb': 0}
            
        total_size = sum(f.stat().st_size for f in pattern_dir.glob('**/*') if f.is_file())
        pattern_count = len(list(pattern_dir.glob('*.json')))
        
        return {
            'count': pattern_count,
            'size_mb': total_size / (1024 * 1024)
        }
        
    async def _get_context_metrics(self) -> Dict:
        """Get context-related metrics."""
        context_dir = Path("/home/jon/.local/share/cursor/contexts")
        if not context_dir.exists():
            return {'count': 0, 'size_mb': 0}
            
        total_size = sum(f.stat().st_size for f in context_dir.glob('**/*') if f.is_file())
        context_count = len(list(context_dir.glob('active/*.json')))
        
        return {
            'count': context_count,
            'size_mb': total_size / (1024 * 1024)
        }
        
    async def _get_pattern_count(self) -> int:
        """Get count of unprocessed patterns."""
        pattern_dir = self.base_path / 'data/patterns'
        if not pattern_dir.exists():
            return 0
            
        return len(list(pattern_dir.glob('*.json')))
        
    async def _optimize_resources(self) -> None:
        """Optimize system resource allocation."""
        try:
            # Get current resource usage
            mem = psutil.virtual_memory()
            swap = psutil.swap_memory()
            disk = psutil.disk_usage('/')
            
            # Check protection thresholds
            if mem.available / (1024 * 1024 * 1024) < 4:  # Cursor protection: 4GB min
                await self._free_memory()
                
            if disk.free / disk.total < 0.2:  # Arch protection: 20% min free
                await self._clean_temp_files()
                
            # Optimize process priorities
            await self._optimize_process_priorities()
            
        except Exception as e:
            self.logger.error(f"Resource optimization failed: {e}")
            
    async def _free_memory(self) -> None:
        """Free system memory while respecting protection directives."""
        try:
            # Get process list sorted by memory usage
            processes = []
            for proc in psutil.process_iter(['pid', 'name', 'memory_info']):
                try:
                    pinfo = proc.info
                    processes.append((
                        pinfo['pid'],
                        pinfo['name'],
                        pinfo['memory_info'].rss
                    ))
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass
                    
            # Sort by memory usage
            processes.sort(key=lambda x: x[2], reverse=True)
            
            for pid, name, _ in processes:
                # Never touch protected processes
                if name in ['cursor', 'Xorg', 'systemd', 'NetworkManager']:
                    continue
                    
                try:
                    proc = psutil.Process(pid)
                    # Try to reduce memory usage
                    if 'cache' in name.lower():
                        proc.terminate()
                    else:
                        # Send SIGTERM to non-essential high memory processes
                        proc.terminate()
                        proc.wait(timeout=3)
                except:
                    continue
                    
                # Check if we've freed enough
                if psutil.virtual_memory().available / (1024 * 1024 * 1024) >= 4:
                    break
                    
        except Exception as e:
            self.logger.error(f"Memory optimization failed: {e}")
            
    async def _clean_temp_files(self) -> None:
        """Clean temporary files while respecting protection directives."""
        try:
            safe_temp_dirs = [
                '/tmp',
                '/var/tmp',
                '/home/jon/.cache/cursor/temp'
            ]
            
            for temp_dir in safe_temp_dirs:
                if not os.path.exists(temp_dir):
                    continue
                    
                for root, dirs, files in os.walk(temp_dir, topdown=True):
                    for name in files:
                        try:
                            path = os.path.join(root, name)
                            # Skip if file is newer than 1 day
                            if time.time() - os.path.getctime(path) < 86400:
                                continue
                            os.remove(path)
                        except:
                            continue
                            
        except Exception as e:
            self.logger.error(f"Temp cleanup failed: {e}")
            
    async def _optimize_process_priorities(self) -> None:
        """Optimize process priorities while respecting protection directives."""
        try:
            # Priority mappings
            priorities = {
                'cursor': -5,  # Higher priority
                'claude': 0,
                'evolution': 0,
                'cache': 10,  # Lower priority
                'temp': 10
            }
            
            for proc in psutil.process_iter(['pid', 'name']):
                try:
                    pinfo = proc.info
                    for key, nice in priorities.items():
                        if key in pinfo['name'].lower():
                            psutil.Process(pinfo['pid']).nice(nice)
                except:
                    continue
                    
        except Exception as e:
            self.logger.error(f"Priority optimization failed: {e}")
            
    async def _optimize_scheduling(self) -> None:
        """Optimize task scheduling while respecting protection directives."""
        try:
            # Get current tasks
            tasks = []
            for proc in psutil.process_iter(['pid', 'name', 'cpu_percent']):
                try:
                    pinfo = proc.info
                    tasks.append((
                        pinfo['pid'],
                        pinfo['name'],
                        pinfo['cpu_percent']
                    ))
                except:
                    continue
                    
            # Sort by CPU usage
            tasks.sort(key=lambda x: x[2], reverse=True)
            
            # Adjust scheduling
            for pid, name, cpu in tasks:
                # Never modify protected processes
                if name in ['cursor', 'Xorg', 'systemd']:
                    continue
                    
                try:
                    proc = psutil.Process(pid)
                    if cpu > 50:  # High CPU usage
                        proc.nice(10)  # Lower priority
                    elif 'background' in name.lower():
                        proc.nice(5)  # Slightly lower priority
                except:
                    continue
                    
        except Exception as e:
            self.logger.error(f"Scheduling optimization failed: {e}")
            
    async def _optimize_models(self) -> None:
        """Optimize model loading and unloading while respecting protection directives."""
        try:
            # Get model usage metrics
            model_dir = Path("/home/jon/ai_system_evolution/data/models")
            if not model_dir.exists():
                return
                
            # Check each model
            for model_path in model_dir.glob("*.bin"):
                try:
                    stats = model_path.stat()
                    size_gb = stats.st_size / (1024 * 1024 * 1024)
                    
                    # Unload large unused models
                    if size_gb > 1.0:  # Models over 1GB
                        # Check if model is in use
                        if not self._is_model_in_use(model_path):
                            # Move to cold storage
                            cold_storage = model_dir / "cold_storage"
                            cold_storage.mkdir(exist_ok=True)
                            model_path.rename(cold_storage / model_path.name)
                except:
                    continue
                    
        except Exception as e:
            self.logger.error(f"Model optimization failed: {e}")
            
    def _is_model_in_use(self, model_path: Path) -> bool:
        """Check if a model is currently in use."""
        try:
            # Check for open file handles
            for proc in psutil.process_iter(['pid', 'open_files']):
                try:
                    files = proc.info['open_files']
                    if files and any(str(model_path) in str(f.path) for f in files):
                        return True
                except:
                    continue
            return False
        except:
            return True  # Assume in use if can't check
            
    async def _load_recent_patterns(self) -> List[Dict]:
        """Load recent unprocessed patterns."""
        try:
            patterns = []
            pattern_dir = self.base_path / 'data/patterns'
            if not pattern_dir.exists():
                return patterns
                
            # Load recent pattern files
            for pattern_file in sorted(
                pattern_dir.glob('*.json'),
                key=lambda x: x.stat().st_mtime,
                reverse=True
            )[:self.config.pattern_batch_size]:
                try:
                    with open(pattern_file) as f:
                        pattern = json.load(f)
                        patterns.append(pattern)
                except:
                    continue
                    
            return patterns
            
        except Exception as e:
            self.logger.error(f"Pattern loading failed: {e}")
            return []
            
    async def _analyze_patterns(self, patterns: List[Dict]) -> Dict:
        """Analyze patterns for optimization opportunities."""
        try:
            analysis = {
                'resource_patterns': [],
                'scheduling_patterns': [],
                'model_patterns': [],
                'metrics': {
                    'total_patterns': len(patterns),
                    'resource_related': 0,
                    'scheduling_related': 0,
                    'model_related': 0
                }
            }
            
            for pattern in patterns:
                # Analyze resource patterns
                if 'resource' in pattern.get('type', ''):
                    analysis['resource_patterns'].append(pattern)
                    analysis['metrics']['resource_related'] += 1
                    
                # Analyze scheduling patterns
                elif 'scheduling' in pattern.get('type', ''):
                    analysis['scheduling_patterns'].append(pattern)
                    analysis['metrics']['scheduling_related'] += 1
                    
                # Analyze model patterns
                elif 'model' in pattern.get('type', ''):
                    analysis['model_patterns'].append(pattern)
                    analysis['metrics']['model_related'] += 1
                    
            return analysis
            
        except Exception as e:
            self.logger.error(f"Pattern analysis failed: {e}")
            return {}
            
    async def _generate_optimizations(self, analysis: Dict) -> List[Dict]:
        """Generate optimization steps from analysis."""
        try:
            optimizations = []
            
            # Resource optimizations
            if analysis.get('resource_patterns'):
                optimizations.append({
                    'type': 'resource',
                    'action': 'optimize',
                    'patterns': analysis['resource_patterns'],
                    'priority': len(analysis['resource_patterns'])
                })
                
            # Scheduling optimizations
            if analysis.get('scheduling_patterns'):
                optimizations.append({
                    'type': 'scheduling',
                    'action': 'optimize',
                    'patterns': analysis['scheduling_patterns'],
                    'priority': len(analysis['scheduling_patterns'])
                })
                
            # Model optimizations
            if analysis.get('model_patterns'):
                optimizations.append({
                    'type': 'model',
                    'action': 'optimize',
                    'patterns': analysis['model_patterns'],
                    'priority': len(analysis['model_patterns'])
                })
                
            # Sort by priority
            optimizations.sort(key=lambda x: x['priority'], reverse=True)
            
            return optimizations
            
        except Exception as e:
            self.logger.error(f"Optimization generation failed: {e}")
            return []
            
    async def _apply_optimizations(self, optimizations: List[Dict]) -> None:
        """Apply generated optimizations."""
        try:
            for opt in optimizations:
                if not self.active:
                    break
                    
                try:
                    if opt['type'] == 'resource':
                        await self._optimize_resources()
                    elif opt['type'] == 'scheduling':
                        await self._optimize_scheduling()
                    elif opt['type'] == 'model':
                        await self._optimize_models()
                        
                    # Log successful optimization
                    self.logger.info(f"Applied optimization: {opt['type']}")
                    
                except Exception as e:
                    self.logger.error(f"Failed to apply optimization {opt['type']}: {e}")
                    continue
                    
        except Exception as e:
            self.logger.error(f"Optimization application failed: {e}")
            
    async def _trigger_optimization(self) -> None:
        """Trigger optimization cycle."""
        try:
            if await self._can_optimize():
                async with self._task_semaphore:
                    await self._optimize_system()
        except Exception as e:
            self.logger.error(f"Optimization trigger failed: {e}")

async def main():
    """Main entry point."""
    manager = AutonomicManager()
    await manager.start()
    
    try:
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        await manager.stop()

if __name__ == "__main__":
    asyncio.run(main()) 