import pytest
import asyncio
import json
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from lib.autonomic.validation import (
    ValidationManager,
    ValidationStore,
    Validator,
    ValidationRule,
    ValidationResult,
    ValidationConfig,
    ValidationLevel,
    ValidationEvent
)

@pytest.fixture
def validation_store(tmp_path):
    """Create validation store instance with temporary storage"""
    store = ValidationStore()
    store.storage_path = str(tmp_path / "validations")
    store._init_storage()
    return store

@pytest.fixture
def validation_manager(validation_store):
    """Create validation manager instance"""
    config = ValidationConfig(
        check_interval=1.0,
        max_retries=3,
        retry_delay=timedelta(seconds=5),
        enable_caching=True,
        cache_ttl=timedelta(minutes=5)
    )
    manager = ValidationManager(config)
    manager.store = validation_store
    return manager

@pytest.fixture
def validation_rules():
    """Create test validation rules"""
    return [
        ValidationRule(
            id="test_rule_001",
            name="cpu_usage_check",
            description="Validate CPU usage is within acceptable range",
            type="metric",
            condition={
                'field': 'cpu_percent',
                'operator': 'less_than',
                'value': 80.0
            },
            level=ValidationLevel.ERROR,
            metadata={
                'component': 'system',
                'category': 'performance'
            }
        ),
        ValidationRule(
            id="test_rule_002",
            name="memory_usage_check",
            description="Validate memory usage is within acceptable range",
            type="metric",
            condition={
                'field': 'memory_percent',
                'operator': 'less_than',
                'value': 85.0
            },
            level=ValidationLevel.WARNING,
            metadata={
                'component': 'system',
                'category': 'performance'
            }
        ),
        ValidationRule(
            id="test_rule_003",
            name="component_status_check",
            description="Validate all components are active",
            type="status",
            condition={
                'field': 'status',
                'operator': 'equals',
                'value': 'active'
            },
            level=ValidationLevel.CRITICAL,
            metadata={
                'component': 'system',
                'category': 'health'
            }
        )
    ]

@pytest.mark.asyncio
async def test_store_validation_rule(validation_store, validation_rules):
    """Test validation rule storage"""
    # Store rules
    for rule in validation_rules:
        success = await validation_store.store_rule(rule)
        assert success

    # Retrieve rules
    for rule in validation_rules:
        retrieved = await validation_store.get_rule(rule.id)
        assert retrieved is not None
        assert retrieved.id == rule.id
        assert retrieved.name == rule.name
        assert retrieved.level == rule.level

@pytest.mark.asyncio
async def test_validate_metrics(validation_manager, validation_rules):
    """Test metrics validation"""
    # Add rules
    for rule in validation_rules[:2]:  # CPU and memory rules
        await validation_manager.add_rule(rule)

    # Test data
    metrics = {
        'cpu_percent': 75.0,
        'memory_percent': 90.0  # Should trigger warning
    }

    # Validate metrics
    results = await validation_manager.validate_metrics(metrics)
    assert len(results) == 2
    assert any(r.level == ValidationLevel.WARNING for r in results)

@pytest.mark.asyncio
async def test_validate_component_status(validation_manager, validation_rules):
    """Test component status validation"""
    # Add rule
    status_rule = validation_rules[2]
    await validation_manager.add_rule(status_rule)

    # Test data
    components = {
        'monitor': {'status': 'active'},
        'analyzer': {'status': 'inactive'}  # Should trigger critical
    }

    # Validate status
    results = await validation_manager.validate_component_status(components)
    assert len(results) > 0
    assert any(r.level == ValidationLevel.CRITICAL for r in results)

@pytest.mark.asyncio
async def test_validation_caching(validation_manager, validation_rules):
    """Test validation result caching"""
    # Add rule
    rule = validation_rules[0]
    await validation_manager.add_rule(rule)

    # Test data
    metrics = {'cpu_percent': 75.0}

    # First validation (should hit database)
    result1 = await validation_manager.validate_metrics(metrics)
    
    # Second validation (should hit cache)
    result2 = await validation_manager.validate_metrics(metrics)

    assert result1 == result2
    assert validation_manager.cache_hits > 0

@pytest.mark.asyncio
async def test_custom_validator(validation_manager):
    """Test custom validator implementation"""
    # Create custom validator
    class CustomValidator(Validator):
        async def validate(self, data, rule):
            if data['custom_field'] > rule.condition['value']:
                return ValidationResult(
                    rule_id=rule.id,
                    success=False,
                    level=rule.level,
                    message="Custom validation failed"
                )
            return ValidationResult(
                rule_id=rule.id,
                success=True,
                level=rule.level,
                message="Custom validation passed"
            )

    # Register custom validator
    validation_manager.register_validator('custom', CustomValidator())

    # Create custom rule
    rule = ValidationRule(
        id="custom_rule",
        name="custom_check",
        type="custom",
        condition={'value': 10},
        level=ValidationLevel.ERROR
    )

    # Test data
    data = {'custom_field': 15}  # Should fail validation

    # Validate
    results = await validation_manager.validate(data, [rule])
    assert len(results) == 1
    assert not results[0].success

