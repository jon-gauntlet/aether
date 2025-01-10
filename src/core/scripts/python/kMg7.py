import os
import json
import asyncio
import logging
import psutil
import docker
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass
from systemd import journal

from .planner import Action

class ResourceExecutor:
    def __init__(self):
        self.docker_client = docker.from_env()
        self.actions = {
            'scale_cpu': self._scale_cpu,
            'optimize_cpu': self._optimize_cpu,
            'scale_memory': self._scale_memory,
            'optimize_memory': self._optimize_memory,
            'limit_contexts': self._limit_contexts,
            'optimize_contexts': self._optimize_contexts,
            'limit_patterns': self._limit_patterns,
            'optimize_patterns': self._optimize_patterns
        }
        
    async def _scale_cpu(self, action: Action) -> str:
        """Scale CPU resources"""
        try:
            container_name = os.environ.get('CONTAINER_NAME')
            if not container_name:
                return "No container name specified"
                
            container = self.docker_client.containers.get(container_name)
            current_cpu = float(container.attrs['HostConfig']['NanoCpus']) / 1e9
            target_cpu = current_cpu * action.parameters['scale_factor']
            
            container.update(nano_cpus=int(target_cpu * 1e9))
            return f"Scaled CPU from {current_cpu:.1f} to {target_cpu:.1f} cores"
            
        except Exception as e:
            return f"Failed to scale CPU: {e}"
            
    async def _optimize_cpu(self, action: Action) -> str:
        """Optimize CPU usage"""
        try:
            # Get process info
            process = psutil.Process()
            
            # Set CPU affinity to optimize core usage
            cores = list(range(psutil.cpu_count()))
            process.cpu_affinity(cores[:max(1, len(cores)//2)])
            
            # Set nice value for better scheduling
            process.nice(10)
            
            return "Optimized CPU usage settings"
            
        except Exception as e:
            return f"Failed to optimize CPU: {e}"
            
    async def _scale_memory(self, action: Action) -> str:
        """Scale memory resources"""
        try:
            container_name = os.environ.get('CONTAINER_NAME')
            if not container_name:
                return "No container name specified"
                
            container = self.docker_client.containers.get(container_name)
            current_memory = container.attrs['HostConfig']['Memory']
            target_memory = int(current_memory * action.parameters['scale_factor'])
            
            container.update(mem_limit=target_memory)
            return f"Scaled memory from {current_memory/1e6:.0f}MB to {target_memory/1e6:.0f}MB"
            
        except Exception as e:
            return f"Failed to scale memory: {e}"
            
    async def _optimize_memory(self, action: Action) -> str:
        """Optimize memory usage"""
        try:
            # Get process info
            process = psutil.Process()
            
            # Clear process memory
            if action.parameters['cleanup_level'] == 'aggressive':
                # Force garbage collection
                import gc
                gc.collect()
                
            # Set memory priority
            if psutil.WINDOWS:
                process.nice(psutil.BELOW_NORMAL_PRIORITY_CLASS)
                
            return "Optimized memory usage settings"
            
        except Exception as e:
            return f"Failed to optimize memory: {e}"
            
    async def _limit_contexts(self, action: Action) -> str:
        """Limit context creation rate"""
        try:
            # Update context service config
            config_path = os.path.join(
                os.path.dirname(__file__),
                '..',
                '..',
                'config',
                'context_service.json'
            )
            
            with open(config_path, 'r') as f:
                config = json.load(f)
                
            config['max_contexts_per_hour'] = action.parameters['target_rate']
            config['rate_limit_duration'] = action.parameters['limit_duration']
            
            with open(config_path, 'w') as f:
                json.dump(config, f, indent=2)
                
            return f"Limited context creation rate to {action.parameters['target_rate']} per hour"
            
        except Exception as e:
            return f"Failed to limit contexts: {e}"
            
    async def _optimize_contexts(self, action: Action) -> str:
        """Optimize context management"""
        try:
            # Update context service config
            config_path = os.path.join(
                os.path.dirname(__file__),
                '..',
                '..',
                'config',
                'context_service.json'
            )
            
            with open(config_path, 'r') as f:
                config = json.load(f)
                
            if action.parameters['optimization_level'] == 'moderate':
                config['context_ttl'] = 3600  # 1 hour
                config['max_context_size'] = 1024 * 1024  # 1MB
                config['compression_enabled'] = True
            elif action.parameters['optimization_level'] == 'aggressive':
                config['context_ttl'] = 1800  # 30 minutes
                config['max_context_size'] = 512 * 1024  # 512KB
                config['compression_enabled'] = True
                config['compression_level'] = 9
                
            with open(config_path, 'w') as f:
                json.dump(config, f, indent=2)
                
            return f"Optimized context management settings"
            
        except Exception as e:
            return f"Failed to optimize contexts: {e}"
            
    async def _limit_patterns(self, action: Action) -> str:
        """Limit pattern creation rate"""
        try:
            # Update pattern service config
            config_path = os.path.join(
                os.path.dirname(__file__),
                '..',
                '..',
                'config',
                'pattern_service.json'
            )
            
            with open(config_path, 'r') as f:
                config = json.load(f)
                
            config['max_patterns_per_hour'] = action.parameters['target_rate']
            config['rate_limit_duration'] = action.parameters['limit_duration']
            
            with open(config_path, 'w') as f:
                json.dump(config, f, indent=2)
                
            return f"Limited pattern creation rate to {action.parameters['target_rate']} per hour"
            
        except Exception as e:
            return f"Failed to limit patterns: {e}"
            
    async def _optimize_patterns(self, action: Action) -> str:
        """Optimize pattern management"""
        try:
            # Update pattern service config
            config_path = os.path.join(
                os.path.dirname(__file__),
                '..',
                '..',
                'config',
                'pattern_service.json'
            )
            
            with open(config_path, 'r') as f:
                config = json.load(f)
                
            if action.parameters['optimization_level'] == 'moderate':
                config['pattern_ttl'] = 86400  # 24 hours
                config['max_pattern_size'] = 1024 * 1024  # 1MB
                config['compression_enabled'] = True
            elif action.parameters['optimization_level'] == 'aggressive':
                config['pattern_ttl'] = 43200  # 12 hours
                config['max_pattern_size'] = 512 * 1024  # 512KB
                config['compression_enabled'] = True
                config['compression_level'] = 9
                
            with open(config_path, 'w') as f:
                json.dump(config, f, indent=2)
                
            return f"Optimized pattern management settings"
            
        except Exception as e:
            return f"Failed to optimize patterns: {e}"

class PatternExecutor:
    def __init__(self):
        self.actions = {
            'prepare_scaling': self._prepare_scaling,
            'prepare_descaling': self._prepare_descaling,
            'optimize_cycle': self._optimize_cycle
        }
        
    async def _prepare_scaling(self, action: Action) -> str:
        """Prepare for resource scaling"""
        try:
            # Update scaling config
            config_path = os.path.join(
                os.path.dirname(__file__),
                '..',
                '..',
                'config',
                'scaling.json'
            )
            
            with open(config_path, 'r') as f:
                config = json.load(f)
                
            metric_type = action.parameters['metric_type']
            trend_duration = action.parameters['trend_duration']
            trend_slope = action.parameters['trend_slope']
            
            # Calculate scaling threshold
            threshold = max(60, min(90, 100 - trend_slope * 10))
            
            config['scaling_rules'][metric_type] = {
                'threshold': threshold,
                'cooldown': min(300, trend_duration / 4),
                'scale_factor': 1.0 + trend_slope / 2
            }
            
            with open(config_path, 'w') as f:
                json.dump(config, f, indent=2)
                
            return f"Updated scaling rules for {metric_type}"
            
        except Exception as e:
            return f"Failed to prepare scaling: {e}"
            
    async def _prepare_descaling(self, action: Action) -> str:
        """Prepare for resource reduction"""
        try:
            # Update scaling config
            config_path = os.path.join(
                os.path.dirname(__file__),
                '..',
                '..',
                'config',
                'scaling.json'
            )
            
            with open(config_path, 'r') as f:
                config = json.load(f)
                
            metric_type = action.parameters['metric_type']
            trend_duration = action.parameters['trend_duration']
            trend_slope = action.parameters['trend_slope']
            
            # Calculate descaling threshold
            threshold = max(20, min(40, 50 + trend_slope * 10))
            
            config['descaling_rules'][metric_type] = {
                'threshold': threshold,
                'cooldown': min(600, trend_duration / 2),
                'scale_factor': max(0.5, 1.0 + trend_slope)
            }
            
            with open(config_path, 'w') as f:
                json.dump(config, f, indent=2)
                
            return f"Updated descaling rules for {metric_type}"
            
        except Exception as e:
            return f"Failed to prepare descaling: {e}"
            
    async def _optimize_cycle(self, action: Action) -> str:
        """Optimize for cyclical pattern"""
        try:
            # Update cycle optimization config
            config_path = os.path.join(
                os.path.dirname(__file__),
                '..',
                '..',
                'config',
                'optimization.json'
            )
            
            with open(config_path, 'r') as f:
                config = json.load(f)
                
            metric_type = action.parameters['metric_type']
            period = action.parameters['period']
            amplitude = action.parameters['amplitude']
            
            config['cycle_optimization'][metric_type] = {
                'period': period,
                'amplitude': amplitude,
                'buffer_size': int(period * 2),
                'prediction_window': int(period / 2)
            }
            
            with open(config_path, 'w') as f:
                json.dump(config, f, indent=2)
                
            return f"Updated cycle optimization for {metric_type}"
            
        except Exception as e:
            return f"Failed to optimize cycle: {e}"

class ActionExecutor:
    def __init__(self):
        self.resource_executor = ResourceExecutor()
        self.pattern_executor = PatternExecutor()
        self.log = logging.getLogger("action_executor")
        self.log.addHandler(journal.JournalHandler())
        self.log.setLevel(logging.INFO)
        self.active = False
        
    async def start(self):
        """Start executor"""
        if self.active:
            return
            
        self.active = True
        self.log.info("Action executor starting")
        
        # Start execution tasks
        asyncio.create_task(self._execute_actions())
        
    async def stop(self):
        """Stop executor"""
        self.active = False
        self.log.info("Action executor stopping")
        
    async def _execute_actions(self):
        """Execute planned actions"""
        while self.active:
            try:
                # Get pending actions
                actions = await self._get_pending_actions()
                if not actions:
                    await asyncio.sleep(60)
                    continue
                    
                # Sort by priority
                actions.sort(key=lambda a: a.priority)
                
                # Execute actions
                for action in actions:
                    try:
                        # Execute resource action
                        if action.action_type in self.resource_executor.actions:
                            result = await self.resource_executor.actions[action.action_type](action)
                            action.status = 'completed'
                            action.result = result
                            self.log.info(f"Executed {action.action_type}: {result}")
                            
                        # Execute pattern action
                        elif action.action_type in self.pattern_executor.actions:
                            result = await self.pattern_executor.actions[action.action_type](action)
                            action.status = 'completed'
                            action.result = result
                            self.log.info(f"Executed {action.action_type}: {result}")
                            
                        else:
                            action.status = 'failed'
                            action.result = f"Unknown action type: {action.action_type}"
                            self.log.error(f"Unknown action type: {action.action_type}")
                            
                    except Exception as e:
                        action.status = 'failed'
                        action.result = str(e)
                        self.log.error(f"Action execution failed: {e}")
                        
                # Update action status
                await self._update_actions(actions)
                
                # Sleep before next execution cycle
                await asyncio.sleep(60)
                
            except Exception as e:
                self.log.error(f"Execution error: {e}")
                await asyncio.sleep(60)
                
    async def _get_pending_actions(self) -> List[Action]:
        """Get pending actions"""
        try:
            # Get actions from last hour
            actions = []
            base_path = os.path.join(os.path.dirname(__file__), '..', '..', 'data')
            actions_path = os.path.join(base_path, 'actions')
            
            end_time = datetime.now()
            start_time = end_time - timedelta(hours=1)
            
            # Walk through actions directory
            for root, _, files in os.walk(actions_path):
                for file in files:
                    if not file.endswith('.json'):
                        continue
                        
                    file_path = os.path.join(root, file)
                    try:
                        with open(file_path, 'r') as f:
                            result = json.load(f)
                            
                        timestamp = datetime.fromisoformat(result['timestamp'])
                        if start_time <= timestamp <= end_time:
                            for action in result['actions']:
                                if action['status'] == 'pending':
                                    actions.append(Action(
                                        timestamp=datetime.fromisoformat(action['timestamp']),
                                        action_type=action['action_type'],
                                        priority=action['priority'],
                                        description=action['description'],
                                        parameters=action['parameters'],
                                        status=action['status'],
                                        result=action['result']
                                    ))
                                    
                    except Exception as e:
                        self.log.error(f"Failed to read actions file {file_path}: {e}")
                        
            return actions
            
        except Exception as e:
            self.log.error(f"Failed to get pending actions: {e}")
            return []
            
    async def _update_actions(self, actions: List[Action]):
        """Update action status"""
        try:
            # Group actions by file
            action_files = {}
            base_path = os.path.join(os.path.dirname(__file__), '..', '..', 'data')
            actions_path = os.path.join(base_path, 'actions')
            
            for root, _, files in os.walk(actions_path):
                for file in files:
                    if not file.endswith('.json'):
                        continue
                        
                    file_path = os.path.join(root, file)
                    try:
                        with open(file_path, 'r') as f:
                            result = json.load(f)
                            
                        # Update matching actions
                        updated = False
                        for stored_action in result['actions']:
                            for action in actions:
                                if (stored_action['timestamp'] == action.timestamp.isoformat() and
                                    stored_action['action_type'] == action.action_type):
                                    stored_action['status'] = action.status
                                    stored_action['result'] = action.result
                                    updated = True
                                    
                        if updated:
                            action_files[file_path] = result
                            
                    except Exception as e:
                        self.log.error(f"Failed to read actions file {file_path}: {e}")
                        
            # Write updated files
            for file_path, result in action_files.items():
                try:
                    with open(file_path, 'w') as f:
                        json.dump(result, f, indent=2)
                        
                except Exception as e:
                    self.log.error(f"Failed to write actions file {file_path}: {e}")
                    
        except Exception as e:
            self.log.error(f"Failed to update actions: {e}")

async def main():
    """Main executor entry point"""
    executor = ActionExecutor()
    
    try:
        await executor.start()
        
        # Keep running
        while True:
            await asyncio.sleep(1)
            
    except KeyboardInterrupt:
        await executor.stop()
    except Exception as e:
        logger.error(f"Executor error: {e}")
        await executor.stop()
        raise

if __name__ == "__main__":
    asyncio.run(main()) 