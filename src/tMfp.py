import pytest
import asyncio
import numpy as np
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from lib.autonomic.anomaly_detection import (
    AnomalyManager,
    AnomalyStore,
    Anomaly,
    AnomalyConfig,
    MetricsData,
    AnomalyMetrics,
    AnomalyAlert,
    AnomalyEvent
)

@pytest.fixture
def anomaly_store(tmp_path):
    """Create anomaly store instance with temporary storage"""
    store = AnomalyStore()
    store.storage_path = str(tmp_path / "anomalies")
    store._init_storage()
    return store

@pytest.fixture
def anomaly_manager(anomaly_store):
    """Create anomaly manager instance"""
    config = AnomalyConfig(
        scan_interval=timedelta(minutes=1),
        detection_threshold=3.0,
        learning_rate=0.01,
        history_window=timedelta(hours=24),
        min_data_points=100,
        alert_cooldown=timedelta(minutes=15)
    )
    manager = AnomalyManager(config)
    manager.store = anomaly_store
    return manager

@pytest.fixture
def metrics_data():
    """Create test metrics data"""
    now = datetime.now()
    timestamps = [now - timedelta(minutes=i) for i in range(100)]
    
    # Generate synthetic metrics data with some anomalies
    data = []
    for i in range(100):
        # Add occasional anomalies
        is_anomaly = i in [20, 40, 60, 80]
        anomaly_factor = 5.0 if is_anomaly else 1.0
        
        data.append(
            MetricsData(
                timestamp=timestamps[i],
                values={
                    'cpu_usage': np.random.normal(60, 10) * anomaly_factor,
                    'memory_usage': np.random.normal(70, 15) * anomaly_factor,
                    'response_time': np.random.normal(200, 50) * anomaly_factor,
                    'error_rate': np.random.exponential(0.1) * anomaly_factor
                },
                metadata={
                    'environment': 'production',
                    'component': 'api_server',
                    'is_anomaly': is_anomaly
                }
            )
        )
    return data

@pytest.mark.asyncio
async def test_store_metrics_data(anomaly_store, metrics_data):
    """Test metrics data storage"""
    # Store metrics data
    for data in metrics_data:
        success = await anomaly_store.store_data(data)
        assert success

    # Retrieve metrics data
    stored_data = await anomaly_store.get_metrics_data(
        start_time=datetime.now() - timedelta(hours=1),
        end_time=datetime.now()
    )
    assert len(stored_data) == len(metrics_data)

@pytest.mark.asyncio
async def test_anomaly_detection(anomaly_manager, metrics_data):
    """Test anomaly detection"""
    # Add metrics data
    for data in metrics_data:
        await anomaly_manager.add_metrics_data(data)

    # Detect anomalies
    anomalies = await anomaly_manager.detect_anomalies(
        metrics=['cpu_usage', 'memory_usage', 'response_time', 'error_rate']
    )

    assert isinstance(anomalies, list)
    assert len(anomalies) > 0
    assert all(isinstance(a, Anomaly) for a in anomalies)
    assert all(a.score > anomaly_manager.config.detection_threshold 
              for a in anomalies)

@pytest.mark.asyncio
async def test_anomaly_alerts(anomaly_manager, metrics_data):
    """Test anomaly alerts"""
    # Set up alert handler
    alerts = []
    def alert_handler(alert):
        alerts.append(alert)

    anomaly_manager.on_anomaly_alert(alert_handler)

    # Add metrics data with anomalies
    for data in metrics_data:
        await anomaly_manager.add_metrics_data(data)
        if data.metadata.get('is_anomaly'):
            # Force anomaly detection
            await anomaly_manager.detect_anomalies(
                metrics=['cpu_usage', 'memory_usage', 'response_time', 'error_rate']
            )

    # Verify alerts
    assert len(alerts) > 0
    assert all(isinstance(a, AnomalyAlert) for a in alerts)
    assert all(a.severity > 0 for a in alerts)

@pytest.mark.asyncio
async def test_anomaly_learning(anomaly_manager, metrics_data):
    """Test anomaly detection learning"""
    # Split data into training and testing
    train_data = metrics_data[:70]
    test_data = metrics_data[70:]

    # Train on initial data
    for data in train_data:
        await anomaly_manager.add_metrics_data(data)
    
    initial_anomalies = await anomaly_manager.detect_anomalies(
        metrics=['cpu_usage', 'memory_usage']
    )

    # Add test data and detect anomalies
    for data in test_data:
        await anomaly_manager.add_metrics_data(data)
    
    final_anomalies = await anomaly_manager.detect_anomalies(
        metrics=['cpu_usage', 'memory_usage']
    )

    # Verify learning progress
    assert len(final_anomalies) <= len(initial_anomalies)
    assert all(a.confidence > 0.5 for a in final_anomalies)

