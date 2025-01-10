import os
import asyncio
import logging
import numpy as np
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
from systemd import journal

from .monitor import SystemMetrics, MetricsStore

@dataclass
class Anomaly:
    timestamp: datetime
    metric_type: str
    value: float
    threshold: float
    severity: str
    description: str
    
@dataclass
class Pattern:
    start_time: datetime
    end_time: datetime
    metric_type: str
    pattern_type: str
    confidence: float
    data: Dict
    
class AnomalyDetector:
    def __init__(self):
        self.thresholds = {
            'cpu_percent': {
                'warning': 70,
                'critical': 90
            },
            'memory_percent': {
                'warning': 80,
                'critical': 95
            },
            'context_growth_rate': {
                'warning': 100,  # contexts per hour
                'critical': 200
            },
            'pattern_growth_rate': {
                'warning': 50,  # patterns per hour
                'critical': 100
            }
        }
        
    def detect_anomalies(self, metrics: List[SystemMetrics]) -> List[Anomaly]:
        """Detect anomalies in metrics"""
        anomalies = []
        
        # Skip if not enough data
        if len(metrics) < 2:
            return anomalies
            
        # Check each metric
        for i, metric in enumerate(metrics):
            # Check CPU usage
            if metric.cpu_percent > self.thresholds['cpu_percent']['critical']:
                anomalies.append(Anomaly(
                    timestamp=metric.timestamp,
                    metric_type='cpu_percent',
                    value=metric.cpu_percent,
                    threshold=self.thresholds['cpu_percent']['critical'],
                    severity='critical',
                    description='CPU usage critically high'
                ))
            elif metric.cpu_percent > self.thresholds['cpu_percent']['warning']:
                anomalies.append(Anomaly(
                    timestamp=metric.timestamp,
                    metric_type='cpu_percent',
                    value=metric.cpu_percent,
                    threshold=self.thresholds['cpu_percent']['warning'],
                    severity='warning',
                    description='CPU usage high'
                ))
                
            # Check memory usage
            if metric.memory_percent > self.thresholds['memory_percent']['critical']:
                anomalies.append(Anomaly(
                    timestamp=metric.timestamp,
                    metric_type='memory_percent',
                    value=metric.memory_percent,
                    threshold=self.thresholds['memory_percent']['critical'],
                    severity='critical',
                    description='Memory usage critically high'
                ))
            elif metric.memory_percent > self.thresholds['memory_percent']['warning']:
                anomalies.append(Anomaly(
                    timestamp=metric.timestamp,
                    metric_type='memory_percent',
                    value=metric.memory_percent,
                    threshold=self.thresholds['memory_percent']['warning'],
                    severity='warning',
                    description='Memory usage high'
                ))
                
            # Skip growth rate checks for first metric
            if i == 0:
                continue
                
            # Calculate growth rates
            prev_metric = metrics[i-1]
            time_diff = (metric.timestamp - prev_metric.timestamp).total_seconds() / 3600
            
            if time_diff > 0:
                # Check context growth
                context_growth = (metric.context_count - prev_metric.context_count) / time_diff
                if context_growth > self.thresholds['context_growth_rate']['critical']:
                    anomalies.append(Anomaly(
                        timestamp=metric.timestamp,
                        metric_type='context_growth_rate',
                        value=context_growth,
                        threshold=self.thresholds['context_growth_rate']['critical'],
                        severity='critical',
                        description='Context growth rate critically high'
                    ))
                elif context_growth > self.thresholds['context_growth_rate']['warning']:
                    anomalies.append(Anomaly(
                        timestamp=metric.timestamp,
                        metric_type='context_growth_rate',
                        value=context_growth,
                        threshold=self.thresholds['context_growth_rate']['warning'],
                        severity='warning',
                        description='Context growth rate high'
                    ))
                    
                # Check pattern growth
                pattern_growth = (metric.pattern_count - prev_metric.pattern_count) / time_diff
                if pattern_growth > self.thresholds['pattern_growth_rate']['critical']:
                    anomalies.append(Anomaly(
                        timestamp=metric.timestamp,
                        metric_type='pattern_growth_rate',
                        value=pattern_growth,
                        threshold=self.thresholds['pattern_growth_rate']['critical'],
                        severity='critical',
                        description='Pattern growth rate critically high'
                    ))
                elif pattern_growth > self.thresholds['pattern_growth_rate']['warning']:
                    anomalies.append(Anomaly(
                        timestamp=metric.timestamp,
                        metric_type='pattern_growth_rate',
                        value=pattern_growth,
                        threshold=self.thresholds['pattern_growth_rate']['warning'],
                        severity='warning',
                        description='Pattern growth rate high'
                    ))
                    
        return anomalies