@pytest.mark.asyncio
async def test_validation_events(validation_manager, validation_rules):
    """Test validation event handling"""
    # Set up event handler
    events = []
    def event_handler(event):
        events.append(event)

    validation_manager.on_validation_event(event_handler)

    # Add rule and validate
    rule = validation_rules[0]
    await validation_manager.add_rule(rule)
    await validation_manager.validate_metrics({'cpu_percent': 90.0})  # Should trigger event

    # Verify events
    assert len(events) > 0
    assert all(isinstance(e, ValidationEvent) for e in events)

@pytest.mark.asyncio
async def test_validation_aggregation(validation_manager, validation_rules):
    """Test validation result aggregation"""
    # Add rules
    for rule in validation_rules:
        await validation_manager.add_rule(rule)

    # Generate multiple validation results
    test_data = [
        {'cpu_percent': 85.0, 'memory_percent': 80.0},
        {'cpu_percent': 75.0, 'memory_percent': 90.0},
        {'cpu_percent': 95.0, 'memory_percent': 95.0}
    ]

    results = []
    for data in test_data:
        result = await validation_manager.validate_metrics(data)
        results.extend(result)

    # Aggregate results
    aggregated = await validation_manager.aggregate_results(
        start_time=datetime.now() - timedelta(hours=1),
        end_time=datetime.now()
    )

    assert isinstance(aggregated, dict)
    assert 'error_count' in aggregated
    assert 'warning_count' in aggregated
    assert 'critical_count' in aggregated

@pytest.mark.asyncio
async def test_validation_retry(validation_manager):
    """Test validation retry mechanism"""
    # Create failing validator
    failure_count = 0
    class RetryValidator(Validator):
        async def validate(self, data, rule):
            nonlocal failure_count
            failure_count += 1
            if failure_count < 3:
                raise Exception("Temporary failure")
            return ValidationResult(
                rule_id=rule.id,
                success=True,
                level=rule.level,
                message="Validation succeeded after retries"
            )

    # Register validator
    validation_manager.register_validator('retry', RetryValidator())

    # Create rule
    rule = ValidationRule(
        id="retry_rule",
        name="retry_test",
        type="retry",
        level=ValidationLevel.ERROR
    )

    # Validate with retries
    results = await validation_manager.validate({'test': 'data'}, [rule])
    assert len(results) == 1
    assert results[0].success
    assert failure_count == 3

@pytest.mark.asyncio
async def test_validation_cleanup(validation_manager):
    """Test validation result cleanup"""
    # Store some validation results
    for i in range(5):
        result = ValidationResult(
            rule_id=f"test_rule_{i}",
            success=True,
            level=ValidationLevel.INFO,
            message="Test result",
            timestamp=datetime.now() - timedelta(days=i*10)
        )
        await validation_manager.store.store_result(result)

    # Run cleanup
    cleaned = await validation_manager.cleanup(max_age=timedelta(days=30))
    assert cleaned > 0

@pytest.mark.asyncio
async def test_manager_start_stop(validation_manager):
    """Test manager start/stop"""
    # Start manager
    await validation_manager.start()
    assert validation_manager.active

    # Let it run briefly
    await asyncio.sleep(2)

    # Stop manager
    await validation_manager.stop()
    assert not validation_manager.active

@pytest.mark.asyncio
async def test_manager_error_handling(validation_manager):
    """Test manager error handling"""
    # Mock store.store_rule to raise an exception
    async def mock_store(*args):
        raise Exception("Test error")

    validation_manager.store.store_rule = mock_store

    # Start manager
    await validation_manager.start()
    assert validation_manager.active

    # Try to add rule (should handle error gracefully)
    await validation_manager.add_rule(validation_rules[0])

    # Verify manager is still running
    assert validation_manager.active

    # Stop manager
    await validation_manager.stop()
    assert not validation_manager.active

@pytest.mark.asyncio
async def test_validation_export_import(validation_manager, validation_rules):
    """Test validation rule export/import"""
    # Export rules
    export_data = await validation_manager.export_rules(validation_rules)
    assert isinstance(export_data, dict)
    assert 'rules' in export_data
    assert len(export_data['rules']) == len(validation_rules)

    # Import rules
    imported = await validation_manager.import_rules(export_data)
    assert len(imported) == len(validation_rules)
    assert all(isinstance(r, ValidationRule) for r in imported) 