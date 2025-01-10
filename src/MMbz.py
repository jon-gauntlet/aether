import os
import asyncio
import logging
from typing import Dict, List, Optional
from dataclasses import dataclass
import json
from datetime import datetime
import psutil
from pathlib import Path

@dataclass
class AutonomicConfig:
    monitoring_interval: int = 60  # seconds
    adaptation_threshold: float = 0.8  # 80% resource utilization triggers adaptation
    learning_rate: float = 0.1
    max_concurrent_optimizations: int = 2
    min_improvement_threshold: float = 0.05  # 5% minimum improvement to keep changes

class AutonomicManager:
    def __init__(self, base_path: str = "/home/jon/ai_system_evolution"):
        self.base_path = Path(base_path)
        self.config = AutonomicConfig()
        self.active = False
        self._optimization_lock = asyncio.Lock()
        self._ensure_directories()
        self._load_state()
        
    def _ensure_directories(self) -> None:
        """Ensure required directories exist."""
        dirs = [
            'data/autonomic/state',
            'data/autonomic/metrics',
            'data/autonomic/patterns',
            'data/autonomic/optimizations'
        ]
        for dir_name in dirs:
            os.makedirs(self.base_path / dir_name, exist_ok=True)
            
    def _load_state(self) -> None:
        """Load autonomic system state."""
        state_file = self.base_path / 'data/autonomic/state/manager_state.json'
        if state_file.exists():
            with open(state_file) as f:
                self.state = json.load(f)
        else:
            self.state = {
                'optimizations': {},
                'metrics_history': [],
                'learned_patterns': {},
                'adaptation_history': []
            }
            
    async def start(self) -> None:
        """Start autonomic manager."""
        if self.active:
            return
            
        self.active = True
        logging.info("Autonomic manager starting")
        
        # Start monitoring and optimization loops
        asyncio.create_task(self._monitoring_loop())
        asyncio.create_task(self._optimization_loop())
        asyncio.create_task(self._learning_loop())
        
    async def stop(self) -> None:
        """Stop autonomic manager."""
        self.active = False
        await self._save_state()
        logging.info("Autonomic manager stopped")
        
    async def _save_state(self) -> None:
        """Save current state."""
        state_file = self.base_path / 'data/autonomic/state/manager_state.json'
        async with aiofiles.open(state_file, 'w') as f:
            await f.write(json.dumps(self.state, indent=2))
            
    async def _monitoring_loop(self) -> None:
        """Monitor system metrics and trigger adaptations."""
        while self.active:
            try:
                metrics = await self._collect_metrics()
                await self._analyze_metrics(metrics)
                await self._store_metrics(metrics)
                
                # Sleep until next monitoring interval
                await asyncio.sleep(self.config.monitoring_interval)
            except Exception as e:
                logging.error(f"Monitoring error: {e}")
                await asyncio.sleep(10)
                
    async def _optimization_loop(self) -> None:
        """Execute system optimizations."""
        while self.active:
            try:
                if await self._should_optimize():
                    async with self._optimization_lock:
                        await self._execute_optimizations()
                        
                await asyncio.sleep(self.config.monitoring_interval * 2)
            except Exception as e:
                logging.error(f"Optimization error: {e}")
                await asyncio.sleep(30)
                
    async def _learning_loop(self) -> None:
        """Learn from system behavior and adaptations."""
        while self.active:
            try:
                await self._analyze_patterns()
                await self._update_learning()
                await self._prune_ineffective_patterns()
                
                await asyncio.sleep(self.config.monitoring_interval * 5)
            except Exception as e:
                logging.error(f"Learning error: {e}")
                await asyncio.sleep(60)
                
    async def _collect_metrics(self) -> Dict:
        """Collect system-wide metrics."""
        metrics = {
            'timestamp': datetime.now().isoformat(),
            'system': {
                'cpu_percent': psutil.cpu_percent(interval=1),
                'memory_percent': psutil.virtual_memory().percent,
                'swap_percent': psutil.swap_memory().percent
            },
            'services': await self._collect_service_metrics(),
            'resources': await self._collect_resource_metrics(),
            'patterns': await self._collect_pattern_metrics()
        }
        return metrics
        
    async def _analyze_metrics(self, metrics: Dict) -> None:
        """Analyze metrics and identify optimization opportunities."""
        # Add to metrics history
        self.state['metrics_history'].append(metrics)
        
        # Keep only recent history
        max_history = 1000
        if len(self.state['metrics_history']) > max_history:
            self.state['metrics_history'] = self.state['metrics_history'][-max_history:]
            
        # Analyze for patterns
        await self._analyze_metric_patterns(metrics)
        
    async def _analyze_metric_patterns(self, metrics: Dict) -> None:
        """Analyze metrics for patterns that might need optimization."""
        patterns = self.state['learned_patterns']
        
        # Resource usage patterns
        if metrics['system']['cpu_percent'] > self.config.adaptation_threshold * 100:
            patterns.setdefault('high_cpu_usage', []).append({
                'timestamp': metrics['timestamp'],
                'value': metrics['system']['cpu_percent']
            })
            
        if metrics['system']['memory_percent'] > self.config.adaptation_threshold * 100:
            patterns.setdefault('high_memory_usage', []).append({
                'timestamp': metrics['timestamp'],
                'value': metrics['system']['memory_percent']
            })
            
        # Service patterns
        for service, service_metrics in metrics['services'].items():
            if service_metrics.get('error_rate', 0) > 0.1:  # 10% error rate
                patterns.setdefault(f'{service}_errors', []).append({
                    'timestamp': metrics['timestamp'],
                    'value': service_metrics['error_rate']
                })
                
    async def _should_optimize(self) -> bool:
        """Determine if optimization should run."""
        if not self.state['metrics_history']:
            return False
            
        recent_metrics = self.state['metrics_history'][-1]
        
        # Check if resources are stressed
        system_metrics = recent_metrics['system']
        if (system_metrics['cpu_percent'] > self.config.adaptation_threshold * 100 or
            system_metrics['memory_percent'] > self.config.adaptation_threshold * 100):
            return True
            
        # Check for error patterns
        for service in recent_metrics['services'].values():
            if service.get('error_rate', 0) > 0.1:
                return True
                
        return False
        
    async def _execute_optimizations(self) -> None:
        """Execute identified optimizations."""
        # Get current optimizations
        optimizations = await self._identify_optimizations()
        
        # Execute each optimization
        for opt in optimizations[:self.config.max_concurrent_optimizations]:
            try:
                # Take backup before optimization
                backup_id = await self._create_backup()
                
                # Apply optimization
                success = await self._apply_optimization(opt)
                
                if success:
                    # Validate improvement
                    if await self._validate_improvement(opt):
                        # Store successful optimization
                        await self._store_optimization(opt)
                    else:
                        # Restore from backup if no improvement
                        await self._restore_backup(backup_id)
                else:
                    await self._restore_backup(backup_id)
                    
            except Exception as e:
                logging.error(f"Optimization failed: {e}")
                if backup_id:
                    await self._restore_backup(backup_id)
                    
    async def _identify_optimizations(self) -> List[Dict]:
        """Identify potential optimizations based on patterns."""
        optimizations = []
        
        # Analyze patterns for optimization opportunities
        patterns = self.state['learned_patterns']
        
        # Resource optimizations
        if 'high_cpu_usage' in patterns:
            optimizations.append({
                'type': 'resource',
                'target': 'cpu',
                'action': 'reduce_load',
                'priority': len(patterns['high_cpu_usage'])
            })
            
        if 'high_memory_usage' in patterns:
            optimizations.append({
                'type': 'resource',
                'target': 'memory',
                'action': 'optimize_usage',
                'priority': len(patterns['high_memory_usage'])
            })
            
        # Service optimizations
        for pattern_name, pattern_data in patterns.items():
            if pattern_name.endswith('_errors'):
                service_name = pattern_name.replace('_errors', '')
                optimizations.append({
                    'type': 'service',
                    'target': service_name,
                    'action': 'improve_reliability',
                    'priority': len(pattern_data)
                })
                
        # Sort by priority
        optimizations.sort(key=lambda x: x['priority'], reverse=True)
        
        return optimizations
        
    async def _apply_optimization(self, optimization: Dict) -> bool:
        """Apply an optimization to the system."""
        try:
            if optimization['type'] == 'resource':
                if optimization['target'] == 'cpu':
                    return await self._optimize_cpu_usage()
                elif optimization['target'] == 'memory':
                    return await self._optimize_memory_usage()
            elif optimization['type'] == 'service':
                return await self._optimize_service(optimization['target'])
                
            return False
        except Exception as e:
            logging.error(f"Failed to apply optimization: {e}")
            return False
            
    async def _validate_improvement(self, optimization: Dict) -> bool:
        """Validate if an optimization actually improved the system."""
        # Get metrics before optimization
        before_metrics = self.state['metrics_history'][-2]
        
        # Get current metrics
        current_metrics = await self._collect_metrics()
        
        # Calculate improvement
        if optimization['type'] == 'resource':
            if optimization['target'] == 'cpu':
                improvement = (before_metrics['system']['cpu_percent'] -
                             current_metrics['system']['cpu_percent']) / 100.0
            elif optimization['target'] == 'memory':
                improvement = (before_metrics['system']['memory_percent'] -
                             current_metrics['system']['memory_percent']) / 100.0
        elif optimization['type'] == 'service':
            service = optimization['target']
            before_errors = before_metrics['services'][service].get('error_rate', 0)
            current_errors = current_metrics['services'][service].get('error_rate', 0)
            improvement = before_errors - current_errors
            
        return improvement >= self.config.min_improvement_threshold
        
    async def _store_optimization(self, optimization: Dict) -> None:
        """Store successful optimization."""
        optimization_file = self.base_path / 'data/autonomic/optimizations/successful_optimizations.json'
        
        optimizations = []
        if optimization_file.exists():
            with open(optimization_file) as f:
                optimizations = json.load(f)
                
        optimization['timestamp'] = datetime.now().isoformat()
        optimizations.append(optimization)
        
        with open(optimization_file, 'w') as f:
            json.dump(optimizations, f, indent=2)
            
    async def _create_backup(self) -> str:
        """Create backup before optimization."""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_id = f"autonomic_backup_{timestamp}"
        backup_dir = self.base_path / 'data/autonomic/backups' / backup_id
        
        os.makedirs(backup_dir, exist_ok=True)
        
        # Backup critical files
        await self._backup_files(backup_dir)
        
        return backup_id
        
    async def _restore_backup(self, backup_id: str) -> None:
        """Restore from backup if optimization fails."""
        backup_dir = self.base_path / 'data/autonomic/backups' / backup_id
        
        if backup_dir.exists():
            await self._restore_files(backup_dir)
            
    async def _backup_files(self, backup_dir: Path) -> None:
        """Backup critical files."""
        # Implement backup logic
        pass
        
    async def _restore_files(self, backup_dir: Path) -> None:
        """Restore files from backup."""
        # Implement restore logic
        pass

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
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main()) 