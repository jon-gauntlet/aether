import pytest
import asyncio
import numpy as np
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from lib.autonomic.learning import (
    LearningManager,
    LearningStore,
    LearningModel,
    LearningConfig,
    TrainingData,
    ModelMetrics,
    PredictionResult,
    LearningEvent
)

@pytest.fixture
def learning_store(tmp_path):
    """Create learning store instance with temporary storage"""
    store = LearningStore()
    store.storage_path = str(tmp_path / "learning")
    store._init_storage()
    return store

@pytest.fixture
def learning_manager(learning_store):
    """Create learning manager instance"""
    config = LearningConfig(
        training_interval=timedelta(hours=1),
        batch_size=32,
        learning_rate=0.001,
        max_epochs=100,
        validation_split=0.2,
        early_stopping_patience=5
    )
    manager = LearningManager(config)
    manager.store = learning_store
    return manager

@pytest.fixture
def training_data():
    """Create test training data"""
    now = datetime.now()
    timestamps = [now - timedelta(minutes=i) for i in range(100)]
    
    # Generate synthetic metrics data
    cpu_usage = np.random.normal(60, 10, 100)
    memory_usage = np.random.normal(70, 15, 100)
    response_times = np.random.normal(200, 50, 100)
    
    # Create training samples
    samples = []
    for i in range(100):
        samples.append(
            TrainingData(
                timestamp=timestamps[i],
                features={
                    'cpu_usage': cpu_usage[i],
                    'memory_usage': memory_usage[i],
                    'request_count': np.random.randint(100, 1000)
                },
                labels={
                    'response_time': response_times[i]
                },
                metadata={
                    'environment': 'production',
                    'component': 'api_server'
                }
            )
        )
    return samples

@pytest.mark.asyncio
async def test_store_training_data(learning_store, training_data):
    """Test training data storage"""
    # Store training data
    for data in training_data:
        success = await learning_store.store_data(data)
        assert success

    # Retrieve training data
    stored_data = await learning_store.get_training_data(
        start_time=datetime.now() - timedelta(hours=1),
        end_time=datetime.now()
    )
    assert len(stored_data) == len(training_data)

@pytest.mark.asyncio
async def test_model_training(learning_manager, training_data):
    """Test model training"""
    # Add training data
    for data in training_data:
        await learning_manager.add_training_data(data)

    # Define model architecture
    model_config = {
        'type': 'neural_network',
        'layers': [
            {'type': 'dense', 'units': 64, 'activation': 'relu'},
            {'type': 'dense', 'units': 32, 'activation': 'relu'},
            {'type': 'dense', 'units': 1, 'activation': 'linear'}
        ]
    }

    # Train model
    model = await learning_manager.train_model(
        features=['cpu_usage', 'memory_usage', 'request_count'],
        labels=['response_time'],
        model_config=model_config
    )

    assert isinstance(model, LearningModel)
    assert model.is_trained
    assert model.metrics['validation_loss'] < model.metrics['initial_loss']

@pytest.mark.asyncio
async def test_model_prediction(learning_manager, training_data):
    """Test model prediction"""
    # Train model first
    await test_model_training(learning_manager, training_data)

    # Make prediction
    features = {
        'cpu_usage': 65.0,
        'memory_usage': 75.0,
        'request_count': 500
    }

    prediction = await learning_manager.predict(features)
    assert isinstance(prediction, PredictionResult)
    assert 'response_time' in prediction.values
    assert prediction.confidence > 0.0

@pytest.mark.asyncio
async def test_model_evaluation(learning_manager, training_data):
    """Test model evaluation"""
    # Train model first
    await test_model_training(learning_manager, training_data)

    # Evaluate model
    metrics = await learning_manager.evaluate_model()
    assert isinstance(metrics, ModelMetrics)
    assert metrics.accuracy > 0.0
    assert metrics.loss < float('inf')
    assert len(metrics.feature_importance) > 0

