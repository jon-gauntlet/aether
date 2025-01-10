import asyncio
import logging
import os
from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime
import json
import aiofiles
import psutil

@dataclass
class EvolutionConfig:
    max_memory_gb: float = 4.0
    max_cpu_percent: float = 40.0
    evolution_interval_minutes: int = 30
    backup_retention_days: int = 7
    min_free_memory_gb: float = 2.0

class EvolutionService:
    def __init__(self, base_path: str = "/home/jon/ai_system_evolution"):
        self.base_path = base_path
        self.config = EvolutionConfig()
        self.active = False
        self._evolution_lock = asyncio.Lock()
        self._ensure_directories()
        
    def _ensure_directories(self) -> None:
        """Ensure required directories exist."""
        dirs = [
            'data/backups',
            'data/metrics',
            'data/patterns',
            'data/states'
        ]
        for dir_name in dirs:
            os.makedirs(os.path.join(self.base_path, dir_name), exist_ok=True)
            
    async def start(self) -> None:
        """Start the evolution service."""
        if self.active:
            return
            
        self.active = True
        logging.info("Evolution service starting")
        
        # Start background tasks
        asyncio.create_task(self._evolution_loop())
        asyncio.create_task(self._cleanup_loop())
        
    async def stop(self) -> None:
        """Stop the evolution service."""
        self.active = False
        logging.info("Evolution service stopping")
        
    async def _evolution_loop(self) -> None:
        """Main evolution loop."""
        while self.active:
            try:
                if await self._can_evolve():
                    async with self._evolution_lock:
                        await self._evolve_system()
                        
                # Sleep until next evolution cycle
                await asyncio.sleep(self.config.evolution_interval_minutes * 60)
            except Exception as e:
                logging.error(f"Evolution error: {e}")
                await asyncio.sleep(60)  # Sleep on error
                
    async def _cleanup_loop(self) -> None:
        """Cleanup old backups and metrics."""
        while self.active:
            try:
                await self._cleanup_old_backups()
                await self._cleanup_old_metrics()
                await asyncio.sleep(3600)  # Run hourly
            except Exception as e:
                logging.error(f"Cleanup error: {e}")
                await asyncio.sleep(300)
                
    async def _can_evolve(self) -> bool:
        """Check if system can evolve."""
        # Check system resources
        mem = psutil.virtual_memory()
        available_gb = mem.available / (1024 * 1024 * 1024)
        cpu_percent = psutil.cpu_percent(interval=1)
        
        if available_gb < self.config.min_free_memory_gb:
            return False
            
        if cpu_percent > self.config.max_cpu_percent:
            return False
            
        return True
        
    async def _evolve_system(self) -> None:
        """Execute system evolution steps."""
        # Create backup
        backup_id = await self._create_backup()
        if not backup_id:
            raise RuntimeError("Failed to create backup")
            
        try:
            # Execute evolution steps
            steps = [
                self._evolve_patterns,
                self._evolve_context_handling,
                self._evolve_resource_management,
                self._evolve_integration
            ]
            
            for step in steps:
                if not self.active:
                    break
                    
                if await self._can_evolve():
                    await step()
                    await self._validate_evolution()
                    await self._store_metrics()
                    
        except Exception as e:
            logging.error(f"Evolution failed: {e}")
            await self._restore_backup(backup_id)
            raise
            
    async def _evolve_patterns(self) -> None:
        """Evolve system patterns."""
        patterns_dir = os.path.join(self.base_path, 'data/patterns')
        
        # Load existing patterns
        patterns = await self._load_patterns()
        
        # Analyze patterns
        analysis = await self._analyze_patterns(patterns)
        
        # Generate optimizations
        optimizations = await self._generate_pattern_optimizations(analysis)
        
        # Apply optimizations
        await self._apply_pattern_optimizations(optimizations)
        
    async def _evolve_context_handling(self) -> None:
        """Evolve context handling capabilities."""
        # Analyze current context handling
        contexts = await self._load_contexts()
        
        # Identify improvements
        improvements = await self._analyze_context_handling(contexts)
        
        # Apply improvements
        await self._apply_context_improvements(improvements)
        
    async def _evolve_resource_management(self) -> None:
        """Evolve resource management strategies."""
        # Get current resource usage patterns
        usage = await self._get_resource_usage_patterns()
        
        # Generate optimizations
        optimizations = await self._generate_resource_optimizations(usage)
        
        # Apply optimizations
        await self._apply_resource_optimizations(optimizations)
        
    async def _evolve_integration(self) -> None:
        """Evolve system integration capabilities."""
        # Analyze current integration points
        integration_points = await self._analyze_integration_points()
        
        # Generate improvements
        improvements = await self._generate_integration_improvements(integration_points)
        
        # Apply improvements
        await self._apply_integration_improvements(improvements)
        
    async def _create_backup(self) -> Optional[str]:
        """Create system state backup."""
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_id = f"backup_{timestamp}"
            backup_dir = os.path.join(self.base_path, 'data/backups', backup_id)
            
            # Create backup directory
            os.makedirs(backup_dir)
            
            # Backup critical directories
            dirs_to_backup = ['data/patterns', 'data/states', 'config']
            for dir_name in dirs_to_backup:
                src = os.path.join(self.base_path, dir_name)
                dst = os.path.join(backup_dir, dir_name)
                if os.path.exists(src):
                    os.makedirs(os.path.dirname(dst), exist_ok=True)
                    os.system(f'cp -r "{src}" "{dst}"')
                    
            return backup_id
        except Exception as e:
            logging.error(f"Backup failed: {e}")
            return None
            
    async def _restore_backup(self, backup_id: str) -> bool:
        """Restore system from backup."""
        try:
            backup_dir = os.path.join(self.base_path, 'data/backups', backup_id)
            
            # Restore directories
            dirs_to_restore = ['data/patterns', 'data/states', 'config']
            for dir_name in dirs_to_restore:
                src = os.path.join(backup_dir, dir_name)
                dst = os.path.join(self.base_path, dir_name)
                if os.path.exists(src):
                    os.system(f'rm -rf "{dst}"')
                    os.makedirs(os.path.dirname(dst), exist_ok=True)
                    os.system(f'cp -r "{src}" "{dst}"')
                    
            return True
        except Exception as e:
            logging.error(f"Restore failed: {e}")
            return False
            
    async def _cleanup_old_backups(self) -> None:
        """Clean up old backup files."""
        backup_dir = os.path.join(self.base_path, 'data/backups')
        current_time = datetime.now()
        
        for backup_id in os.listdir(backup_dir):
            try:
                backup_path = os.path.join(backup_dir, backup_id)
                creation_time = datetime.fromtimestamp(os.path.getctime(backup_path))
                age_days = (current_time - creation_time).days
                
                if age_days > self.config.backup_retention_days:
                    os.system(f'rm -rf "{backup_path}"')
            except Exception as e:
                logging.error(f"Failed to cleanup backup {backup_id}: {e}")
                
    async def _cleanup_old_metrics(self) -> None:
        """Clean up old metrics data."""
        metrics_dir = os.path.join(self.base_path, 'data/metrics')
        current_time = datetime.now()
        
        for filename in os.listdir(metrics_dir):
            try:
                file_path = os.path.join(metrics_dir, filename)
                creation_time = datetime.fromtimestamp(os.path.getctime(file_path))
                age_days = (current_time - creation_time).days
                
                if age_days > self.config.backup_retention_days:
                    os.remove(file_path)
            except Exception as e:
                logging.error(f"Failed to cleanup metrics file {filename}: {e}")
                
    async def _validate_evolution(self) -> bool:
        """Validate system state after evolution."""
        try:
            # Check system integrity
            if not await self._check_system_integrity():
                return False
                
            # Verify resource usage
            if not await self._verify_resource_usage():
                return False
                
            # Validate patterns
            if not await self._validate_patterns():
                return False
                
            return True
        except Exception as e:
            logging.error(f"Validation failed: {e}")
            return False
            
    async def _store_metrics(self) -> None:
        """Store evolution metrics."""
        try:
            metrics = {
                'timestamp': datetime.now().isoformat(),
                'resource_usage': await self._get_resource_metrics(),
                'pattern_metrics': await self._get_pattern_metrics(),
                'context_metrics': await self._get_context_metrics()
            }
            
            metrics_file = os.path.join(
                self.base_path,
                'data/metrics',
                f"evolution_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            )
            
            async with aiofiles.open(metrics_file, 'w') as f:
                await f.write(json.dumps(metrics, indent=2))
        except Exception as e:
            logging.error(f"Failed to store metrics: {e}")

async def main():
    service = EvolutionService()
    await service.start()
    
    try:
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        await service.stop()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main()) 