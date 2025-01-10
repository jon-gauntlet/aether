import os
import json
import asyncio
import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass
from systemd import journal

from .analyzer import Anomaly, Pattern

@dataclass
class Action:
    timestamp: datetime
    action_type: str
    priority: int  # 1-5, 1 being highest
    description: str
    parameters: Dict
    status: str = 'pending'
    result: Optional[str] = None
    
class ResourceAction:
    def __init__(self):
        self.actions = {
            'cpu_high': self._handle_high_cpu,
            'memory_high': self._handle_high_memory,
            'context_growth': self._handle_context_growth,
            'pattern_growth': self._handle_pattern_growth
        }
        
    async def _handle_high_cpu(self, anomaly: Anomaly) -> Action:
        """Handle high CPU usage"""
        if anomaly.severity == 'critical':
            return Action(
                timestamp=datetime.now(),
                action_type='scale_cpu',
                priority=1,
                description='Scale up CPU resources',
                parameters={
                    'current_usage': anomaly.value,
                    'target_usage': 70,
                    'scale_factor': 1.5
                }
            )
        else:
            return Action(
                timestamp=datetime.now(),
                action_type='optimize_cpu',
                priority=3,
                description='Optimize CPU usage',
                parameters={
                    'current_usage': anomaly.value,
                    'target_usage': 60,
                    'optimization_level': 'moderate'
                }
            )
            
    async def _handle_high_memory(self, anomaly: Anomaly) -> Action:
        """Handle high memory usage"""
        if anomaly.severity == 'critical':
            return Action(
                timestamp=datetime.now(),
                action_type='scale_memory',
                priority=1,
                description='Scale up memory resources',
                parameters={
                    'current_usage': anomaly.value,
                    'target_usage': 80,
                    'scale_factor': 1.5
                }
            )
        else:
            return Action(
                timestamp=datetime.now(),
                action_type='optimize_memory',
                priority=3,
                description='Optimize memory usage',
                parameters={
                    'current_usage': anomaly.value,
                    'target_usage': 70,
                    'cleanup_level': 'moderate'
                }
            )
            
    async def _handle_context_growth(self, anomaly: Anomaly) -> Action:
        """Handle rapid context growth"""
        if anomaly.severity == 'critical':
            return Action(
                timestamp=datetime.now(),
                action_type='limit_contexts',
                priority=2,
                description='Limit context creation rate',
                parameters={
                    'current_rate': anomaly.value,
                    'target_rate': 100,
                    'limit_duration': 3600
                }
            )
        else:
            return Action(
                timestamp=datetime.now(),
                action_type='optimize_contexts',
                priority=4,
                description='Optimize context management',
                parameters={
                    'current_rate': anomaly.value,
                    'target_rate': 80,
                    'optimization_level': 'moderate'
                }
            )
            
    async def _handle_pattern_growth(self, anomaly: Anomaly) -> Action:
        """Handle rapid pattern growth"""
        if anomaly.severity == 'critical':
            return Action(
                timestamp=datetime.now(),
                action_type='limit_patterns',
                priority=2,
                description='Limit pattern creation rate',
                parameters={
                    'current_rate': anomaly.value,
                    'target_rate': 50,
                    'limit_duration': 3600
                }
            )
        else:
            return Action(
                timestamp=datetime.now(),
                action_type='optimize_patterns',
                priority=4,
                description='Optimize pattern management',
                parameters={
                    'current_rate': anomaly.value,
                    'target_rate': 40,
                    'optimization_level': 'moderate'
                }
            )
            
class PatternAction:
    def __init__(self):
        self.actions = {
            'increasing_trend': self._handle_increasing_trend,
            'decreasing_trend': self._handle_decreasing_trend,
            'cycle': self._handle_cycle
        }
        
    async def _handle_increasing_trend(self, pattern: Pattern) -> Optional[Action]:
        """Handle increasing trend pattern"""
        if pattern.confidence < 0.5:
            return None
            
        if pattern.metric_type in ['cpu_percent', 'memory_percent']:
            return Action(
                timestamp=datetime.now(),
                action_type='prepare_scaling',
                priority=3,
                description=f'Prepare for {pattern.metric_type} scaling',
                parameters={
                    'metric_type': pattern.metric_type,
                    'trend_duration': pattern.data['duration'],
                    'trend_slope': pattern.data['slope'],
                    'confidence': pattern.confidence
                }
            )
        elif pattern.metric_type in ['context_count', 'pattern_count']:
            return Action(
                timestamp=datetime.now(),
                action_type='optimize_growth',
                priority=4,
                description=f'Optimize {pattern.metric_type} growth',
                parameters={
                    'metric_type': pattern.metric_type,
                    'trend_duration': pattern.data['duration'],
                    'trend_slope': pattern.data['slope'],
                    'confidence': pattern.confidence
                }
            )
            
        return None
        
    async def _handle_decreasing_trend(self, pattern: Pattern) -> Optional[Action]:
        """Handle decreasing trend pattern"""
        if pattern.confidence < 0.5:
            return None
            
        if pattern.metric_type in ['cpu_percent', 'memory_percent']:
            return Action(
                timestamp=datetime.now(),
                action_type='prepare_descaling',
                priority=4,
                description=f'Prepare for {pattern.metric_type} reduction',
                parameters={
                    'metric_type': pattern.metric_type,
                    'trend_duration': pattern.data['duration'],
                    'trend_slope': pattern.data['slope'],
                    'confidence': pattern.confidence
                }
            )
            
        return None
        
    async def _handle_cycle(self, pattern: Pattern) -> Optional[Action]:
        """Handle cyclical pattern"""
        if pattern.confidence < 0.7:
            return None
            
        return Action(
            timestamp=datetime.now(),
            action_type='optimize_cycle',
            priority=5,
            description=f'Optimize for {pattern.metric_type} cycle',
            parameters={
                'metric_type': pattern.metric_type,
                'period': pattern.data['period'],
                'amplitude': pattern.data['amplitude'],
                'confidence': pattern.confidence
            }
        )

