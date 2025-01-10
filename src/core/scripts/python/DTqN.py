import pytest
import asyncio
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from lib.autonomic.analyzer import (
    MetricsAnalyzer,
    AnomalyDetector,
    PatternDetector,
    Anomaly,
    Pattern,
    SystemMetrics
)

@pytest.fixture
def metrics():
    """Create test metrics"""
    now = datetime.now()
    return [
        SystemMetrics(
            timestamp=now - timedelta(minutes=i),
            cpu_percent=50.0 + i,
            memory_percent=60.0 + i,
            io_counters={'read_bytes': 1000, 'write_bytes': 2000},
            network_counters={'bytes_sent': 3000, 'bytes_recv': 4000},
            context_count=100 + i * 10,
            pattern_count=50 + i * 5,
            active_services=['service1', 'service2']
        )
        for i in range(10)
    ]

@pytest.fixture
def anomaly_detector():
    """Create anomaly detector instance"""
    return AnomalyDetector()

@pytest.fixture
def pattern_detector():
    """Create pattern detector instance"""
    return PatternDetector()

@pytest.fixture
def analyzer():
    """Create analyzer instance"""
    return MetricsAnalyzer()

@pytest.mark.asyncio
async def test_detect_cpu_anomaly(anomaly_detector, metrics):
    """Test CPU usage anomaly detection"""
    # Create metrics with high CPU usage
    high_cpu_metrics = metrics.copy()
    high_cpu_metrics[0].cpu_percent = 95.0

    # Detect anomalies
    anomalies = anomaly_detector.detect_anomalies(high_cpu_metrics)

    # Verify anomaly detection
    cpu_anomalies = [a for a in anomalies if a.metric_type == 'cpu_percent']
    assert len(cpu_anomalies) == 1
    assert cpu_anomalies[0].severity == 'critical'
    assert cpu_anomalies[0].value == 95.0

@pytest.mark.asyncio
async def test_detect_memory_anomaly(anomaly_detector, metrics):
    """Test memory usage anomaly detection"""
    # Create metrics with high memory usage
    high_mem_metrics = metrics.copy()
    high_mem_metrics[0].memory_percent = 90.0

    # Detect anomalies
    anomalies = anomaly_detector.detect_anomalies(high_mem_metrics)

    # Verify anomaly detection
    mem_anomalies = [a for a in anomalies if a.metric_type == 'memory_percent']
    assert len(mem_anomalies) == 1
    assert mem_anomalies[0].severity == 'critical'
    assert mem_anomalies[0].value == 90.0

@pytest.mark.asyncio
async def test_detect_growth_anomaly(anomaly_detector, metrics):
    """Test growth rate anomaly detection"""
    # Create metrics with rapid context growth
    rapid_growth_metrics = metrics.copy()
    rapid_growth_metrics[0].context_count = 1000
    rapid_growth_metrics[1].context_count = 100

    # Detect anomalies
    anomalies = anomaly_detector.detect_anomalies(rapid_growth_metrics)

    # Verify anomaly detection
    growth_anomalies = [a for a in anomalies if a.metric_type == 'context_growth_rate']
    assert len(growth_anomalies) > 0
    assert growth_anomalies[0].severity in ['warning', 'critical']

@pytest.mark.asyncio
async def test_detect_trend_pattern(pattern_detector, metrics):
    """Test trend pattern detection"""
    # Create metrics with clear trend
    trend_metrics = metrics.copy()
    for i, m in enumerate(trend_metrics):
        m.cpu_percent = 50.0 + i * 5  # Linear increase

    # Detect patterns
    patterns = pattern_detector.detect_patterns(trend_metrics)

    # Verify pattern detection
    trend_patterns = [p for p in patterns if p.pattern_type.endswith('_trend')]
    assert len(trend_patterns) > 0
    assert trend_patterns[0].metric_type == 'cpu_percent'
    assert trend_patterns[0].confidence > 0.5

@pytest.mark.asyncio
async def test_detect_cycle_pattern(pattern_detector, metrics):
    """Test cycle pattern detection"""
    # Create metrics with cyclical pattern
    cycle_metrics = metrics.copy()
    for i, m in enumerate(cycle_metrics):
        m.memory_percent = 60.0 + 20.0 * (i % 2)  # Alternating pattern

    # Detect patterns
    patterns = pattern_detector.detect_patterns(cycle_metrics)

    # Verify pattern detection
    cycle_patterns = [p for p in patterns if p.pattern_type == 'cycle']
    assert len(cycle_patterns) > 0
    assert cycle_patterns[0].metric_type == 'memory_percent'
    assert cycle_patterns[0].confidence > 0.5

@pytest.mark.asyncio
async def test_analyzer_start_stop(analyzer):
    """Test analyzer start/stop"""
    # Start analyzer
    await analyzer.start()
    assert analyzer.active

    # Let it run briefly
    await asyncio.sleep(2)

    # Stop analyzer
    await analyzer.stop()
    assert not analyzer.active

@pytest.mark.asyncio
async def test_analyzer_error_handling(analyzer):
    """Test analyzer error handling"""
    # Mock store.get_metrics to raise an exception
    async def mock_get_metrics(*args):
        raise Exception("Test error")

    analyzer.store.get_metrics = mock_get_metrics

    # Start analyzer
    await analyzer.start()
    assert analyzer.active

    # Let it try to analyze metrics
    await asyncio.sleep(2)

    # Verify analyzer is still running
    assert analyzer.active

    # Stop analyzer
    await analyzer.stop()
    assert not analyzer.active 