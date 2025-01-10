import pytest
import asyncio
import json
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from lib.autonomic.integration import (
    IntegrationManager,
    IntegrationStore,
    Integration,
    IntegrationConfig,
    IntegrationStatus,
    DataTransform,
    DataMapping,
    IntegrationEvent
)

@pytest.fixture
def integration_store(tmp_path):
    """Create integration store instance with temporary storage"""
    store = IntegrationStore()
    store.storage_path = str(tmp_path / "integrations")
    store._init_storage()
    return store

@pytest.fixture
def integration_manager(integration_store):
    """Create integration manager instance"""
    config = IntegrationConfig(
        check_interval=5.0,
        retry_limit=3,
        retry_delay=timedelta(seconds=5),
        batch_size=100,
        enable_validation=True
    )
    manager = IntegrationManager(config)
    manager.store = integration_store
    return manager

@pytest.fixture
def integrations():
    """Create test integrations"""
    now = datetime.now()
    return [
        Integration(
            id="test_integration_001",
            name="test_source_to_target",
            source={
                'type': 'rest_api',
                'url': 'http://source-api.test/data',
                'method': 'GET',
                'headers': {'Authorization': 'Bearer test_token'}
            },
            target={
                'type': 'database',
                'connection_string': 'postgresql://test:test@localhost:5432/test',
                'table': 'test_data'
            },
            transform=DataTransform(
                mapping=[
                    DataMapping(
                        source_field='id',
                        target_field='record_id',
                        transform_type='direct'
                    ),
                    DataMapping(
                        source_field='timestamp',
                        target_field='created_at',
                        transform_type='datetime',
                        format='%Y-%m-%dT%H:%M:%S'
                    ),
                    DataMapping(
                        source_field='value',
                        target_field='metric_value',
                        transform_type='float'
                    )
                ],
                filters=[
                    {'field': 'value', 'operator': 'gt', 'value': 0}
                ]
            ),
            schedule={
                'type': 'interval',
                'interval': timedelta(minutes=5)
            },
            status=IntegrationStatus.ACTIVE,
            metadata={
                'version': '1.0.0',
                'owner': 'test_team'
            },
            created_at=now,
            updated_at=now
        ),
        Integration(
            id="test_integration_002",
            name="test_event_streaming",
            source={
                'type': 'kafka',
                'bootstrap_servers': 'localhost:9092',
                'topic': 'test_events'
            },
            target={
                'type': 'elasticsearch',
                'hosts': ['http://localhost:9200'],
                'index': 'test_events'
            },
            transform=DataTransform(
                mapping=[
                    DataMapping(
                        source_field='event_id',
                        target_field='id',
                        transform_type='direct'
                    ),
                    DataMapping(
                        source_field='event_data',
                        target_field='data',
                        transform_type='json'
                    )
                ]
            ),
            schedule={
                'type': 'continuous'
            },
            status=IntegrationStatus.ACTIVE,
            metadata={
                'version': '1.0.0',
                'owner': 'test_team'
            },
            created_at=now,
            updated_at=now
        )
    ]

@pytest.mark.asyncio
async def test_store_integration(integration_store, integrations):
    """Test integration storage"""
    # Store integrations
    for integration in integrations:
        success = await integration_store.store(integration)
        assert success

    # Retrieve integrations
    for integration in integrations:
        retrieved = await integration_store.get(integration.id)
        assert retrieved is not None
        assert retrieved.id == integration.id
        assert retrieved.name == integration.name
        assert retrieved.status == integration.status

@pytest.mark.asyncio
async def test_integration_execution(integration_manager, integrations):
    """Test integration execution"""
    # Mock source and target systems
    source_data = [{'id': 1, 'timestamp': '2023-01-01T00:00:00', 'value': 100.0}]
    
    async def mock_fetch_data(*args, **kwargs):
        return source_data

    async def mock_store_data(*args, **kwargs):
        return True

    with patch('lib.autonomic.integration.fetch_data', mock_fetch_data), \
         patch('lib.autonomic.integration.store_data', mock_store_data):
        # Execute integration
        integration = integrations[0]
        result = await integration_manager.execute_integration(integration)
        assert result.success
        assert result.records_processed == len(source_data)