class PatternDetector:
    def __init__(self):
        self.min_pattern_length = 3  # Minimum number of points to form a pattern
        self.max_gap = timedelta(minutes=5)  # Maximum gap between points
        
    def detect_patterns(self, metrics: List[SystemMetrics]) -> List[Pattern]:
        """Detect patterns in metrics"""
        patterns = []
        
        # Skip if not enough data
        if len(metrics) < self.min_pattern_length:
            return patterns
            
        # Detect CPU usage patterns
        cpu_patterns = self._detect_metric_patterns(
            metrics,
            lambda m: m.cpu_percent,
            'cpu_percent'
        )
        patterns.extend(cpu_patterns)
        
        # Detect memory usage patterns
        memory_patterns = self._detect_metric_patterns(
            metrics,
            lambda m: m.memory_percent,
            'memory_percent'
        )
        patterns.extend(memory_patterns)
        
        # Detect context count patterns
        context_patterns = self._detect_metric_patterns(
            metrics,
            lambda m: m.context_count,
            'context_count'
        )
        patterns.extend(context_patterns)
        
        # Detect pattern count patterns
        pattern_count_patterns = self._detect_metric_patterns(
            metrics,
            lambda m: m.pattern_count,
            'pattern_count'
        )
        patterns.extend(pattern_count_patterns)
        
        return patterns
        
    def _detect_metric_patterns(
        self,
        metrics: List[SystemMetrics],
        value_func: callable,
        metric_type: str
    ) -> List[Pattern]:
        """Detect patterns in specific metric"""
        patterns = []
        
        # Convert to numpy arrays for analysis
        times = np.array([m.timestamp.timestamp() for m in metrics])
        values = np.array([value_func(m) for m in metrics])
        
        # Detect trends
        trend_patterns = self._detect_trends(times, values, metrics, metric_type)
        patterns.extend(trend_patterns)
        
        # Detect cycles
        cycle_patterns = self._detect_cycles(times, values, metrics, metric_type)
        patterns.extend(cycle_patterns)
        
        return patterns
        
    def _detect_trends(
        self,
        times: np.ndarray,
        values: np.ndarray,
        metrics: List[SystemMetrics],
        metric_type: str
    ) -> List[Pattern]:
        """Detect trend patterns"""
        patterns = []
        
        # Calculate moving average
        window = min(len(values), 5)
        if window < 3:
            return patterns
            
        ma = np.convolve(values, np.ones(window)/window, mode='valid')
        
        # Find trend segments
        segments = []
        start_idx = 0
        
        for i in range(1, len(ma)):
            if i == len(ma) - 1 or abs(ma[i] - ma[i-1]) > np.std(values):
                if i - start_idx >= self.min_pattern_length:
                    segments.append((start_idx, i))
                start_idx = i
                
        # Create patterns for segments
        for start_idx, end_idx in segments:
            segment_values = values[start_idx:end_idx+1]
            
            # Calculate trend
            slope = np.polyfit(range(len(segment_values)), segment_values, 1)[0]
            
            if abs(slope) > 0.1:  # Minimum slope threshold
                pattern_type = 'increasing' if slope > 0 else 'decreasing'
                confidence = min(1.0, abs(slope))
                
                patterns.append(Pattern(
                    start_time=metrics[start_idx].timestamp,
                    end_time=metrics[end_idx].timestamp,
                    metric_type=metric_type,
                    pattern_type=f'{pattern_type}_trend',
                    confidence=confidence,
                    data={
                        'slope': slope,
                        'start_value': values[start_idx],
                        'end_value': values[end_idx],
                        'duration': (metrics[end_idx].timestamp - metrics[start_idx].timestamp).total_seconds()
                    }
                ))
                
        return patterns
        
    def _detect_cycles(
        self,
        times: np.ndarray,
        values: np.ndarray,
        metrics: List[SystemMetrics],
        metric_type: str
    ) -> List[Pattern]:
        """Detect cyclical patterns"""
        patterns = []
        
        # Need enough points for FFT
        if len(values) < self.min_pattern_length * 2:
            return patterns
            
        # Perform FFT
        fft = np.fft.fft(values - np.mean(values))
        freqs = np.fft.fftfreq(len(values), d=np.mean(np.diff(times)))
        
        # Find dominant frequencies
        power = np.abs(fft)
        significant_freq_idx = np.where(power > np.max(power) * 0.2)[0]
        
        for idx in significant_freq_idx:
            if freqs[idx] <= 0:  # Skip negative frequencies
                continue
                
            period = 1 / freqs[idx]
            if period < 60:  # Skip very short cycles
                continue
                
            amplitude = power[idx] / len(values)
            if amplitude < np.std(values) * 0.1:  # Skip weak cycles
                continue
                
            patterns.append(Pattern(
                start_time=metrics[0].timestamp,
                end_time=metrics[-1].timestamp,
                metric_type=metric_type,
                pattern_type='cycle',
                confidence=min(1.0, amplitude / np.std(values)),
                data={
                    'period': period,
                    'amplitude': amplitude,
                    'frequency': freqs[idx]
                }
            ))
            
        return patterns

