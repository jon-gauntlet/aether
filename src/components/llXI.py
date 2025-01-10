import os
import asyncio
import logging
from typing import Dict, List, Optional
from datetime import datetime
from systemd import journal

from .monitor import SystemMonitor
from .analyzer import MetricsAnalyzer
from .planner import ActionPlanner
from .executor import ActionExecutor
from .knowledge import KnowledgeManager

class AutonomicManager:
    def __init__(self):
        self.monitor = SystemMonitor()
        self.analyzer = MetricsAnalyzer()
        self.planner = ActionPlanner()
        self.executor = ActionExecutor()
        self.knowledge = KnowledgeManager()
        
        self.log = logging.getLogger("autonomic_manager")
        self.log.addHandler(journal.JournalHandler())
        self.log.setLevel(logging.INFO)
        
        self.active = False
        
    async def start(self):
        """Start autonomic manager"""
        if self.active:
            return
            
        self.active = True
        self.log.info("Autonomic manager starting")
        
        try:
            # Start all components
            await self.monitor.start()
            await self.analyzer.start()
            await self.planner.start()
            await self.executor.start()
            await self.knowledge.start()
            
            # Start coordination tasks
            asyncio.create_task(self._coordinate_components())
            
        except Exception as e:
            self.log.error(f"Failed to start autonomic manager: {e}")
            await self.stop()
            raise
            
    async def stop(self):
        """Stop autonomic manager"""
        self.active = False
        self.log.info("Autonomic manager stopping")
        
        try:
            # Stop all components
            await self.monitor.stop()
            await self.analyzer.stop()
            await self.planner.stop()
            await self.executor.stop()
            await self.knowledge.stop()
            
        except Exception as e:
            self.log.error(f"Error stopping autonomic manager: {e}")
            raise
            
    async def _coordinate_components(self):
        """Coordinate component interactions"""
        while self.active:
            try:
                # Ensure all components are running
                if not all([
                    self.monitor.active,
                    self.analyzer.active,
                    self.planner.active,
                    self.executor.active,
                    self.knowledge.active
                ]):
                    self.log.error("One or more components not active")
                    await self.stop()
                    break
                    
                # Log coordination status
                self.log.info(
                    "Components coordinated - Monitor: %s, Analyzer: %s, "
                    "Planner: %s, Executor: %s, Knowledge: %s",
                    self.monitor.active,
                    self.analyzer.active,
                    self.planner.active,
                    self.executor.active,
                    self.knowledge.active
                )
                
                # Sleep before next coordination check
                await asyncio.sleep(300)  # Check every 5 minutes
                
            except Exception as e:
                self.log.error(f"Coordination error: {e}")
                await asyncio.sleep(60)
                
    async def get_status(self) -> Dict:
        """Get manager status"""
        return {
            'active': self.active,
            'components': {
                'monitor': {
                    'active': self.monitor.active
                },
                'analyzer': {
                    'active': self.analyzer.active
                },
                'planner': {
                    'active': self.planner.active
                },
                'executor': {
                    'active': self.executor.active
                },
                'knowledge': {
                    'active': self.knowledge.active
                }
            },
            'timestamp': datetime.now().isoformat()
        }

async def main():
    """Main autonomic manager entry point"""
    manager = AutonomicManager()
    
    try:
        await manager.start()
        
        # Keep running
        while True:
            await asyncio.sleep(1)
            
    except KeyboardInterrupt:
        await manager.stop()
    except Exception as e:
        logger.error(f"Autonomic manager error: {e}")
        await manager.stop()
        raise

if __name__ == "__main__":
    asyncio.run(main()) 