@pytest.mark.asyncio
async def test_data_transformation(integration_manager):
    """Test data transformation"""
    # Test data
    source_data = {
        'id': '123',
        'timestamp': '2023-01-01T00:00:00',
        'value': '42.5'
    }

    # Create transform
    transform = DataTransform(
        mapping=[
            DataMapping(
                source_field='id',
                target_field='record_id',
                transform_type='direct'
            ),
            DataMapping(
                source_field='timestamp',
                target_field='created_at',
                transform_type='datetime',
                format='%Y-%m-%dT%H:%M:%S'
            ),
            DataMapping(
                source_field='value',
                target_field='metric_value',
                transform_type='float'
            )
        ]
    )

    # Transform data
    transformed = await integration_manager.transform_data(source_data, transform)
    assert transformed['record_id'] == '123'
    assert isinstance(transformed['created_at'], datetime)
    assert isinstance(transformed['metric_value'], float)

@pytest.mark.asyncio
async def test_integration_scheduling(integration_manager, integrations):
    """Test integration scheduling"""
    # Add integrations
    for integration in integrations:
        await integration_manager.add_integration(integration)

    # Start scheduler
    await integration_manager.start_scheduler()

    # Let it run briefly
    await asyncio.sleep(2)

    # Check execution history
    history = await integration_manager.get_execution_history(integrations[0].id)
    assert len(history) > 0

    # Stop scheduler
    await integration_manager.stop_scheduler()

@pytest.mark.asyncio
async def test_error_handling(integration_manager, integrations):
    """Test integration error handling"""
    # Mock source to raise error
    async def mock_fetch_data(*args, **kwargs):
        raise Exception("Test error")

    with patch('lib.autonomic.integration.fetch_data', mock_fetch_data):
        # Execute integration
        integration = integrations[0]
        result = await integration_manager.execute_integration(integration)
        assert not result.success
        assert result.error is not None

@pytest.mark.asyncio
async def test_data_validation(integration_manager):
    """Test data validation"""
    # Test data
    valid_data = {'id': '123', 'value': 42.5}
    invalid_data = {'id': '123'}  # Missing required field

    # Create validation schema
    schema = {
        'type': 'object',
        'required': ['id', 'value'],
        'properties': {
            'id': {'type': 'string'},
            'value': {'type': 'number'}
        }
    }

    # Validate data
    is_valid = await integration_manager.validate_data(valid_data, schema)
    assert is_valid

    is_valid = await integration_manager.validate_data(invalid_data, schema)
    assert not is_valid

@pytest.mark.asyncio
async def test_integration_monitoring(integration_manager, integrations):
    """Test integration monitoring"""
    # Set up monitoring handler
    events = []
    def event_handler(event):
        events.append(event)

    integration_manager.on_integration_event(event_handler)

    # Execute integration
    integration = integrations[0]
    await integration_manager.execute_integration(integration)

    # Verify events
    assert len(events) > 0
    assert all(isinstance(e, IntegrationEvent) for e in events)

@pytest.mark.asyncio
async def test_batch_processing(integration_manager):
    """Test batch processing"""
    # Test data
    batch_data = [
        {'id': i, 'value': float(i)}
        for i in range(150)  # More than batch size
    ]

    # Process batch
    results = await integration_manager.process_batch(
        data=batch_data,
        batch_size=100,
        process_func=lambda x: x
    )
    assert len(results) == len(batch_data)

@pytest.mark.asyncio
async def test_integration_status_updates(integration_manager, integrations):
    """Test integration status updates"""
    # Add integration
    integration = integrations[0]
    await integration_manager.add_integration(integration)

    # Update status
    new_status = IntegrationStatus.PAUSED
    success = await integration_manager.update_integration_status(
        integration.id,
        new_status
    )
    assert success

    # Verify update
    updated = await integration_manager.get_integration(integration.id)
    assert updated.status == new_status

@pytest.mark.asyncio
async def test_manager_start_stop(integration_manager):
    """Test manager start/stop"""
    # Start manager
    await integration_manager.start()
    assert integration_manager.active

    # Let it run briefly
    await asyncio.sleep(2)

    # Stop manager
    await integration_manager.stop()
    assert not integration_manager.active

@pytest.mark.asyncio
async def test_integration_cleanup(integration_manager, integrations):
    """Test integration cleanup"""
    # Add integrations
    for integration in integrations:
        await integration_manager.add_integration(integration)

    # Add execution history
    for integration in integrations:
        for _ in range(5):
            await integration_manager.store.store_execution_result({
                'integration_id': integration.id,
                'timestamp': datetime.now() - timedelta(days=60),
                'success': True
            })

    # Run cleanup
    cleaned = await integration_manager.cleanup(max_age=timedelta(days=30))
    assert cleaned > 0 