class ActionPlanner:
    def __init__(self):
        self.resource_action = ResourceAction()
        self.pattern_action = PatternAction()
        self.log = logging.getLogger("action_planner")
        self.log.addHandler(journal.JournalHandler())
        self.log.setLevel(logging.INFO)
        self.active = False
        
    async def start(self):
        """Start planner"""
        if self.active:
            return
            
        self.active = True
        self.log.info("Action planner starting")
        
        # Start planning tasks
        asyncio.create_task(self._plan_actions())
        
    async def stop(self):
        """Stop planner"""
        self.active = False
        self.log.info("Action planner stopping")
        
    async def _plan_actions(self):
        """Plan actions based on analysis"""
        while self.active:
            try:
                # Get recent analysis results
                analysis_results = await self._get_recent_analysis()
                if not analysis_results:
                    await asyncio.sleep(60)
                    continue
                    
                # Plan actions for anomalies
                actions = []
                for result in analysis_results:
                    # Handle anomalies
                    for anomaly in result['anomalies']:
                        anomaly_obj = Anomaly(
                            timestamp=datetime.fromisoformat(anomaly['timestamp']),
                            metric_type=anomaly['metric_type'],
                            value=anomaly['value'],
                            threshold=anomaly['threshold'],
                            severity=anomaly['severity'],
                            description=anomaly['description']
                        )
                        
                        if anomaly_obj.metric_type.endswith('_percent'):
                            action_type = f"{anomaly_obj.metric_type.split('_')[0]}_high"
                        else:
                            action_type = f"{anomaly_obj.metric_type.split('_')[0]}_growth"
                            
                        if action_type in self.resource_action.actions:
                            action = await self.resource_action.actions[action_type](anomaly_obj)
                            if action:
                                actions.append(action)
                                
                    # Handle patterns
                    for pattern in result['patterns']:
                        pattern_obj = Pattern(
                            start_time=datetime.fromisoformat(pattern['start_time']),
                            end_time=datetime.fromisoformat(pattern['end_time']),
                            metric_type=pattern['metric_type'],
                            pattern_type=pattern['pattern_type'],
                            confidence=pattern['confidence'],
                            data=pattern['data']
                        )
                        
                        if pattern_obj.pattern_type in self.pattern_action.actions:
                            action = await self.pattern_action.actions[pattern_obj.pattern_type](pattern_obj)
                            if action:
                                actions.append(action)
                                
                # Store planned actions
                if actions:
                    await self._store_actions(actions)
                    
                # Sleep before next planning cycle
                await asyncio.sleep(300)  # Plan every 5 minutes
                
            except Exception as e:
                self.log.error(f"Planning error: {e}")
                await asyncio.sleep(60)
                
    async def _get_recent_analysis(self) -> List[Dict]:
        """Get recent analysis results"""
        try:
            # Get analysis from last hour
            results = []
            base_path = os.path.join(os.path.dirname(__file__), '..', '..', 'data')
            analysis_path = os.path.join(base_path, 'analysis')
            
            end_time = datetime.now()
            start_time = end_time - timedelta(hours=1)
            
            # Walk through analysis directory
            for root, _, files in os.walk(analysis_path):
                for file in files:
                    if not file.endswith('.json'):
                        continue
                        
                    file_path = os.path.join(root, file)
                    try:
                        with open(file_path, 'r') as f:
                            result = json.load(f)
                            
                        timestamp = datetime.fromisoformat(result['timestamp'])
                        if start_time <= timestamp <= end_time:
                            results.append(result)
                            
                    except Exception as e:
                        self.log.error(f"Failed to read analysis file {file_path}: {e}")
                        
            return results
            
        except Exception as e:
            self.log.error(f"Failed to get recent analysis: {e}")
            return []
            
    async def _store_actions(self, actions: List[Action]):
        """Store planned actions"""
        try:
            # Create timestamp-based path
            dt = datetime.now()
            actions_dir = os.path.join(
                os.path.dirname(__file__),
                '..',
                '..',
                'data',
                'actions',
                dt.strftime('%Y/%m/%d/%H')
            )
            os.makedirs(actions_dir, exist_ok=True)
            
            # Store actions
            actions_file = os.path.join(actions_dir, f"{dt.strftime('%M%S')}.json")
            with open(actions_file, 'w') as f:
                json.dump({
                    'timestamp': dt.isoformat(),
                    'actions': [
                        {
                            'timestamp': a.timestamp.isoformat(),
                            'action_type': a.action_type,
                            'priority': a.priority,
                            'description': a.description,
                            'parameters': a.parameters,
                            'status': a.status,
                            'result': a.result
                        }
                        for a in actions
                    ]
                }, f)
                
            self.log.info(f"Stored {len(actions)} planned actions")
            
        except Exception as e:
            self.log.error(f"Failed to store actions: {e}")

async def main():
    """Main planner entry point"""
    planner = ActionPlanner()
    
    try:
        await planner.start()
        
        # Keep running
        while True:
            await asyncio.sleep(1)
            
    except KeyboardInterrupt:
        await planner.stop()
    except Exception as e:
        logger.error(f"Planner error: {e}")
        await planner.stop()
        raise

if __name__ == "__main__":
    asyncio.run(main()) 