@pytest.mark.asyncio
async def test_anomaly_persistence(anomaly_manager, metrics_data):
    """Test anomaly persistence"""
    # Detect and save anomalies
    await test_anomaly_detection(anomaly_manager, metrics_data)
    anomaly_id = await anomaly_manager.save_state()

    # Load anomalies
    loaded_state = await anomaly_manager.load_state(anomaly_id)
    assert loaded_state
    
    # Verify detection still works
    anomalies = await anomaly_manager.detect_anomalies(
        metrics=['cpu_usage', 'memory_usage']
    )
    assert len(anomalies) > 0

@pytest.mark.asyncio
async def test_anomaly_metrics(anomaly_manager, metrics_data):
    """Test anomaly metrics collection"""
    # Detect anomalies
    await test_anomaly_detection(anomaly_manager, metrics_data)

    # Get anomaly metrics
    metrics = await anomaly_manager.get_anomaly_metrics()
    assert isinstance(metrics, AnomalyMetrics)
    assert metrics.total_anomalies > 0
    assert metrics.false_positive_rate < 0.3
    assert metrics.detection_latency < timedelta(minutes=5)

@pytest.mark.asyncio
async def test_anomaly_classification(anomaly_manager, metrics_data):
    """Test anomaly classification"""
    # Add metrics data
    for data in metrics_data:
        await anomaly_manager.add_metrics_data(data)

    # Detect and classify anomalies
    anomalies = await anomaly_manager.detect_anomalies(
        metrics=['cpu_usage', 'memory_usage', 'response_time', 'error_rate']
    )

    # Classify anomalies
    classifications = await anomaly_manager.classify_anomalies(anomalies)
    assert len(classifications) == len(anomalies)
    assert all('type' in c for c in classifications)
    assert all('severity' in c for c in classifications)

@pytest.mark.asyncio
async def test_anomaly_correlation(anomaly_manager, metrics_data):
    """Test anomaly correlation"""
    # Add metrics data
    for data in metrics_data:
        await anomaly_manager.add_metrics_data(data)

    # Detect anomalies
    anomalies = await anomaly_manager.detect_anomalies(
        metrics=['cpu_usage', 'memory_usage', 'response_time', 'error_rate']
    )

    # Correlate anomalies
    correlations = await anomaly_manager.correlate_anomalies(anomalies)
    assert isinstance(correlations, list)
    assert len(correlations) > 0
    assert all('source' in c for c in correlations)
    assert all('target' in c for c in correlations)
    assert all('strength' in c for c in correlations)

@pytest.mark.asyncio
async def test_anomaly_forecasting(anomaly_manager, metrics_data):
    """Test anomaly forecasting"""
    # Add historical data
    for data in metrics_data:
        await anomaly_manager.add_metrics_data(data)

    # Generate forecast
    forecast = await anomaly_manager.forecast_anomalies(
        horizon=timedelta(hours=1),
        metrics=['cpu_usage', 'memory_usage']
    )

    assert isinstance(forecast, list)
    assert len(forecast) > 0
    assert all('timestamp' in f for f in forecast)
    assert all('probability' in f for f in forecast)
    assert all('metrics' in f for f in forecast)

@pytest.mark.asyncio
async def test_anomaly_root_cause(anomaly_manager, metrics_data):
    """Test root cause analysis"""
    # Add metrics data and detect anomalies
    for data in metrics_data:
        await anomaly_manager.add_metrics_data(data)
    
    anomalies = await anomaly_manager.detect_anomalies(
        metrics=['cpu_usage', 'memory_usage', 'response_time', 'error_rate']
    )

    # Analyze root causes
    for anomaly in anomalies[:3]:  # Analyze first 3 anomalies
        root_cause = await anomaly_manager.analyze_root_cause(anomaly)
        assert isinstance(root_cause, dict)
        assert 'cause' in root_cause
        assert 'confidence' in root_cause
        assert 'evidence' in root_cause

@pytest.mark.asyncio
async def test_manager_start_stop(anomaly_manager):
    """Test manager start/stop"""
    # Start manager
    await anomaly_manager.start()
    assert anomaly_manager.active

    # Let it run briefly
    await asyncio.sleep(2)

    # Stop manager
    await anomaly_manager.stop()
    assert not anomaly_manager.active

@pytest.mark.asyncio
async def test_manager_error_handling(anomaly_manager):
    """Test manager error handling"""
    # Mock store.store_data to raise an exception
    async def mock_store(*args):
        raise Exception("Test error")

    anomaly_manager.store.store_data = mock_store

    # Start manager
    await anomaly_manager.start()
    assert anomaly_manager.active

    # Try to add metrics data (should handle error gracefully)
    await anomaly_manager.add_metrics_data(metrics_data[0])

    # Verify manager is still running
    assert anomaly_manager.active

    # Stop manager
    await anomaly_manager.stop()
    assert not anomaly_manager.active 