@pytest.mark.asyncio
async def test_online_learning(learning_manager):
    """Test online learning capabilities"""
    # Initialize model
    model_config = {
        'type': 'online_learning',
        'algorithm': 'passive_aggressive'
    }
    await learning_manager.initialize_model(model_config)

    # Simulate online learning
    for i in range(10):
        features = {
            'cpu_usage': 60.0 + i,
            'memory_usage': 70.0 + i
        }
        actual = {'response_time': 200.0 + i * 10}
        
        # Make prediction and update
        prediction = await learning_manager.predict(features)
        await learning_manager.update_model(features, actual)

        # Verify learning progress
        if i > 0:
            assert abs(prediction.values['response_time'] - actual['response_time']) < \
                   abs(prediction.values['response_time'] - (200.0 + (i-1) * 10))

@pytest.mark.asyncio
async def test_model_persistence(learning_manager, training_data):
    """Test model persistence"""
    # Train and save model
    await test_model_training(learning_manager, training_data)
    model_id = await learning_manager.save_model()

    # Load model
    loaded_model = await learning_manager.load_model(model_id)
    assert isinstance(loaded_model, LearningModel)
    assert loaded_model.is_trained

    # Verify predictions match
    features = {
        'cpu_usage': 65.0,
        'memory_usage': 75.0,
        'request_count': 500
    }
    
    prediction1 = await learning_manager.predict(features)
    prediction2 = await loaded_model.predict(features)
    assert np.allclose(prediction1.values['response_time'],
                      prediction2.values['response_time'])

@pytest.mark.asyncio
async def test_feature_selection(learning_manager, training_data):
    """Test feature selection"""
    # Add training data
    for data in training_data:
        await learning_manager.add_training_data(data)

    # Perform feature selection
    selected_features = await learning_manager.select_features(
        target='response_time',
        method='correlation',
        threshold=0.1
    )
    
    assert isinstance(selected_features, list)
    assert len(selected_features) > 0
    assert all(f in ['cpu_usage', 'memory_usage', 'request_count']
              for f in selected_features)

@pytest.mark.asyncio
async def test_model_versioning(learning_manager, training_data):
    """Test model versioning"""
    # Train multiple versions
    versions = []
    for i in range(3):
        await test_model_training(learning_manager, training_data)
        version_id = await learning_manager.save_model(
            version=f"1.0.{i}",
            metadata={'iteration': i}
        )
        versions.append(version_id)

    # Get version history
    history = await learning_manager.get_model_history()
    assert len(history) == 3
    assert all(v in [h['version_id'] for h in history] for v in versions)

@pytest.mark.asyncio
async def test_learning_monitoring(learning_manager, training_data):
    """Test learning monitoring"""
    # Set up monitoring handler
    events = []
    def event_handler(event):
        events.append(event)

    learning_manager.on_learning_event(event_handler)

    # Trigger learning events
    await test_model_training(learning_manager, training_data)

    # Verify events
    assert len(events) > 0
    assert all(isinstance(e, LearningEvent) for e in events)

@pytest.mark.asyncio
async def test_model_export_import(learning_manager, training_data):
    """Test model export/import"""
    # Train and export model
    await test_model_training(learning_manager, training_data)
    export_data = await learning_manager.export_model()
    
    # Import model
    imported_model = await learning_manager.import_model(export_data)
    assert isinstance(imported_model, LearningModel)
    assert imported_model.is_trained

@pytest.mark.asyncio
async def test_manager_start_stop(learning_manager):
    """Test manager start/stop"""
    # Start manager
    await learning_manager.start()
    assert learning_manager.active

    # Let it run briefly
    await asyncio.sleep(2)

    # Stop manager
    await learning_manager.stop()
    assert not learning_manager.active

@pytest.mark.asyncio
async def test_manager_error_handling(learning_manager):
    """Test manager error handling"""
    # Mock store.store_data to raise an exception
    async def mock_store(*args):
        raise Exception("Test error")

    learning_manager.store.store_data = mock_store

    # Start manager
    await learning_manager.start()
    assert learning_manager.active

    # Try to add training data (should handle error gracefully)
    await learning_manager.add_training_data(training_data[0])

    # Verify manager is still running
    assert learning_manager.active

    # Stop manager
    await learning_manager.stop()
    assert not learning_manager.active 