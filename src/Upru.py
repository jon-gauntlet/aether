import asyncio
from dataclasses import dataclass, field
from datetime import datetime
import json
import logging
import os
import psutil
import signal
import sys
from typing import Dict, List, Optional, Any, Set
import uuid

from systemd import journal

from ..context.manager import ContextManager, Context
from ..context.learner import PatternLearner
from ..context.synthesizer import PatternSynthesizer

@dataclass
class AutonomicConfig:
    """Configuration for autonomic management."""
    min_free_memory_mb: int = 1024  # Minimum free memory in MB
    max_cpu_percent: float = 80.0  # Maximum CPU usage percentage
    evolution_interval: int = 300  # Seconds between evolution cycles
    pattern_batch_size: int = 100  # Number of patterns to process per batch
    context_batch_size: int = 100  # Number of contexts to process per batch
    cleanup_interval: int = 3600  # Seconds between cleanup cycles
    max_evolution_time: int = 60  # Maximum seconds for evolution cycle
    db_path: Optional[str] = None

class AutonomicManager:
    """Manages autonomous system evolution and optimization."""
    
    def __init__(self, config: Optional[AutonomicConfig] = None):
        self.config = config or AutonomicConfig()
        
        # Initialize components
        self.context_manager = ContextManager()
        self.pattern_learner = PatternLearner()
        self.pattern_synthesizer = PatternSynthesizer()
        
        # Setup logging
        self.log = logging.getLogger("autonomic_manager")
        self.log.addHandler(journal.JournalHandler())
        self.log.setLevel(logging.INFO)
        
        # Initialize state
        self.running = False
        self.tasks = set()
        
        # Register signal handlers
        signal.signal(signal.SIGTERM, self._handle_signal)
        signal.signal(signal.SIGINT, self._handle_signal)
    
    def _handle_signal(self, signum, frame):
        """Handle termination signals."""
        self.log.info(f"Received signal {signum}")
        asyncio.create_task(self.stop())
    
    async def start(self):
        """Start the autonomic manager."""
        if self.running:
            return
            
        self.running = True
        self.log.info("Starting autonomic manager")
        
        # Start background tasks
        self.tasks.add(asyncio.create_task(
            self._run_evolution_loop(),
            name="evolution_loop"
        ))
        self.tasks.add(asyncio.create_task(
            self._run_cleanup_loop(),
            name="cleanup_loop"
        ))
        self.tasks.add(asyncio.create_task(
            self._run_monitoring_loop(),
            name="monitoring_loop"
        ))
    
    async def stop(self):
        """Stop the autonomic manager."""
        if not self.running:
            return
            
        self.running = False
        self.log.info("Stopping autonomic manager")
        
        # Cancel all tasks
        for task in self.tasks:
            task.cancel()
            
        # Wait for tasks to complete
        await asyncio.gather(*self.tasks, return_exceptions=True)
        self.tasks.clear()
    
    async def _run_evolution_loop(self):
        """Run the main evolution loop."""
        self.log.info("Starting evolution loop")
        
        while self.running:
            try:
                # Check system resources
                if not await self._check_resources():
                    await asyncio.sleep(60)
                    continue
                    
                # Run evolution cycle
                start_time = datetime.now()
                evolved = await self._run_evolution_cycle()
                duration = (datetime.now() - start_time).total_seconds()
                
                self.log.info(
                    f"Evolution cycle complete: {evolved} patterns evolved "
                    f"in {duration:.1f} seconds"
                )
                
                # Sleep until next cycle
                await asyncio.sleep(self.config.evolution_interval)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                self.log.error(f"Error in evolution loop: {e}")
                await asyncio.sleep(60)
    
    async def _run_cleanup_loop(self):
        """Run the cleanup loop."""
        self.log.info("Starting cleanup loop")
        
        while self.running:
            try:
                # Run cleanup cycle
                start_time = datetime.now()
                cleaned = await self._run_cleanup_cycle()
                duration = (datetime.now() - start_time).total_seconds()
                
                self.log.info(
                    f"Cleanup cycle complete: {cleaned} items cleaned "
                    f"in {duration:.1f} seconds"
                )
                
                # Sleep until next cycle
                await asyncio.sleep(self.config.cleanup_interval)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                self.log.error(f"Error in cleanup loop: {e}")
                await asyncio.sleep(60)
    
    async def _run_monitoring_loop(self):
        """Run the monitoring loop."""
        self.log.info("Starting monitoring loop")
        
        while self.running:
            try:
                # Collect metrics
                metrics = await self._collect_metrics()
                
                # Create monitoring context
                await self.context_manager.create_context(
                    context_type='system',
                    data=metrics,
                    metadata={'source': 'monitoring_loop'}
                )
                
                # Sleep briefly
                await asyncio.sleep(60)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                self.log.error(f"Error in monitoring loop: {e}")
                await asyncio.sleep(60)
    
    async def _check_resources(self) -> bool:
        """Check if system resources are sufficient for evolution."""
        try:
            # Check memory
            memory = psutil.virtual_memory()
            if memory.available < (self.config.min_free_memory_mb * 1024 * 1024):
                self.log.warning("Insufficient memory available")
                return False
                
            # Check CPU
            cpu_percent = psutil.cpu_percent(interval=1)
            if cpu_percent > self.config.max_cpu_percent:
                self.log.warning("CPU usage too high")
                return False
                
            return True
            
        except Exception as e:
            self.log.error(f"Error checking resources: {e}")
            return False
    
    async def _collect_metrics(self) -> Dict[str, Any]:
        """Collect system metrics."""
        try:
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            return {
                'timestamp': datetime.now().isoformat(),
                'memory': {
                    'total': memory.total,
                    'available': memory.available,
                    'percent': memory.percent
                },
                'cpu': {
                    'percent': psutil.cpu_percent(interval=1),
                    'count': psutil.cpu_count()
                },
                'disk': {
                    'total': disk.total,
                    'free': disk.free,
                    'percent': disk.percent
                },
                'process': {
                    'memory': psutil.Process().memory_info().rss,
                    'cpu_percent': psutil.Process().cpu_percent()
                }
            }
            
        except Exception as e:
            self.log.error(f"Error collecting metrics: {e}")
            return {}
    
    async def _run_evolution_cycle(self) -> int:
        """Run a single evolution cycle."""
        evolved_count = 0
        
        try:
            # Get recent contexts
            contexts = await self.context_manager.get_contexts(
                limit=self.config.context_batch_size
            )
            
            # Learn patterns from contexts
            for context in contexts:
                pattern = await self.pattern_learner.learn(context.data)
                if pattern:
                    evolved_count += 1
                    
            # Synthesize new patterns
            patterns = await self.pattern_learner.get_patterns(
                limit=self.config.pattern_batch_size
            )
            synthesized = await self.pattern_learner.synthesize(patterns)
            evolved_count += len(synthesized)
            
            # Analyze impact
            if patterns and synthesized:
                impact = await self.pattern_learner.analyze_synthesis_impact(
                    patterns, synthesized
                )
                
                # Log impact metrics
                self.log.info(
                    f"Evolution impact: {impact['synthesized_count']} patterns "
                    f"synthesized, compression ratio: {impact['compression_ratio']:.2f}"
                )
                
            return evolved_count
            
        except Exception as e:
            self.log.error(f"Error in evolution cycle: {e}")
            return 0
    
    async def _run_cleanup_cycle(self) -> int:
        """Run a single cleanup cycle."""
        cleaned_count = 0
        
        try:
            # Cleanup contexts
            cleaned_contexts = await self.context_manager.cleanup_contexts()
            cleaned_count += cleaned_contexts
            
            # Cleanup patterns
            cleaned_patterns = await self.pattern_learner.cleanup_patterns()
            cleaned_count += cleaned_patterns
            
            return cleaned_count
            
        except Exception as e:
            self.log.error(f"Error in cleanup cycle: {e}")
            return 0
    
    async def get_status(self) -> Dict[str, Any]:
        """Get current status of the autonomic manager."""
        try:
            return {
                'running': self.running,
                'tasks': len(self.tasks),
                'metrics': await self._collect_metrics(),
                'contexts': await self.context_manager.get_context_stats(),
                'patterns': await self.pattern_learner.get_pattern_stats()
            }
        except Exception as e:
            self.log.error(f"Error getting status: {e}")
            return {
                'running': self.running,
                'error': str(e)
            } 