class MetricsAnalyzer:
    def __init__(self):
        self.store = MetricsStore()
        self.anomaly_detector = AnomalyDetector()
        self.pattern_detector = PatternDetector()
        self.log = logging.getLogger("metrics_analyzer")
        self.log.addHandler(journal.JournalHandler())
        self.log.setLevel(logging.INFO)
        self.active = False
        
    async def start(self):
        """Start analyzer"""
        if self.active:
            return
            
        self.active = True
        self.log.info("Metrics analyzer starting")
        
        # Start analysis tasks
        asyncio.create_task(self._analyze_metrics())
        
    async def stop(self):
        """Stop analyzer"""
        self.active = False
        self.log.info("Metrics analyzer stopping")
        
    async def _analyze_metrics(self):
        """Analyze system metrics"""
        while self.active:
            try:
                # Get recent metrics
                end_time = datetime.now()
                start_time = end_time - timedelta(hours=1)
                metrics = await self.store.get_metrics(start_time, end_time)
                
                if not metrics:
                    await asyncio.sleep(60)
                    continue
                    
                # Detect anomalies
                anomalies = self.anomaly_detector.detect_anomalies(metrics)
                for anomaly in anomalies:
                    self.log.warning(
                        f"Detected {anomaly.severity} anomaly: {anomaly.description} "
                        f"({anomaly.metric_type}={anomaly.value:.1f})"
                    )
                    
                # Detect patterns
                patterns = self.pattern_detector.detect_patterns(metrics)
                for pattern in patterns:
                    self.log.info(
                        f"Detected {pattern.pattern_type} pattern in {pattern.metric_type} "
                        f"(confidence={pattern.confidence:.2f})"
                    )
                    
                # Store analysis results
                await self._store_analysis(anomalies, patterns)
                
                # Sleep before next analysis
                await asyncio.sleep(300)  # Analyze every 5 minutes
                
            except Exception as e:
                self.log.error(f"Analysis error: {e}")
                await asyncio.sleep(60)
                
    async def _store_analysis(self, anomalies: List[Anomaly], patterns: List[Pattern]):
        """Store analysis results"""
        try:
            # Create timestamp-based path
            dt = datetime.now()
            analysis_dir = os.path.join(
                self.store.base_path,
                'analysis',
                dt.strftime('%Y/%m/%d/%H')
            )
            os.makedirs(analysis_dir, exist_ok=True)
            
            # Store results
            results_file = os.path.join(analysis_dir, f"{dt.strftime('%M%S')}.json")
            with open(results_file, 'w') as f:
                json.dump({
                    'timestamp': dt.isoformat(),
                    'anomalies': [
                        {
                            'timestamp': a.timestamp.isoformat(),
                            'metric_type': a.metric_type,
                            'value': a.value,
                            'threshold': a.threshold,
                            'severity': a.severity,
                            'description': a.description
                        }
                        for a in anomalies
                    ],
                    'patterns': [
                        {
                            'start_time': p.start_time.isoformat(),
                            'end_time': p.end_time.isoformat(),
                            'metric_type': p.metric_type,
                            'pattern_type': p.pattern_type,
                            'confidence': p.confidence,
                            'data': p.data
                        }
                        for p in patterns
                    ]
                }, f)
                
        except Exception as e:
            self.log.error(f"Failed to store analysis results: {e}")

async def main():
    """Main analyzer entry point"""
    analyzer = MetricsAnalyzer()
    
    try:
        await analyzer.start()
        
        # Keep running
        while True:
            await asyncio.sleep(1)
            
    except KeyboardInterrupt:
        await analyzer.stop()
    except Exception as e:
        logger.error(f"Analyzer error: {e}")
        await analyzer.stop()
        raise

if __name__ == "__main__":
    asyncio.run(main()) 